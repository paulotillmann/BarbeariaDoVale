import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import { LogIn, UserPlus, Phone, Lock, User, AlertCircle, ArrowLeft, Mail, Eye, EyeOff } from "lucide-react"

export default function Login() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Detectar modo inicial a partir do query param (ex: /login?mode=register)
  const queryParams = new URLSearchParams(location.search)
  const initialIsRegister = queryParams.get("mode") === "register"

  const [isRegister, setIsRegister] = useState(initialIsRegister)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [loginKey, setLoginKey] = useState("") // Para login: aceita e-mail ou telefone
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Carregar e-mail/telefone salvo se ativado "Lembrar-me" anteriormente
  useEffect(() => {
    const savedKey = localStorage.getItem("rememberedLoginKey")
    if (savedKey) {
      setLoginKey(savedKey)
      setRememberMe(true)
    }
  }, [])

  useEffect(() => {
    // Se o usuário já estiver logado, redireciona para o dashboard
    if (user) {
      navigate("/dashboard")
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError("O nome é obrigatório.")
          setLoading(false)
          return
        }

        const cleanPhone = phone.replace(/\D/g, "")
        if (cleanPhone.length < 10) {
          setError("Por favor, insira um número de telefone válido com DDD.")
          setLoading(false)
          return
        }

        await register(name, cleanPhone, email.trim() || null, password, "client")
      } else {
        if (!loginKey.trim()) {
          setError("Por favor, insira seu telefone ou e-mail.")
          setLoading(false)
          return
        }

        await login(loginKey.trim(), password)
        if (rememberMe) {
          localStorage.setItem("rememberedLoginKey", loginKey.trim())
        } else {
          localStorage.removeItem("rememberedLoginKey")
        }
      }
      navigate("/dashboard")
    } catch (err) {
      setError(err.message || "Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Formatador de máscara de telefone brasileiro (ex: (84) 99999-9999)
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 11) value = value.slice(0, 11)
    
    if (value.length > 10) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
    } else if (value.length > 5) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    } else if (value.length > 0) {
      value = `(${value}`
    }
    setPhone(value)
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center px-4 relative pt-20">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[120px]"></div>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate("/")}
        className="absolute top-24 left-4 md:left-10 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm font-medium"
      >
        <ArrowLeft size={16} /> Voltar para o início
      </button>

      <div className="w-full max-w-md z-10">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/assets/logo-nova-sem-borda.png" alt="Barbearia Do Vale" className="h-[152px] md:h-[200px] w-auto object-contain mb-4" />
          <h2 className="text-2xl font-bold font-display tracking-wide uppercase">
            {isRegister ? "Criar sua Conta" : "Acesse sua Conta"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            {isRegister 
              ? "Cadastre-se para agendar seu corte na melhor de Araguari" 
              : "Entre para gerenciar seus agendamentos e horários"}
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister ? (
              // CAMPOS DE CADASTRO
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Manoel Neto"
                      className="w-full bg-background/50 border border-border focus:border-primary rounded-xl py-3.5 pl-12 pr-4 text-foreground placeholder-muted-foreground focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(84) 99999-9999"
                      className="w-full bg-background/50 border border-border focus:border-primary rounded-xl py-3.5 pl-12 pr-4 text-foreground placeholder-muted-foreground focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail (Opcional)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: paulogtillmann@gmail.com"
                      className="w-full bg-background/50 border border-border focus:border-primary rounded-xl py-3.5 pl-12 pr-4 text-foreground placeholder-muted-foreground focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>
              </>
            ) : (
              // CAMPOS DE LOGIN
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
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {!isRegister && (
              <div className="flex items-center justify-between mt-2 select-none">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-primary w-4 h-4 rounded border-border bg-background focus:ring-primary focus:ring-opacity-25"
                  />
                  <span>Lembrar de mim</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/reset-password")}
                  className="text-xs text-primary hover:text-accent font-semibold transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2.5 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 active:translate-y-0 h-14 rounded-xl text-base transition-all duration-500 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : isRegister ? (
                <>
                  <UserPlus size={18} /> Cadastrar Conta
                </>
              ) : (
                <>
                  <LogIn size={18} /> Entrar no Painel
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-8 text-center text-sm border-t border-border/50 pt-6">
            <span className="text-muted-foreground">
              {isRegister ? "Já possui uma conta?" : "Ainda não tem conta?"}{" "}
            </span>
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError("")
              }}
              className="text-primary hover:text-accent font-semibold transition-colors cursor-pointer"
            >
              {isRegister ? "Fazer Login" : "Cadastrar-se agora"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
