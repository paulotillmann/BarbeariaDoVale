import React, { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Menu, X, LogIn, UserPlus } from "lucide-react"
import Logo from "./Logo.jsx"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-gold-subtle transition-all duration-500">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo - Premium */}
          <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-4 group">
            <img src="/assets/logo-nova-sem-borda.png" alt="Barbearia Brooklyn" className="h-12 w-auto object-contain border-none transition-transform duration-500 group-hover:scale-105" style={{border: 'none'}} />
          </Link>

          {/* Desktop Navigation - Premium */}
          <nav className="hidden md:flex items-center gap-10">
            <button
              onClick={() => handleNavClick("#services")}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-all duration-300 cursor-pointer tracking-wide relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all duration-300 hover:after:w-full"
            >
              Serviços
            </button>
            <button
              onClick={() => handleNavClick("#plans")}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-all duration-300 cursor-pointer tracking-wide relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all duration-300 hover:after:w-full"
            >
              Planos
            </button>
            <button
              onClick={() => handleNavClick("#team")}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-all duration-300 cursor-pointer tracking-wide relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all duration-300 hover:after:w-full"
            >
              Equipe
            </button>
            <Link
              to="/trabalhe-conosco"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-all duration-300 tracking-wide relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all duration-300 hover:after:w-full"
            >
              Trabalhe Conosco
            </Link>
          </nav>

          {/* Desktop Action Buttons - Premium */}
          <div className="hidden md:flex items-center gap-5">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-foreground hover:bg-muted/80 hover:text-foreground h-12 px-7 py-3 border border-gold-subtle">
              Entrar
            </button>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 active:translate-y-0 h-12 px-7 py-3">
              Criar Conta
            </button>
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
            onClick={() => handleNavClick("#plans")}
            className="text-left text-muted-foreground hover:text-primary text-base font-medium py-3 border-b border-gold-subtle transition-colors tracking-wide"
          >
            Planos
          </button>
          <button
            onClick={() => handleNavClick("#team")}
            className="text-left text-muted-foreground hover:text-primary text-base font-medium py-3 border-b border-gold-subtle transition-colors tracking-wide"
          >
            Equipe
          </button>
          <Link
            to="/trabalhe-conosco"
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-primary text-base font-medium py-3 border-b border-gold-subtle transition-colors tracking-wide"
          >
            Trabalhe Conosco
          </Link>
          <div className="flex flex-col gap-4 pt-4">
            <button className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-foreground hover:bg-muted/80 hover:text-foreground h-12 px-7 py-3 border border-gold-subtle">
              Entrar
            </button>
            <button className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gold-gradient text-primary-foreground font-semibold shadow-gold h-12 px-7 py-3">
              Criar Conta
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
