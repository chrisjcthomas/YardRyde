# YardRyde: Jamaica's Real-Time Transit Tracker

**YardRyde** is a high-performance, real-time transit tracking platform built to solve the unpredictability of commuting in Jamaica. Focused initially on **Kingston and St. Andrew**, YardRyde enables riders to visualize JUTC bus positions, track live ETAs, and contribute to crowdsourced "vibe" reports.

![YardRyde Status](https://img.shields.io/badge/YardRyde-Live-brightgreen)
![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?logo=springboot)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black?logo=socket.io)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9+-199900?logo=leaflet)

## 🇯🇲 The Mission: Kingston & St. Andrew
In Kingston, commuters often face long, unpredictable waits at bus stops. YardRyde provides:
- **Live Tracking:** See exactly where your bus is on the map.
- **Smart Planning:** Input your destination to find the best JUTC routes and estimated arrival times.
- **Driver Empowerment:** A dedicated interface for drivers to broadcast their live GPS location with a single tap.
- **Vibe Reports:** Crowdsourced real-time updates on delays, crowding, and AC status ("Cold AC ❄️").

## 🌍 Multi-Region Capability
While our heart is in Jamaica, YardRyde is built on a robust, multi-region architecture. The app dynamically switches based on the `DATA_SOURCE` configuration:

- **Kingston Mode (`kingston`):** Our primary focus. A high-fidelity simulator and driver-broadcasting system tailored for JUTC routes.
- **NYC Mode (`nyc`):** A technical proof-of-concept using live **New York City (MTA)** bus data (SIRI/GTFS-RT) to demonstrate real-world API integration at scale.

## Core Features

- **Real-Time Map Visualization** — Interactive Leaflet maps with sub-2s position updates.
- **Trip Planner** — Advanced routing logic to tell you which bus to take to reach your destination.
- **Proximity Notifications** — Browser alerts when your watched bus is within 500m.
- **Driver Dashboard** — Simple, mobile-first toggle for drivers to share their live location.
- **GTFS-RT Compatibility** — Backend generates Protocol Buffer streams for professional transit integration.
- **Cross-Platform** — Responsive web client for riders and a React Native companion app for deep mobile integration.

## Tech Stack

| Component | Stack |
|-----------|-------|
| **Client (Web)** | React 19, Vite 7, Leaflet, Socket.io-client 4.x, Tailwind CSS 4, Google Maps API |
| **Server** | Java 21, Spring Boot 3.4.3, netty-socketio, Maven, GTFS-RT / Protocol Buffers |
| **Mobile** | React Native 0.78, TypeScript, react-native-maps, @notifee/react-native |
| **Data Sources** | Kingston Simulator (In-memory), NYC MTA (SIRI / GTFS-RT APIs) |

## Project Structure

```
Real-Time_Transit_Tracker/
├── client/           # React Web Application (Rider & Driver views)
├── server/           # Spring Boot Backend (Orchestration & Simulator)
├── mobile/           # React Native App (iOS/Android)
├── Documentation/    # PRD, Roadmaps, and Hackathon Specs
└── README.md
```

## Quick Start

### 1. Configure Environment

**Client (`client/.env`):**
```bash
VITE_DATA_SOURCE=kingston # Set to 'nyc' for MTA demo
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_MAPS_BROWSER_KEY=your_key_here
```

**Server (`server/.env`):**
```bash
TRANSIT_DATA_SOURCE=simulator # Set to 'mta' for NYC data
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

## Supported Routes (Kingston)

| Route | Name | Color |
|-------|------|-------|
| 800 | Half-Way-Tree to Portmore | Green |
| 76 | Cross Roads to Downtown | Blue |
| 42 | UTech to Constant Spring | Orange |

---
**YardRyde** — Launched today for the Intellibus Hackathon 2026. Bringing transparency to Jamaican transit, one stop at a time.
