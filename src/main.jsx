import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//antd
import 'antd/dist/reset.css';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'

// AOS & Swiper CSS (thay cho wow + owlcarousel)
import 'aos/dist/aos.css'
import 'swiper/css'

// CSS của template (đã copy sang src)
import './assets/styles/style.css'
import './index.css'
// import './App.css'

// Bootstrap JS (bundle có Popper: cần cho navbar, dropdown, modal...)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'


import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <App />
  </BrowserRouter>
)
