import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ClientPage from './pages/ClientPage'
import HostPage from './pages/HostPage'


const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/client" replace />} />
      <Route path="/client" element={<ClientPage />} />
      <Route path="/host" element={<HostPage />} />
    </Routes>
  </BrowserRouter>
)

export default App
