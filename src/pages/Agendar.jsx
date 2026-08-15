import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { Calendar as CalendarIcon, Clock, User, Scissors, Star, ArrowLeft, CheckCircle2, AlertTriangle, CalendarDays, MessageCircle, Phone } from "lucide-react"
import ColorBends from "../components/ColorBends.jsx"

export default function Agendar() {
  const { user, token } = useAuth()

  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [appointments, setAppointments] = useState([])

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
  const [slotWarning, setSlotWarning] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Inicializar nome e telefone com dados do usuário logado se houver
  useEffect(() => {
    if (user) {
      setClientName(user.name || "")
      setClientPhone(user.phone || "")
    }
  }, [user])

  // Carregar dados iniciais de serviços, barbeiros e agendamentos existentes
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // 1. Carregar Serviços
        const srvRes = await fetch(`${API_URL}/api/services`)
        if (srvRes.ok) {
          const srvData = await srvRes.json()
          const publicServices = srvData.filter(s => !s.restricted_access && !s.acesso_restrito)
          setServices(publicServices)
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

        // 3. Carregar Agendamentos Ocupados
        try {
          const apptEndpoint = token ? `${API_URL}/api/appointments` : `${API_URL}/api/appointments/occupied`
          const apptHeaders = token ? { Authorization: `Bearer ${token}` } : {}
          const apptRes = await fetch(apptEndpoint, { headers: apptHeaders })
          if (apptRes.ok) {
            const apptData = await apptRes.json()
            setAppointments(apptData)
          }
        } catch (e) {
          console.error("Erro ao carregar agendamentos ocupados:", e)
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
  }, [token])

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

    if (dayOfWeek === 0) return [] // Domingo fechado

    const slots = []
    const startHour = 9
    const endHour = dayOfWeek === 6 ? 16 : 20 // Horários das 09:00 às 20:00 (Sábados até 16:00)

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

  // Cálculo acumulado de duração para os serviços selecionados
  const selectedServicesDetails = services.filter(s => selectedServices.includes(s.id))
  const totalDurationMinutes = selectedServicesDetails.reduce((sum, s) => sum + (s.duration_minutes ?? 30), 0)

  // Verificar se um horário de um barbeiro específico já está reservado/ocupado
  const isTimeSlotBooked = (dateString, timeString, targetBarberId = selectedBarber) => {
    if (!targetBarberId || !dateString || !timeString) return false

    const barbObj = barbers.find(b => String(b.id) === String(targetBarberId))
    const barbName = barbObj ? barbObj.name : null

    const [slotH, slotM] = timeString.split(':').map(Number)
    if (isNaN(slotH) || isNaN(slotM)) return false

    // Se o serviço selecionado no formulário tem duração 0 min (Livre), ele NÃO ocupa horário
    if (selectedServices.length > 0 && totalDurationMinutes === 0) return false

    const slotStartMinutes = slotH * 60 + slotM
    const requestedDuration = selectedServices.length > 0 ? totalDurationMinutes : 30
    const slotEndMinutes = slotStartMinutes + requestedDuration

    // Verificar se ultrapassa o horário de funcionamento da barbearia (20:00)
    const dateParts = dateString.split("-")
    if (dateParts.length === 3) {
      const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]))
      const dayOfWeek = dateObj.getDay()
      if (dayOfWeek === 0) return true // Domingo fechado
      const closingHour = dayOfWeek === 6 ? 16 : 20
      const closingMinutes = closingHour * 60
      if (slotEndMinutes > closingMinutes) return true
    }

    return appointments.some(appt => {
      // Ignorar agendamentos cancelados comuns, mas CONSIDERAR bloqueios de agenda (que possuem cancellation_reason)
      if (appt.status === 'cancelled' && !appt.cancellation_reason) return false

      // Verificar se é no mesmo dia
      if (!appt.appointment_time || !appt.appointment_time.startsWith(dateString)) return false

      // Verificar se é do mesmo barbeiro
      const matchesBarberId = appt.barber_id && (
        String(appt.barber_id) === String(targetBarberId) ||
        (barbObj?.user_id && String(appt.barber_id) === String(barbObj.user_id)) ||
        (barbObj?.id && String(appt.barber_id) === String(barbObj.id))
      )
      const matchesBarberName = barbName && appt.barber_name && appt.barber_name.trim().toLowerCase() === barbName.trim().toLowerCase()
      if (!matchesBarberId && !matchesBarberName) return false

      // Extrair horário do agendamento existente
      const timePart = appt.appointment_time.split('T')[1] || ""
      if (!timePart) return false

      const [apptH, apptM] = timePart.split(':').map(Number)
      if (isNaN(apptH) || isNaN(apptM)) return false

      const apptStartMinutes = apptH * 60 + apptM
      const apptDuration = appt.duration_minutes !== undefined && appt.duration_minutes !== null ? appt.duration_minutes : 30

      if (apptDuration === 0) return false

      const apptEndMinutes = apptStartMinutes + apptDuration

      // Verifica sobreposição entre intervalos [slotStart, slotEnd) e [apptStart, apptEnd)
      const overlapStart = Math.max(slotStartMinutes, apptStartMinutes)
      const overlapEnd = Math.min(slotEndMinutes, apptEndMinutes)

      return overlapStart < overlapEnd
    })
  }

  // Avaliar e retornar o motivo exato pelo qual um horário não pode ser agendado devido à duração dos serviços ou conflitos
  const getTimeSlotStatusReason = (dateString, timeString, targetBarberId = selectedBarber) => {
    if (!targetBarberId || !dateString || !timeString) return null

    const barbObj = barbers.find(b => String(b.id) === String(targetBarberId))
    const barbName = barbObj ? barbObj.name : null

    const [slotH, slotM] = timeString.split(':').map(Number)
    if (isNaN(slotH) || isNaN(slotM)) return null

    const slotStartMinutes = slotH * 60 + slotM
    const requestedDuration = selectedServices.length > 0 ? totalDurationMinutes : 30
    const slotEndMinutes = slotStartMinutes + requestedDuration

    let closingHour = 20
    if (dateString) {
      const dateParts = dateString.split("-")
      if (dateParts.length === 3) {
        const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]))
        if (dateObj.getDay() === 6) closingHour = 16
      }
    }
    const closingMinutes = closingHour * 60
    if (slotEndMinutes > closingMinutes) {
      const endH = String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')
      const endM = String(slotEndMinutes % 60).padStart(2, '0')
      return `O(s) serviço(s) selecionado(s) possuem duração total de ${requestedDuration} min. Iniciando às ${timeString}, o atendimento terminaria às ${endH}:${endM}, ultrapassando o horário de encerramento das ${closingHour}:00.`
    }

    // 2. Verificar conflitos com agendamentos ou bloqueios existentes
    for (const appt of appointments) {
      if (appt.status === 'cancelled' && !appt.cancellation_reason) continue
      if (!appt.appointment_time || !appt.appointment_time.startsWith(dateString)) continue

      const matchesBarberId = appt.barber_id && (
        String(appt.barber_id) === String(targetBarberId) ||
        (barbObj?.user_id && String(appt.barber_id) === String(barbObj.user_id)) ||
        (barbObj?.id && String(appt.barber_id) === String(barbObj.id))
      )
      const matchesBarberName = barbName && appt.barber_name && appt.barber_name.trim().toLowerCase() === barbName.trim().toLowerCase()
      if (!matchesBarberId && !matchesBarberName) continue

      const timePart = appt.appointment_time.split('T')[1] || ""
      const [apptH, apptM] = timePart.split(':').map(Number)
      if (isNaN(apptH) || isNaN(apptM)) continue

      const apptStartMinutes = apptH * 60 + apptM
      const apptDuration = (appt.duration_minutes !== undefined && appt.duration_minutes !== null) ? Number(appt.duration_minutes) : 30
      if (apptDuration === 0) continue

      const apptEndMinutes = apptStartMinutes + apptDuration

      const overlapStart = Math.max(slotStartMinutes, apptStartMinutes)
      const overlapEnd = Math.min(slotEndMinutes, apptEndMinutes)

      if (overlapStart < overlapEnd) {
        const apptStartH = String(Math.floor(apptStartMinutes / 60)).padStart(2, '0')
        const apptStartMStr = String(apptStartMinutes % 60).padStart(2, '0')
        const apptEndH = String(Math.floor(apptEndMinutes / 60)).padStart(2, '0')
        const apptEndMStr = String(apptEndMinutes % 60).padStart(2, '0')

        if (slotStartMinutes === apptStartMinutes) {
          if (appt.cancellation_reason) {
            return `Horário bloqueado na agenda do profissional (${appt.cancellation_reason}).`
          }
          return `Este profissional já possui um agendamento reservado às ${timeString}.`
        }

        return `A duração de ${requestedDuration} min do(s) serviço(s) selecionado(s) não cabe neste intervalo e entra em conflito com outro agendamento existente das ${apptStartH}:${apptStartMStr} às ${apptEndH}:${apptEndMStr}.`
      }
    }

    return null
  }

  // Auto-resetar horário se a alteração de serviço/profissional o tornar indisponível
  useEffect(() => {
    if (selectedTime && selectedDate && selectedBarber) {
      const reason = getTimeSlotStatusReason(selectedDate, selectedTime, selectedBarber)
      if (reason) {
        setSelectedTime("")
        setSlotWarning(reason)
      } else {
        setSlotWarning("")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServices, selectedBarber, selectedDate, selectedTime])

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
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold transition-all cursor-pointer ${isSelected
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

    if (isTimeSlotBooked(selectedDate, selectedTime, selectedBarber)) {
      setError("O horário selecionado já está reservado para este barbeiro. Por favor, selecione outro horário.")
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
    <div className="relative min-h-screen bg-transparent text-foreground pt-24 pb-12 px-4 md:px-8 flex flex-col items-center justify-center">

      {/* Background ColorBends Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
        <ColorBends
          colors={["#8c6b12", "#59420b", "#332405"]}
          rotation={90}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          noise={0.15}
          parallax={0.5}
          iterations={1}
          intensity={0.9}
          bandWidth={6}
          transparent
          autoRotate={0}
          color="#59420b"
        />
      </div>

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
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all cursor-pointer ${bookingStep === s
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
                      {barbers.map((barb) => {
                        const isSelected = selectedBarber === barb.id
                        const nameLower = (barb.name || "").toLowerCase()
                        const barberPhoto = barb.photo
                          ? barb.photo
                          : nameLower.includes("marcio") || nameLower.includes("márcio")
                            ? "/assets/marcio-barber.jpeg"
                            : nameLower.includes("lucas")
                              ? "/assets/lucas-barber.jpeg"
                              : "/assets/neto-barber.jpeg"

                        const rawFirst = (barb.name || "").trim().split(/\s+/)[0] || ""
                        const firstName = rawFirst ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase() : ""

                        return (
                          <button
                            key={barb.id}
                            type="button"
                            onClick={() => setSelectedBarber(barb.id)}
                            className="group flex flex-col items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer focus:outline-none transition-transform"
                            title={barb.name}
                          >
                            <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 transition-all duration-300 shadow-lg ${isSelected
                                ? "border-primary ring-4 ring-primary/20 scale-110 shadow-gold"
                                : "border-border/40 hover:border-primary/50 group-hover:scale-105"
                              }`}>
                              <img
                                src={barberPhoto}
                                alt={barb.name}
                                className="w-full h-full object-cover object-top scale-110"
                              />
                            </div>
                            <span className={`font-display text-sm md:text-base font-bold tracking-wide transition-colors ${isSelected ? "text-primary scale-105" : "text-foreground group-hover:text-primary"
                              }`}>
                              {firstName}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selecionar Serviços (Múltiplo) */}
                  <div className="space-y-3">
                    <label className="text-sm md:text-base font-bold uppercase tracking-wider text-primary block text-center">Serviços Desejados (Pode marcar mais de um)</label>
                    <div className="space-y-3">
                      {services.filter(srv => !srv.restricted_access && !srv.acesso_restrito).map(srv => {
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
                            className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-background text-foreground hover:border-primary/40"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent"
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
                        <div className="space-y-3">
                          {selectedServices.length > 0 && (
                            <div className="text-xs font-semibold text-muted-foreground text-center bg-card/60 p-2.5 rounded-xl border border-border/50">
                              ⏱️ Duração total dos serviços: <span className="text-primary font-bold">{totalDurationMinutes} min</span>
                            </div>
                          )}

                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto pr-2">
                            {getTimeSlots(selectedDate).map(time => {
                              const isPast = isTimeSlotPast(selectedDate, time)
                              const reason = getTimeSlotStatusReason(selectedDate, time, selectedBarber)
                              const isBooked = !!reason
                              const isDisabled = isPast || isBooked

                              return (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => {
                                    if (isPast) {
                                      setSlotWarning("Este horário já encerrou para a data selecionada.")
                                      return
                                    }
                                    if (reason) {
                                      setSlotWarning(reason)
                                      return
                                    }
                                    setSlotWarning("")
                                    setSelectedTime(time)
                                  }}
                                  title={reason || (isPast ? "Horário encerrado" : "Horário disponível")}
                                  className={`py-3 text-xs font-bold rounded-xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${selectedTime === time
                                      ? "bg-primary border-primary text-primary-foreground shadow-gold scale-105"
                                      : isBooked
                                        ? "bg-destructive/10 border-destructive/40 text-destructive hover:bg-destructive/20"
                                        : isPast
                                          ? "bg-background/20 border-border/10 text-muted-foreground/30 cursor-not-allowed"
                                          : "bg-background border-border text-foreground hover:border-primary/50"
                                    }`}
                                >
                                  <span className={isDisabled ? "line-through" : ""}>{time}</span>
                                  {isBooked && (
                                    <span className="text-[9px] font-semibold text-destructive mt-0.5 no-underline">Indisponível</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>

                          {slotWarning && (
                            <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-xl p-3.5 animate-fade-in shadow-sm">
                              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-destructive">Não é possível agendar neste horário:</span>
                                <span className="text-destructive/90">{slotWarning}</span>
                              </div>
                            </div>
                          )}

                          {error && (
                            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3.5 animate-fade-in">
                              <AlertTriangle size={16} className="shrink-0" />
                              <span>{error}</span>
                            </div>
                          )}
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
