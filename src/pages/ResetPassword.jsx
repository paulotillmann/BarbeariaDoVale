import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../context/AuthContext.jsx"
import { Lock, User, AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react"

export default function ResetPassword() {
  const navigate = useNavigate()
  
  const [loginKey, setLoginKey] = useState("") // Aceita e-mail ou telefone
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    setLoading(true)

    if (!loginKey.trim()) {
      setError("Por favor, insira seu telefone ou e-mail cadastrado.")
      setLoading(false)
      return
    }

    if (newPassword.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          loginKey: loginKey.trim(),
          newPassword: newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMsg(data.message || "Sua senha foi redefinida com sucesso!")
        setLoginKey("")
        setNewPassword("")
      } else {
        setError(data.error || "Não foi possível redefinir a senha.")
      }
    } catch {
      setError("Erro ao conectar com o servidor. Verifique sua conexão.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center px-4 relative pt-20">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate("/login")}
        className="absolute top-24 left-4 md:left-10 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm font-medium"
      >
        <ArrowLeft size={16} /> Voltar para o Login
      </button>

      <div className="w-full max-w-md z-10">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/assets/logo-nova-sem-borda.png" alt="Barbearia Do Vale" className="h-[152px] md:h-[200px] w-auto object-contain mb-4" />
          <h2 className="text-2xl font-bold font-display tracking-wide uppercase">
            Redefinir Senha
          </h2>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Insira suas credenciais cadastradas para criar uma nova senha
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-2xl border border-gold-subtle p-8 shadow-elevated">
          {error && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6 animate-fade-in">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="space-y-6 text-center animate-scale-in">
              <div className="flex flex-col items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-5">
                <CheckCircle2 size={36} className="text-green-400 animate-pulse mb-1" />
                <span className="font-semibold text-base">{successMsg}</span>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">Sua conta foi atualizada. Agora você pode entrar com a sua nova senha.</p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full inline-flex items-center justify-center gap-2 bg-gold-gradient text-primary-foreground font-bold h-14 rounded-xl text-sm uppercase tracking-wider shadow-gold hover:shadow-gold-lg transition-all duration-300 cursor-pointer"
              >
                Ir para o Login
              </button>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail ou Telefone</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={loginKey}
                    onChange={(e) => setLoginKey(e.target.value)}
                    placeholder="Ex: paulogtillmann@gmail.com ou (84) 99999-9999"
                    className="w-full bg-background/50 border border-border focus:border-primary rounded-xl py-3.5 pl-12 pr-4 text-foreground placeholder-muted-foreground focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background/50 border border-border focus:border-primary rounded-xl py-3.5 pl-12 pr-12 text-foreground placeholder-muted-foreground focus:outline-none transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer"
                    title={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 active:translate-y-0 h-14 rounded-xl text-base transition-all duration-500 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Redefinir Minha Senha"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
