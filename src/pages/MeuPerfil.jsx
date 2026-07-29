import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { User, Lock, Save, AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

const formatPhoneNumber = (value) => {
  if (!value) return ""
  const digits = value.replace(/[^\d]/g, "")
  if (digits.length > 11) return formatPhoneNumber(digits.slice(0, 11))
  if (digits.length > 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length > 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  if (digits.length > 2) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length > 0) {
    return `(${digits}`
  }
  return digits
}

export default function MeuPerfil() {
  const { user, token, updateUserSession } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    setName(user.name || "")
    setPhone(formatPhoneNumber(user.phone || ""))
    setEmail(user.email || "")
  }, [user, navigate])

  const handlePhoneChange = (e) => {
    setPhone(formatPhoneNumber(e.target.value))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage("")
    setSuccessMessage("")

    if (!name.trim()) {
      setErrorMessage("O nome completo é obrigatório.")
      setSubmitting(false)
      return
    }

    if (newPassword) {
      if (!currentPassword) {
        setErrorMessage("Informe a sua senha atual para poder cadastrar uma nova senha.")
        setSubmitting(false)
        return
      }
      if (newPassword.length < 6) {
        setErrorMessage("A nova senha deve possuir no mínimo 6 caracteres.")
        setSubmitting(false)
        return
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("A nova senha e a confirmação de senha não coincidem.")
        setSubmitting(false)
        return
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar dados do perfil.")
      }

      if (updateUserSession) {
        updateUserSession(data.user, data.token)
      }

      setSuccessMessage("Dados do seu perfil foram atualizados com sucesso!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => {
        setSuccessMessage("")
      }, 6000)
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-transparent text-foreground pt-24 pb-28 lg:pt-8 lg:pb-12 pr-[40px] pl-4 md:pl-8 relative lg:pl-[274px] sidebar-page-container flex flex-col justify-start">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        `}
      </style>

      {/* Sidebar de Navegação */}
      <Sidebar />

      <div className="w-full max-w-3xl mx-auto relative z-10 animate-fade-in mt-[20px]">
        <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated relative overflow-hidden">
          
          <div className="flex items-center gap-3 border-b border-border/80 pb-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gold-gradient/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-[18pt] font-bold font-display tracking-wide flex items-center gap-2">
                Meu Perfil
              </h2>
              <p className="text-xs text-muted-foreground">
                Atualize seus dados pessoais de cadastro e altere sua senha de acesso.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-4 mb-6 animate-scale-in">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl p-4 mb-6 animate-scale-in">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Bloco 1: Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <User size={14} /> Informações Pessoais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Celular / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Ex: (34) 99868-4036"
                    maxLength={15}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">E-mail de Acesso</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: usuario@email.com"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Segurança / Alteração de Senha */}
            <div className="space-y-4 border-t border-border/40 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Lock size={14} /> Alterar Senha (Opcional)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Deixe os campos de senha em branco se deseja manter a sua senha atual.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Senha Atual</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 pl-4 pr-10 text-sm text-foreground focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer transition-colors"
                      title={showCurrentPassword ? "Ocultar senha" : "Exibir senha"}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 pl-4 pr-10 text-sm text-foreground focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer transition-colors"
                      title={showNewPassword ? "Ocultar senha" : "Exibir senha"}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 pl-4 pr-10 text-sm text-foreground focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer transition-colors"
                      title={showConfirmPassword ? "Ocultar senha" : "Exibir senha"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Ação */}
            <div className="pt-4 border-t border-border/40 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 bg-gold-gradient text-primary-foreground font-bold h-12 px-8 rounded-xl text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={16} /> Salvar Perfil
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
