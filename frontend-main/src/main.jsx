import React from 'react'
import ReactDOM from 'react-dom/client'
// 1. Design tokens (CSS custom properties) — must load first
import './styles/tokens.css'
// 2. Global reset
import './index.css'
// 3. App
import { AuthProvider } from './authContext.jsx'
import ProjectRoutes from './Routes.jsx'
import { BrowserRouter as Router } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Router>
      <ProjectRoutes />
    </Router>
  </AuthProvider>
)
