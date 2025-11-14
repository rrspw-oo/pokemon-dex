import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializePWA, setupInstallPrompt, setupNetworkMonitoring } from './utils/pwaHelper'

initializePWA()
setupInstallPrompt()
setupNetworkMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
