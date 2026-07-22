import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import Home from "./pages/Home.jsx"
import Sobre from "./pages/Sobre.jsx"
import TrabalheConosco from "./pages/TrabalheConosco.jsx"
import Login from "./pages/Login.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Agenda from "./pages/Agenda.jsx"
import Clientes from "./pages/Clientes.jsx"
import Servicos from "./pages/Servicos.jsx"
import Profissionais from "./pages/Profissionais.jsx"
import Configuracoes from "./pages/Configuracoes.jsx"
import Agendar from "./pages/Agendar.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/trabalhe-conosco" element={<TrabalheConosco />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/profissionais" element={<Profissionais />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/agendar" element={<Agendar />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </div>
  )
}
