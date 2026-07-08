import React from "react"

export default function Botao({ children, onClick, tipo = "primario" }) {
  const estilos = {
    primario: "bg-gold-gradient text-primary-foreground font-bold shadow-gold hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
    secundario: "border border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary",
  }
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer ${estilos[tipo]}`}
    >
      {children}
    </button>
  )
}
