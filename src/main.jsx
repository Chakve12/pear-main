import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import { useThemeStore, applyTheme } from './store/useThemeStore'

applyTheme(useThemeStore.getState().theme)

createRoot(document.getElementById('root')).render(
  <App />
)
