import React, { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, CalendarDays, Users, Scissors, User, Settings, LogOut } from "lucide-react"
import { useAuth } from "../context/AuthContext.jsx"

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Inicia recolhido por padrão para hover fluído
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    if (isCollapsed) {
      document.body.setAttribute("data-sidebar-collapsed", "true")
    } else {
      document.body.removeAttribute("data-sidebar-collapsed")
    }
  }, [isCollapsed])

  if (!user) return null

  const baseSidebarOptions = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "agenda", label: "Agenda", path: "/agenda", icon: <CalendarDays size={20} /> },
    { id: "clientes", label: "Clientes", path: "/clientes", icon: <Users size={20} /> },
    { id: "servicos", label: "Serviços", path: "/servicos", icon: <Scissors size={20} /> },
    { id: "equipe", label: "Profissionais", path: "/profissionais", icon: <User size={20} /> }
  ]

  const sidebarOptions = user.role === 'admin'
    ? [...baseSidebarOptions, { id: "configuracoes", label: "Configurações", path: "/configuracoes", icon: <Settings size={20} /> }]
    : baseSidebarOptions

  const currentPath = location.pathname

  const handleOptionClick = () => {
    setIsCollapsed(true)
  }

  return (
    <>
      {/* Sidebar Vertical para Telas Grandes (Desktop) com Hover e Collapse Suave */}
      <aside 
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={`hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 h-[calc(100vh-100px)] sidebar-smooth-transition duration-700 bg-gold-gradient rounded-[48px] shadow-gold-lg flex-col justify-between py-6 z-50 border border-gold-subtle ${
          isCollapsed ? "w-[88px] px-2.5" : "w-[210px] px-4"
        }`}
      >
        <div className="space-y-4">
          {/* Cabeçalho do Sidebar com Logo Redimensionável */}
          <div className="flex flex-col items-center border-b border-black/10 pb-3 relative">
            <Link to="/dashboard" onClick={handleOptionClick} className="transition-transform duration-700 hover:scale-105 mt-2">
              <img
                src="/assets/logo-nova-sem-borda.png"
                alt="Barbearia Do Vale"
                className={`object-contain sidebar-smooth-transition duration-700 ${
                  isCollapsed ? "h-[68px] max-w-[72px]" : "h-[115px] w-auto"
                }`}
              />
            </Link>
          </div>

          {/* Opções de Navegação com Animação Fluída de Texto e Ícone Centralizado */}
          <nav className="space-y-2.5">
            {sidebarOptions.filter(opt => opt.id !== "configuracoes").map((opt) => {
              const isSelected = currentPath === opt.path
              return (
                <Link
                  key={opt.id}
                  to={opt.path}
                  title={opt.label}
                  onClick={handleOptionClick}
                  className={`flex items-center sidebar-smooth-transition duration-700 overflow-hidden relative ${
                    isCollapsed 
                      ? "w-[54px] h-[54px] rounded-full justify-center items-center mx-auto p-0 gap-0" 
                      : "w-full px-4 py-2.5 rounded-2xl gap-3 text-xs font-bold uppercase tracking-wider"
                  } ${
                    isSelected 
                      ? "bg-black text-[#d4af37] shadow-md scale-105" 
                      : "text-black/80 hover:bg-black/10 hover:text-black hover:scale-105"
                  }`}
                >
                  <span className="shrink-0 flex items-center justify-center">{opt.icon}</span>
                  <span className={`truncate sidebar-smooth-transition duration-700 transition-all ${
                    isCollapsed 
                      ? "max-w-0 opacity-0 translate-x-2 pointer-events-none absolute left-14" 
                      : "max-w-[140px] opacity-100 translate-x-0 relative left-0"
                  }`}>
                    {opt.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Rodapé do Sidebar com Transição Suave Cruzada */}
        <div className="border-t border-black/10 pt-3 flex flex-col gap-2 relative min-h-[85px] justify-center">
          {/* Rodapé Expandido */}
          <div className={`sidebar-smooth-transition duration-700 flex flex-col gap-2 ${
            isCollapsed ? "opacity-0 pointer-events-none absolute inset-x-0 bottom-0 scale-95" : "opacity-100 relative scale-100"
          }`}>
            <div className="text-center">
              <div className="text-[10px] font-bold text-black truncate max-w-[170px] mx-auto">
                {user.name}
              </div>
              <div className="text-[8px] font-extrabold text-black/50 uppercase tracking-widest mt-0.5">
                {user.role === 'admin' ? 'Administrador' : user.role === 'barber' ? 'Barbeiro' : 'Cliente VIP'}
              </div>
            </div>
            {user.role === 'admin' && (
              <Link
                to="/configuracoes"
                onClick={handleOptionClick}
                className={`w-[128px] mx-auto py-2 flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl sidebar-smooth-transition duration-700 border ${
                  currentPath === "/configuracoes"
                    ? "bg-black text-[#d4af37] border-black shadow-md"
                    : "bg-black/15 hover:bg-black text-black hover:text-[#d4af37] border-black/5 hover:border-black"
                }`}
              >
                <Settings size={12} /> Configurações
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                handleOptionClick()
                logout()
                navigate("/login")
              }}
              className="w-[128px] mx-auto mt-0.5 py-2 flex items-center justify-center gap-1.5 bg-black/15 hover:bg-black text-black hover:text-[#d4af37] text-[10px] font-extrabold uppercase tracking-wider rounded-xl sidebar-smooth-transition duration-700 border border-black/5 hover:border-black cursor-pointer hover:scale-102"
            >
              <LogOut size={12} /> Sair
            </button>
          </div>

          {/* Rodapé Recolhido */}
          <div className={`sidebar-smooth-transition duration-700 flex flex-col items-center gap-2 ${
            isCollapsed ? "opacity-100 relative scale-100" : "opacity-0 pointer-events-none absolute inset-x-0 bottom-0 scale-95"
          }`}>
            {user.role === 'admin' && (
              <Link
                to="/configuracoes"
                title="Configurações"
                onClick={handleOptionClick}
                className={`w-[54px] h-[54px] rounded-full flex items-center justify-center sidebar-smooth-transition duration-700 border ${
                  currentPath === "/configuracoes"
                    ? "bg-black text-[#d4af37] border-black shadow-md scale-105"
                    : "bg-black/15 hover:bg-black text-black hover:text-[#d4af37] border-black/5"
                }`}
              >
                <Settings size={22} />
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                handleOptionClick()
                logout()
                navigate("/login")
              }}
              title="Sair"
              className="w-[54px] h-[54px] rounded-full flex items-center justify-center bg-black/15 hover:bg-black text-black hover:text-[#d4af37] sidebar-smooth-transition duration-700 border border-black/5 cursor-pointer hover:scale-105"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </aside>

      {/* Navigation Bar Horizontal para Telas Pequenas (Mobile) - Pílula Flutuante Inferior */}
      <aside className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-gold-gradient rounded-full shadow-gold-lg flex items-center justify-around px-4 z-50 border border-gold-subtle">
        {sidebarOptions.map((opt) => {
          const isSelected = currentPath === opt.path
          return (
            <Link
              key={opt.id}
              to={opt.path}
              className={`p-3 rounded-full transition-all duration-300 flex flex-col items-center justify-center ${
                isSelected 
                  ? "bg-black text-[#d4af37] scale-110 shadow-md" 
                  : "text-black/70 hover:text-black"
              }`}
              title={opt.label}
            >
              {opt.icon}
            </Link>
          )
        })}
      </aside>
    </>
  )
}
