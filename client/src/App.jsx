import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ACTIVE_SOURCE, DATA_SOURCE } from './constants'

const NycTransitPage = lazy(() => import('./pages/NycTransitPage'))
const RiderMap = lazy(() => import('./pages/RiderMap'))

function App() {
  useEffect(() => {
    document.title = ACTIVE_SOURCE.displayName
  }, [])

  const landingPage = DATA_SOURCE === 'nyc' ? <NycTransitPage /> : <RiderMap />

  return (
    <Suspense fallback={<div className="app-loading">Loading transit view...</div>}>
      <Router>
        <Routes>
          <Route path="/" element={landingPage} />
        </Routes>
      </Router>
    </Suspense>
  )
}

export default App
