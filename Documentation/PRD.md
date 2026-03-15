# Product Requirements Document (PRD)
## Real-Time Transit Tracker for Jamaica

**Version:** 1.0  
**Date:** March 14, 2026
**Author:** Intellibus Hackathon Team
---

## 1. Overview

### 1.1 Problem Statement
In Kingston, Jamaica, commuters waste 2+ hours daily waiting for buses that may never arrive. There is no reliable way to know when a bus will come, how crowded it is, or if it's delayed. This unpredictability leads to frustration, missed appointments, and wasted time for hundreds of thousands of daily riders.

### 1.2 Solution
A real-time bus tracking web application that enables:
- **Drivers** to broadcast their live GPS location
- **Riders** to see buses on a map with estimated arrival times
- **Crowdsourced "vibe" reports** for conditions like delays, crowding, and AC status

### 1.3 Product Vision
A lightweight, mobile-first transit tracker that could scale to integrate with JUTC (Jamaica Urban Transit Company) or private bus operators island-wide.

---

## 2. Goals & Success Metrics

### 2.1 Primary Goals
1. Reduce rider uncertainty by providing real-time bus locations
2. Enable crowd-sourced reporting to improve commuter decision-making
3. Demonstrate a working MVP within a 5-hour hackathon window

### 2.2 Success Metrics
| Metric | Target |
|--------|--------|
| Bus location update latency | < 2 seconds |
| Simultaneous bus tracking | 3+ buses |
| Report submission to display | < 1 second |
| Multi-device connectivity via ngrok | 2+ devices |
| Demo completion | All 9 acceptance criteria passed |

---

## 3. Target Users

### 3.1 Primary Users

**Commuters/Riders**
- Daily bus users in Kingston
- Need to know when the next bus is arriving
- Want to avoid overcrowded or delayed buses
- Primarily access via mobile browser

**Bus Drivers**
- JUTC or private bus operators
- Need a simple way to broadcast location
- Use personal smartphone while driving
- Require minimal interaction (one-tap start/stop)

### 3.2 Secondary Users

**Transit Administrators** (Future)
- Monitor fleet status
- View aggregated reports
- Analyze route performance

---

## 4. Features & Requirements

### 4.1 Core Features (MVP)

#### F1: Real-Time Bus Tracking
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| F1.1 | Display live bus positions on an interactive map |
| F1.2 | Update bus locations every 2-5 seconds |
| F1.3 | Show route number badge on each bus marker |
| F1.4 | Support 3+ simultaneous buses (via simulator + real drivers) |
| F1.5 | Display connection status indicator ("🟢 Live") |

#### F2: Driver Broadcasting Mode
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| F2.1 | One-tap START/STOP broadcasting button |
| F2.2 | Route selection dropdown (5 JUTC routes) |
| F2.3 | Real-time coordinate display for driver feedback |
| F2.4 | "Broadcasting..." status indicator with visual feedback |
| F2.5 | GPS location updates every 5 seconds |

#### F3: ETA Calculation
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| F3.1 | Calculate distance between bus and rider |
| F3.2 | Estimate arrival time assuming 20 km/h average speed |
| F3.3 | Display "~X min" label above each bus marker |

#### F4: Crowdsourced Reports ("Vibe Reports")
**Priority:** P0 (Must Have)

| Requirement | Description |
|-------------|-------------|
| F4.1 | Modal-based report submission UI |
| F4.2 | Four report types: Delay ⏱️, Crowded 👥, Cold AC ❄️, Standing Room 🧍 |
| F4.3 | Reports appear as colored dots on the map |
| F4.4 | Toast confirmation: "Report sent! 🚨" |
| F4.5 | Reports broadcast to all connected riders in real-time |

### 4.2 Deferred Features (Post-MVP)

| Feature | Reason for Deferral |
|---------|---------------------|
| Route filtering dropdown | Not needed for 3 buses |
| Search bar for routes/stops | Time constraint |
| "Active Reports" feed panel | Adds complexity |
| Capacity indicators | Requires additional data |
| Smooth marker animations | Nice-to-have polish |
| PostgreSQL persistence | Only if time permits in Hour 5 |
| Historical analytics | Future enhancement |

---

## 5. User Flows

### 5.1 Rider Flow
```
1. Open app → Map loads centered on Kingston
2. See bus markers with route numbers
3. View ETA labels ("~4 min") above buses
4. Tap "😊 Report Vibe" button
5. Select report type from 2×2 grid
6. See toast confirmation + report dot on map
```

### 5.2 Driver Flow
```
1. Navigate to /driver
2. Select route from dropdown
3. Tap "START" button
4. Grant location permission
5. See "BROADCASTING..." status
6. Continue driving (app broadcasts in background)
7. Tap "STOP" when route complete
```

---

## 6. Technical Specifications

### 6.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Maps | Leaflet + OpenStreetMap |
| Real-time | Socket.io (client + server) |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Storage | In-memory (Map/objects) |
| Testing | ngrok for multi-device |

### 6.2 Socket.io Event Contract

**Client → Server**
| Event | Payload | Description |
|-------|---------|-------------|
| `driver:update_location` | `{route, lat, lng}` | Driver sends GPS update |
| `rider:subscribe` | `{}` | Rider requests current state |
| `report:create` | `{type, lat, lng}` | Rider submits vibe report |

**Server → Client**
| Event | Payload | Description |
|-------|---------|-------------|
| `vehicles:state` | `[{id, route, lat, lng}]` | All bus positions |
| `reports:state` | `[{type, lat, lng}]` | All active reports |

### 6.3 Data Models

**Vehicle (In-Memory)**
```javascript
{
  id: string,       // "driver-123" or "sim-bus-1"
  route: string,    // "800", "76", etc.
  lat: number,
  lng: number,
  timestamp: Date
}
```

**Report (In-Memory)**
```javascript
{
  id: string,
  type: "delay" | "crowded" | "cold_ac" | "standing",
  lat: number,
  lng: number,
  timestamp: Date
}
```

### 6.4 Supported Routes

| Route ID | Route Name |
|----------|------------|
| 800 | Half-Way-Tree → Portmore |
| 76 | Cross Roads → Downtown |
| 42 | UTech → Constant Spring |
| 900 | Portmore → Half-Way-Tree |
| 83 | Stony Hill → Downtown |

---

## 7. UI/UX Requirements

### 7.1 Design Principles
- **Mobile-first**: Primary use is on smartphones
- **One-tap actions**: Minimize cognitive load
- **Real-time feedback**: Visual confirmation of all actions
- **Minimal chrome**: Map should dominate the screen

### 7.2 Screen Specifications

#### Rider Map View (`/`)
- Full-screen Leaflet map centered on Kingston (18.0179°N, 76.8099°W)
- Header: Logo + "🟢 Live" connection status
- Bus markers: Green pins with route number badge
- ETA tooltips: White text on dark background
- Report button: Green floating pill at bottom center
- Map controls: +/- zoom, recenter button

#### Driver Mode (`/driver`)
- Dark green background
- Large START/STOP button (center)
- Route dropdown (top)
- Broadcasting status with pulsing indicator
- Live coordinate readout
- "Updated Xs ago" timestamp

#### Report Modal
- Semi-transparent overlay
- Centered white card
- "How's the ride?" title
- 2×2 grid with 4 report buttons
- Each button: emoji icon + label
- Close button (X) in top-right

#### Toast Notification
- Green background
- Checkmark icon
- "Report sent! 🚨" message
- Auto-dismiss after 3 seconds

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Map should load within 3 seconds on 3G connection
- Bus position updates should render within 100ms of receipt
- Support 50+ concurrent riders (for demo purposes)

### 8.2 Reliability
- Graceful degradation if GPS unavailable
- Mock simulator ensures demo always has moving buses
- Reconnection handling for Socket.io drops

### 8.3 Accessibility
- High contrast text on all UI elements
- Tap targets minimum 44x44px
- Status indicators use text + color (not color alone)

### 8.4 Browser Support
- Chrome (Android) – Primary
- Safari (iOS) – Primary
- Chrome (Desktop) – Secondary
- Firefox – Secondary

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GPS fails on driver device | Medium | High | Mock simulator as fallback |
| Socket.io connection drops | Medium | Medium | Reconnection logic + status indicator |
| ngrok tunnel unstable | Medium | High | Test early (Hour 2), have backup URL |
| CORS issues | High | Medium | Configure Express CORS middleware |
| Phone browser blocks geolocation | Low | High | HTTPS required (ngrok provides) |

---

## 10. Acceptance Criteria

The MVP is complete when all 9 criteria pass:

1. ✅ Open driver page on phone, select route, tap START
2. ✅ Driver's bus appears on laptop map within 2 seconds
3. ✅ Bus marker shows route number and ~X min ETA
4. ✅ Tap "Report Vibe" on laptop, select report type
5. ✅ Report dot appears on map instantly
6. ✅ Toast shows "Report sent! 🚨"
7. ✅ All 3 simulator buses are moving smoothly
8. ✅ Connection status shows "🟢 Live"
9. ✅ Works on phone + laptop via ngrok public URL

---

## 11. Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Hour 0 (Prep) | Pre-hackathon | Environment setup, dependencies, mock data |
| Hour 1 | 1 hour | Socket.io server, in-memory storage, event contract |
| Hour 2 | 1 hour | Driver mode UI, GPS broadcasting, simulator |
| Hour 3 | 1 hour | Rider map, bus markers, report modal |
| Hour 4 | 1 hour | ETA feature, report dots, UI polish |
| Hour 5 | 1 hour | Multi-device testing, ngrok setup, demo prep |

---

## 12. Future Roadmap (Post-Hackathon)

### Phase 2: Persistence & Scale
- PostgreSQL integration for reports and analytics
- Redis for real-time vehicle state
- Historical report analysis

### Phase 3: Integration
- JUTC API integration for official routes
- Push notifications for favorite routes
- Driver authentication

### Phase 4: Advanced Features
- Route prediction and optimization
- Crowding forecasts based on historical data
- Multi-language support (English, Patois)

---

## 13. Appendix

### A. Map Configuration
```javascript
const KINGSTON_CENTER = [18.0179, -76.8099];
const DEFAULT_ZOOM = 13;
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
```

### B. Report Color Coding
| Type | Color | Hex |
|------|-------|-----|
| Delay | Yellow | #FCD34D |
| Crowded | Blue | #60A5FA |
| Cold AC | Cyan | #22D3EE |
| Standing Room | Orange | #FB923C |

### C. ETA Formula
```
Distance (km) = Haversine formula between bus and user
Speed = 20 km/h (Kingston traffic average)
ETA (min) = (Distance / Speed) × 60
```

---

*Document prepared for Intellibus Hackathon 2026*
