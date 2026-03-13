# Real-Time Transit Tracker for Jamaica

A real-time bus tracking web application for Kingston, Jamaica that enables riders to see buses on a map with estimated arrival times, crowdsourced "vibe" reports, route filtering, trip planning, and dark mode.

![Kingston Transit Tracker](https://img.shields.io/badge/Kingston-Transit-brightgreen)
![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?logo=springboot)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black?logo=socket.io)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9+-199900?logo=leaflet)

## Features

- **Real-Time Bus Tracking** -- Live bus positions on an interactive map with automatic updates every 2 seconds
- **Color-Coded Route Lines** -- Each route drawn as a polyline on the map with a distinct color
- **Stop Markers** -- Terminal stops displayed on the map with route-colored borders
- **Route Filtering** -- Filter the map to show only a specific route's buses, line, and stops
- **ETA Calculation** -- Estimated arrival times displayed above each bus marker (Haversine distance / 20 km/h)
- **Trip Planner** -- Pick a start and end stop to find connecting routes with live ETAs
- **Crowdsourced Reports** -- Submit and view reports for delays, crowding, cold AC, and standing room
- **Report Aggregation** -- Route pills show badge counts of nearby reports with type breakdown
- **Report Expiration** -- Reports auto-expire after 30 minutes to keep the map current
- **Dark Mode** -- Toggle between light and dark themes (persisted in localStorage)
- **Bus Proximity Notifications** -- Browser notifications when a watched bus is within 500m (5-min throttle)
- **Accessibility Indicators** -- Wheelchair icon on accessible buses
- **Historical Patterns** -- Backend tracks report types by hour of day via `/api/patterns`
- **User Location** -- Shows your current position on the map with a blue dot
- **GTFS-RT Output** -- Protocol Buffer endpoint at `/api/gtfs-rt/vehicle-positions`
- **Optional PostgreSQL Persistence** -- JPA entities with write-through caching (works without a DB)
- **Mobile App** -- React Native companion app with map, trip planner, and push notifications

## Tech Stack

| Component | Stack |
|-----------|-------|
| **Client (Web)** | React 19, Vite 7, Leaflet / react-leaflet, Socket.io-client 4.x, React Router DOM 7, Tailwind CSS 4 |
| **Server** | Java 21, Spring Boot 3.4.3, netty-socketio 2.0.12, Maven, Spring Data JPA, GTFS-RT / Protocol Buffers |
| **Mobile** | React Native 0.78, TypeScript, react-native-maps, React Navigation, @notifee/react-native, Socket.io-client |
| **Storage** | In-memory (ConcurrentHashMap / synchronized ArrayList), optional PostgreSQL via JPA |
| **Maps** | OpenStreetMap (light) / CartoDB Dark Matter (dark mode) |

## Project Structure

```
Real-Time_Transit_Tracker/
├── server/
│   ├── pom.xml
│   ├── mvnw.cmd
│   ├── .env.example
│   └── src/main/java/com/transit/tracker/
│       ├── TransitTrackerApplication.java
│       ├── config/SocketIOConfig.java
│       ├── controller/
│       │   ├── HealthController.java            # /health, /api/patterns, /api/reports/history
│       │   └── GtfsRtController.java            # /api/gtfs-rt/vehicle-positions
│       ├── handler/SocketIOEventHandler.java     # WebSocket event handling
│       ├── model/Vehicle.java, Report.java, ReportRequest.java
│       ├── entity/VehicleEntity.java, ReportEntity.java, HistoricalPatternEntity.java
│       ├── repository/VehicleRepository.java, ReportRepository.java, HistoricalPatternRepository.java
│       └── service/
│           ├── TransitService.java               # In-memory store + async DB write-through
│           ├── BusSimulatorService.java           # Kingston bus simulator (3 routes)
│           ├── GtfsRtFeedService.java             # MTA live feed poller
│           └── ReportCleanupService.java          # Auto-expire old reports
├── client/
│   ├── package.json
│   ├── index.html
│   ├── .env.example
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx, App.jsx, constants.js
│       ├── pages/RiderMap.jsx                    # Main map view
│       ├── components/ReportModal.jsx, TripPlanner.jsx, Toast.jsx
│       └── services/socket.js, notifications.js
├── mobile/
│   ├── package.json, app.json
│   └── src/
│       ├── App.tsx
│       ├── constants/index.ts
│       ├── screens/MapScreen.tsx, TripPlannerScreen.tsx, SettingsScreen.tsx
│       └── services/socket.ts, notifications.ts, eta.ts
└── Documentation/
    ├── PRD.md
    ├── UI_Implementation_Roadmap.md
    └── Hackathon Roadmap v2.md, v3_FINAL.md
```

## Quick Start

### Prerequisites

- **Java 21** (JDK)
- **Node.js** v18 or higher
- **Android SDK** (for the mobile app)
- Modern web browser with geolocation support

### 1. Start the Backend Server

```bash
cd server
mvnw.cmd spring-boot:run
```

- REST API runs on `http://localhost:8080`
- Socket.IO runs on `ws://localhost:3001`
- You should see: "Bus simulator initialized with 3 buses"

### 2. Start the Web Client

```bash
cd client
npm install
npm run dev
```

- Client runs on `http://localhost:5173`

### 3. Start the Mobile App (optional)

```bash
cd mobile
npm install
npx react-native run-android
```

### Usage

1. Open `http://localhost:5173`
2. You should see a map centered on Kingston with color-coded route lines, 3 simulated buses moving on routes 800, 76, and 42, terminal stop markers, and ETA labels above each bus
3. **Filter routes** -- Click a route pill in the bottom-left panel
4. **Report a vibe** -- Click "Report Vibe" to submit a condition report
5. **Plan a trip** -- Click "Trip" to find routes between two stops with live ETAs
6. **Toggle dark mode** -- Click the moon/sun icon in the header
7. **Get notified** -- Click the bell icon next to a route pill

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (`{status, vehicles, reports}`) |
| GET | `/api/patterns` | Historical report counts by type and hour |
| GET | `/api/reports/history` | Report history |
| GET | `/api/gtfs-rt/vehicle-positions` | GTFS-RT vehicle positions (Protocol Buffer) |

## Socket.IO Events

### Client to Server
| Event | Payload | Description |
|-------|---------|-------------|
| `rider:subscribe` | `{}` | Request current state |
| `report:create` | `{type, lat, lng}` | Submit a vibe report |

### Server to Client
| Event | Payload | Description |
|-------|---------|-------------|
| `vehicles:state` | `[{id, route, lat, lng, accessible}]` | All bus positions |
| `reports:state` | `[{id, type, lat, lng, timestamp}]` | All active reports |

## Environment Variables

### Client (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SOCKET_URL` | `http://localhost:3001` | Socket.IO server URL |
| `VITE_DATA_SOURCE` | `kingston` | Data source (`kingston` or `nyc`) |

### Server (application.properties)

| Variable | Default | Description |
|----------|---------|-------------|
| `server.port` | `8080` | Spring Boot HTTP port |
| `socketio.port` | `3001` | Socket.IO WebSocket port |
| `simulator.update-interval` | `2000` | Bus simulator tick (ms) |
| `reports.max-age-minutes` | `30` | Report expiration time |
| `transit.data-source` | `simulator` | `simulator` or `mta` |
| `transit.mta.api-key` | -- | MTA API key (for live NYC data) |
| `spring.datasource.*` | `localhost:5432/transit_tracker` | PostgreSQL connection |

## Supported Routes

| Route | Name | Color |
|-------|------|-------|
| 800 | Half-Way-Tree to Portmore | Green |
| 76 | Cross Roads to Downtown | Blue |
| 42 | UTech to Constant Spring | Orange |
| 900 | Portmore to Half-Way-Tree | Purple |
| 83 | Stony Hill to Downtown | Red |

## Report Types

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| Delay | Timer | Yellow | Bus is running late |
| Crowded | People | Blue | Bus is full |
| Cold AC | Snowflake | Cyan | Strong air conditioning |
| Standing Room | Person | Orange | Only standing space available |

## Not Yet Implemented

- SMS/WhatsApp fallback (Twilio integration)
- Localization (English, Patois)
- Authentication (driver/admin accounts)

## Multi-Device Testing with ngrok

1. Start ngrok: `ngrok http 3001`
2. Update `client/.env`: `VITE_SOCKET_URL=https://your-url.ngrok.io`
3. Restart the client: `npm run dev`
4. Open the ngrok URL on your phone

## Acknowledgments

Built for the Intellibus Hackathon 2026. Uses OpenStreetMap and CARTO for map tiles, with route data inspired by JUTC.

## License

ISC License
