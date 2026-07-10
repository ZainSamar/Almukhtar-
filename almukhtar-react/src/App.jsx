import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import SellerDashboard from './pages/SellerDashboard.jsx'
import Store from './pages/Store.jsx'
import Terms from './pages/Terms.jsx'
import StoreFront from './pages/StoreFront.jsx'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/dashboard" element={<SellerDashboard />} />
        <Route path="/store" element={<Store />} />
        <Route path="/terms" element={<Terms />} />
         <Route path="/store/:slug" element={<StoreFront />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
