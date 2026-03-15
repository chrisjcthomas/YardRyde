import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'

const NycTransitPage = lazy(() => import('./pages/NycTransitPage'))
const JamaicaDemoPage = lazy(() => import('./pages/JamaicaDemoPage'))

function App() {
  return (
    <Suspense fallback={<div className="app-loading">Loading transit view...</div>}>
      <Router>
        <Routes>
          <Route path="/" element={<JamaicaDemoPage />} />
          <Route path="/lab/nyc" element={<NycTransitPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Suspense>
  )
}

export default App
