import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Polyfill for Recharts minPointSize compatibility
if (typeof window !== 'undefined' && !('minPointSize' in Object.prototype)) {
  Object.defineProperty(Object.prototype, 'minPointSize', { value: 0, writable: true, configurable: true });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
