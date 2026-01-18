import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Set document direction to RTL
document.documentElement.setAttribute('dir', 'rtl')

const rootElement = document.getElementById('root') as HTMLElement

createRoot(rootElement).render(
    <App />
)
