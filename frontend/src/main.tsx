import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GenBatchProgressProvider } from './hooks/useGenBatchProgress.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GenBatchProgressProvider>
      <App />
    </GenBatchProgressProvider>
  </StrictMode>,
)
