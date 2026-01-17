import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from './stores/authStore.ts'

function AppWrapper() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
)
