# Not Fully Implemented Features

Features that are scoped but not yet complete. Updated as items get implemented.

## Implemented (code written, needs runtime environment to test)

- **PostgreSQL Persistence** -- JPA entities, repositories, write-through caching from TransitService, auto-cleanup of expired reports, `/api/reports/history` endpoint. Requires a running PostgreSQL instance to activate.
- **Real GTFS-RT Data (NYC MTA)** -- `GtfsRtFeedService` polls MTA vehicle positions feed every 15s. Activated by setting `transit.data-source=mta` in `application.properties`. Requires an MTA API key.
- **Real GTFS-RT Data (Kingston Simulated)** -- `BusSimulatorService` outputs GTFS-RT-compatible fields (tripId, routeId, scheduleRelationship). `GET /api/gtfs-rt/vehicle-positions` serves a Protocol Buffer response.
- **React Native Mobile App** -- Project structure in `/mobile` with MapScreen, TripPlannerScreen, SettingsScreen, Socket.IO service, ETA calculations, and push notification service. Requires Android SDK / Xcode to build.

## Not Started

- **SMS/WhatsApp Fallback** -- Text "ROUTE 800" to get next bus ETA. Requires Twilio or similar service integration.
- **Localization** -- Multi-language support (English, Patois).
- **Authentication** -- Driver/admin accounts for secured access.
