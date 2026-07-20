import React, { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut } from "lucide-react"
import Logo from "./Logo.jsx"
import { useAuth } from "../context/AuthContext.jsx"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleNavClick = (anchor) => {
    setIsOpen(false)
    if (location.pathname !== "/") {
      navigate("/" + anchor)
    } else {
      const element = document.querySelector(anchor)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  const handleLogoClick = (e) => {
    setIsOpen(false)
    if (location.pathname === "/") {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  if (user) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-gold-subtle transition-all duration-500">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo - Premium */}
          {!user && (
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-4 group">
              <img src="/assets/logo-nova-sem-borda.png" alt="Barbearia Do Vale" className="h-[72px] w-auto object-contain border-none transition-transform duration-500 group-hover:scale-105" style={{border: 'none'}} />
            </Link>
          )}

          {/* Desktop Navigation - Premium */}
          <nav className="hidden md:flex items-center gap-10">
            <button
              onClick={() => handleNavClick("#services")}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-all duration-300 cursor-pointer tracking-wide relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all duration-300 hover:after:w-full"
            >
              Serviços
            </button>

            <button
              onClick={() => handleNavClick("#team")}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-all duration-300 cursor-pointer tracking-wide relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all duration-300 hover:after:w-full"
            >
              Equipe
            </button>

            <Link
              to="/agendar"
              className="text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer tracking-wide shadow-gold/20 shadow-sm border border-primary/20"
            >
              Agendar
            </Link>
          </nav>

          {/* Desktop Action Buttons - Premium */}
          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <>
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-foreground hover:bg-muted/80 hover:text-foreground h-12 px-5 py-3 border border-gold-subtle cursor-pointer"
                >
                  <LayoutDashboard size={16} /> Painel
                </button>
                <button 
                  onClick={() => { logout(); navigate("/"); }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 active:translate-y-0 h-12 px-7 py-3 cursor-pointer"
                >
                  <LogOut size={16} /> Sair
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 active:translate-y-0 h-12 px-7 py-3 cursor-pointer"
                >
                  Entrar
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Premium */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-3 text-foreground hover:text-primary transition-all duration-300 cursor-pointer rounded-xl hover:bg-muted/50"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown - Premium */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-background/95 border-b border-gold-subtle backdrop-blur-xl animate-fade-in py-8 px-6 flex flex-col gap-6 shadow-2xl">
          <button
            onClick={() => handleNavClick("#services")}
            className="text-left text-muted-foreground hover:text-primary text-base font-medium py-3 border-b border-gold-subtle transition-colors tracking-wide"
          >
            Serviços
          </button>

          <button
            onClick={() => handleNavClick("#team")}
            className="text-left text-muted-foreground hover:text-primary text-base font-medium py-3 border-b border-gold-subtle transition-colors tracking-wide"
          >
            Equipe
          </button>

          <button
            onClick={() => { setIsOpen(false); navigate("/agendar"); }}
            className="text-left text-primary hover:text-primary-foreground font-semibold py-3 border-b border-gold-subtle transition-colors tracking-wide"
          >
            Agendar Horário
          </button>

          <div className="flex flex-col gap-4 pt-4">
            {user ? (
              <>
                <button 
                  onClick={() => { setIsOpen(false); navigate("/dashboard"); }}
                  className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-foreground hover:bg-muted/80 hover:text-foreground h-12 px-7 py-3 border border-gold-subtle cursor-pointer"
                >
                  <LayoutDashboard size={16} /> Painel
                </button>
                <button 
                  onClick={() => { setIsOpen(false); logout(); navigate("/"); }}
                  className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:shadow-gold-lg active:translate-y-0 h-12 px-7 py-3 cursor-pointer"
                >
                  <LogOut size={16} /> Sair
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setIsOpen(false); navigate("/login"); }}
                  className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:shadow-gold-lg active:translate-y-0 h-12 px-7 py-3 cursor-pointer"
                >
                  Entrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
