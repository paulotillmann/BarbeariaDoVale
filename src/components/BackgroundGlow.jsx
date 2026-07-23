import React from "react"

export default function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Background Gradients Radial - Premium */}
      <div className="absolute inset-0 bg-hero-gradient"></div>

      {/* Glow Ambient Lights */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-30"></div>

      {/* Geometric Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
    </div>
  )
}
