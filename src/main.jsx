import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErroGeral } from './ui/ErroGeral'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErroGeral>
      <App />
    </ErroGeral>
  </StrictMode>,
)
