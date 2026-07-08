import React, { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Send, Sparkles, CheckCircle2 } from "lucide-react"
import Logo from "../components/Logo.jsx"

export default function TrabalheConosco() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "Barbeiro",
    experiencia: "",
    portfolio: ""
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulando o envio
    setSubmitted(true)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="bg-background min-h-screen text-foreground pt-24 pb-16 flex items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Back Link */}
        <div className="max-w-2xl mx-auto mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Início
          </Link>
        </div>

        {/* Card */}
        <div className="max-w-2xl mx-auto rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-md p-8 md:p-12 shadow-elevated">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <Logo showText={false} className="h-16 w-auto" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Faça Parte do Nosso <span className="gold-text">Time</span>
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
              Buscamos talentos apaixonados pela arte da barbearia que desejam crescer na maior e melhor rede de Natal.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <label htmlFor="nome" className="text-sm font-semibold text-muted-foreground">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    required
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>

                {/* E-mail */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-muted-foreground">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="exemplo@email.com"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Telefone */}
                <div className="space-y-2">
                  <label htmlFor="telefone" className="text-sm font-semibold text-muted-foreground">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    required
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(84) 99999-9999"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>

                {/* Cargo */}
                <div className="space-y-2">
                  <label htmlFor="cargo" className="text-sm font-semibold text-muted-foreground">
                    Vaga Pretendida
                  </label>
                  <select
                    id="cargo"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 cursor-pointer text-muted-foreground"
                  >
                    <option value="Barbeiro">Barbeiro Especialista</option>
                    <option value="Recepcionista">Recepcionista</option>
                    <option value="Gerente">Gerente de Unidade</option>
                    <option value="ServicosGerais">Serviços Gerais</option>
                  </select>
                </div>
              </div>

              {/* Redes Sociais / Portfólio */}
              <div className="space-y-2">
                <label htmlFor="portfolio" className="text-sm font-semibold text-muted-foreground">
                  Link do Portfólio ou Instagram Profissional
                </label>
                <input
                  type="url"
                  id="portfolio"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://instagram.com/seu.perfil"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>

              {/* Mensagem / Experiência */}
              <div className="space-y-2">
                <label htmlFor="experiencia" className="text-sm font-semibold text-muted-foreground">
                  Fale sobre sua experiência profissional
                </label>
                <textarea
                  id="experiencia"
                  name="experiencia"
                  required
                  rows={4}
                  value={formData.experiencia}
                  onChange={handleChange}
                  placeholder="Conte um pouco sobre suas habilidades e histórico de trabalho..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-gold-gradient text-primary-foreground font-bold shadow-gold hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 h-14 rounded-xl text-lg transition-all duration-300 cursor-pointer"
              >
                <Send className="w-5 h-5 mr-1" />
                Enviar Candidatura
              </button>
            </form>
          ) : (
            /* Success State */
            <div className="text-center py-8 space-y-6 animate-scale-up">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-bold">Candidatura Recebida!</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  Obrigado pelo seu interesse, <strong>{formData.nome}</strong>! Nossa equipe analisará seu perfil profissional e entrará em contato em breve.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 border border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary h-12 rounded-xl px-8 text-base font-semibold transition-all duration-300"
                >
                  Voltar para o Início
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
