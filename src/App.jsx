import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import BackgroundGlow from "./components/BackgroundGlow.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import Home from "./pages/Home.jsx"
import Sobre from "./pages/Sobre.jsx"
import TrabalheConosco from "./pages/TrabalheConosco.jsx"
import Login from "./pages/Login.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Agenda from "./pages/Agenda.jsx"
import Clientes from "./pages/Clientes.jsx"
import Servicos from "./pages/Servicos.jsx"
import Produtos from "./pages/Produtos.jsx"
import Profissionais from "./pages/Profissionais.jsx"
import Configuracoes from "./pages/Configuracoes.jsx"
import Agendar from "./pages/Agendar.jsx"
import AgendaGrid from "./pages/AgendaGrid.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"
import MeuPerfil from "./pages/MeuPerfil.jsx"
import Caixa from "./pages/Caixa.jsx"

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-x-hidden">
      <BackgroundGlow />
      <Navbar />
      <div className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/trabalhe-conosco" element={<TrabalheConosco />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'secretario']}><Dashboard /></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute allowedRoles={['admin', 'secretario', 'barber']}><Agenda /></ProtectedRoute>} />
          <Route path="/agenda-barbeiros" element={<ProtectedRoute allowedRoles={['admin', 'secretario', 'barber']}><AgendaGrid /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute allowedRoles={['admin', 'secretario', 'barber']}><Clientes /></ProtectedRoute>} />
          <Route path="/caixa" element={<ProtectedRoute allowedRoles={['admin', 'secretario']}><Caixa /></ProtectedRoute>} />
          <Route path="/servicos" element={<ProtectedRoute allowedRoles={['admin', 'secretario']}><Servicos /></ProtectedRoute>} />
          <Route path="/produtos" element={<ProtectedRoute allowedRoles={['admin', 'secretario']}><Produtos /></ProtectedRoute>} />
          <Route path="/profissionais" element={<ProtectedRoute allowedRoles={['admin', 'secretario']}><Profissionais /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={['admin']}><Configuracoes /></ProtectedRoute>} />
          <Route path="/meu-perfil" element={<ProtectedRoute allowedRoles={['admin', 'secretario', 'barber']}><MeuPerfil /></ProtectedRoute>} />
          <Route path="/agendar" element={<Agendar />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </div>
  )
}
