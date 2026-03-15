# Real-Time Multi-Region Transit Tracker

A high-performance, real-time transit tracking platform supporting both a **Kingston, Jamaica** simulator and live **New York City (MTA)** bus data. Riders can visualize bus positions, track ETAs, plan trips, and receive proximity notifications across multiple regions.

![Transit Tracker](https://img.shields.io/badge/Transit-Tracker-brightgreen)
![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?logo=springboot)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black?logo=socket.io)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9+-199900?logo=leaflet)

## 🌍 Multi-Region Support

The application dynamically switches its interface and data orchestration based on the `DATA_SOURCE` configuration:

- **Kingston Mode (`kingston`):** A high-fidelity simulator for Kingston, Jamaica with color-coded routes (JUTC inspired), crowdsourced "vibe" reports, and interactive trip planning.
- **NYC Mode (`nyc`):** Live tracking for the New York City MTA bus network using official SIRI (Stop Monitoring) and GTFS-RT (Vehicle Positions) APIs.

## Features

- **Real-Time Tracking** -- Live bus positions on an interactive map (Leaflet) with 2s updates in simulator mode and live MTA polling in NYC mode.
- **Region-Specific UIs** -- Dedicated views: `RiderMap` for Kingston's route-based tracking and `NycTransitPage` for NYC's stop-centric live monitoring.
- **Advanced Trip Planning** -- Find connecting routes and live ETAs between stops using regional routing logic.
- **NYC Stop Monitoring** -- Real-time arrivals, distance-to-stop, and "layover" status for every MTA bus stop.
- **Google Maps Integration** -- Integrated address autocompletion and geocoding for precise stop discovery in NYC.
- **Crowdsourced Vibe Reports (Kingston)** -- Submit reports for delays, crowding, and AC status; reports auto-expire after 30 minutes.
- **Proximity Notifications** -- Browser-based alerts when a watched bus is within 500m of your location.
- **GTFS-RT Output** -- Backend provides a Protocol Buffer endpoint at `/api/gtfs-rt/vehicle-positions`.
- **Cross-Platform** -- Responsive React web client and a React Native mobile companion app.

## Tech Stack

| Component | Stack |
|-----------|-------|
| **Client (Web)** | React 19, Vite 7, Leaflet, Socket.io-client 4.x, Tailwind CSS 4, Google Maps API |
| **Server** | Java 21, Spring Boot 3.4.3, netty-socketio, Maven, GTFS-RT / Protocol Buffers |
| **Mobile** | React Native 0.78, TypeScript, react-native-maps, @notifee/react-native |
| **Data Sources** | Kingston Simulator (In-memory), NYC MTA (SIRI / GTFS-RT APIs) |
| **Storage** | Concurrent In-memory store, optional PostgreSQL via Spring Data JPA |

## Project Structure

```
Real-Time_Transit_Tracker/
├── server/
│   └── src/main/java/com/transit/tracker/
│       ├── controller/
│       │   ├── NycTransitController.java         # NYC REST API (/api/nyc/*)
│       │   └── GtfsRtController.java             # GTFS-RT Protobuf output
│       └── service/
│           ├── NycTransitService.java            # MTA API orchestration
│           ├── MtaBusTimeHttpGateway.java        # High-perf SIRI client
│           ├── MtaBusTimeParser.java             # SIRI/GTFS-RT robust parsing
│           └── BusSimulatorService.java          # Kingston bus simulator
├── client/
│   └── src/
│       ├── pages/
│       │   ├── NycTransitPage.jsx                # Dedicated NYC Live view
│       │   └── RiderMap.jsx                      # Kingston Simulator view
│       └── services/
│           ├── nycApi.js                         # NYC-specific API client
│           └── googleMaps.js                     # Google Maps integration
├── mobile/                                       # React Native application
└── Documentation/                                # PRD, Roadmaps, and UI specs
```

## Quick Start

### 1. Configure Environment

**Client (`client/.env`):**
```bash
VITE_DATA_SOURCE=nyc # or 'kingston'
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_MAPS_BROWSER_KEY=your_key_here
```

**Server (`server/.env`):**
```bash
TRANSIT_DATA_SOURCE=mta # or 'simulator'
TRANSIT_MTA_API_KEY=your_mta_gtfs_key
MTA_BUSTIME_API_KEY=your_mta_bustime_key
```

### 2. Run the Platform

**Backend:**
```bash
cd server && ./mvnw spring-boot:run
```

**Web Client:**
```bash
cd client && npm install && npm run dev
```

## API Endpoints (NYC)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/nyc/nearby` | Finds stops and arrivals near lat/lng |
| GET | `/api/nyc/stop` | Real-time arrivals for a specific Stop ID |
| GET | `/api/nyc/vehicles` | Live vehicle positions for a specific Route ID |

## Supported Routes (Kingston Simulator)

| Route | Name | Color |
|-------|------|-------|
| 800 | Half-Way-Tree to Portmore | Green |
| 76 | Cross Roads to Downtown | Blue |
| 42 | UTech to Constant Spring | Orange |

## License

ISC License — Built for the Intellibus Hackathon 2026.
