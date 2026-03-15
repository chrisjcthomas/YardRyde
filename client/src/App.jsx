import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ACTIVE_SOURCE, DATA_SOURCE } from './constants'

const NycTransitPage = lazy(() => import('./pages/NycTransitPage'))
const RiderMap = lazy(() => import('./pages/RiderMap'))
const FaresPage = lazy(() => import('./pages/FaresPage'))

function App() {
  useEffect(() => {
    document.title = ACTIVE_SOURCE.displayName
  }, [])

  const landingPage = DATA_SOURCE === 'nyc' ? <NycTransitPage /> : <RiderMap />

  return (
    <Suspense fallback={<div className="app-loading">Loading...</div>}>
      <Router>
        <Routes>
          <Route path="/" element={landingPage} />
          <Route path="/fares" element={<FaresPage />} />
          {/* existing driver page stays as-is */}
        </Routes>
      </Router>
    </Suspense>
  )
}

export default App
