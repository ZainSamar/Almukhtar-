import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* راح نضيف باقي الصفحات هنا تدريجياً */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
