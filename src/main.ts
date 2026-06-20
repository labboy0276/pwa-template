import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { mountApp } from './app'

// Register the service worker (offline support + auto-updates).
registerSW({ immediate: true })

mountApp(document.getElementById('app')!)
