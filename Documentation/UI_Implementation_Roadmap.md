# 🗺️ **UI Implementation Roadmap**
**Kingston Transit Tracker - 5-Hour Build Plan**

---

## **📱 SCREEN 1: Driver Mode**
**File:** `/src/pages/DriverMode.jsx`

### **Purpose**
Enable bus drivers to broadcast their live GPS location to the system. This creates the "supply" side of the real-time tracking system.

### **UI Components Breakdown**

| Component | Purpose | Implementation Details |
|-----------|---------|------------------------|
| **Header** | Branding + exit option | Logo + "DRIVER PORTAL V2.4" + Exit button (routes to rider view) |
| **Route Selector** | Let driver choose their route | Dropdown with 5 JUTC routes (stored in constants.js) |
| **START Button** | Initiate GPS broadcasting | Giant green circle, toggles to "STOP" when active |
| **Status Display** | Show broadcasting state | "🟢 BROADCASTING..." with pulsing animation |
| **Coordinates Display** | Confirm GPS is working | Live lat/lng updating every 2s |
| **Timestamp** | Show last update time | "⚡ Updated 2s ago" |
| **Simulate Toggle** | Dev mode for testing | Checkbox to send fake GPS instead of real |

### **Component Structure**
```jsx
<DriverMode>
  ├── <Header>
  │   └── Exit Button → routes to "/"
  ├── <RouteSelector>
  │   └── Dropdown (5 options)
  ├── <BroadcastButton>
  │   ├── Icon (broadcast symbol)
  │   └── Label (START/STOP)
  ├── <StatusIndicator>
  │   ├── Pulsing green dot
  │   └── "BROADCASTING..." text
  ├── <CoordinatesDisplay>
  │   ├── LAT value
  │   └── LNG value
  ├── <Timestamp>
  └── <SimulateToggle>
</DriverMode>
```

### **State Management**
```javascript
const [broadcasting, setBroadcasting] = useState(false);
const [selectedRoute, setSelectedRoute] = useState(null);
const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
const [lastUpdate, setLastUpdate] = useState(null);
const [simulateMode, setSimulateMode] = useState(false);
```

### **Key Functions**
- `handleStartBroadcast()` - Request geolocation, emit to Socket.io
- `handleStopBroadcast()` - Stop GPS watch, clear interval
- `emitLocation()` - Send `driver:update_location` event every 5s
- `toggleSimulate()` - Switch between real GPS and fake coords

---

## **📱 SCREEN 2: Rider Map View**
**File:** `/src/pages/RiderMap.jsx`

### **Purpose**
Show riders live bus locations with ETA estimates. This is the "demand" side - the main user experience.

### **UI Components Breakdown**

| Component | Purpose | Implementation Details |
|-----------|---------|------------------------|
| **Header Bar** | Branding + status | "KINGSTON TRANSIT" + "🟢 Live Connection" |
| **Map Container** | Display Kingston geography | Leaflet map centered on 18.0179°N, 76.8099°W |
| **Bus Markers** | Show live bus positions | Green pin with route number (800, 76, etc.) |
| **ETA Labels** | Show arrival time | White text on dark bg: "~4 min" |
| **Report Dots** | Show rider-submitted issues | Small colored circles (yellow=delay, etc.) |
| **User Location** | Show rider's position | Blue pulsing dot |
| **Report Button** | Open report modal | Green pill at bottom: "😊 Report Vibe" |
| **Map Controls** | Zoom + recenter | +/- buttons, recenter button |

### **Component Structure**
```jsx
<RiderMap>
  ├── <Header>
  │   ├── Logo + Title
  │   └── Connection Status (green dot)
  ├── <MapContainer> (Leaflet)
  │   ├── <TileLayer> (OpenStreetMap)
  │   ├── {vehicles.map(bus => (
  │   │     <BusMarker>
  │   │       ├── Route number badge
  │   │       └── ETA popup
  │   │   ))}
  │   ├── {reports.map(report => (
  │   │     <ReportDot color={reportColor} />
  │   │   ))}
  │   └── <UserMarker> (blue dot)
  ├── <MapControls>
  │   ├── Zoom In (+)
  │   ├── Zoom Out (-)
  │   └── Recenter (⊙)
  └── <ReportButton onClick={openModal}>
</RiderMap>
```

### **State Management**
```javascript
const [vehicles, setVehicles] = useState([]); // Array of {id, route, lat, lng}
const [reports, setReports] = useState([]); // Array of {type, lat, lng}
const [userLocation, setUserLocation] = useState(null);
const [modalOpen, setModalOpen] = useState(false);
const [connectionStatus, setConnectionStatus] = useState('connecting');
```

### **Socket.io Listeners**
```javascript
socket.on('vehicles:state', (data) => {
  setVehicles(data); // Update bus positions
});

socket.on('reports:state', (data) => {
  setReports(data); // Update report dots
});

socket.on('connect', () => {
  setConnectionStatus('live');
});

socket.on('disconnect', () => {
  setConnectionStatus('offline');
});
```

### **Key Functions**
- `calculateETA(busLat, busLng, userLat, userLng)` - Distance ÷ 20km/h
- `getUserLocation()` - Request geolocation API
- `handleReportSubmit(type)` - Emit `report:create` event

---

## **📱 SCREEN 3: Report Modal**
**File:** `/src/components/ReportModal.jsx`

### **Purpose**
Let riders quickly report issues on a specific bus or route. Creates crowd-sourced intelligence.

### **UI Components Breakdown**

| Component | Purpose | Implementation Details |
|-----------|---------|------------------------|
| **Modal Overlay** | Dim background | Semi-transparent black overlay |
| **Modal Card** | Container for content | White card, centered, rounded corners |
| **Title** | Explain purpose | "How's the ride?" |
| **Subtitle** | Show context | "Bus #42 • Half Way Tree to Downtown" |
| **Close Button** | Dismiss modal | X icon in top-right |
| **Report Grid** | 4 report types | 2×2 grid of tappable buttons |
| **Footer Text** | Encourage use | "Your report helps others plan their trip." |

### **Component Structure**
```jsx
<ReportModal open={modalOpen} onClose={closeModal}>
  ├── <Overlay onClick={closeModal} />
  ├── <ModalCard>
  │   ├── <Header>
  │   │   ├── Title: "How's the ride?"
  │   │   ├── Subtitle: Bus context
  │   │   └── Close button (X)
  │   ├── <ReportGrid>
  │   │   ├── <ReportButton type="delay">
  │   │   │   ├── Icon: ⏱️
  │   │   │   └── Label: "Delay"
  │   │   ├── <ReportButton type="crowded">
  │   │   │   ├── Icon: 👥
  │   │   │   └── Label: "Crowded"
  │   │   ├── <ReportButton type="cold_ac">
  │   │   │   ├── Icon: ❄️
  │   │   │   └── Label: "Cold AC"
  │   │   └── <ReportButton type="standing">
  │   │       ├── Icon: 🧍
  │   │       └── Label: "Standing Room"
  │   └── <Footer>
  │       └── "Your report helps others..."
</ReportModal>
```

### **Props**
```javascript
{
  open: boolean,
  onClose: function,
  busId: string | null,
  routeName: string | null
}
```

### **State Management**
```javascript
const [submitting, setSubmitting] = useState(false);
```

### **Key Functions**
- `handleReportClick(type)` - Submit report, show toast, close modal
- `submitReport(type)` - Emit Socket.io event with user location + type

---

## **🎨 BONUS: Toast Notification**
**File:** `/src/components/Toast.jsx`

### **Purpose**
Confirm to user that their report was successfully sent.

### **UI Components**
```jsx
<Toast visible={showToast}>
  ├── Checkmark icon (✓)
  ├── "Report sent! 🚨"
  └── "Thanks for keeping Kingston moving."
</Toast>
```

### **Props**
```javascript
{
  visible: boolean,
  message: string,
  duration: number (default 3000ms)
}
```

---

## ⏱️ **HOUR-BY-HOUR IMPLEMENTATION**

### **Hour 0 (Pre-Hackathon Prep)**
- ✅ Create React + Vite project
- ✅ Install dependencies: `react-router-dom`, `leaflet`, `react-leaflet`, `socket.io-client`
- ✅ Create `/src/constants.js` with 5 mock routes:
```javascript
export const ROUTES = [
  { id: 'route-800', name: 'Half-Way-Tree → Portmore', number: '800' },
  { id: 'route-76', name: 'Cross Roads → Downtown', number: '76' },
  { id: 'route-42', name: 'UTech → Constant Spring', number: '42' },
  { id: 'route-900', name: 'Portmore → Half-Way-Tree', number: '900' },
  { id: 'route-83', name: 'Stony Hill → Downtown', number: '83' }
];
```

---

### **Hour 1 (Backend + Socket.io Setup)**
**Focus:** Get real-time infrastructure working

#### **Server Tasks:**
1. Create `/server/index.js` with Express + Socket.io
2. Setup in-memory storage:
```javascript
const vehicles = new Map(); // {vehicleId: {route, lat, lng, timestamp}}
const reports = []; // [{type, lat, lng, timestamp}]
```
3. Implement Socket.io events:
   - `driver:update_location` → update vehicles Map
   - `rider:subscribe` → send current state
   - `report:create` → push to reports array
4. Add broadcast logic: `io.emit('vehicles:state', Array.from(vehicles.values()))`

#### **Client Tasks:**
1. Create Socket.io connection in `/src/services/socket.js`
2. Test connection with simple console.log

**Deliverable:** Server running, Socket.io connected, events logging in console

---

### **Hour 2 (Driver Mode + Simulator)**
**Focus:** Get GPS broadcasting working

#### **Tasks:**
1. Build `/src/pages/DriverMode.jsx`:
   - Route dropdown (map over ROUTES constant)
   - START button with click handler
   - Broadcasting status display
   - Coordinates display

2. Implement GPS broadcasting:
```javascript
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    socket.emit('driver:update_location', {
      route: selectedRoute,
      lat: position.coords.latitude,
      lng: position.coords.longitude
    });
  },
  (error) => console.error(error),
  { enableHighAccuracy: true, maximumAge: 0 }
);
```

3. Add server-side simulator in `/server/simulator.js`:
   - 3 mock routes with predefined coordinates
   - Update every 2 seconds
   - Emit as different vehicle IDs

4. **Multi-device test**:
   - Phone: Open driver mode, tap START
   - Laptop: Check server logs for incoming events

**Deliverable:** Driver can broadcast, simulator runs, events reach server

---

### **Hour 3 (Rider Map + Report Modal)**
**Focus:** Build the main user interface

#### **Tasks:**

**1. RiderMap.jsx (45 min):**
- Setup Leaflet map centered on Kingston
- Subscribe to `vehicles:state` Socket.io event
- Render bus markers:
```jsx
{vehicles.map(bus => (
  <Marker 
    key={bus.id}
    position={[bus.lat, bus.lng]}
    icon={customBusIcon}
  >
    <Popup>
      <b>Route {bus.route}</b>
    </Popup>
  </Marker>
))}
```
- Add floating "Report Vibe" button

**2. ReportModal.jsx (15 min):**
- Create modal component with overlay
- 2×2 grid of report buttons
- Wire up onClick handlers
- Test opening/closing

**Deliverable:** Map shows live buses from simulator, modal opens/closes

---

### **Hour 4 (Polish + ETA Feature)**
**Focus:** Make it demo-ready

#### **Tasks:**

**1. ETA Calculation (20 min):**
```javascript
function calculateETA(busLat, busLng, userLat, userLng) {
  const R = 6371; // Earth radius in km
  const dLat = (userLat - busLat) * Math.PI / 180;
  const dLon = (userLng - busLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(busLat * Math.PI / 180) * 
            Math.cos(userLat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  const speed = 20; // km/h average in Kingston traffic
  const timeInHours = distance / speed;
  const timeInMinutes = Math.round(timeInHours * 60);
  return timeInMinutes;
}
```

**2. Add ETA labels to bus markers (15 min):**
```jsx
<Tooltip permanent direction="top">
  ~{calculateETA(bus.lat, bus.lng, userLat, userLng)} min
</Tooltip>
```

**3. Report dots on map (10 min):**
```jsx
{reports.map(report => (
  <CircleMarker
    key={report.id}
    center={[report.lat, report.lng]}
    radius={8}
    fillColor={getReportColor(report.type)}
  />
))}
```

**4. Toast notification (10 min):**
- Create Toast component
- Show after report submission
- Auto-dismiss after 3s

**5. UI Polish (5 min):**
- Add Tailwind classes for spacing
- Ensure mobile-responsive
- Test on phone screen size

**Deliverable:** ETA showing, reports appear on map, looks polished

---

### **Hour 5 (Testing + Deployment)**
**Focus:** Lock it in, don't break it

#### **Tasks:**

**1. Multi-Device Final Test (30 min):**
- [ ] Phone: Open driver mode
- [ ] Phone: Select route, tap START
- [ ] Laptop: See bus appear on map
- [ ] Laptop: Check ETA label shows
- [ ] Phone: Submit report (Crowded)
- [ ] Laptop: See report dot appear
- [ ] Phone: Stop broadcasting
- [ ] Laptop: Confirm bus disappears or stops moving

**2. ngrok Setup (10 min):**
```bash
ngrok http 3000
```
- Copy public URL (e.g., https://abc123.ngrok.io)
- Update Socket.io client to use this URL
- Test from phone again

**3. Screenshot for Pitch (5 min):**
- Take clean screenshot of map with 3 buses
- Screenshot of driver mode broadcasting
- Screenshot of report modal

**4. Pitch Rehearsal (10 min):**
- Practice 60-second flow
- Time yourself

**5. Buffer Time (5 min):**
- Fix any last-minute bugs
- Don't add features!

**Deliverable:** Working demo on 2+ devices via ngrok, screenshots ready

---

## 📊 **Component Checklist**

### **Driver Mode (DriverMode.jsx)**
- [ ] Header with logo + version
- [ ] Exit button routes to "/"
- [ ] Route dropdown with 5 options
- [ ] START button (green, centered)
- [ ] Broadcasting status (pulsing green dot)
- [ ] Live coordinates display
- [ ] "Updated Xs ago" timestamp
- [ ] Simulate GPS toggle
- [ ] Dark green background
- [ ] Mobile-responsive (works on phone)

### **Rider Map (RiderMap.jsx)**
- [ ] Header with logo + connection status
- [ ] Leaflet map centered on Kingston
- [ ] Bus markers with route numbers
- [ ] ETA labels on markers
- [ ] Report dots (color-coded)
- [ ] User location (blue dot)
- [ ] Map controls (+, -, recenter)
- [ ] "Report Vibe" button (bottom-center)
- [ ] Opens ReportModal on click

### **Report Modal (ReportModal.jsx)**
- [ ] Semi-transparent overlay
- [ ] White modal card (centered)
- [ ] "How's the ride?" title
- [ ] Bus context subtitle (if available)
- [ ] Close button (X)
- [ ] 2×2 grid with 4 buttons
- [ ] Each button has icon + label
- [ ] Footer with helpful text
- [ ] onClick submits report
- [ ] Shows toast after submission
- [ ] Closes automatically

### **Toast Notification (Toast.jsx)**
- [ ] Green background
- [ ] Checkmark icon
- [ ] "Report sent! 🚨" message
- [ ] Auto-dismiss after 3s
- [ ] Smooth fade in/out animation

---

## 🎯 **Success Criteria**

By Hour 5, you should be able to:

1. ✅ Open driver page on phone, select route, tap START
2. ✅ See driver's bus appear on laptop map within 2 seconds
3. ✅ Bus marker shows route number and ~X min ETA
4. ✅ Tap "Report Vibe" on laptop, select "Crowded"
5. ✅ See report dot appear on map instantly
6. ✅ Toast shows "Report sent! 🚨"
7. ✅ All 3 simulator buses are moving smoothly
8. ✅ Connection status shows "🟢 Live"
9. ✅ Works on phone + laptop via ngrok

**If all 9 work, you're ready to present.**

---

## 🚨 **Critical Path Items**

These MUST work or the demo fails:

| Component | Must Work | Test Method |
|-----------|-----------|-------------|
| Socket.io connection | ✅ | Check connection status indicator |
| Driver GPS broadcast | ✅ | Tap START, verify coords update |
| Map renders buses | ✅ | See markers appear |
| ETA calculation | ✅ | Check labels show ~X min |
| Report submission | ✅ | Tap report, see dot + toast |
| ngrok connectivity | ✅ | Access from phone on cell data |

**Test these 6 things at the END of Hour 4.** If any fail, fix immediately.

---

## 💾 **File Structure**

```
/kingston-transit
├── /server
│   ├── index.js              # Express + Socket.io server
│   ├── simulator.js          # Mock bus movement
│   └── package.json
├── /client
│   ├── /src
│   │   ├── /pages
│   │   │   ├── DriverMode.jsx    # Screen 3
│   │   │   └── RiderMap.jsx      # Screen 2
│   │   ├── /components
│   │   │   ├── ReportModal.jsx   # Screen 1
│   │   │   └── Toast.jsx
│   │   ├── /services
│   │   │   └── socket.js         # Socket.io client
│   │   ├── constants.js          # Routes data
│   │   ├── App.jsx               # Routing
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## 🏁 **Bottom Line**

You have **3 screens**, **5 hours**, and a **clear path**:

- **Hour 1:** Backend infrastructure
- **Hour 2:** Driver mode + simulator
- **Hour 3:** Map + modal
- **Hour 4:** ETA + polish
- **Hour 5:** Testing + ngrok

Follow this roadmap and you'll finish with time to spare. Good luck! 🚀
