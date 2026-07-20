import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { Calendar as CalendarIcon, Clock, User, Scissors, Star, ArrowLeft, CheckCircle2, AlertTriangle, CalendarDays, MessageCircle, Phone } from "lucide-react"

export default function Agendar() {
  const { user, token } = useAuth()

  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])

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

  // Inicializar nome e telefone com dados do usuário logado se houver
  useEffect(() => {
    if (user) {
      setClientName(user.name || "")
      setClientPhone(user.phone || "")
    }
  }, [user])

  // Carregar dados iniciais de serviços e barbeiros
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // 1. Carregar Serviços
        const srvRes = await fetch(`${API_URL}/api/services`)
        if (srvRes.ok) {
          const srvData = await srvRes.json()
          setServices(srvData)
        } else {
          setServices([
            { id: "srv-corte", name: "Corte de Cabelo", price: 55, duration_minutes: 30, description: "Corte clássico com acabamento perfeito realizado pelos nossos profissionais de ponta." },
            { id: "srv-barba", name: "Barba Completa", price: 45, duration_minutes: 30, description: "Barboterapia completa com toalha quente, óleos essenciais e massagem facial." },
            { id: "srv-combo", name: "Combo Do Vale (Corte + Barba)", price: 90, duration_minutes: 60, description: "A experiência completa da Barbearia Do Vale com desconto exclusivo." }
          ])
        }

        // 2. Carregar Barbeiros
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
        // Fallbacks
        setServices([
          { id: "srv-corte", name: "Corte de Cabelo", price: 55, duration_minutes: 30, description: "Corte clássico com acabamento perfeito realizado pelos nossos profissionais de ponta." },
          { id: "srv-barba", name: "Barba Completa", price: 45, duration_minutes: 30, description: "Barboterapia completa com toalha quente, óleos essenciais e massagem facial." },
          { id: "srv-combo", name: "Combo Do Vale (Corte + Barba)", price: 90, duration_minutes: 60, description: "A experiência completa da Barbearia Do Vale com desconto exclusivo." }
        ])
        setBarbers([
          { id: "barb-marcio", name: "MARCIO DO VALE" },
          { id: "barb-lucas", name: "LUCAS DO VALE" },
          { id: "barb-paulo", name: "PAULO TILLMANN" }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
            className="p-1.5 hover:bg-muted rounded-lg text-foreground cursor-pointer text-xs font-semibold"
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
            className="p-1.5 hover:bg-muted rounded-lg text-foreground cursor-pointer text-xs font-semibold"
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
      // Se tiver token, envia agendamento autenticado. Caso contrário, envia agendamento rápido (quick)
      const endpoint = token ? `${API_URL}/api/appointments` : `${API_URL}/api/appointments/quick`
      const headers = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          barber_id: selectedBarber,
          service_id: selectedServices,
          appointment_time: appointmentTime,
          name: clientName,
          phone: clientPhone
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao agendar horário.")
      }

      setSuccessMsg("Agendamento realizado com sucesso! Você receberá uma confirmação no WhatsApp.")
      
      // Limpar formulário
      setSelectedServices([])
      setSelectedBarber("")
      setSelectedDate("")
      setSelectedTime("")
      setBookingStep(1)
    } catch (err) {
      setError(err.message || "Erro de conexão ao realizar agendamento.")
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient text-foreground pt-24 pb-12 px-4 md:px-8 flex flex-col items-center justify-center">
      
      {/* Botão Voltar */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full border border-border bg-card/60 backdrop-blur-md text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300 shadow-lg self-start md:ml-10 hover:scale-105"
        title="Voltar para o início"
      >
        <ArrowLeft size={20} />
      </Link>

      <div className="w-full max-w-4xl glass-card border border-gold-subtle rounded-2xl p-6 md:p-10 shadow-elevated z-10">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <h1 className="font-rye text-3xl md:text-4xl font-bold mb-2 tracking-wide uppercase gold-text">
            Agendar Horário
          </h1>
          <p className="text-muted-foreground text-sm">
            Escolha o melhor dia, horário e profissional em apenas 3 etapas rápidas.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex flex-col items-center justify-center text-center bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-6 mb-6 gap-3">
            <CheckCircle2 size={32} className="text-green-400" />
            <span className="font-semibold text-base">{successMsg}</span>
            {user ? (
              <Link to="/dashboard" className="mt-2 text-xs text-primary hover:underline font-semibold">
                Ir para o Painel de Agendamentos &gt;
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                Acesse seu Whatsapp para visualizar os dados de confirmação enviados.
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !successMsg && (
          <>
            {/* Indicador de Etapas */}
            <div className="flex items-center justify-between mb-10 max-w-md mx-auto relative select-none">
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
          </>
        )}
      </div>
    </div>
  )
}
