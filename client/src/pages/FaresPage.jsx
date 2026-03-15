import { useState } from 'react';
import { ROUTES, ROUTE_COLORS, FARES } from '../constants';

const SERVICE_TYPES = [
  { id: 'regular', label: 'Regular', description: 'Standard route service' },
  { id: 'express', label: 'Express', description: 'Fewer stops, faster trip' },
  { id: 'premium', label: 'Premium', description: 'A/C + reclining seats' },
];

const PASSENGER_TYPES = [
  {
    id: 'adult',
    label: 'Adult',
    icon: '👤',
    note: 'General fare',
    badge: null,
  },
  {
    id: 'student',
    label: 'Student',
    icon: '🎒',
    note: 'Valid school ID or uniform required',
    badge: 'ID required',
  },
  {
    id: 'elderly',
    label: 'Elderly / Pensioner',
    icon: '🧓',
    note: 'Senior concession card required',
    badge: 'Concession card',
  },
  {
    id: 'child',
    label: 'Child',
    icon: '👦',
    note: 'Under 12 years',
    badge: null,
  },
];

function formatFare(amount) {
  return `J$${amount}`;
}

export default function FaresPage() {
  const [activeService, setActiveService] = useState('regular');
  const [hoveredRoute, setHoveredRoute] = useState(null);

  const fare = FARES[activeService];

  return (
    <div className="fares-shell">
      {/* ── Header ── */}
      <header className="fares-header">
        <div className="fares-header-inner">
          <div className="fares-header-flag">
            <span className="flag-stripe flag-black" />
            <span className="flag-stripe flag-gold" />
            <span className="flag-stripe flag-green" />
          </div>
          <div>
            <p className="fares-eyebrow">Jamaica Urban Transit Company</p>
            <h1 className="fares-title">Bus Fares &amp; Pricing</h1>
            <p className="fares-subtitle">
              Serving Kingston, Portmore &amp; Spanish Town · All fares in Jamaican dollars (J$)
            </p>
          </div>
        </div>

        {/* Service type tabs */}
        <div className="fares-service-tabs">
          {SERVICE_TYPES.map((svc) => (
            <button
              key={svc.id}
              type="button"
              className={`fares-service-tab ${activeService === svc.id ? 'is-active' : ''}`}
              onClick={() => setActiveService(svc.id)}
            >
              <strong>{svc.label}</strong>
              <span>{svc.description}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Fare summary cards ── */}
      <section className="fares-summary">
        {PASSENGER_TYPES.map((pt) => (
          <div key={pt.id} className="fare-summary-card">
            <span className="fare-summary-icon">{pt.icon}</span>
            <div className="fare-summary-body">
              <span className="fare-summary-label">{pt.label}</span>
              {pt.badge && <span className="fare-summary-badge">{pt.badge}</span>}
            </div>
            <span className="fare-summary-amount">{formatFare(fare.passengers[pt.id])}</span>
          </div>
        ))}
      </section>

      {/* ── Per-route cards ── */}
      <section className="fares-routes-section">
        <h2 className="fares-section-title">Fares by Route</h2>
        <p className="fares-section-note">
          {activeService === 'regular' && 'Regular service stops at all designated points along the route.'}
          {activeService === 'express' && 'Express service makes fewer stops. One flat fare regardless of passenger type.'}
          {activeService === 'premium' && 'Premium service features A/C, reclining seats, and Smartercard-only payment.'}
        </p>

        <div className="fare-route-grid">
          {ROUTES.map((route) => {
            const color = ROUTE_COLORS[route.number] || '#6b7280';
            const routeFare = fare.byRoute?.[route.number] || fare;
            const isHovered = hoveredRoute === route.number;

            return (
              <div
                key={route.id}
                className={`fare-route-card ${isHovered ? 'is-hovered' : ''}`}
                style={{ '--rc': color }}
                onMouseEnter={() => setHoveredRoute(route.number)}
                onMouseLeave={() => setHoveredRoute(null)}
              >
                {/* Card top stripe */}
                <div className="fare-card-stripe" />

                <div className="fare-card-head">
                  <span className="fare-route-pill">{route.number}</span>
                  <span className="fare-route-name">{route.name.replace(/→|to/g, '→')}</span>
                </div>

                <div className="fare-card-stops">
                  <span className="fare-stop fare-stop-origin">
                    {route.stops[0]?.name}
                  </span>
                  <span className="fare-stop-arrow">→</span>
                  <span className="fare-stop fare-stop-dest">
                    {route.stops[route.stops.length - 1]?.name}
                  </span>
                </div>

                {activeService === 'express' ? (
                  <div className="fare-flat">
                    <span className="fare-flat-label">Flat fare</span>
                    <span className="fare-flat-amount">{formatFare(routeFare.flat ?? fare.flat)}</span>
                  </div>
                ) : (
                  <div className="fare-breakdown">
                    {PASSENGER_TYPES.map((pt) => (
                      <div key={pt.id} className="fare-row">
                        <span className="fare-row-icon">{pt.icon}</span>
                        <span className="fare-row-label">{pt.label}</span>
                        <span className="fare-row-amount">
                          {formatFare(routeFare.passengers?.[pt.id] ?? fare.passengers[pt.id])}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="fare-card-footer">
                  <span className="fare-card-stops-count">{route.stops.length} stops</span>
                  {activeService === 'premium' && (
                    <span className="fare-smartercard-note">Smartercard only</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Info section ── */}
      <section className="fares-info">
        <div className="fares-info-grid">
          <div className="fares-info-card">
            <h3>💳 Smartercard</h3>
            <p>
              Pay cashlessly with the JUTC Smartercard. Balances transfer if the card is lost
              or stolen. Top up at Half Way Tree Transport Centre, Downtown Hub, or Greater Portmore
              Office.
            </p>
          </div>
          <div className="fares-info-card">
            <h3>🎒 Students</h3>
            <p>
              Students must present a valid school ID card or be in school uniform to qualify for
              the concessionary fare. Free rides may be available during back-to-school periods —
              check jutc.gov.jm for announcements.
            </p>
          </div>
          <div className="fares-info-card">
            <h3>🧓 Elderly / Pensioners</h3>
            <p>
              Senior citizens require a JUTC concession card. Visit any major JUTC location with
              valid identification to register and update your Smartercard for senior rates.
            </p>
          </div>
          <div className="fares-info-card">
            <h3>ℹ️ Fare note</h3>
            <p>
              Fares shown reflect the government-subsidised JUTC rates (effective April 2024).
              Express and Premium service fares are set per route and may differ. Call{' '}
              <strong>1-876-948-4240</strong> for the latest pricing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
