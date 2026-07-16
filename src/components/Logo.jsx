import React from "react"
import logoImg from "../assets/logo_nova.jpeg"

export default function Logo({ className = "h-10 w-auto", showText = true }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logoImg}
        alt="Barbearia Do Vale"
        className={className}
      />
      {showText && (
        <span className="font-display text-lg md:text-xl font-bold tracking-wider uppercase text-foreground">
          Barbearia <span className="gold-text">Do Vale</span>
        </span>
      )}
    </div>
  )
}
