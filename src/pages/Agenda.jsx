import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { Calendar as CalendarIcon, Clock, User, Plus, AlertTriangle, CheckCircle2, Check, Search, UserPlus, X, Trash2, Edit3 } from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

export default function Agenda() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [customers, setCustomers] = useState([])

  // Calendário e Agenda states
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date())
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  })

  // Etapa 1: Dados do Cliente e Autocomplete
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const customerDropdownRef = useRef(null)

  // Sub-modal: Criar Novo Cliente
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerSubmitting, setNewCustomerSubmitting] = useState(false)
  const [newCustomerError, setNewCustomerError] = useState("")

  // Etapa 2: Barbeiro e Múltiplos Serviços
  const [selectedBarber, setSelectedBarber] = useState("")
  const [selectedServices, setSelectedServices] = useState([])

  // Etapa 3: Data e Horário
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")

  // Controle do calendário
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [barberFilter, setBarberFilter] = useState(null)

  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  const shortMonthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ]

  const shortWeekDayNames = [
    "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"
  ]




  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` }

        const apptRes = await fetch(`${API_URL}/api/appointments`, { headers })
        if (apptRes.ok) {
          const apptData = await apptRes.json()
          setAppointments(apptData)
        }

        const srvRes = await fetch(`${API_URL}/api/services`)
        if (srvRes.ok) {
          const srvData = await srvRes.json()
          setServices(srvData)
        }

        const barbRes = await fetch(`${API_URL}/api/barbers`)
        if (barbRes.ok) {
          const barbData = await barbRes.json()
          setBarbers(barbData)
        }

        const custRes = await fetch(`${API_URL}/api/customers`, { headers })
        if (custRes.ok) {
          const custData = await custRes.json()
          setCustomers(custData)
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      }
    }

    fetchData()
  }, [user, token, navigate])

  // Fechar dropdown de busca ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  const getTimeSlots = (dateString) => {
    if (!dateString) return []
    const dateParts = dateString.split("-")
    const date = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]))
    const dayOfWeek = date.getDay()

    if (dayOfWeek === 0) return []

    const slots = []
    let startHour = 9
    let endHour = dayOfWeek === 6 ? 16 : 19

    for (let h = startHour; h < endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
      slots.push(`${String(h).padStart(2, '0')}:30`)
    }
    return slots
  }

  const isTimeSlotPast = (dateString, timeString) => {
    if (!dateString || !timeString) return false
    const appointmentDateTime = new Date(`${dateString}T${timeString}`)
    const now = new Date()
    return appointmentDateTime < now
  }

  const isTimeSlotBooked = (dateString, timeString, targetBarberId = selectedBarber) => {
    if (!targetBarberId || !dateString || !timeString) return false

    const barbObj = barbers.find(b => String(b.id) === String(targetBarberId))
    const barbId = targetBarberId
    const barbName = barbObj ? barbObj.name : null

    const [slotH, slotM] = timeString.split(':').map(Number)
    if (isNaN(slotH) || isNaN(slotM)) return false
    const slotStartMinutes = slotH * 60 + slotM
    const requestedDuration = totalDurationMinutes > 0 ? totalDurationMinutes : 30
    const slotEndMinutes = slotStartMinutes + requestedDuration

    return appointments.some(appt => {
      // Ignorar agendamentos cancelados
      if (appt.status === 'cancelled') return false

      // Ignorar a própria agenda em caso de edição
      if (editingAppointmentId && String(appt.id) === String(editingAppointmentId)) return false

      // Verificar se é no mesmo dia
      if (!appt.appointment_time || !appt.appointment_time.startsWith(dateString)) return false

      // Verificar se é do mesmo barbeiro
      const matchesBarberId = appt.barber_id && String(appt.barber_id) === String(barbId)
      const matchesBarberName = barbName && appt.barber_name && appt.barber_name.toLowerCase() === barbName.toLowerCase()
      if (!matchesBarberId && !matchesBarberName) return false

      // Extrair horário do agendamento existente
      const timePart = appt.appointment_time.split('T')[1] || ""
      if (!timePart) return false

      const [apptH, apptM] = timePart.split(':').map(Number)
      if (isNaN(apptH) || isNaN(apptM)) return false

      const apptStartMinutes = apptH * 60 + apptM
      const apptDuration = appt.duration_minutes || 30
      const apptEndMinutes = apptStartMinutes + apptDuration

      // Verifica sobreposição entre intervalos [slotStart, slotEnd) e [apptStart, apptEnd)
      const overlapStart = Math.max(slotStartMinutes, apptStartMinutes)
      const overlapEnd = Math.min(slotEndMinutes, apptEndMinutes)

      return overlapStart < overlapEnd
    })
  }

  const refreshCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch (err) {
      console.error("Erro ao atualizar lista de clientes:", err)
    }
  }

  const normalizeText = (str) => {
    if (!str) return ""
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  }

  // Filtragem de clientes para autocomplete (busca por partes do nome ou telefone)
  const filteredCustomers = customers.filter(c => {
    if (!clientName.trim()) return false
    const searchNorm = normalizeText(clientName)
    const nameNorm = normalizeText(c.name)
    const phoneClean = c.phone ? c.phone.replace(/\D/g, "") : ""
    const searchClean = clientName.replace(/\D/g, "")

    return (
      nameNorm.includes(searchNorm) ||
      (searchClean.length > 0 && phoneClean.includes(searchClean))
    )
  })

  const handleSelectCustomer = (cust) => {
    setClientName(cust.name)
    setClientPhone(formatPhoneNumber(cust.phone || ""))
    setIsCustomerDropdownOpen(false)
  }


  const handleCreateNewCustomer = async (e) => {
    e.preventDefault()
    setNewCustomerSubmitting(true)
    setNewCustomerError("")

    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      setNewCustomerError("Nome e Telefone são obrigatórios.")
      setNewCustomerSubmitting(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar cliente.")
      }

      setCustomers(prev => [...prev, data.customer])
      setClientName(data.customer.name)
      setClientPhone(formatPhoneNumber(data.customer.phone || ""))
      setIsNewCustomerModalOpen(false)
      setNewCustomerName("")
      setNewCustomerPhone("")
    } catch (err) {
      setNewCustomerError(err.message)
    } finally {
      setNewCustomerSubmitting(false)
    }
  }

  // Cálculo acumulado de duração e preço para múltiplos serviços
  const selectedServicesDetails = services.filter(s => selectedServices.includes(s.id))
  const totalDurationMinutes = selectedServicesDetails.reduce((sum, s) => sum + (s.duration_minutes || 30), 0)
  const totalPriceCalculated = selectedServicesDetails.reduce((sum, s) => sum + (s.price || 0), 0)

  let calculatedEndTime = ""
  if (selectedTime && totalDurationMinutes > 0) {
    const [hours, minutes] = selectedTime.split(':').map(Number)
    if (!isNaN(hours) && !isNaN(minutes)) {
      const startDate = new Date()
      startDate.setHours(hours, minutes, 0, 0)
      const endDate = new Date(startDate.getTime() + totalDurationMinutes * 60000)
      const endH = String(endDate.getHours()).padStart(2, '0')
      const endM = String(endDate.getMinutes()).padStart(2, '0')
      calculatedEndTime = `${endH}:${endM}`
    }
  }

  const [editingAppointmentId, setEditingAppointmentId] = useState(null)

  const handleEditAppointmentClick = (appt) => {
    setEditingAppointmentId(appt.id)
    setClientName(appt.client_name || "")
    setClientPhone(formatPhoneNumber(appt.client_phone || ""))
    setSelectedBarber(appt.barber_id || "")

    let sIds = []
    if (appt.service_ids) {
      sIds = typeof appt.service_ids === 'string' ? appt.service_ids.split(',').filter(Boolean) : [appt.service_ids]
    } else if (appt.service_id) {
      sIds = [appt.service_id]
    }
    setSelectedServices(sIds)

    if (appt.appointment_time) {
      const parts = appt.appointment_time.split('T')
      setSelectedDate(parts[0])
      if (parts[1]) {
        setSelectedTime(parts[1].slice(0, 5))
      }
    }

    setError("")
    setSuccessMsg("")
    setIsCustomerDropdownOpen(false)
    setIsNewAppointmentModalOpen(true)
  }

  const handleCancelAppointment = () => {
    if (!editingAppointmentId) return
    setConfirmModal({
      isOpen: true,
      title: "Cancelar Agendamento",
      message: "Tem certeza que deseja cancelar esta agenda?",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        setSubmitLoading(true)
        try {
          const res = await fetch(`${API_URL}/api/appointments/${editingAppointmentId}/cancel`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || "Erro ao cancelar agenda.")

          setSuccessMsg("Agendamento cancelado com sucesso!")
          setTimeout(() => setSuccessMsg(""), 5000)
          setIsNewAppointmentModalOpen(false)
          setEditingAppointmentId(null)

          const appRes = await fetch(`${API_URL}/api/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (appRes.ok) {
            const apptData = await appRes.json()
            setAppointments(apptData)
          }
        } catch (err) {
          setError(err.message)
        } finally {
          setSubmitLoading(false)
        }
      }
    })
  }

  const handleCreateAppointment = async (e) => {
    if (e) e.preventDefault()
    setError("")
    setSuccessMsg("")

    if (!clientName.trim()) {
      setError("Por favor, preencha o seu nome completo.")
      return
    }
    if (!clientPhone.trim()) {
      setError("Por favor, preencha o seu telefone/Whatsapp.")
      return
    }
    if (!selectedBarber) {
      setError("Por favor, selecione um profissional.")
      return
    }
    if (selectedServices.length === 0) {
      setError("Por favor, selecione ao menos um serviço.")
      return
    }
    if (!selectedDate || !selectedTime) {
      setError("Por favor, selecione o horário do agendamento.")
      return
    }

    if (isTimeSlotBooked(selectedDate, selectedTime)) {
      setError("O horário selecionado já está agendado para este profissional.")
      return
    }

    setSubmitLoading(true)
    const appointmentTime = `${selectedDate}T${selectedTime}`

    try {
      const url = editingAppointmentId
        ? `${API_URL}/api/appointments/${editingAppointmentId}`
        : `${API_URL}/api/appointments`
      const method = editingAppointmentId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
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
        throw new Error(data.error || "Erro ao salvar agendamento.")
      }

      setSuccessMsg(editingAppointmentId ? "Agendamento atualizado com sucesso!" : "Agendamento realizado com sucesso!")
      setTimeout(() => {
        setSuccessMsg("")
      }, 5000)

      setClientName("")
      setClientPhone("")
      setSelectedServices([])
      setSelectedBarber("")
      setSelectedDate("")
      setSelectedTime("")
      setEditingAppointmentId(null)
      setIsNewAppointmentModalOpen(false)
      setError("")

      const appRes = await fetch(`${API_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (appRes.ok) {
        const apptData = await appRes.json()
        setAppointments(apptData)
      }
    } catch (err) {
      setError(err.message || "Erro de conexão ao realizar agendamento.")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleToggleAbsent = async (e, appt) => {
    e.stopPropagation()
    const newStatus = appt.status === 'absent' ? 'confirmed' : 'absent'

    setAppointments(prev =>
      prev.map(a => (a.id === appt.id ? { ...a, status: newStatus } : a))
    )

    try {
      const response = await fetch(`${API_URL}/api/appointments/${appt.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        setAppointments(prev =>
          prev.map(a => (a.id === appt.id ? { ...a, status: appt.status } : a))
        )
      }
    } catch (err) {
      console.error("Erro ao alterar status ausente:", err)
      setAppointments(prev =>
        prev.map(a => (a.id === appt.id ? { ...a, status: appt.status } : a))
      )
    }
  }

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(prev => prev - 1)
    } else {
      setCalendarMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear(prev => prev + 1)
    } else {
      setCalendarMonth(prev => prev + 1)
    }
  }

  const getCalendarCells = () => {
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate()
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay()
    const prevMonthTotalDays = new Date(calendarYear, calendarMonth, 0).getDate()

    const cells = []

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayVal = prevMonthTotalDays - i
      const cellDate = new Date(calendarYear, calendarMonth - 1, dayVal)
      cells.push({
        date: cellDate,
        isCurrentMonth: false,
        dayNumber: dayVal
      })
    }

    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(calendarYear, calendarMonth, d)
      cells.push({
        date: cellDate,
        isCurrentMonth: true,
        dayNumber: d
      })
    }

    const remaining = cells.length % 7
    if (remaining > 0) {
      const nextDaysNeeded = 7 - remaining
      for (let n = 1; n <= nextDaysNeeded; n++) {
        const cellDate = new Date(calendarYear, calendarMonth + 1, n)
        cells.push({
          date: cellDate,
          isCurrentMonth: false,
          dayNumber: n
        })
      }
    }

    return cells
  }

  const handleDayClick = (cellDate) => {
    const year = cellDate.getFullYear()
    const month = String(cellDate.getMonth() + 1).padStart(2, '0')
    const day = String(cellDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    setSelectedDate(dateStr)
    setSelectedCalendarDate(cellDate)
    setSelectedTime("")
    setError("")
    setSuccessMsg("")
  }

  const handleOpenNewAppointmentModal = () => {
    refreshCustomers()
    const year = selectedCalendarDate.getFullYear()
    const month = String(selectedCalendarDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedCalendarDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    setSelectedDate(dateStr)
    setEditingAppointmentId(null)
    setClientName("")
    setClientPhone("")
    setSelectedServices([])
    setSelectedBarber("")
    setSelectedTime("")
    setError("")
    setSuccessMsg("")
    setIsCustomerDropdownOpen(false)
    setIsNewAppointmentModalOpen(true)
  }

  const formatBirthDate = (dateStr) => {
    if (!dateStr) return ""
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  if (!user) return null

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background text-foreground pt-24 pb-28 lg:pb-12 px-4 md:px-8 relative lg:pl-[280px] sidebar-page-container flex flex-col justify-start">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      <Sidebar />

      <div className="container mx-auto px-1 max-w-5xl relative z-10 animate-scale-in lg:fixed lg:left-[280px] sidebar-fixed-content lg:right-10 lg:top-1/2 lg:-translate-y-1/2 lg:h-[calc(80vh+80px)] lg:w-auto lg:max-w-none lg:overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:pr-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch lg:h-[calc(100vh-170px)] animate-scale-in">
          {/* Lado Esquerdo/Centro: Calendário Mensal em Grid */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <div className="bg-card/45 backdrop-blur-md border border-border/80 rounded-3xl p-6 md:p-8 shadow-elevated relative overflow-hidden h-full flex flex-col">

              {/* Cabeçalho do Calendário */}
              <div className="flex items-center justify-between border-b border-border/60 pb-5 mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-['Bebas_Neue'] text-3xl text-foreground capitalize tracking-widest">
                    {monthNames[calendarMonth]}
                  </span>
                  <span className="font-['Bebas_Neue'] text-3xl text-muted-foreground tracking-widest pl-1">
                    {calendarYear}
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {/* Filtro por Foto dos Barbeiros */}
                  <div className="flex items-center gap-2 bg-background/30 p-1.5 rounded-2xl border border-border/50 shadow-xs">
                    {barbers.map((barb, index) => {
                      const isSelected = barberFilter === barb.id
                      const barberPhoto = barb.photo || (
                        index === 0 ? "/assets/foto_marcio.png" :
                          index === 1 ? "/assets/foto_lucas.png" :
                            "/assets/foto_neto.png"
                      )

                      return (
                        <button
                          key={barb.id || index}
                          type="button"
                          onClick={() => setBarberFilter(isSelected ? null : barb.id)}
                          className={`relative group/barbfilter rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center p-0.5 border ${isSelected
                            ? "border-primary bg-primary/20 ring-2 ring-primary/50 scale-110 shadow-gold-sm"
                            : barberFilter !== null
                              ? "border-border/40 opacity-40 hover:opacity-100 hover:border-primary/60 grayscale-[40%] hover:grayscale-0"
                              : "border-border/60 bg-background/50 hover:border-primary/80 hover:scale-105"
                            }`}
                          title={isSelected ? `Filtrando por ${barb.name} (Clique para ver todos)` : `Filtrar agenda de ${barb.name}`}
                        >
                          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden border border-gold-subtle shadow-xs bg-background flex items-center justify-center shrink-0">
                            {barberPhoto ? (
                              <img src={barberPhoto} alt={barb.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={22} className="text-muted-foreground" />
                            )}
                          </div>
                          {isSelected && (
                            <span className="absolute -bottom-1 -right-1 bg-primary text-background rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black shadow-xs">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}

                    {barberFilter !== null && (
                      <button
                        type="button"
                        onClick={() => setBarberFilter(null)}
                        className="text-[10px] font-bold text-muted-foreground hover:text-primary px-2 py-1 transition-colors cursor-pointer"
                        title="Limpar filtro de barbeiro"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Navegação de Mês */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-2.5 bg-background/50 hover:bg-muted border border-border/60 rounded-xl text-foreground hover:text-primary transition-all cursor-pointer"
                      title="Mês Anterior"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-2.5 bg-background/50 hover:bg-muted border border-border/60 rounded-xl text-foreground hover:text-primary transition-all cursor-pointer"
                      title="Próximo Mês"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="grid grid-cols-7 gap-2.5 text-center font-display text-[12px] font-black uppercase tracking-widest text-primary mb-3">
                <div>DOM</div>
                <div>SEG</div>
                <div>TER</div>
                <div>QUA</div>
                <div>QUI</div>
                <div>SEX</div>
                <div>SÁB</div>
              </div>

              {/* Grid de Dias */}
              <div className="grid grid-cols-7 gap-2.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                {getCalendarCells().map((cell, idx) => {
                  const isToday = new Date().toDateString() === cell.date.toDateString()
                  const isSelected = selectedCalendarDate.toDateString() === cell.date.toDateString()

                  const cellYear = cell.date.getFullYear()
                  const cellMonth = String(cell.date.getMonth() + 1).padStart(2, '0')
                  const cellDay = String(cell.date.getDate()).padStart(2, '0')
                  const cellDateStr = `${cellYear}-${cellMonth}-${cellDay}`

                  const dayAppts = appointments.filter(appt => {
                    if (!appt.appointment_time) return false
                    if (!appt.appointment_time.startsWith(cellDateStr)) return false
                    if (barberFilter) {
                      const barbObj = barbers.find(b => b.id === barberFilter)
                      const matchesId = appt.barber_id === barberFilter
                      const matchesName = barbObj && appt.barber_name === barbObj.name
                      if (!matchesId && !matchesName) return false
                    }
                    return true
                  })
                  const activeDayAppts = dayAppts.filter(a => a.status !== 'cancelled')

                  // Agrupar agendamentos ativos por barbeiro para exibir avatar + quantidade total no dia
                  const barberApptCounts = {}
                  activeDayAppts.forEach(appt => {
                    const bKey = appt.barber_id || appt.barber_name || "default"
                    if (!barberApptCounts[bKey]) {
                      const barbObj = barbers.find(b => b.id === appt.barber_id || b.name === appt.barber_name)
                      const photo = appt.barber_photo || (barbObj && barbObj.photo ? barbObj.photo : null)
                      barberApptCounts[bKey] = {
                        barber_id: appt.barber_id,
                        barber_name: appt.barber_name || (barbObj ? barbObj.name : "Barbeiro"),
                        photo: photo,
                        count: 0
                      }
                    }
                    barberApptCounts[bKey].count += 1
                  })
                  const barberSummaries = Object.values(barberApptCounts)

                  return (
                    <div
                      key={`cell-${idx}`}
                      onClick={() => handleDayClick(cell.date)}
                      className={`min-h-[70px] lg:min-h-0 lg:h-full border rounded-2xl p-2.5 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between group select-none ${isSelected
                        ? "bg-primary/5 border-primary shadow-gold-sm"
                        : isToday
                          ? "bg-muted/30 border-primary/50"
                          : cell.isCurrentMonth
                            ? "bg-muted/15 border-border/60 text-foreground"
                            : "bg-muted/5 border-border/20 text-muted-foreground/30"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[22pt] font-['Bebas_Neue'] tracking-wider ${isSelected
                          ? "text-primary"
                          : isToday
                            ? "text-primary"
                            : cell.isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground/35"
                          }`}>
                          {cell.dayNumber}
                        </span>
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>

                      {/* Exibição dos avatares dos barbeiros com o total de agendas no dia */}
                      {barberSummaries.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2 items-center">
                          {barberSummaries.map((bSum, bIdx) => {
                            const barberPhoto = bSum.photo || (
                              bIdx === 0 ? "/assets/foto_marcio.png" :
                                bIdx === 1 ? "/assets/foto_lucas.png" :
                                  "/assets/foto_neto.png"
                            )
                            return (
                              <div
                                key={bSum.barber_id || bIdx}
                                className="relative group/avatar"
                                title={`${bSum.barber_name}: ${bSum.count} agendamento(s)`}
                              >
                                <div className="w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-gold-subtle shadow-md bg-background/80 flex items-center justify-center shrink-0">
                                  {barberPhoto ? (
                                    <img src={barberPhoto} alt={bSum.barber_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <User size={22} className="text-muted-foreground/60" />
                                  )}
                                </div>
                                <span className="absolute -top-1.5 -right-1.5 bg-primary text-background font-black text-[12px] min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center font-mono shadow-md border-2 border-background">
                                  {bSum.count}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Painel lateral Agenda */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <div className="bg-card/45 backdrop-blur-md border border-border/80 rounded-3xl p-5 md:p-6 shadow-elevated relative overflow-hidden flex flex-col h-full min-h-[320px] lg:min-h-0">

              {/* Cabeçalho da Agenda */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                <div>
                  <h3 className="font-display font-black text-lg tracking-wide text-foreground uppercase flex items-center gap-2">
                    <span>AGENDA</span>
                    {barberFilter && (() => {
                      const activeBarb = barbers.find(b => b.id === barberFilter)
                      return (
                        <span className="text-[10px] bg-primary/15 border border-primary/40 text-primary px-2 py-0.5 rounded-full font-bold normal-case tracking-normal">
                          {activeBarb ? activeBarb.name.split(' ')[0] : 'Filtrado'}
                        </span>
                      )
                    })()}
                  </h3>
                  <p className="font-['Bebas_Neue'] text-[14pt] tracking-wider text-muted-foreground mt-0.5">
                    {selectedCalendarDate.getDate()}/{shortMonthNames[selectedCalendarDate.getMonth()]}, {shortWeekDayNames[selectedCalendarDate.getDay()]}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenNewAppointmentModal}
                    className="inline-flex items-center justify-center gap-1.5 bg-gold-gradient text-primary-foreground font-bold h-10 rounded-xl px-4 text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    title="Novo Agendamento"
                  >
                    <Plus size={14} />
                    <span>Nova Agenda</span>
                  </button>
                </div>
              </div>

              {/* Listagem detalhada dos agendamentos */}
              <div className="space-y-6 flex-1 overflow-y-auto max-h-[370px] lg:max-h-[calc(100vh-330px)] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
                {(() => {
                  const cellYear = selectedCalendarDate.getFullYear()
                  const cellMonth = String(selectedCalendarDate.getMonth() + 1).padStart(2, '0')
                  const cellDay = String(selectedCalendarDate.getDate()).padStart(2, '0')
                  const cellDateStr = `${cellYear}-${cellMonth}-${cellDay}`

                  const dayAppts = appointments.filter(appt => {
                    if (!appt.appointment_time) return false
                    if (!appt.appointment_time.startsWith(cellDateStr)) return false
                    if (barberFilter) {
                      const barbObj = barbers.find(b => b.id === barberFilter)
                      const matchesId = appt.barber_id === barberFilter
                      const matchesName = barbObj && appt.barber_name === barbObj.name
                      if (!matchesId && !matchesName) return false
                    }
                    return true
                  })

                  const sortedDayAppts = [...dayAppts].sort((a, b) => {
                    const timeA = a.appointment_time.split('T')[1] || ""
                    const timeB = b.appointment_time.split('T')[1] || ""
                    return timeB.localeCompare(timeA)
                  })

                  if (sortedDayAppts.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-muted/5 h-full">
                        <CalendarIcon size={36} className="stroke-1 mb-3 text-muted-foreground/30 animate-pulse" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Nenhum compromisso</p>
                        <p className="text-[10px] mt-1 text-muted-foreground/40">Para este dia selecionado.</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-6">
                      {sortedDayAppts.map((appt) => {
                        const isCancelled = appt.status === 'cancelled'
                        const isAbsent = appt.status === 'absent'
                        const isStruckThrough = isCancelled || isAbsent
                        const apptTimeOnly = appt.appointment_time.split('T')[1] || ""

                        let endTimeOnly = ""
                        const durationMin = appt.duration_minutes || 30
                        if (apptTimeOnly) {
                          const [hours, minutes] = apptTimeOnly.split(':').map(Number)
                          if (!isNaN(hours) && !isNaN(minutes)) {
                            const startDate = new Date()
                            startDate.setHours(hours, minutes, 0, 0)
                            const endDate = new Date(startDate.getTime() + durationMin * 60000)
                            const endHours = String(endDate.getHours()).padStart(2, '0')
                            const endMinutes = String(endDate.getMinutes()).padStart(2, '0')
                            endTimeOnly = `${endHours}:${endMinutes}`
                          }
                        }

                        const durationText = durationMin === 60
                          ? "1h"
                          : durationMin > 60
                            ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}min`
                            : `${durationMin} min`

                        const barber = barbers.find(b => b.name === appt.barber_name || b.id === appt.barber_id)
                        const barberImg = appt.barber_photo || (barber && barber.photo ? barber.photo : null)

                        return (
                          <div key={appt.id} className="animate-scale-in">
                            <div
                              onClick={() => handleEditAppointmentClick(appt)}
                              className={`glass-card border border-border/70 rounded-2xl p-4 hover:border-primary/60 transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer group hover:shadow-gold-sm ${isStruckThrough ? "opacity-65 bg-destructive/5 border-destructive/30" : ""
                                }`}
                              title="Clique para editar ou cancelar este agendamento"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                  <h4 className={`font-bold text-[12px] tracking-wide uppercase leading-tight group-hover:text-primary transition-colors flex items-center gap-2 flex-wrap ${isStruckThrough ? "line-through text-destructive" : "text-foreground"
                                    }`}>
                                    <span>{user.role === 'client' ? `Profissional: ${appt.barber_name}` : appt.client_name}</span>
                                    {isCancelled && (
                                      <span className="no-underline inline-block text-[8px] bg-destructive/20 border border-destructive/40 text-destructive px-1.5 py-0.5 rounded font-mono font-bold">
                                        CANCELADO
                                      </span>
                                    )}
                                    {isAbsent && (
                                      <span className="no-underline inline-block text-[8px] bg-amber-500/20 border border-amber-500/40 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                                        AUSENTE
                                      </span>
                                    )}
                                  </h4>

                                  {/* Toggle Ausente */}
                                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Ausente</span>
                                    <label className="relative inline-flex items-center cursor-pointer select-none" title="Marcar/Desmarcar como Ausente">
                                      <input
                                        type="checkbox"
                                        checked={isAbsent}
                                        onChange={(e) => handleToggleAbsent(e, appt)}
                                        className="sr-only peer"
                                      />
                                      <div className="w-7 h-4 bg-muted/70 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                                    </label>
                                  </div>
                                </div>

                                <p className={`text-[12px] leading-normal ${isStruckThrough ? "line-through text-muted-foreground/50" : "text-muted-foreground"
                                  }`}>
                                  {appt.service_name}
                                </p>

                                <div className="flex items-center justify-between text-[12px] text-muted-foreground/75 pt-1.5 mt-1.5">
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <Clock size={13} className={isStruckThrough ? "text-destructive/60" : "text-primary/70"} />
                                    <span className={`text-[13px] font-bold ${isStruckThrough ? "line-through text-muted-foreground/60" : ""}`}>
                                      {apptTimeOnly}{endTimeOnly ? ` às ${endTimeOnly}` : ""}
                                    </span>
                                  </div>
                                  <span className={`font-medium font-mono text-[11px] px-2 py-0.5 rounded-full ${isStruckThrough ? "line-through bg-destructive/10 text-destructive/70" : "bg-muted/30 text-muted-foreground/90"
                                    }`}>{durationText}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gold-subtle shadow-xs bg-background/50 flex items-center justify-center shrink-0">
                                    {barberImg ? (
                                      <img src={barberImg} alt={appt.barber_name} className="w-full h-full object-cover" />
                                    ) : (
                                      <User size={24} className="text-muted-foreground/45" />
                                    )}
                                  </div>
                                  <span className={`text-[13px] font-bold leading-none ${isStruckThrough ? "line-through text-muted-foreground/60" : "text-foreground/80"}`}>
                                    {appt.barber_name ? appt.barber_name.split(' ')[0] : 'Barbeiro'}
                                  </span>
                                </div>
                                <span className={`font-bold font-['Bebas_Neue'] text-[14pt] tracking-wider ${isStruckThrough ? "line-through text-muted-foreground/50" : "text-primary"
                                  }`}>
                                  R$ {appt.service_price ? appt.service_price.toFixed(2).replace('.', ',') : '0,00'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO PERSONALIZADO */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm border border-destructive/20 rounded-2xl p-6 md:p-8 shadow-elevated relative animate-scale-in text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 border border-destructive/25 text-destructive rounded-full flex items-center justify-center mb-4 animate-bounce">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-bold font-display text-foreground mb-2">
              {confirmModal.title}
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              {confirmModal.message}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 border border-border hover:bg-muted text-foreground font-bold h-11 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-destructive hover:bg-destructive/80 text-white font-bold h-11 rounded-xl text-xs transition-all cursor-pointer shadow-lg hover:shadow-destructive/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO RÁPIDO DE NOVO CLIENTE */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="glass-card w-full max-w-md border border-gold-subtle rounded-2xl p-6 md:p-8 shadow-elevated relative animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display text-primary flex items-center gap-2">
                <UserPlus size={20} /> Cadastrar Novo Cliente
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {newCustomerError && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3 mb-4">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{newCustomerError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewCustomer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">WhatsApp / Celular *</label>
                <input
                  type="text"
                  required
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(formatPhoneNumber(e.target.value))}
                  placeholder="Ex: (34) 99999-8888"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/40 mt-4">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="flex-1 py-2.5 bg-muted/40 hover:bg-muted/60 text-foreground text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={newCustomerSubmitting}
                  className="flex-1 py-2.5 bg-gold-gradient text-primary-foreground text-xs uppercase tracking-wider font-bold rounded-xl shadow-gold hover:shadow-gold-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {newCustomerSubmitting ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    "Salvar e Selecionar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE NOVOS AGENDAMENTOS */}
      {isNewAppointmentModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card w-full max-w-lg border border-gold-subtle rounded-2xl p-6 md:p-8 shadow-elevated relative animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold font-display mb-6 text-primary flex items-center gap-2">
              {editingAppointmentId ? <Edit3 size={20} /> : <Plus size={20} />}
              {editingAppointmentId ? "Editar Agendamento" : "Novo Agendamento"}
            </h3>


            <p className="text-sm text-muted-foreground mb-6">
              Para o dia <span className="font-bold text-foreground font-mono">{selectedDate ? formatBirthDate(selectedDate) : ""}</span>
            </p>

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

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* CAMPO DE CLIENTE COM AUTOCOMPLETE DE BUSCA E OPÇÃO DE NOVO CLIENTE */}
                <div className="space-y-1 relative sm:col-span-1" ref={customerDropdownRef}>
                  <div className="flex items-center justify-between h-5 mb-0.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome do Cliente *</label>
                    <button
                      type="button"
                      onClick={() => setIsNewCustomerModalOpen(true)}
                      className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus size={11} /> + Novo Cliente
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => {
                        const val = e.target.value
                        setClientName(val)
                        setIsCustomerDropdownOpen(val.trim().length > 0)
                      }}
                      onFocus={() => {
                        if (clientName.trim().length > 0) {
                          setIsCustomerDropdownOpen(true)
                        }
                      }}
                      placeholder="Digite o nome para buscar"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 pl-9 pr-4 text-sm text-foreground focus:outline-none transition-all"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  </div>

                  {/* Dropdown Autocomplete de Clientes (Exibe apenas ao digitar) */}
                  {isCustomerDropdownOpen && clientName.trim().length > 0 && (

                    <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-elevated z-50 max-h-48 overflow-y-auto animate-scale-in">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(cust => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => handleSelectCustomer(cust)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-muted/40 border-b border-border/30 last:border-0 flex flex-col cursor-pointer transition-colors"
                          >
                            <span className="font-bold text-xs text-foreground">{cust.name}</span>
                            {cust.phone && (
                              <span className="text-[10px] text-primary font-mono">{formatPhoneNumber(cust.phone)}</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          <p className="mb-2 text-[11px]">Nenhum cliente encontrado com este nome.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomerDropdownOpen(false)
                              setNewCustomerName(clientName)
                              setIsNewCustomerModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all cursor-pointer"
                          >
                            <UserPlus size={12} /> Cadastrar "{clientName}"
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <div className="flex items-center justify-between h-5 mb-0.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone / WhatsApp *</label>
                  </div>
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(formatPhoneNumber(e.target.value))}
                    maxLength={15}
                    placeholder="Ex: (34) 98821-8498"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

              </div>

              {/* Selecionar Barbeiro */}
              <div className="space-y-2 mt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Profissional / Barbeiro *</label>
                <div className="flex flex-wrap gap-2.5">
                  {barbers.map((barb, index) => {
                    const isSelected = selectedBarber === barb.id
                    const barberPhoto = barb.photo || (
                      index === 0 ? "/assets/foto_marcio.png" :
                        index === 1 ? "/assets/foto_lucas.png" :
                          "/assets/foto_neto.png"
                    )
                    return (
                      <button
                        type="button"
                        key={barb.id}
                        onClick={() => {
                          const newBarberId = barb.id
                          setSelectedBarber(newBarberId)
                          if (selectedTime && isTimeSlotBooked(selectedDate, selectedTime, newBarberId)) {
                            setSelectedTime("")
                          }
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border/60 bg-background/30 text-muted-foreground hover:border-border"
                          }`}
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-border/80 shrink-0 bg-background">
                          <img src={barberPhoto} alt={barb.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs truncate">{barb.name.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selecionar Serviços (Múltiplos) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Serviços Desejados *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-background/25 border border-border/40 rounded-xl">
                  {services.map((srv) => {
                    const isSelected = selectedServices.includes(srv.id)
                    return (
                      <button
                        type="button"
                        key={srv.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedServices(prev => prev.filter(id => id !== srv.id))
                          } else {
                            setSelectedServices(prev => [...prev, srv.id])
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-background/30 text-muted-foreground hover:border-border"
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-primary bg-primary text-background" : "border-muted-foreground/35"
                            }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className="text-xs truncate font-medium">{srv.name}</span>
                        </div>
                        <span className="text-[10px] font-mono pl-2 shrink-0 text-muted-foreground">R$ {srv.price.toFixed(0)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PAINEL INFORMATIVO DE DURAÇÃO SOMADA E HORÁRIO CALCULADO */}
              {selectedServices.length > 0 && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3.5 flex items-center justify-between text-xs animate-fade-in">
                  <div>
                    <span className="font-bold text-primary block text-[10px] uppercase tracking-wider">Resumo Combinado</span>
                    <span className="text-foreground font-semibold text-xs truncate max-w-[220px] block">
                      {selectedServicesDetails.map(s => s.name).join(" + ")}
                    </span>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="font-bold text-primary text-base font-['Bebas_Neue'] tracking-wide">
                      R$ {totalPriceCalculated.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono font-bold">
                      ⏱️ {totalDurationMinutes} min {selectedTime && calculatedEndTime ? `(${selectedTime} - ${calculatedEndTime})` : ""}
                    </div>
                  </div>
                </div>
              )}

              {/* Selecionar Horário */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Horário Disponível *</label>
                {!selectedDate ? (
                  <p className="text-xs text-muted-foreground">Selecione um dia primeiro.</p>
                ) : getTimeSlots(selectedDate).length === 0 ? (
                  <p className="text-xs text-destructive font-bold bg-destructive/5 p-3 rounded-lg border border-destructive/20 text-center">Barbearia fechada neste dia (Domingo).</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1 bg-background/25 border border-border/40 rounded-xl">
                    {getTimeSlots(selectedDate).map((time) => {
                      const isPast = isTimeSlotPast(selectedDate, time)
                      const isBooked = isTimeSlotBooked(selectedDate, time)
                      const isDisabled = isPast || isBooked
                      const isSelected = selectedTime === time
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all text-center ${isSelected
                            ? "bg-primary border-primary text-background shadow-gold scale-102 cursor-pointer"
                            : isBooked
                              ? "bg-destructive/10 border-destructive/20 text-destructive/60 line-through cursor-not-allowed"
                              : isPast
                                ? "bg-background/20 border-border/10 text-muted-foreground/30 cursor-not-allowed"
                                : "bg-background border-border text-foreground hover:border-primary/50 cursor-pointer"
                            }`}
                          title={
                            isBooked
                              ? "Horário já agendado para este profissional"
                              : isPast
                                ? "Horário já passou"
                                : `Selecionar ${time}`
                          }
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/40 mt-6 flex-wrap">
                {editingAppointmentId && (
                  <button
                    type="button"
                    onClick={handleCancelAppointment}
                    disabled={submitLoading}
                    className="py-3 px-4 bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 text-destructive text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Cancelar Agenda</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsNewAppointmentModalOpen(false)
                    setEditingAppointmentId(null)
                    if (user.role !== 'client') {
                      setClientName("")
                      setClientPhone("")
                    }
                    setSelectedServices([])
                    setSelectedBarber("")
                    setSelectedTime("")
                    setError("")
                  }}
                  className="flex-1 py-3 px-4 bg-muted/40 hover:bg-muted/60 text-foreground text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !selectedTime || !selectedBarber || selectedServices.length === 0}
                  className="flex-1 py-3 px-4 bg-gold-gradient text-black text-xs uppercase tracking-wider font-bold rounded-xl shadow-gold-sm hover:shadow-gold-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : editingAppointmentId ? (
                    "Salvar Alterações"
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
