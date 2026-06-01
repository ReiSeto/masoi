import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1035',
          color: '#fff',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '12px',
          fontFamily: 'Outfit, sans-serif',
        },
        success: {
          iconTheme: { primary: '#7c3aed', secondary: '#fff' },
          duration: 3000,
        },
        error: {
          iconTheme: { primary: '#f43f5e', secondary: '#fff' },
          duration: 4000,
        },
      }}
    />
  </React.StrictMode>
)
