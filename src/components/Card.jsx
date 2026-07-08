import React from "react"

export default function Card({ titulo, children }) {
  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-elevated p-6 max-w-md w-full transition-all duration-300">
      {titulo && (
        <h2 className="text-xl font-bold font-display mb-4 text-foreground border-b border-border/30 pb-2">
          {titulo}
        </h2>
      )}
      <div className="text-muted-foreground leading-relaxed text-sm">{children}</div>
    </div>
  )
}
