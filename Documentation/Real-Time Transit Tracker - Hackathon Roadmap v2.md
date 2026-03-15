# Real-Time Transit Tracker for Jamaica
A tightened "Goldilocks" 5-hour hackathon plan for today's Intellibus Hackathon 2026.
## Tech Stack
* **Frontend**: React + Vite, Leaflet (maps), Socket.io client, Tailwind CSS
* **Backend**: Node.js, Express, Socket.io server
* **Storage**: In-memory (Map/objects), optional PostgreSQL for persistence
* **Deployment**: ngrok for multi-device testing
## High-Level Changes
* Use **in-memory storage** (simple Map/objects) for live vehicles and reports; skip PostgreSQL unless you have extra time in Hour 5
* Add **mock vehicle simulators** so the map looks alive even without real GPS
* Get **ngrok + multi-device** working early so you don't die in deployment hell at the end
* Add exactly **one "wow" feature** (ETA calculation showing "~3 min" above bus markers) and include local "vibe" reports (Cold AC) alongside standard reports (Delay, Crowded, Standing Room)
## Hour 0 (Starting Now) – Prep
Do this the night before or in the 15-20 min buffer before coding starts.
* Install Node.js, test `npm init` and React + Vite scaffold
* Spin up a tiny test app with Leaflet centered on Kingston (18.0179°N, 76.8099°W)
* Verify Socket.io basics: simple `connection` event and a `ping` event working locally
* Install and test ngrok with a "hello world" Express server so you already know the command
* Review the approved mockups (driver mode, rider map, report modal)
* Create a `constants.js` with mock route coordinates pre-written (don't waste Hour 2 Googling Kingston streets)
* Confirm route names with your team:
    * Route 800: Half-Way-Tree → Portmore
    * Route 76: Cross Roads → Downtown
    * Route 42: UTech → Constant Spring
    * Route 900: Portmore → Half-Way-Tree
    * Route 83: Stony Hill → Downtown
* Draft your opening pitch:
    * "In Kingston, people waste 2+ hours daily waiting for buses that may never come."
    * "We built real-time bus tracking with crowdsourced 'vibe' reports, in 5 hours."
## Hour 1 – Skeleton + Real-time Core (0:00–1:00)
**Goal**: Working Socket.io server and barebones client seeing dummy updates.
* Create project structure:
    * `/server/index.js` – Express + Socket.io server
    * `/client` – React app (Vite + React)
* Implement in-memory structures on server:
    * `const vehicles = new Map();`
    * `const reports = [];`
* Implement Socket.io events:
    * `driver:update_location` → update `vehicles` Map and `io.emit('vehicles:state', ...)`
    * `rider:subscribe` → send current vehicle state
    * `report:create` → push to `reports` array, broadcast `reports:state`
* Add simple test client page that logs incoming `vehicles:state` in console
**No DB, no Postgres, no Kafka in this hour.**
## Hour 2 – Driver Mode + Mock Simulator (1:00–2:00)
**Goal**: A "driver" page that broadcasts, plus simulation mode that fakes multiple drivers.
* In React, create `/driver` page:
    * Big **Start Broadcasting** button
    * On click: request geolocation, send `driver:update_location` every 5-10 seconds
    * Show status text: "Broadcasting…" or error messages
* Add **debug/simulator mode** on server:
    * Hardcode 2-3 routes (arrays of lat/lng from your `constants.js`)
    * Every 2-3 seconds, move simulated buses along routes and emit events for `sim-bus-1`, `sim-bus-2`
* **Multi-device test (spend 15-20 min here, not 2!)**:
    * Use `ngrok http 3000` to get public URL
    * Test phone → laptop Socket.io connection NOW
    * Don't wait until Hour 5 for this
    * Laptop = commuter/map
    * Phone = driver using `/driver` page with real GPS
    * If it doesn't work by 2:15, you'll panic later
## Hour 3 – Live Map + Reports UI (2:00–3:00)
**Goal**: Real-time map with moving markers, plus modal-based report submission.
* Build `Map.jsx` using Leaflet:
    * Center on Kingston (18.0179°N, 76.8099°W)
    * Subscribe to `vehicles:state` and `reports:state` via Socket.io
    * Render bus markers for each vehicle with route number badge
* Add **Report button** at bottom of map:
    * Floating green pill: "😊 Report Vibe"
    * Opens modal with 4 report types (2×2 grid):
        * Delay ⏱️
        * Crowded 👥
        * Cold AC ❄️
        * Standing Room 🧍
    * On click: send `report:create` with user location + type
    * Close modal, show green toast: "Report sent! 🚨"
* Show report dots on map:
    * Small colored circles (yellow=delay, blue=crowded, etc.)
    * No labels (just the dot itself)
* **Important:** Use a modal for report submission (not inline buttons)
    * Modal opens when clicking "😊 Report Vibe" button
    * 2×2 grid with 4 report types
    * Shows "Report sent! 🚨" toast after submission
    * Mockup reference: See approved design files
**End of Hour 3**: You can demo → open map → see fake buses moving → tap Report Vibe → select type → see dot appear + toast.
## Hour 4 – Polish + Single Wow Feature (3:00–4:00)
**Goal**: Make it feel intentional and add your one "wow".
* UI polish (keep minimal):
    * Use Tailwind / simple CSS; no design rabbit holes
    * Clear labels: "Driver Mode" vs "Rider View"
* Add **ONE** wow feature (we're doing ETA):
    * **Simple ETA**: Distance between bus and user location, assume 20 km/h, display "~3 min" label above each bus marker
    * ~~Route filter~~ (cut - not needed for 3 buses)
    * ~~Smooth animation~~ (nice-to-have if time, but ETA is the priority)
* Make sure mock buses look great even if live GPS fails
* Do a full run-through on two devices at least once this hour
* **DO NOT ADD:**
    * Search bar for routes/stops
    * "Active Reports" feed panel
    * Route filter dropdown
    * Capacity indicators ("Seats filling fast")
    * More than 4 report types
    * **These were in early mockups but REMOVED for time.**
### Pre-Hour 5 Validation Checklist
Before moving to Hour 5, verify these 6 things work:
1. [ ] Socket.io connection shows "🟢 Live" on rider page
2. [ ] Driver page broadcasts GPS (coords update every 2-5s)
3. [ ] Map shows 3+ buses (simulated + any real drivers)
4. [ ] ETA labels appear above bus markers
5. [ ] Report submission → dot appears + toast shows
6. [ ] ngrok URL accessible from phone on cellular
**If ANY fail, fix immediately. Do not proceed to Hour 5.**
## Hour 5 – Demo Hardening (4:00–5:00)
**Goal**: Lock in the story, not new features.
* Final multi-device test:
    * Phone on `/driver` with Start Broadcasting
    * Laptop on `/` map as rider
    * Confirm: buses appear, they move, reports show up
* Lock in **ngrok**:
    * Start tunnel and confirm both devices connect via public URL
    * Do not change ports or env after this
* Prepare 60-90 second pitch flow:
    1. Pain: "In Kingston, people waste 2+ hours daily waiting for buses that might never come."
    2. Show live buses moving (simulated + real driver tab)
    3. Trigger a "Delay" or "Cold AC" report → show it appear instantly
    4. Call out wow feature: "We also show rough ETA so riders know whether to wait or walk."
    5. Close: "This could plug into real JUTC data or private bus operators and scale island-wide."
* **Only if rock solid with 15-20 min left**: Add minimal Postgres to persist reports (mention "backed by Postgres, ready for historical analytics")
## Roles (if 2-3 people)
* **Dev 1**: Backend + Socket.io + simulator (Hours 1-3), then ngrok + testing (Hour 5)
* **Dev 2**: React + Leaflet map + Driver page (Hours 2-3), then UI polish and wow feature (Hour 4)
* **Dev 3** (if any): Reports UI + pitch script (Hours 3-5)
**Important**: If you have teammates, sync on the Socket.io event contract BEFORE Hour 1 starts, not during.
## Key Files
```warp-runnable-command
/server
  index.js          # Express + Socket.io server
  simulator.js      # Mock bus movement (3 routes)

/client
  src/App.jsx            # Routing (/ and /driver)
  src/pages/RiderMap.jsx # Main map view (Leaflet)
  src/pages/DriverMode.jsx # Driver broadcasting page
  src/components/ReportModal.jsx # 4-button report grid
  src/components/Toast.jsx # Success notification
  src/services/socket.js  # Socket.io client wrapper
  src/constants.js        # 5 JUTC routes with coordinates
```
## The Only Real Risk
**Multi-device testing in Hour 2**: This is where things break (CORS, WebSocket drops, phone browser quirks). Spend 10-15 minutes here. If it doesn't work by 2:15, you'll panic.
## Bottom Line
This plan will finish. The mock buses guarantee you'll have something to show even if everything else breaks. The ETA gives you a talking point. The "vibe" reports make it memorable.