import StoreSetup from './pages/StoreSetup.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import SellerDashboard from './pages/SellerDashboard.jsx'
import Store from './pages/Store.jsx'
import Terms from './pages/Terms.jsx'
import StoreFront from './pages/StoreFront.jsx'
import Home from './pages/Home.jsx'
import ProductPage from './pages/ProductPage.jsx'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<StoreSetup />} />
        <Route path="/" element={<Home />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/dashboard" element={<SellerDashboard />} />
        <Route path="/store" element={<Store />} />
        <Route path="/terms" element={<Terms />} />
         <Route path="/store/:slug" element={<StoreFront />} />
        <Route path="/product/:pid" element={<ProductPage />} />
        <Route path="/product/:pid/:slug" element={<ProductPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
