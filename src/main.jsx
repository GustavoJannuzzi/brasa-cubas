import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { protegerDoTradutor } from './lib/tradutor'
import { ErroGeral } from './ui/ErroGeral'
import './index.css'

protegerDoTradutor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErroGeral>
      <App />
    </ErroGeral>
  </StrictMode>,
)
