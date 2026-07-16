import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { Calendar as CalendarIcon, Clock, User, Scissors, Star, LogOut, CheckCircle2, XCircle, AlertTriangle, CalendarDays, Plus, Users, ShieldAlert, KeyRound } from "lucide-react"

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])

  // Abas para Administradores: "appointments" (Agendamentos) ou "permissions" (Gerenciar Usuários)
  const [activeTab, setActiveTab] = useState("appointments")
  const [userList, setUserList] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [permissionsError, setPermissionsError] = useState("")
  const [permissionsSuccess, setPermissionsSuccess] = useState("")

  // Etapas do fluxo de agendamento (1, 2 ou 3)
  const [bookingStep, setBookingStep] = useState(1)
  
  // Etapa 1: Dados do Cliente
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  
  // Etapa 2: Barbeiro e Múltiplos Serviços
  const [selectedBarber, setSelectedBarber] = useState("")
  const [selectedServices, setSelectedServices] = useState([]) // Array de IDs de serviços
  
  // Etapa 3: Data e Horário
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  
  // Controle do calendário (Mês e Ano selecionados para navegação)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Inicializar nome e telefone com dados do usuário logado
  useEffect(() => {
    if (user) {
      if (!clientName) setClientName(user.name || "")
      if (!clientPhone) setClientPhone(user.phone || "")
    }
  }, [user])

  // Aplicar máscara no telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  const formatPhoneNumber = (value) => {
    if (!value) return value
    const phoneNumber = value.replace(/[^\d]/g, "")
    const phoneNumberLength = phoneNumber.length

    if (phoneNumberLength < 3) return phoneNumber
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`
    }
    if (phoneNumberLength < 11) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`
  }

  // Gerar horários dinâmicos com base na data (dia da semana)
  const getTimeSlots = (dateString) => {
    if (!dateString) return []
    const dateParts = dateString.split("-")
    const date = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]))
    const dayOfWeek = date.getDay() // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

    if (dayOfWeek === 0) return [] // Domingo
    
    const slots = []
    let startHour = 9
    let endHour = dayOfWeek === 6 ? 16 : 19 // Sábado até 16:00, Seg-Sex até 19:00
    
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
      slots.push(`${String(h).padStart(2, '0')}:30`)
    }
    return slots
  }

  // Verificar se um horário de um dia selecionado já passou da hora local atual
  const isTimeSlotPast = (dateString, timeString) => {
    if (!dateString || !timeString) return false
    const appointmentDateTime = new Date(`${dateString}T${timeString}`)
    const now = new Date()
    return appointmentDateTime < now
  }

  // Renderizador do Calendário
  const renderCalendar = () => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay()

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]

    const days = []
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8 md:w-10 md:h-10"></div>)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(calendarYear, calendarMonth, day)
      const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const isPast = currentDate < today
      const isSunday = currentDate.getDay() === 0
      const isSelected = selectedDate === dateString

      days.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast || isSunday}
          onClick={() => {
            setSelectedDate(dateString)
            setSelectedTime("")
          }}
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold transition-all cursor-pointer ${
            isSelected
              ? "bg-primary text-primary-foreground shadow-gold scale-110"
              : isPast || isSunday
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "hover:bg-primary/20 text-foreground"
          }`}
        >
          {day}
        </button>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <button
            type="button"
            onClick={() => {
              if (calendarMonth === 0) {
                setCalendarMonth(11)
                setCalendarYear(prev => prev - 1)
              } else {
                setCalendarMonth(prev => prev - 1)
              }
            }}
            className="p-1.5 hover:bg-muted rounded-lg text-foreground cursor-pointer text-xs"
          >
            &lt; Mês
          </button>
          
          <div className="font-display font-bold text-xs md:text-sm text-foreground">
            {monthNames[calendarMonth]} de {calendarYear}
          </div>
          
          <button
            type="button"
            onClick={() => {
              if (calendarMonth === 11) {
                setCalendarMonth(0)
                setCalendarYear(prev => prev + 1)
              } else {
                setCalendarMonth(prev => prev + 1)
              }
            }}
            className="p-1.5 hover:bg-muted rounded-lg text-foreground cursor-pointer text-xs"
          >
            Mês &gt;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-display text-[9px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center justify-items-center">
          {days}
        </div>
      </div>
    )
  }

  // Carregar dados iniciais de agendamentos, serviços e barbeiros
  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    async function fetchData() {
      setLoading(true)
      try {
        const headers = { Authorization: `Bearer ${token}` }
        
        // 1. Carregar Agendamentos
        const apptRes = await fetch(`${API_URL}/api/appointments`, { headers })
        if (apptRes.ok) {
          const apptData = await apptRes.json()
          setAppointments(apptData)
        }

        // 2. Carregar Serviços
        const srvRes = await fetch(`${API_URL}/api/services`)
        if (srvRes.ok) {
          const srvData = await srvRes.json()
          setServices(srvData)
        } else {
          setServices([
            { id: "srv-corte", name: "Corte de Cabelo", price: 55, duration_minutes: 30 },
            { id: "srv-barba", name: "Barba Completa", price: 45, duration_minutes: 30 },
            { id: "srv-combo", name: "Combo Do Vale (Corte + Barba)", price: 90, duration_minutes: 60 }
          ])
        }

        // 3. Carregar Barbeiros
        const barbRes = await fetch(`${API_URL}/api/barbers`)
        if (barbRes.ok) {
          const barbData = await barbRes.json()
          setBarbers(barbData)
        } else {
          setBarbers([
            { id: "barb-marcio", name: "MARCIO DO VALE" },
            { id: "barb-lucas", name: "LUCAS DO VALE" },
            { id: "barb-paulo", name: "PAULO TILLMANN" }
          ])
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, token, navigate])

  // Carregar lista de usuários (Apenas se for admin e estiver na aba de permissões)
  useEffect(() => {
    if (activeTab === "permissions" && user && user.role === "admin") {
      async function loadUsers() {
        setUsersLoading(true)
        setPermissionsError("")
        try {
          const response = await fetch(`${API_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            setUserList(data)
          } else {
            const data = await response.json()
            setPermissionsError(data.error || "Erro ao carregar lista de usuários.")
          }
        } catch {
          setPermissionsError("Erro de conexão ao carregar usuários.")
        } finally {
          setUsersLoading(false)
        }
      }
      loadUsers()
    }
  }, [activeTab, user, token])

  const handleCreateAppointment = async (e) => {
    if (e) e.preventDefault()
    setError("")
    setSuccessMsg("")
    
    if (!clientName.trim()) {
      setError("Por favor, preencha o seu nome completo na Etapa 1.")
      setBookingStep(1)
      return
    }
    if (!clientPhone.trim()) {
      setError("Por favor, preencha o seu telefone/Whatsapp na Etapa 1.")
      setBookingStep(1)
      return
    }
    if (!selectedBarber) {
      setError("Por favor, selecione um profissional na Etapa 2.")
      setBookingStep(2)
      return
    }
    if (selectedServices.length === 0) {
      setError("Por favor, selecione ao menos um serviço na Etapa 2.")
      setBookingStep(2)
      return
    }
    if (!selectedDate || !selectedTime) {
      setError("Por favor, selecione a data e o horário na Etapa 3.")
      setBookingStep(3)
      return
    }

    setSubmitLoading(true)
    const appointmentTime = `${selectedDate}T${selectedTime}`

    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          barber_id: selectedBarber,
          service_id: selectedServices, // Enviando array de serviços
          appointment_time: appointmentTime,
          name: clientName, // Enviando nome para atualizar cadastro
          phone: clientPhone // Enviando telefone para atualizar cadastro
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao agendar horário.")
      }

      setSuccessMsg("Agendamento realizado com sucesso! Você receberá uma confirmação no WhatsApp.")
      
      // Limpar formulário e resetar etapa
      setSelectedServices([])
      setSelectedBarber("")
      setSelectedDate("")
      setSelectedTime("")
      setBookingStep(1)

      // Recarregar agendamentos do dashboard
      const appRes = await fetch(`${API_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (appRes.ok) {
        const appData = await appRes.json()
        setAppointments(appData)
      }
    } catch (err) {
      setError(err.message || "Erro de conexão ao realizar agendamento.")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) return

    try {
      const response = await fetch(`${API_URL}/api/appointments/${id}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao cancelar agendamento.")
      }

      // Recarregar agendamentos
      const apptRes = await fetch(`${API_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (apptRes.ok) {
        const apptData = await apptRes.json()
        setAppointments(apptData)
      }
    } catch (err) {
      alert(err.message)
    }
  }

  // Admin: Atualizar papel (permissão) de um usuário
  const handleRoleChange = async (userId, newRole) => {
    setPermissionsError("")
    setPermissionsSuccess("")
    
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar cargo.")
      }

      setPermissionsSuccess(`Cargo atualizado para ${newRole.toUpperCase()} com sucesso!`)
      // Atualizar lista localmente
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      setPermissionsError(err.message)
    }
  }

  const formatDateTime = (isoString) => {
    try {
      const date = new Date(isoString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} às ${hours}:${minutes}`
    } catch {
      return isoString.replace('T', ' ')
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-12 px-4 md:px-8">
      {/* Top Banner / Welcome */}
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card border border-gold-subtle rounded-2xl p-6 md:p-8 gap-4 mb-8 shadow-elevated">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
              Painel do {user.role === 'admin' ? 'Administrador' : user.role === 'barber' ? 'Barbeiro' : 'Cliente'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">
              Olá, <span className="gold-text-solid">{user.name}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Contato: {user.email || user.phone}
            </p>
          </div>
          <button
            onClick={() => {
              logout()
              navigate("/login")
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-destructive/10 hover:text-destructive text-sm font-semibold rounded-xl transition-all cursor-pointer border border-border"
          >
            <LogOut size={16} /> Sair do Painel
          </button>
        </div>

        {/* Abas de Navegação (Somente para Administradores) */}
        {user.role === 'admin' && (
          <div className="flex border-b border-border mb-8 gap-4">
            <button
              onClick={() => setActiveTab("appointments")}
              className={`pb-4 px-2 font-display text-sm font-semibold tracking-wider uppercase transition-colors cursor-pointer border-b-2 ${
                activeTab === "appointments" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <CalendarDays size={16} /> Agendamentos
              </span>
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`pb-4 px-2 font-display text-sm font-semibold tracking-wider uppercase transition-colors cursor-pointer border-b-2 ${
                activeTab === "permissions" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <KeyRound size={16} /> Permissões de Usuários
              </span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm">Carregando informações...</p>
          </div>
        ) : (
          <>
            {/* ABA: AGENDAMENTOS */}
            {activeTab === "appointments" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lado Esquerdo/Centro: Fluxo de Reserva & Listagem */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Se for CLIENTE: Mostra formulário de agendamento */}
                  {user.role === 'client' && (
                    <div className="glass-card border border-gold-subtle rounded-2xl p-6 md:p-8 shadow-md">
                      <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                        <Plus className="text-primary w-5 h-5" /> Novo Agendamento
                      </h2>

                      {error && (
                        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                          <AlertTriangle size={18} className="shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      {successMsg && (
                        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-4 mb-6">
                          <CheckCircle2 size={18} className="shrink-0" />
                          <span>{successMsg}</span>
                        </div>
                      )}

                      {/* Indicador de Etapas */}
                      <div className="flex items-center justify-between mb-8 max-w-md mx-auto relative select-none">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0"></div>
                        <div 
                          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                          style={{ width: `${((bookingStep - 1) / 2) * 100}%` }}
                        ></div>

                        {[1, 2, 3].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              if (s < bookingStep) {
                                setBookingStep(s)
                              } else if (s === 2 && clientName.trim() && clientPhone.trim()) {
                                setBookingStep(2)
                              } else if (s === 3 && clientName.trim() && clientPhone.trim() && selectedBarber && selectedServices.length > 0) {
                                setBookingStep(3)
                              }
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all cursor-pointer ${
                              bookingStep === s
                                ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                                : bookingStep > s
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border text-muted-foreground"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={handleCreateAppointment} className="space-y-6">
                        {/* ETAPA 1 */}
                        {bookingStep === 1 && (
                          <div className="space-y-6">
                            <h3 className="font-display font-semibold text-xl text-foreground border-b border-border pb-2 text-center">
                              Seus dados para Contato
                            </h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome Completo</label>
                                <input
                                  type="text"
                                  required
                                  value={clientName}
                                  onChange={(e) => setClientName(e.target.value)}
                                  placeholder="Digite seu nome completo"
                                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3.5 px-4 text-foreground focus:outline-none transition-colors"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone / Whatsapp</label>
                                <input
                                  type="tel"
                                  required
                                  value={clientPhone}
                                  onChange={(e) => setClientPhone(formatPhoneNumber(e.target.value))}
                                  maxLength={15}
                                  placeholder="Ex: (34) 98853-7720"
                                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3.5 px-4 text-foreground focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!clientName.trim() || !clientPhone.trim()}
                              onClick={() => setBookingStep(2)}
                              className="w-full inline-flex items-center justify-center gap-2 bg-gold-gradient text-primary-foreground font-semibold h-14 rounded-xl text-base shadow-gold hover:shadow-gold-lg transition-all duration-500 cursor-pointer disabled:opacity-50"
                            >
                              Avançar para Barbeiro e Serviços
                            </button>
                          </div>
                        )}

                        {/* ETAPA 2 */}
                        {bookingStep === 2 && (
                          <div className="space-y-6">
                            <h3 className="font-display font-semibold text-xl text-foreground border-b border-border pb-2 text-center">
                              Profissional e Serviços
                            </h3>
                            
                            {/* Selecionar Barbeiro */}
                             <div className="space-y-4 text-center">
                               <label className="text-sm md:text-base font-bold uppercase tracking-wider text-primary block">Selecione o Barbeiro</label>
                               <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 py-2">
                                 {barbers.slice(0, 3).map((barb, index) => {
                                  const isSelected = selectedBarber === barb.id
                                  const barberPhoto = 
                                    index === 0 ? "/assets/foto_marcio.png" :
                                    index === 1 ? "/assets/foto_lucas.png" :
                                    "/assets/foto_neto.png"
                                  
                                  return (
                                    <button
                                      key={barb.id}
                                      type="button"
                                      onClick={() => setSelectedBarber(barb.id)}
                                      className="bg-transparent border-none p-0 cursor-pointer focus:outline-none transition-transform"
                                      title={barb.name}
                                    >
                                      <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 transition-all duration-300 shadow-lg ${
                                        isSelected 
                                          ? "border-primary ring-4 ring-primary/20 scale-110 shadow-gold" 
                                          : "border-border/40 hover:border-primary/50 hover:scale-105"
                                      }`}>
                                        <img 
                                          src={barberPhoto} 
                                          alt={barb.name} 
                                          className="w-full h-full object-cover object-top scale-110"
                                        />
                                      </div>
                                    </button>
                                  )
                                })}
                               </div>
                             </div>

                            {/* Selecionar Serviços (Múltiplo) */}
                            <div className="space-y-3">
                              <label className="text-sm md:text-base font-bold uppercase tracking-wider text-primary block text-center">Serviços Desejados (Pode marcar mais de um)</label>
                              <div className="space-y-3">
                                {services.map(srv => {
                                  const isSelected = selectedServices.includes(srv.id)
                                  return (
                                    <button
                                      key={srv.id}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedServices(prev => prev.filter(id => id !== srv.id))
                                        } else {
                                          setSelectedServices(prev => [...prev, srv.id])
                                        }
                                      }}
                                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                        isSelected
                                          ? "border-primary bg-primary/10 text-foreground"
                                          : "border-border bg-background text-foreground hover:border-primary/40"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent"
                                        }`}>
                                          {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-sm">{srv.name}</p>
                                          <p className="text-xs text-muted-foreground">{srv.description || "Procedimento Do Vale de alto padrão"}</p>
                                        </div>
                                      </div>
                                      <div className="font-display font-bold text-primary text-sm md:text-base">
                                        R$ {srv.price.toFixed(2).replace('.', ',')}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                              <button
                                type="button"
                                onClick={() => setBookingStep(1)}
                                className="flex-1 border border-border hover:bg-muted rounded-xl h-14 font-medium transition-colors cursor-pointer"
                              >
                                Voltar
                              </button>
                              <button
                                type="button"
                                disabled={!selectedBarber || selectedServices.length === 0}
                                onClick={() => setBookingStep(3)}
                                className="flex-1 bg-gold-gradient text-primary-foreground font-semibold h-14 rounded-xl text-base shadow-gold hover:shadow-gold-lg transition-all duration-500 cursor-pointer disabled:opacity-50"
                              >
                                Avançar para Data e Hora
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ETAPA 3 */}
                        {bookingStep === 3 && (
                          <div className="space-y-6">
                            <h3 className="font-display font-semibold text-xl text-foreground border-b border-border pb-2 text-center">
                              Escolha a Data e Horário
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                              {/* Calendário */}
                              <div className="space-y-2">
                                <label className="text-sm md:text-base font-bold uppercase tracking-wider text-primary block text-center">Selecione o Dia</label>
                                <div className="p-4 bg-background border border-border rounded-2xl">
                                  {renderCalendar()}
                                </div>
                              </div>

                              {/* Horários */}
                              <div className="space-y-4">
                                <label className="text-sm md:text-base font-bold uppercase tracking-wider text-primary block text-center">Horários Disponíveis</label>
                                
                                {!selectedDate ? (
                                  <div className="p-6 text-center border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                                    Por favor, selecione um dia no calendário ao lado para ver os horários.
                                  </div>
                                ) : getTimeSlots(selectedDate).length === 0 ? (
                                  <div className="p-6 text-center border border-dashed border-border rounded-2xl text-destructive text-sm font-medium">
                                    Barbearia fechada neste dia (Domingo). Por favor, selecione outro dia.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto pr-2">
                                    {getTimeSlots(selectedDate).map(time => {
                                      const isPast = isTimeSlotPast(selectedDate, time)
                                      return (
                                        <button
                                          key={time}
                                          type="button"
                                          disabled={isPast}
                                          onClick={() => setSelectedTime(time)}
                                          className={`py-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                                            selectedTime === time 
                                              ? "bg-primary border-primary text-primary-foreground shadow-gold scale-105" 
                                              : isPast
                                              ? "bg-background/20 border-border/10 text-muted-foreground/30 cursor-not-allowed"
                                              : "bg-background border-border text-foreground hover:border-primary/50"
                                          }`}
                                        >
                                          {time}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-border">
                              <button
                                type="button"
                                onClick={() => setBookingStep(2)}
                                className="flex-1 border border-border hover:bg-muted rounded-xl h-14 font-medium transition-colors cursor-pointer"
                              >
                                Voltar
                              </button>
                              <button
                                type="submit"
                                disabled={submitLoading || !selectedDate || !selectedTime}
                                className="flex-1 bg-gold-gradient text-primary-foreground font-semibold h-14 rounded-xl text-base shadow-gold hover:shadow-gold-lg transition-all duration-500 cursor-pointer disabled:opacity-50"
                              >
                                {submitLoading ? (
                                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto"></div>
                                ) : (
                                  "Finalizar e Confirmar"
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  )}

                  {/* Listagem de agendamentos */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
                    <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                      <CalendarDays className="text-primary w-5 h-5" /> 
                      {user.role === 'client' ? 'Seus Agendamentos' : 'Agenda Completa de Atendimentos'}
                    </h2>

                    {appointments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <CalendarIcon size={40} className="stroke-1 mb-3 text-muted-foreground/50" />
                        <p className="text-sm">Nenhum agendamento encontrado.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {appointments.map((appt) => (
                          <div 
                            key={appt.id} 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border transition-all ${
                              appt.status === 'cancelled' 
                                ? "bg-muted/30 border-border/50 opacity-60" 
                                : "bg-background border-gold-subtle hover:border-primary/50"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold font-display uppercase tracking-wider">{appt.service_name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  appt.status === 'confirmed' 
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                                    : "bg-destructive/10 text-destructive border border-destructive/20"
                                }`}>
                                  {appt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={14} className="text-primary" />
                                  <span>{formatDateTime(appt.appointment_time)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <User size={14} className="text-primary" />
                                  <span>
                                    {user.role === 'client' ? `Barbeiro: ${appt.barber_name}` : `Cliente: ${appt.client_name}`}
                                  </span>
                                </div>
                                {user.role !== 'client' && (
                                  <div className="flex items-center gap-1.5 col-span-2 mt-1">
                                    <span className="font-semibold">WhatsApp Cliente:</span> 
                                    <span className="text-foreground">{appt.client_phone || "Não cadastrado"}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {appt.status === 'confirmed' && (
                              <button
                                onClick={() => handleCancelAppointment(appt.id)}
                                className="mt-4 sm:mt-0 px-4 py-2 hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/40 text-destructive text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Direita: Info & Destaques */}
                <div className="space-y-8">
                  <div className="glass-card border border-gold-subtle rounded-2xl p-6 shadow-md">
                    <h3 className="text-lg font-bold font-display mb-4 text-primary">Informações Do Vale</h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <Star className="w-5 h-5 text-primary fill-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Disparo Automático</p>
                          <p className="text-xs">Confirmações imediatas e lembretes são disparados automaticamente no WhatsApp 2 horas antes de cada serviço.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Scissors className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Profissionais Ativos</p>
                          <p className="text-xs">Equipe de especialistas Carlos, Felix, Givanildo e Wagner pronta para atender.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: PERMISSÕES (SOMENTE ADMIN) */}
            {activeTab === "permissions" && user.role === "admin" && (
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-md">
                <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                  <ShieldAlert className="text-primary w-5 h-5" /> Controle de Permissões de Usuários
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Como administrador, você pode alterar as atribuições e funções de todos os usuários registrados no sistema. 
                  Isso define o acesso deles ao painel e à agenda.
                </p>

                {permissionsError && (
                  <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{permissionsError}</span>
                  </div>
                )}

                {permissionsSuccess && (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-4 mb-6">
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span>{permissionsSuccess}</span>
                  </div>
                )}

                {usersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-muted-foreground">Carregando usuários...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/80 text-muted-foreground text-xs uppercase font-semibold">
                          <th className="py-4 px-4">Nome</th>
                          <th className="py-4 px-4">Contato (Tel/E-mail)</th>
                          <th className="py-4 px-4">Cargo / Função</th>
                          <th className="py-4 px-4 text-center">Ações de Permissão</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userList.map((usr) => (
                          <tr 
                            key={usr.id} 
                            className={`border-b border-border/40 hover:bg-muted/10 transition-colors ${
                              usr.id === user.id ? "bg-primary/5" : ""
                            }`}
                          >
                            <td className="py-4 px-4 font-semibold text-sm">
                              {usr.name} {usr.id === user.id && <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-full ml-1">Você</span>}
                            </td>
                            <td className="py-4 px-4 text-xs text-muted-foreground">
                              <div>{usr.phone ? `Whats: ${usr.phone}` : ""}</div>
                              <div>{usr.email ? `E-mail: ${usr.email}` : ""}</div>
                            </td>
                            <td className="py-4 px-4 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase border ${
                                usr.role === 'admin' 
                                  ? "bg-primary/10 text-primary border-primary/20" 
                                  : usr.role === 'barber'
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : "bg-muted text-muted-foreground border-border"
                              }`}>
                                {usr.role === 'admin' ? 'Administrador' : usr.role === 'barber' ? 'Barbeiro' : 'Cliente'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <select
                                disabled={usr.id === user.id} // Evitar auto-rebaixamento de admin
                                value={usr.role}
                                onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                                className="bg-background border border-border focus:border-primary rounded-lg py-1.5 px-3 text-xs focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="client">Cliente</option>
                                <option value="barber">Barbeiro</option>
                                <option value="admin">Administrador</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
