import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { Calendar as CalendarIcon, Clock, User, Scissors, Star, LogOut, CheckCircle2, XCircle, AlertTriangle, CalendarDays, Plus, Users, ShieldAlert, KeyRound, Sparkles, MapPin, Flame, LayoutDashboard, Settings, Trash2, Pencil, Search, Upload } from "lucide-react"

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])

  // Seções do painel: "dashboard", "agenda", "clientes", "servicos", "equipe"
  const [activeSection, setActiveSection] = useState("dashboard")
  const [userList, setUserList] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [permissionsError, setPermissionsError] = useState("")
  const [permissionsSuccess, setPermissionsSuccess] = useState("")

  // Clientes (new table) states
  const [customerList, setCustomerList] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customerFilter, setCustomerFilter] = useState("")
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState(null)
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerBirthDate, setCustomerBirthDate] = useState("")
  const [customerPhoto, setCustomerPhoto] = useState("")
  const [customerError, setCustomerError] = useState("")
  const [customerSuccess, setCustomerSuccess] = useState("")
  const [customerSubmitting, setCustomerSubmitting] = useState(false)

  // Profissionais (new table) states
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false)
  const [editingBarberId, setEditingBarberId] = useState(null)
  const [barberName, setBarberName] = useState("")
  const [barberPhone, setBarberPhone] = useState("")
  const [barberPhoto, setBarberPhoto] = useState("")
  const [barberBirthDate, setBarberBirthDate] = useState("")
  const [barberSpecialty, setBarberSpecialty] = useState("")
  const [barberHiredAt, setBarberHiredAt] = useState("")
  const [barberSubmitting, setBarberSubmitting] = useState(false)
  const [barberError, setBarberError] = useState("")
  const [barberSuccess, setBarberSuccess] = useState("")
  // Modal de confirmação personalizado state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  })

  // Configurações Gerais states
  const [shopName, setShopName] = useState(() => localStorage.getItem("shopName") || "Barbearia Do Vale")
  const [shopAddress, setShopAddress] = useState(() => localStorage.getItem("shopAddress") || "Av. Senador Melo Viana, 709 - Goiás, Araguari/MG")
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem("shopPhone") || "(34) 99868-4036")
  const [shopOpenHours, setShopOpenHours] = useState(() => localStorage.getItem("shopOpenHours") || "Segunda a Sábado das 08:00 às 19:00")
  const [settingsSuccess, setSettingsSuccess] = useState("")

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
      }
    }

    fetchData()
  }, [user, token, navigate])

  // Carregar lista de usuários (Apenas se for admin e estiver na aba de configurações)
  useEffect(() => {
    if (activeSection === "configuracoes" && user && user.role === "admin") {
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
  }, [activeSection, user, token])

  // Carregar lista de clientes (Apenas se for admin/barbeiro e estiver na aba de clientes)
  useEffect(() => {
    if (activeSection === "clientes" && user && (user.role === "admin" || user.role === "barber")) {
      async function loadCustomers() {
        setCustomersLoading(true)
        setCustomerError("")
        try {
          const response = await fetch(`${API_URL}/api/customers`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            setCustomerList(data)
          } else {
            const data = await response.json()
            setCustomerError(data.error || "Erro ao carregar lista de clientes.")
          }
        } catch {
          setCustomerError("Erro de conexão ao carregar clientes.")
        } finally {
          setCustomersLoading(false)
        }
      }
      loadCustomers()
    }
  }, [activeSection, user, token])

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
      setTimeout(() => {
        setSuccessMsg("")
      }, 5000)
      
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

  const handleCancelAppointment = (id) => {
    showConfirm(
      "Cancelar Agendamento",
      "Tem certeza que deseja cancelar este agendamento?",
      () => executeCancelAppointment(id)
    )
  }

  const executeCancelAppointment = async (id) => {
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
      setTimeout(() => {
        setPermissionsSuccess("")
      }, 5000)
      // Atualizar lista localmente
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      setPermissionsError(err.message)
    }
  }

  // Clientes CRUD Handlers
  const handleSaveCustomer = async (e) => {
    e.preventDefault()
    setCustomerSubmitting(true)
    setCustomerError("")
    setCustomerSuccess("")

    const payload = {
      name: customerName.trim(),
      address: customerAddress.trim(),
      phone: customerPhone.trim(),
      birth_date: customerBirthDate.trim(),
      photo: customerPhoto.trim()
    }

    try {
      const url = editingCustomerId 
        ? `${API_URL}/api/customers/${editingCustomerId}` 
        : `${API_URL}/api/customers`
      const method = editingCustomerId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar cliente.")
      }

      setCustomerSuccess(editingCustomerId ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!")
      setTimeout(() => {
        setCustomerSuccess("")
      }, 5000)
      
      // Atualizar lista localmente
      if (editingCustomerId) {
        setCustomerList(prev => prev.map(c => c.id === editingCustomerId ? data.customer : c))
      } else {
        setCustomerList(prev => [...prev, data.customer])
      }

      // Fechar modal e resetar form
      setIsCustomerModalOpen(false)
      resetCustomerForm()
    } catch (err) {
      setCustomerError(err.message)
    } finally {
      setCustomerSubmitting(false)
    }
  }

  const handleDeleteCustomer = (id) => {
    showConfirm(
      "Excluir Cliente",
      "Tem certeza que deseja excluir este cliente? Esta ação não poderá ser desfeita.",
      () => executeDeleteCustomer(id)
    )
  }

  const executeDeleteCustomer = async (id) => {
    setCustomerError("")
    setCustomerSuccess("")

    try {
      const res = await fetch(`${API_URL}/api/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao excluir cliente.")
      }

      setCustomerSuccess("Cliente excluído com sucesso!")
      setTimeout(() => {
        setCustomerSuccess("")
      }, 5000)
      setCustomerList(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setCustomerError(err.message)
    }
  }

  const resetCustomerForm = () => {
    setEditingCustomerId(null)
    setCustomerName("")
    setCustomerAddress("")
    setCustomerPhone("")
    setCustomerBirthDate("")
    setCustomerPhoto("")
  }

  const handleEditCustomerClick = (customer) => {
    setEditingCustomerId(customer.id)
    setCustomerName(customer.name || "")
    setCustomerAddress(customer.address || "")
    setCustomerPhone(customer.phone || "")
    setCustomerBirthDate(customer.birth_date || "")
    setCustomerPhoto(customer.photo || "")
    setIsCustomerModalOpen(true)
  }

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleCustomerPhoneChange = (e) => {
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
    setCustomerPhone(value)
  }

  const compressAndSetImage = (file, callback, onError) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height
        
        const MAX_WIDTH = 400
        const MAX_HEIGHT = 400
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)
        
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7)
        callback(compressedBase64)
      }
      img.onerror = () => {
        onError("Erro ao processar imagem.")
      }
      img.src = event.target.result
    }
    reader.onerror = () => {
      onError("Erro ao ler o arquivo.")
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    compressAndSetImage(
      file,
      (compressedBase64) => setCustomerPhoto(compressedBase64),
      (errMsg) => setCustomerError(errMsg)
    )
  }

  const formatBirthDate = (dateStr) => {
    if (!dateStr) return ""
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  // Profissionais CRUD Handlers
  const handleSaveBarber = async (e) => {
    e.preventDefault()
    setBarberSubmitting(true)
    setBarberError("")
    setBarberSuccess("")

    const payload = {
      name: barberName.trim(),
      phone: barberPhone.trim(),
      photo: barberPhoto.trim(),
      birth_date: barberBirthDate.trim(),
      specialty: barberSpecialty.trim(),
      hired_at: barberHiredAt.trim()
    }

    try {
      const url = editingBarberId 
        ? `${API_URL}/api/barbers/${editingBarberId}` 
        : `${API_URL}/api/barbers`
      const method = editingBarberId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar profissional.")
      }

      setBarberSuccess(editingBarberId ? "Profissional atualizado com sucesso!" : "Profissional cadastrado com sucesso!")
      setTimeout(() => {
        setBarberSuccess("")
      }, 5000)

      if (editingBarberId) {
        setBarbers(prev => prev.map(b => b.id === editingBarberId ? data.barber : b))
      } else {
        setBarbers(prev => [...prev, data.barber])
      }

      setIsBarberModalOpen(false)
      resetBarberForm()
    } catch (err) {
      setBarberError(err.message)
    } finally {
      setBarberSubmitting(false)
    }
  }

  const handleDeleteBarber = (id) => {
    showConfirm(
      "Excluir Profissional",
      "Tem certeza que deseja excluir este profissional? Esta ação não poderá ser desfeita.",
      () => executeDeleteBarber(id)
    )
  }

  const executeDeleteBarber = async (id) => {
    setBarberError("")
    setBarberSuccess("")

    try {
      const res = await fetch(`${API_URL}/api/barbers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao excluir profissional.")
      }

      setBarberSuccess("Profissional excluído com sucesso!")
      setTimeout(() => {
        setBarberSuccess("")
      }, 5000)
      setBarbers(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      setBarberError(err.message)
    }
  }

  const resetBarberForm = () => {
    setEditingBarberId(null)
    setBarberName("")
    setBarberPhone("")
    setBarberPhoto("")
    setBarberBirthDate("")
    setBarberSpecialty("")
    setBarberHiredAt("")
  }

  const handleEditBarberClick = (barb) => {
    setEditingBarberId(barb.id)
    setBarberName(barb.name || "")
    setBarberPhone(barb.phone || "")
    setBarberPhoto(barb.photo || "")
    setBarberBirthDate(barb.birth_date || "")
    setBarberSpecialty(barb.specialty || "")
    setBarberHiredAt(barb.hired_at || "")
    setIsBarberModalOpen(true)
  }

  const handleBarberPhoneChange = (e) => {
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
    setBarberPhone(value)
  }

  const handleBarberPhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    compressAndSetImage(
      file,
      (compressedBase64) => setBarberPhoto(compressedBase64),
      (errMsg) => setBarberError(errMsg)
    )
  }

  // Configurações Gerais Handlers
  const handleSaveSettings = (e) => {
    e.preventDefault()
    setSettingsSuccess("")
    
    localStorage.setItem("shopName", shopName)
    localStorage.setItem("shopAddress", shopAddress)
    localStorage.setItem("shopPhone", shopPhone)
    localStorage.setItem("shopOpenHours", shopOpenHours)
    
    setSettingsSuccess("Configurações gerais salvas com sucesso!")
    setTimeout(() => {
      setSettingsSuccess("")
    }, 5000)
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

  const baseSidebarOptions = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "agenda", label: "Agenda", icon: <CalendarDays size={18} /> },
    { id: "clientes", label: "Clientes", icon: <Users size={18} /> },
    { id: "servicos", label: "Serviços", icon: <Scissors size={18} /> },
    { id: "equipe", label: "PROFISSIONAIS", icon: <User size={18} /> }
  ]

  const sidebarOptions = user && user.role === 'admin'
    ? [...baseSidebarOptions, { id: "configuracoes", label: "Configurações", icon: <Settings size={18} /> }]
    : baseSidebarOptions

  const uniqueClients = []
  const clientMap = new Map()
  appointments.forEach(appt => {
    if (appt.client_name && !clientMap.has(appt.client_name)) {
      clientMap.set(appt.client_name, true)
      uniqueClients.push({
        name: appt.client_name,
        phone: appt.client_phone || "Não informado"
      })
    }
  })

  // Encontrar o agendamento mais próximo (futuro e confirmado)
  const getNextAppointment = () => {
    const activeAppts = appointments.filter(a => a.status === 'confirmed')
    if (activeAppts.length === 0) return null
    
    const sorted = [...activeAppts].sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))
    const now = new Date()
    const upcoming = sorted.find(a => new Date(a.appointment_time) > now)
    return upcoming || sorted[0]
  }

  const nextAppt = getNextAppointment()

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-28 lg:pb-12 px-4 md:px-8 relative overflow-hidden lg:pl-[280px]">
      {/* Luzes de gradiente decorativas no fundo */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[180px] pointer-events-none opacity-40"></div>

      {/* Sidebar Responsivo - Pílula Flutuante Dourada */}
      {/* Sidebar Vertical para Telas Grandes (Desktop) */}
      <aside className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 h-[calc(80vh+80px)] w-[200px] bg-gold-gradient rounded-[100px] shadow-gold-lg flex-col justify-between px-4 py-10 z-50 border border-gold-subtle">
        <div className="space-y-8">
          {/* Logo / Título no Sidebar */}
          <div className="flex flex-col items-center border-b border-black/10 pb-6 mt-2">
            <img src="/assets/logo-nova-sem-borda.png" alt="Barbearia Do Vale" className="h-[150px] w-auto object-contain transition-transform duration-300 hover:scale-105" />
          </div>

          {/* Opções */}
          <nav className="space-y-2">
            {sidebarOptions.filter(opt => opt.id !== "configuracoes").map((opt) => {
              const isSelected = activeSection === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActiveSection(opt.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    isSelected 
                      ? "bg-black text-[#d4af37] shadow-md scale-102" 
                      : "text-black/80 hover:bg-black/5 hover:text-black hover:scale-102"
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer do Sidebar */}
        <div className="border-t border-black/10 pt-4 flex flex-col gap-2">
          <div className="text-center">
            <div className="text-[10px] font-bold text-black truncate max-w-[170px] mx-auto">
              {user.name}
            </div>
            <div className="text-[8px] font-extrabold text-black/50 uppercase tracking-widest mt-0.5">
              {user.role === 'admin' ? 'Administrador' : user.role === 'barber' ? 'Barbeiro' : 'Cliente VIP'}
            </div>
          </div>
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveSection("configuracoes")}
              className={`w-[128px] mx-auto py-2 flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 border cursor-pointer hover:scale-102 ${
                activeSection === "configuracoes"
                  ? "bg-black text-[#d4af37] border-black shadow-md"
                  : "bg-black/15 hover:bg-black text-black hover:text-[#d4af37] border-black/5 hover:border-black"
              }`}
            >
              <Settings size={12} /> Configurações
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-[128px] mx-auto mt-1 py-2 flex items-center justify-center gap-1.5 bg-black/15 hover:bg-black text-black hover:text-[#d4af37] text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 border border-black/5 hover:border-black cursor-pointer hover:scale-102"
          >
            <LogOut size={12} /> Sair
          </button>
        </div>
      </aside>

      {/* Navigation Bar Horizontal para Telas Pequenas (Mobile) - Pílula Flutuante Inferior */}
      <aside className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-gold-gradient rounded-full shadow-gold-lg flex items-center justify-around px-4 z-50 border border-gold-subtle">
        {sidebarOptions.map((opt) => {
          const isSelected = activeSection === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setActiveSection(opt.id)}
              className={`p-3 rounded-full transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
                isSelected 
                  ? "bg-black text-[#d4af37] scale-110 shadow-md" 
                  : "text-black/70 hover:text-black"
              }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          );
        })}
      </aside>

      <div className="container mx-auto px-1 max-w-5xl relative z-10 animate-scale-in lg:fixed lg:left-[280px] lg:right-10 lg:top-1/2 lg:-translate-y-1/2 lg:h-[calc(80vh+80px)] lg:w-auto lg:max-w-none lg:overflow-y-auto lg:pr-4">


        {/* Lógica de Renderização de Seções do Sidebar */}
        
        {/* SEÇÃO 1: DASHBOARD */}
        {activeSection === "dashboard" && (
          <div className="space-y-8 animate-scale-in">
            {/* Estatísticas / Grid de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card/40 border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Agendamentos Ativos</span>
                  <span className="text-2xl font-black text-foreground mt-1 block font-display">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </span>
                </div>
              </div>
              
              <div className="bg-card/40 border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                  <Scissors size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Serviços Disponíveis</span>
                  <span className="text-2xl font-black text-foreground mt-1 block font-display">
                    {services.length > 0 ? services.length : 3}
                  </span>
                </div>
              </div>

              <div className="bg-card/40 border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Categoria do Perfil</span>
                  <span className="text-sm font-black text-primary uppercase tracking-wider mt-1 block font-display">
                    {user.role === 'admin' ? 'Administrador' : user.role === 'barber' ? 'Barbeiro' : 'Cliente Gold'}
                  </span>
                </div>
              </div>
            </div>

            {/* Próximo Atendimento Destacado */}
            {nextAppt ? (
              <div className="bg-muted/30 border border-primary/25 rounded-2xl p-6 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 inline-block mb-3">
                      Próximo Agendamento
                    </span>
                    <h3 className="font-bold text-lg text-foreground tracking-wide font-display uppercase">
                      {nextAppt.service_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock size={13} className="text-primary/70" /> {formatDateTime(nextAppt.appointment_time)}</span>
                      <span className="flex items-center gap-1.5"><User size={13} className="text-primary/70" /> {user.role === 'client' ? `Barbeiro: ${nextAppt.barber_name}` : `Cliente: ${nextAppt.client_name}`}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveSection("agenda")}
                    className="px-5 py-2.5 bg-muted border border-border hover:border-primary/40 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer text-foreground"
                  >
                    Ver na Agenda
                  </button>
                </div>
              </div>
            ) : null}

            {/* CTA ou Resumo de Boas vindas específico por perfil */}
            {user.role === 'client' ? (
              <div className="bg-card/40 border border-gold-subtle rounded-2xl p-8 shadow-elevated text-center relative overflow-hidden group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                <h3 className="font-rye text-2xl md:text-3xl text-primary mb-3">Pronto para dar aquele trato no visual?</h3>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6 leading-relaxed">
                  Agende seu horário online em poucos cliques. Escolha o serviço, seu barbeiro favorito e o melhor horário para você.
                </p>
                <button
                  onClick={() => setActiveSection("agenda")}
                  className="inline-flex items-center justify-center gap-2 bg-gold-gradient text-primary-foreground font-bold h-14 rounded-xl px-8 text-base shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                >
                  <CalendarDays size={18} /> Agendar Agora
                </button>
              </div>
            ) : (
              <div className="bg-card/40 border border-gold-subtle rounded-2xl p-8 shadow-elevated relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/3 rounded-full blur-2xl pointer-events-none"></div>
                <h3 className="font-rye text-xl md:text-2xl text-primary mb-3">Boas-vindas à Área de Profissionais</h3>
                <p className="text-muted-foreground text-sm max-w-2xl mb-6 leading-relaxed">
                  Use o menu lateral flutuante para gerenciar os seus atendimentos, gerenciar as contas de usuários (Administrador) ou visualizar os serviços e equipe de barbeiros do Vale.
                </p>
                <button
                  onClick={() => setActiveSection("agenda")}
                  className="inline-flex items-center justify-center gap-2 bg-gold-gradient text-primary-foreground font-bold h-12 rounded-xl px-6 text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                >
                  <CalendarDays size={16} /> Ver Agenda de Atendimentos
                </button>
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO 2: AGENDA */}
        {activeSection === "agenda" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-scale-in">
            {/* Lado Esquerdo/Centro: Fluxo de Reserva & Listagem */}
            <div className="lg:col-span-2 space-y-8">
              {/* Se for CLIENTE: Mostra formulário de agendamento */}
              {user.role === 'client' && (
                <div className="glass-card border border-gold-subtle rounded-2xl p-6 md:p-8 shadow-elevated relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/3 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2.5">
                    <Plus className="text-primary w-5 h-5" /> Novo Agendamento
                  </h2>

                  {error && (
                    <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6 animate-scale-in">
                      <AlertTriangle size={18} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-4 mb-6 animate-scale-in">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Indicador de Etapas */}
                  <div className="flex items-center justify-between mb-10 max-w-md mx-auto relative select-none px-4">
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-border/50 -translate-y-1/2 z-0"></div>
                    <div 
                      className="absolute top-1/2 left-4 h-0.5 bg-gradient-to-r from-primary to-accent -translate-y-1/2 z-0 transition-all duration-500 ease-out"
                      style={{ width: `${((bookingStep - 1) / 2) * 88}%` }}
                    ></div>

                    {[1, 2, 3].map((s) => {
                      const isCurrent = bookingStep === s;
                      const isCompleted = bookingStep > s;
                      return (
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
                          className={`w-11 h-11 rounded-full flex flex-col items-center justify-center font-display font-bold text-xs z-10 transition-all duration-300 cursor-pointer ${
                            isCurrent
                              ? "bg-gold-gradient text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-gold"
                              : isCompleted
                              ? "bg-primary text-primary-foreground border border-primary"
                              : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          <span>{s}</span>
                          <span className="absolute mt-14 text-[9px] uppercase tracking-wider font-bold text-muted-foreground whitespace-nowrap hidden sm:block">
                            {s === 1 ? 'Contato' : s === 2 ? 'Serviços' : 'Agendar'}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <form onSubmit={handleCreateAppointment} className="space-y-6 mt-4">
                    {/* ETAPA 1 */}
                    {bookingStep === 1 && (
                      <div className="space-y-6 animate-scale-in">
                        <h3 className="font-display font-bold text-lg text-foreground border-b border-border/80 pb-2 text-center tracking-wide uppercase text-primary">
                          Seus dados para Contato
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</label>
                            <input
                              type="text"
                              required
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              placeholder="Digite seu nome completo"
                              className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 px-4 text-foreground focus:outline-none transition-all duration-300 text-sm focus:shadow-gold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone / Whatsapp</label>
                            <input
                              type="tel"
                              required
                              value={clientPhone}
                              onChange={(e) => setClientPhone(formatPhoneNumber(e.target.value))}
                              maxLength={15}
                              placeholder="Ex: (34) 98853-7720"
                              className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3.5 px-4 text-foreground focus:outline-none transition-all duration-300 text-sm focus:shadow-gold"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!clientName.trim() || !clientPhone.trim()}
                          onClick={() => setBookingStep(2)}
                          className="w-full inline-flex items-center justify-center gap-2.5 bg-gold-gradient text-primary-foreground font-bold h-14 rounded-xl text-base shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          Avançar para Barbeiro e Serviços
                        </button>
                      </div>
                    )}

                    {/* ETAPA 2 */}
                    {bookingStep === 2 && (
                      <div className="space-y-6 animate-scale-in">
                        <h3 className="font-display font-bold text-lg text-foreground border-b border-border/80 pb-2 text-center tracking-wide uppercase text-primary">
                          Profissional e Serviços
                        </h3>
                        
                        {/* Selecionar Barbeiro */}
                        <div className="space-y-4 text-center">
                          <label className="text-xs font-bold uppercase tracking-[0.2em] text-primary block">Selecione o Barbeiro</label>
                          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 py-3">
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
                                  className="bg-transparent border-none p-0 cursor-pointer focus:outline-none transition-all group flex flex-col items-center gap-2"
                                  title={barb.name}
                                >
                                  <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 transition-all duration-500 shadow-md ${
                                    isSelected 
                                      ? "border-primary ring-4 ring-primary/20 scale-115 shadow-gold" 
                                      : "border-border/80 group-hover:border-primary/60 group-hover:scale-105"
                                  }`}>
                                    <img 
                                      src={barberPhoto} 
                                      alt={barb.name} 
                                      className="w-full h-full object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                        <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">✓ Sel</div>
                                      </div>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                                    isSelected ? "text-primary font-extrabold" : "text-muted-foreground group-hover:text-foreground"
                                  }`}>
                                    {barb.name.split(" ")[0]} {barb.name.split(" ")[1] || ""}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Selecionar Serviços (Múltiplo) */}
                        <div className="space-y-4">
                          <label className="text-xs font-bold uppercase tracking-[0.2em] text-primary block text-center">Serviços Desejados (Pode marcar mais de um)</label>
                          <div className="space-y-3">
                            {services.map(srv => {
                              const isSelected = selectedServices.includes(srv.id)
                              const getServiceIcon = (id) => {
                                if (id.includes('combo')) return <Scissors size={18} className="text-primary" />
                                if (id.includes('barba') || id.includes('barbaterapia')) return <Flame size={18} className="text-primary" />
                                return <Sparkles size={18} className="text-primary" />
                              }
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
                                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                                    isSelected
                                      ? "border-primary bg-primary/8 shadow-md"
                                      : "border-border bg-muted/30 text-foreground hover:border-primary/30 hover:bg-muted/55"
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                      isSelected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background"
                                    }`}>
                                      {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-background/80 border border-border/80 rounded-lg shrink-0">
                                        {getServiceIcon(srv.id)}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm tracking-wide">{srv.name}</p>
                                        <p className="text-xs text-muted-foreground leading-normal mt-0.5">{srv.description || "Procedimento Do Vale de alto padrão"}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="font-display font-black text-primary text-sm md:text-base pl-4 border-l border-border/60 shrink-0">
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
                            className="flex-1 border border-border hover:bg-muted rounded-xl h-14 font-medium transition-colors cursor-pointer text-sm"
                          >
                            Voltar
                          </button>
                          <button
                            type="button"
                            disabled={!selectedBarber || selectedServices.length === 0}
                            onClick={() => setBookingStep(3)}
                            className="flex-1 bg-gold-gradient text-primary-foreground font-bold h-14 rounded-xl text-base shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            Avançar para Data e Hora
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ETAPA 3 */}
                    {bookingStep === 3 && (
                      <div className="space-y-6 animate-scale-in">
                        <h3 className="font-display font-bold text-lg text-foreground border-b border-border/80 pb-2 text-center tracking-wide uppercase text-primary">
                          Escolha a Data e Horário
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                          {/* Calendário */}
                          <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-primary block text-center">Selecione o Dia</label>
                            <div className="p-4 bg-muted/20 border border-border rounded-2xl shadow-sm">
                              {renderCalendar()}
                            </div>
                          </div>

                          {/* Horários */}
                          <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-[0.2em] text-primary block text-center">Horários Disponíveis</label>
                            
                            {!selectedDate ? (
                              <div className="p-6 text-center border border-dashed border-border/70 rounded-2xl text-muted-foreground text-sm bg-muted/10">
                                Por favor, selecione um dia no calendário ao lado para ver os horários.
                              </div>
                            ) : getTimeSlots(selectedDate).length === 0 ? (
                              <div className="p-6 text-center border border-dashed border-destructive/40 rounded-2xl text-destructive text-sm font-semibold bg-destructive/5 animate-pulse">
                                Barbearia fechada neste dia (Domingo). Por favor, selecione outro dia.
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
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
                                          ? "bg-primary border-primary text-primary-foreground shadow-gold scale-105 font-black" 
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

                        <div className="flex gap-4 pt-4 border-t border-border/80">
                          <button
                            type="button"
                            onClick={() => setBookingStep(2)}
                            className="flex-1 border border-border hover:bg-muted rounded-xl h-14 font-medium transition-colors cursor-pointer text-sm"
                          >
                            Voltar
                          </button>
                          <button
                            type="submit"
                            disabled={submitLoading || !selectedDate || !selectedTime}
                            className="flex-1 bg-gold-gradient text-primary-foreground font-bold h-14 rounded-xl text-base shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-2xl pointer-events-none"></div>
                
                <h2 className="text-lg font-bold font-display mb-6 flex items-center gap-2.5 border-b border-border/80 pb-4">
                  <CalendarDays className="text-primary w-5 h-5" /> 
                  {user.role === 'client' ? 'Seus Agendamentos' : 'Agenda Completa de Atendimentos'}
                </h2>

                {appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                    <CalendarIcon size={44} className="stroke-1 mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-medium">Nenhum agendamento cadastrado no momento.</p>
                    <p className="text-xs mt-1 text-muted-foreground/60">Agende um novo horário no formulário acima!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                    {appointments.map((appt) => {
                      const isCancelled = appt.status === 'cancelled';
                      return (
                        <div 
                          key={appt.id} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border transition-all duration-300 ${
                            isCancelled 
                              ? "bg-muted/10 border-border/40 opacity-55" 
                              : "bg-muted/40 border-border hover:border-primary/40 shadow-sm"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <div className="p-1.5 bg-primary/10 rounded-lg text-primary border border-primary/20 shrink-0">
                                <Scissors size={14} />
                              </div>
                              <span className="text-sm font-bold font-display uppercase tracking-wide">{appt.service_name}</span>
                              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                                appt.status === 'confirmed' 
                                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              }`}>
                                {appt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock size={13} className="text-primary/70 shrink-0" />
                                <span>{formatDateTime(appt.appointment_time)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User size={13} className="text-primary/70 shrink-0" />
                                <span>
                                  {user.role === 'client' ? `Barbeiro: ${appt.barber_name}` : `Cliente: ${appt.client_name}`}
                                </span>
                              </div>
                              {user.role !== 'client' && (
                                <div className="flex items-center gap-2 col-span-2 mt-1 border-t border-border/40 pt-1.5">
                                  <span className="font-semibold text-foreground/85">WhatsApp:</span> 
                                  <span className="text-foreground tracking-wide font-medium">{appt.client_phone || "Não cadastrado"}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {appt.status === 'confirmed' && (
                            <button
                              onClick={() => handleCancelAppointment(appt.id)}
                              className="mt-4 sm:mt-0 px-4 py-2 hover:bg-destructive/15 border border-destructive/20 hover:border-destructive/40 text-destructive text-xs font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-center"
                            >
                              Cancelar Horário
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Direita: Info & Destaques */}
            <div className="space-y-8">
              <div className="glass-card border border-gold-subtle rounded-2xl p-6 shadow-elevated relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/2 rounded-full blur-2xl pointer-events-none"></div>
                
                <h3 className="text-lg font-bold font-display mb-5 text-primary border-b border-border/80 pb-3 flex items-center gap-2">
                  <Sparkles size={18} className="fill-primary/10" /> Clube Do Vale
                </h3>
                
                <div className="space-y-5 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm tracking-wide">Confirmação Imediata</p>
                      <p className="text-xs leading-normal mt-0.5">Assim que realizar o agendamento, nosso sistema envia os detalhes da reserva para o seu WhatsApp cadastrado.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm tracking-wide">Lembrete Inteligente</p>
                      <p className="text-xs leading-normal mt-0.5">Enviaremos uma mensagem automática de lembrete 2 horas antes do seu horário marcado, para que você não perca o atendimento.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm tracking-wide">Nossa Localização</p>
                      <p className="text-xs leading-normal mt-0.5">{shopAddress}.<br />Estacionamento fácil e ambiente climatizado com café de cortesia.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 3: CLIENTES */}
        {activeSection === "clientes" && (
          <div className="space-y-6 animate-scale-in">
            {(user.role === "admin" || user.role === "barber") ? (
              <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-border/80 pb-6">
                  <div>
                    <h2 className="text-xl font-bold font-display flex items-center gap-2.5">
                      <Users className="text-primary w-5 h-5" /> Clientes
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gerenciamento completo das fichas cadastrais de clientes da barbearia.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetCustomerForm()
                      setIsCustomerModalOpen(true)
                    }}
                    className="inline-flex items-center gap-2 bg-gold-gradient text-primary-foreground font-bold h-11 px-5 rounded-xl text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    <Plus size={16} /> Novo Cliente
                  </button>
                </div>

                {/* Filtro/Pesquisa */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    placeholder="Buscar cliente por nome ou celular..."
                    className="w-full bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none transition-all duration-300"
                  />
                </div>

                {customerError && (
                  <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{customerError}</span>
                  </div>
                )}

                {customerSuccess && (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-4 mb-6 animate-scale-in">
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span>{customerSuccess}</span>
                  </div>
                )}

                {customersLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-muted-foreground">Carregando fichas de clientes...</span>
                  </div>
                ) : (
                  <>
                    {customerList.filter(c => 
                      (c.name && c.name.toLowerCase().includes(customerFilter.toLowerCase())) ||
                      (c.phone && c.phone.includes(customerFilter))
                    ).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                        <Users size={40} className="stroke-1 mb-3 text-muted-foreground/30" />
                        <p className="text-sm font-medium">Nenhum cliente cadastrado ou encontrado.</p>
                        <p className="text-xs mt-1 text-muted-foreground/60">Clique em "Novo Cliente" para adicionar.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customerList
                          .filter(c => 
                            (c.name && c.name.toLowerCase().includes(customerFilter.toLowerCase())) ||
                            (c.phone && c.phone.includes(customerFilter))
                          )
                          .map((c) => (
                            <div key={c.id} className="bg-muted/30 border border-border/80 rounded-2xl p-5 hover:border-primary/45 transition-all duration-300 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-full overflow-hidden border border-gold-subtle shadow-sm bg-background/50 flex items-center justify-center shrink-0">
                                    {c.photo ? (
                                      <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <User size={24} className="text-muted-foreground/60" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm tracking-wide text-foreground leading-snug">{c.name}</h4>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Cadastrado em {formatDateTime(c.created_at || new Date().toISOString()).split(" ")[0]}</p>
                                  </div>
                                </div>

                                <div className="space-y-2 text-xs text-muted-foreground border-t border-border/40 pt-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground/80">Celular:</span>
                                    <a 
                                      href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline hover:text-accent font-medium tracking-wide flex items-center gap-1"
                                    >
                                      {c.phone}
                                    </a>
                                  </div>
                                  {c.birth_date && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-foreground/80">Nascimento:</span>
                                      <span className="text-foreground/90">{formatBirthDate(c.birth_date)}</span>
                                    </div>
                                  )}
                                  {c.address && (
                                    <div className="flex items-start gap-2">
                                      <span className="font-semibold text-foreground/80 shrink-0">Endereço:</span>
                                      <span className="text-foreground/90 leading-tight">{c.address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2.5 border-t border-border/40 pt-4 mt-4">
                                <button
                                  type="button"
                                  onClick={() => handleEditCustomerClick(c)}
                                  className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-background border border-border hover:border-primary/40 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                                >
                                  <Pencil size={12} /> Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomer(c.id)}
                                  className="flex-1 py-2 flex items-center justify-center gap-1.5 hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/40 text-destructive text-xs font-bold rounded-xl transition-all cursor-pointer"
                                >
                                  <Trash2 size={12} /> Excluir
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="bg-card/45 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated relative overflow-hidden">
                <h2 className="text-xl font-bold font-display mb-4 text-primary flex items-center gap-2">
                  <Sparkles size={20} className="text-primary fill-primary/10 animate-pulse" /> Programa de Fidelidade Do Vale
                </h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Bem-vindo ao nosso clube de vantagens! A cada atendimento finalizado na Barbearia Do Vale, você acumula pontos para trocar por serviços e produtos exclusivos.
                </p>
                
                {/* Medidor de progresso fictício */}
                <div className="bg-background/40 border border-border p-6 rounded-xl mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progresso do Próximo Corte Grátis</span>
                    <span className="text-sm font-bold text-primary">{appointments.filter(a => a.status === 'confirmed').length % 10}/10 Atendimentos</span>
                  </div>
                  <div className="w-full bg-muted h-3 rounded-full overflow-hidden border border-border">
                    <div 
                      className="bg-gold-gradient h-full rounded-full transition-all duration-500 shadow-gold"
                      style={{ width: `${(appointments.filter(a => a.status === 'confirmed').length % 10) * 10}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    * A cada 10 atendimentos concluídos, você ganha 1 corte de cabelo ou barba inteiramente grátis!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-background/20 border border-border/60 p-5 rounded-xl">
                    <h4 className="font-bold text-sm text-foreground mb-2">Dados do Perfil</h4>
                    <p className="text-xs text-muted-foreground">Nome: <span className="text-foreground font-semibold">{user.name}</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Contato: <span className="text-foreground font-semibold">{user.phone || user.email}</span></p>
                  </div>
                  <div className="bg-background/20 border border-border/60 p-5 rounded-xl flex items-center justify-center text-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">Categoria de Cliente</p>
                      <p className="text-xl font-black text-foreground mt-1 font-display tracking-wider">CLIENTE GOLD</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO 4: SERVIÇOS */}
        {activeSection === "servicos" && (
          <div className="space-y-6 animate-scale-in">
            <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated">
              <h2 className="text-xl font-bold font-display mb-2 flex items-center gap-2">
                <Scissors className="text-primary w-5 h-5" /> Nosso Catálogo de Serviços
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Confira nossos procedimentos, tempos de execução e valores. Serviços executados sob medida com padrão de excelência.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(services.length > 0 ? services : [
                  { id: "srv-corte", name: "Corte de Cabelo", price: 55, duration_minutes: 30, description: "Corte clássico com acabamento perfeito realizado pelos nossos profissionais de ponta." },
                  { id: "srv-barba", name: "Barba Completa", price: 45, duration_minutes: 30, description: "Barboterapia completa com toalha quente, óleos essenciais e massagem facial." },
                  { id: "srv-combo", name: "Combo Do Vale (Corte + Barba)", price: 90, duration_minutes: 60, description: "A experiência completa da Barbearia Do Vale com desconto exclusivo." }
                ]).map((srv) => {
                  const getServiceIcon = (id) => {
                    if (id.includes('combo')) return <Scissors size={20} className="text-primary" />
                    if (id.includes('barba')) return <Flame size={20} className="text-primary" />
                    return <Sparkles size={20} className="text-primary" />
                  }
                  return (
                    <div key={srv.id} className="bg-muted/30 border border-border/70 rounded-2xl p-6 hover:border-primary/45 transition-all duration-300 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                      <div>
                        <div className="w-12 h-12 bg-background border border-border/60 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform duration-300">
                          {getServiceIcon(srv.id)}
                        </div>
                        <h4 className="font-bold text-base tracking-wide text-foreground mb-2">{srv.name}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-6">{srv.description || "Procedimento Do Vale de alto padrão"}</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/40 pt-4">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock size={13} /> {srv.duration_minutes} min</span>
                        <span className="font-display font-black text-primary text-base">R$ {srv.price.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 5: EQUIPE */}
        {activeSection === "equipe" && (
          <div className="space-y-6 animate-scale-in">
            {barberSuccess && (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-4 shadow-sm animate-fade-in">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{barberSuccess}</span>
              </div>
            )}

            {barberError && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 shadow-sm animate-fade-in">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{barberError}</span>
              </div>
            )}

            <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold font-display mb-2 flex items-center gap-2">
                    <User className="text-primary w-5 h-5" /> Profissionais
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Profissionais qualificados com ampla experiência no mercado, prontos para entregar o melhor visual para você.
                  </p>
                </div>
                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      resetBarberForm()
                      setIsBarberModalOpen(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-gradient text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    <Plus size={14} /> Novo Profissional
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                {barbers.map((barb, index) => {
                  const barberPhoto = barb.photo || (
                    index === 0 ? "/assets/foto_marcio.png" :
                    index === 1 ? "/assets/foto_lucas.png" :
                    "/assets/foto_neto.png"
                  )
                  return (
                    <div key={barb.id} className="w-full max-w-[280px] bg-muted/20 border border-border/85 rounded-2xl p-6 shadow-md hover:border-primary/40 transition-all duration-300 text-center flex flex-col items-center group relative">
                      <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-border/80 group-hover:border-primary/50 transition-colors duration-300 shadow-md mb-4 bg-background">
                        <img src={barberPhoto} alt={barb.name} className="w-full h-full object-cover object-top scale-102 group-hover:scale-108 transition-transform duration-500" />
                      </div>
                      <h4 className="font-bold text-sm uppercase tracking-wide text-foreground mt-2">{barb.name}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">{barb.specialty || "Especialista Do Vale"}</span>
                      
                      <div className="space-y-1.5 text-left w-full text-xs text-muted-foreground border-t border-border/40 pt-4 mt-4 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground/80">WhatsApp:</span>
                          <a 
                            href={`https://wa.me/55${barb.phone.replace(/\D/g, "")}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline hover:text-accent font-medium tracking-wide"
                          >
                            {barb.phone}
                          </a>
                        </div>
                        {barb.hired_at && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground/80">Profissional desde:</span>
                            <span className="text-foreground/90">{formatBirthDate(barb.hired_at)}</span>
                          </div>
                        )}
                      </div>

                      {user.role === 'admin' && (
                        <div className="flex gap-2.5 w-full border-t border-border/40 pt-4 mt-4">
                          <button
                            type="button"
                            onClick={() => handleEditBarberClick(barb)}
                            className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-background border border-border hover:border-primary/40 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            <Pencil size={12} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBarber(barb.id)}
                            className="p-2 flex items-center justify-center bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground text-xs rounded-xl transition-all cursor-pointer border border-destructive/20 hover:border-destructive"
                            title="Excluir Profissional"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 6: CONFIGURAÇÕES (Admin only) */}
        {activeSection === "configuracoes" && user.role === "admin" && (
          <div className="space-y-6 animate-scale-in">
            <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-2xl pointer-events-none"></div>
              
              <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2.5 border-b border-border/80 pb-4">
                <Settings className="text-primary w-5 h-5" /> Configurações do Sistema
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Lado Esquerdo: Controle de Permissões (User List) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <ShieldAlert size={16} /> Usuários e Permissões
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Gerencie os perfis de acesso dos usuários cadastrados na barbearia.
                  </p>

                  {permissionsError && (
                    <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>{permissionsError}</span>
                    </div>
                  )}

                  {permissionsSuccess && (
                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl p-3 animate-scale-in">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>{permissionsSuccess}</span>
                    </div>
                  )}

                  {usersLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] text-muted-foreground">Carregando usuários...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border/80 bg-background/20 max-h-[350px] overflow-y-auto pr-1">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border/80 text-muted-foreground uppercase font-bold tracking-wider bg-background/45 sticky top-0 z-10">
                            <th className="py-3 px-4">Nome</th>
                            <th className="py-3 px-4">Função</th>
                            <th className="py-3 px-4 text-center">Alterar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userList.map((usr) => (
                            <tr 
                              key={usr.id} 
                              className={`border-b border-border/40 hover:bg-muted/5 transition-colors ${
                                usr.id === user.id ? "bg-primary/5" : ""
                              }`}
                            >
                              <td className="py-3 px-4 font-semibold">
                                <div className="truncate max-w-[150px]" title={usr.name}>{usr.name}</div>
                                <div className="text-[9px] text-muted-foreground font-normal mt-0.5">{usr.phone || usr.email}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                  usr.role === 'admin' 
                                    ? "bg-primary/10 text-primary border-primary/20" 
                                    : usr.role === 'barber'
                                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                      : "bg-muted text-muted-foreground border-border"
                                }`}>
                                  {usr.role === 'admin' ? 'Admin' : usr.role === 'barber' ? 'Barbeiro' : 'Cliente'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <select
                                  disabled={usr.id === user.id}
                                  value={usr.role}
                                  onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                                  className="bg-background border border-border focus:border-primary rounded-lg py-1 px-2 text-[10px] focus:outline-none transition-all disabled:opacity-45 cursor-pointer"
                                >
                                  <option value="client">Cliente</option>
                                  <option value="barber">Barbeiro</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Lado Direito: Configurações Gerais */}
                <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-border/60 pt-6 lg:pt-0 lg:pl-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Settings size={16} /> Configurações Gerais
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Configure os dados principais da barbearia apresentados no dashboard do cliente.
                  </p>

                  {settingsSuccess && (
                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl p-3 animate-scale-in">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome da Barbearia</label>
                      <input
                        type="text"
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="Ex: Barbearia Do Vale"
                        className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endereço Principal</label>
                      <input
                        type="text"
                        required
                        value={shopAddress}
                        onChange={(e) => setShopAddress(e.target.value)}
                        placeholder="Endereço da Barbearia"
                        className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone de Contato</label>
                      <input
                        type="text"
                        required
                        value={shopPhone}
                        onChange={(e) => setShopPhone(e.target.value)}
                        placeholder="Ex: (34) 99868-4036"
                        className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Horários de Funcionamento</label>
                      <input
                        type="text"
                        required
                        value={shopOpenHours}
                        onChange={(e) => setShopOpenHours(e.target.value)}
                        placeholder="Ex: Segunda a Sábado das 08:00 às 19:00"
                        className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gold-gradient text-primary-foreground font-bold h-11 rounded-xl text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        )}
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

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE PROFISSIONAIS */}
      {isBarberModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card w-full max-w-lg border border-gold-subtle rounded-2xl p-6 md:p-8 shadow-elevated relative animate-scale-in">
            <h3 className="text-xl font-bold font-display mb-6 text-primary flex items-center gap-2">
              {editingBarberId ? <Pencil size={20} /> : <Plus size={20} />}
              {editingBarberId ? "Editar Ficha de Profissional" : "Cadastrar Novo Profissional"}
            </h3>

            {barberError && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{barberError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBarber} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={barberName}
                    onChange={(e) => setBarberName(e.target.value)}
                    placeholder="Ex: Paulo Tillmann"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Celular / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={barberPhone}
                    onChange={handleBarberPhoneChange}
                    placeholder="Ex: (34) 98821-8498"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data de Nascimento</label>
                  <input
                    type="date"
                    value={barberBirthDate}
                    onChange={(e) => setBarberBirthDate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Especialidade (Especialista em)</label>
                  <input
                    type="text"
                    value={barberSpecialty}
                    onChange={(e) => setBarberSpecialty(e.target.value)}
                    placeholder="Ex: Cortes clássicos"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Profissional Desde (Data)</label>
                  <input
                    type="date"
                    value={barberHiredAt}
                    onChange={(e) => setBarberHiredAt(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Foto do Profissional</label>
                  <div className="flex items-center gap-4 bg-background/40 border border-border p-4 rounded-xl">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gold-subtle shadow-sm bg-background/50 flex items-center justify-center shrink-0">
                      {barberPhoto ? (
                        <img src={barberPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label 
                        htmlFor="barber-photo-upload-input" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl border border-border cursor-pointer transition-all hover:scale-102"
                      >
                        <Upload size={14} /> Selecionar Foto
                      </label>
                      <input 
                        type="file" 
                        id="barber-photo-upload-input" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleBarberPhotoUpload} 
                      />
                      <p className="text-[9px] text-muted-foreground leading-normal">Selecione uma imagem (PNG, JPG) de até 2MB para salvar no perfil.</p>
                      {barberPhoto && (
                        <button 
                          type="button" 
                          onClick={() => setBarberPhoto("")}
                          className="text-[10px] text-destructive hover:underline font-bold block"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border/40 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsBarberModalOpen(false)
                    resetBarberForm()
                  }}
                  className="flex-1 border border-border hover:bg-muted rounded-xl h-12 font-medium transition-colors cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={barberSubmitting}
                  className="flex-1 bg-gold-gradient text-primary-foreground font-bold h-12 rounded-xl text-sm uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  {barberSubmitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    "Salvar Ficha"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CLIENTES */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card w-full max-w-lg border border-gold-subtle rounded-2xl p-6 md:p-8 shadow-elevated relative animate-scale-in">
            <h3 className="text-xl font-bold font-display mb-6 text-primary flex items-center gap-2">
              {editingCustomerId ? <Pencil size={20} /> : <Plus size={20} />}
              {editingCustomerId ? "Editar Ficha de Cliente" : "Cadastrar Novo Cliente"}
            </h3>

            {customerError && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{customerError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Paulo Tillmann"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Celular / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={handleCustomerPhoneChange}
                    placeholder="Ex: (34) 98821-8498"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data de Nascimento</label>
                  <input
                    type="date"
                    value={customerBirthDate}
                    onChange={(e) => setCustomerBirthDate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endereço Completo</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Ex: Rua das Flores, 123, Centro, Araguari/MG"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Foto do Cliente</label>
                  <div className="flex items-center gap-4 bg-background/40 border border-border p-4 rounded-xl">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gold-subtle shadow-sm bg-background/50 flex items-center justify-center shrink-0">
                      {customerPhoto ? (
                        <img src={customerPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label 
                        htmlFor="photo-upload-input" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl border border-border cursor-pointer transition-all hover:scale-102"
                      >
                        <Upload size={14} /> Selecionar Foto
                      </label>
                      <input 
                        type="file" 
                        id="photo-upload-input" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoUpload} 
                      />
                      <p className="text-[9px] text-muted-foreground leading-normal">Selecione uma imagem (PNG, JPG) de até 2MB para salvar no perfil.</p>
                      {customerPhoto && (
                        <button 
                          type="button" 
                          onClick={() => setCustomerPhoto("")}
                          className="text-[10px] text-destructive hover:underline font-bold block"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border/40 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerModalOpen(false)
                    resetCustomerForm()
                  }}
                  className="flex-1 border border-border hover:bg-muted rounded-xl h-12 font-medium transition-colors cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={customerSubmitting}
                  className="flex-1 bg-gold-gradient text-primary-foreground font-bold h-12 rounded-xl text-sm uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  {customerSubmitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    "Salvar Ficha"
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
