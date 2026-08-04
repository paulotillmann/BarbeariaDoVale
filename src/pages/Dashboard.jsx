import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Scissors,
  Users,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Check,
  Percent,
  Calendar,
  Sparkles
} from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"
import {
  FinancialTrendChart,
  BarberPerformanceChart,
  ServicesDistributionChart,
  StatusDistributionChart
} from "../components/DashboardCharts.jsx"

function formatCurrency(val) {
  return (Number(val) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

function formatDateBR(dateTimeStr) {
  if (!dateTimeStr) return "—"
  const clean = dateTimeStr.replace("T", " ")
  const parts = clean.split(" ")
  const datePart = parts[0]
  const timePart = parts[1] || ""

  if (!datePart) return dateTimeStr

  const dateSplit = datePart.split("-")
  if (dateSplit.length === 3) {
    const formattedDate = `${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]}`
    const timeFormatted = timePart ? timePart.slice(0, 5) : ""
    return timeFormatted ? `${formattedDate} ${timeFormatted}` : formattedDate
  }
  return dateTimeStr
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [caixaTransactions, setCaixaTransactions] = useState([])
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  // Filtros Globais: Período e Barbeiro
  const [periodFilter, setPeriodFilter] = useState("month") // 'month' (padrão), 'today', 'week', 'custom', 'all'
  const [selectedBarberFilter, setSelectedBarberFilter] = useState("all") // 'all' ou id do barbeiro
  const [isBarberDropdownOpen, setIsBarberDropdownOpen] = useState(false)
  const barberDropdownRef = useRef(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const loadAllData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const headers = { Authorization: `Bearer ${token}` }

      const [apptRes, caixaRes, barbRes, srvRes] = await Promise.all([
        fetch(`${API_URL}/api/appointments`, { headers }),
        fetch(`${API_URL}/api/caixa`, { headers }),
        fetch(`${API_URL}/api/barbers`),
        fetch(`${API_URL}/api/services`)
      ])

      if (apptRes.ok) {
        const apptData = await apptRes.json()
        setAppointments(apptData || [])
      }

      if (caixaRes.ok) {
        const caixaData = await caixaRes.json()
        setCaixaTransactions(caixaData.transactions || [])
      }

      if (barbRes.ok) {
        const barbData = await barbRes.json()
        setBarbers(barbData || [])
      }

      if (srvRes.ok) {
        const srvData = await srvRes.json()
        setServices(srvData || [])
      }
    } catch (err) {
      console.error("Erro ao carregar dados do Dashboard:", err)
      setError("Falha ao carregar métricas da dashboard.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    loadAllData()
  }, [user, navigate, loadAllData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllData()
    setRefreshing(false)
  }

  // Fechar dropdown de barbeiros ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (barberDropdownRef.current && !barberDropdownRef.current.contains(event.target)) {
        setIsBarberDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ----------------------------------------------------
  // FILTRAGEM E CÁLCULO DAS MÉTRICAS
  // ----------------------------------------------------

  // Obter barbeiro selecionado
  const selectedBarberObj = useMemo(() => {
    if (selectedBarberFilter === "all") return null
    return barbers.find((b) => String(b.id) === String(selectedBarberFilter))
  }, [barbers, selectedBarberFilter])

  // Agendamentos filtrados por Período e Barbeiro
  const filteredAppointments = useMemo(() => {
    const now = new Date()
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

    return appointments.filter((a) => {
      // 1. Filtro por Barbeiro
      if (selectedBarberFilter !== "all") {
        const barbNameClean = selectedBarberObj ? selectedBarberObj.name.trim().toLowerCase() : ""
        const matchesId = a.barber_id && String(a.barber_id) === String(selectedBarberFilter)
        const matchesName = barbNameClean && a.barber_name && a.barber_name.trim().toLowerCase().includes(barbNameClean)
        if (!matchesId && !matchesName) return false
      }

      // 2. Filtro por Período
      if (!a.appointment_time) return true
      const datePart = a.appointment_time.split("T")[0]

      if (periodFilter === "today") {
        return datePart === todayStr
      } else if (periodFilter === "week") {
        const d = new Date(datePart + "T00:00:00")
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24)
        return diffDays >= 0 && diffDays <= 7
      } else if (periodFilter === "month") {
        const currentMonth = todayStr.slice(0, 7)
        const d = new Date(datePart + "T00:00:00")
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24)
        return datePart.startsWith(currentMonth) || (diffDays >= 0 && diffDays <= 31)
      } else if (periodFilter === "custom") {
        if (startDate && datePart < startDate) return false
        if (endDate && datePart > endDate) return false
        return true
      }

      return true
    })
  }, [appointments, selectedBarberFilter, selectedBarberObj, periodFilter, startDate, endDate])

  // Transações de Caixa filtradas por Período e Barbeiro
  const filteredCaixa = useMemo(() => {
    const now = new Date()
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

    return caixaTransactions.filter((t) => {
      // 1. Filtro por Barbeiro
      if (selectedBarberFilter !== "all") {
        const barbNameClean = selectedBarberObj ? selectedBarberObj.name.trim().toLowerCase() : ""
        const matchesId = t.barber_id && String(t.barber_id) === String(selectedBarberFilter)
        const matchesName = barbNameClean && t.barber_name && t.barber_name.trim().toLowerCase().includes(barbNameClean)
        if (!matchesId && !matchesName) return false
      }

      // 2. Filtro por Período
      if (!t.date) return true
      const datePart = t.date.split(" ")[0]

      if (periodFilter === "today") {
        return datePart === todayStr
      } else if (periodFilter === "week") {
        const d = new Date(datePart + "T00:00:00")
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24)
        return diffDays >= 0 && diffDays <= 7
      } else if (periodFilter === "month") {
        const currentMonth = todayStr.slice(0, 7)
        const d = new Date(datePart + "T00:00:00")
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24)
        return datePart.startsWith(currentMonth) || (diffDays >= 0 && diffDays <= 31)
      } else if (periodFilter === "custom") {
        if (startDate && datePart < startDate) return false
        if (endDate && datePart > endDate) return false
        return true
      }

      return true
    })
  }, [caixaTransactions, selectedBarberFilter, selectedBarberObj, periodFilter, startDate, endDate])

  // KPI Calculations
  const kpiData = useMemo(() => {
    let totalReceitas = 0
    let totalDespesas = 0

    filteredCaixa.forEach((t) => {
      const val = Number(t.amount) || 0
      if (t.type === "receita") totalReceitas += val
      else if (t.type === "despesa") totalDespesas += val
    })

    const totalAgendamentos = filteredAppointments.length
    const concluidos = filteredAppointments.filter((a) => a.status === "completed" || a.status === "confirmed").length
    const cancelados = filteredAppointments.filter((a) => a.status === "cancelled").length
    const ausentes = filteredAppointments.filter((a) => a.status === "absent").length

    const lucroLiquido = totalReceitas - totalDespesas
    const ticketMedio = concluidos > 0 ? totalReceitas / concluidos : 0
    const taxaEfetividade = totalAgendamentos > 0 ? Math.round((concluidos / totalAgendamentos) * 100) : 100

    return {
      totalReceitas,
      totalDespesas,
      lucroLiquido,
      ticketMedio,
      totalAgendamentos,
      concluidos,
      cancelados,
      ausentes,
      taxaEfetividade
    }
  }, [filteredCaixa, filteredAppointments])

  // 1. Dados para o Gráfico de Fluxo Financeiro (Barras Empilhadas por Barbeiro por dia)
  const financialTrendData = useMemo(() => {
    const daysMap = {}

    // Lista dos nomes dos barbeiros conhecidos
    const barberNamesSet = new Set(barbers.map((b) => b.name))

    // Processar agendamentos confirmados/concluídos
    filteredAppointments.forEach((a) => {
      if (a.status === "cancelled" || !a.appointment_time) return
      const cleanTime = String(a.appointment_time).trim().replace(" ", "T")
      const dateKey = cleanTime.split("T")[0] // YYYY-MM-DD
      const dayParts = dateKey.split("-")
      const formattedLabel = dayParts.length === 3 ? `${dayParts[2]}/${dayParts[1]}` : dateKey

      const barbName = a.barber_name || "Geral"
      barberNamesSet.add(barbName)

      if (!daysMap[dateKey]) {
        daysMap[dateKey] = { dateKey, date: formattedLabel, total: 0 }
      }

      const val = Number(a.service_price) || Number(a.price) || 0
      daysMap[dateKey][barbName] = (daysMap[dateKey][barbName] || 0) + val
      daysMap[dateKey].total += val
    })

    // Processar receitas do caixa (sem duplicar agendamentos)
    filteredCaixa.forEach((t) => {
      if (t.type !== "receita" || !t.date) return
      const dateKey = t.date.split(" ")[0].split("T")[0] // YYYY-MM-DD
      const dayParts = dateKey.split("-")
      const formattedLabel = dayParts.length === 3 ? `${dayParts[2]}/${dayParts[1]}` : dateKey

      const barbName = t.barber_name || "Geral"
      barberNamesSet.add(barbName)

      if (!daysMap[dateKey]) {
        daysMap[dateKey] = { dateKey, date: formattedLabel, total: 0 }
      }

      if (!t.appointment_id) {
        const val = Number(t.amount) || 0
        daysMap[dateKey][barbName] = (daysMap[dateKey][barbName] || 0) + val
        daysMap[dateKey].total += val
      }
    })

    const barberList = Array.from(barberNamesSet)
    const sortedKeys = Object.keys(daysMap).sort()

    return sortedKeys.map((k) => {
      const dayObj = { date: daysMap[k].date, total: daysMap[k].total }
      barberList.forEach((bName) => {
        dayObj[bName] = daysMap[k][bName] || 0
      })
      return dayObj
    })
  }, [barbers, filteredAppointments, filteredCaixa])

  // 2. Dados para o Gráfico de Desempenho por Barbeiro (Bar Chart)
  const barberPerformanceData = useMemo(() => {
    const barbMap = {}

    barbers.forEach((b) => {
      barbMap[b.name] = { name: b.name, faturamento: 0, atendimentos: 0 }
    })

    filteredAppointments.forEach((a) => {
      if (a.status === "cancelled") return
      const barbName = a.barber_name || "Desconhecido"
      if (!barbMap[barbName]) {
        barbMap[barbName] = { name: barbName, faturamento: 0, atendimentos: 0 }
      }
      barbMap[barbName].atendimentos += 1
      barbMap[barbName].faturamento += Number(a.service_price) || 0
    })

    // Adicionar também receitas diretas do caixa vinculadas ao barbeiro
    filteredCaixa.forEach((t) => {
      if (t.type !== "receita" || !t.barber_name) return
      const barbName = t.barber_name
      if (!barbMap[barbName]) {
        barbMap[barbName] = { name: barbName, faturamento: 0, atendimentos: 0 }
      }
      // Se não for agendamento repetido
      if (!t.appointment_id) {
        barbMap[barbName].faturamento += Number(t.amount) || 0
      }
    })

    return Object.values(barbMap).filter((item) => item.faturamento > 0 || item.atendimentos > 0)
  }, [barbers, filteredAppointments, filteredCaixa])

  // 3. Dados para o Gráfico de Distribuição dos Serviços (Donut Chart)
  const servicesDistributionData = useMemo(() => {
    const srvMap = {}
    const COLORS = ["#FADD00", "#CFBB23", "#A59837", "#7A733D", "#504D35", "#33322B"]

    filteredAppointments.forEach((a) => {
      if (a.status === "cancelled") return
      const srvName = a.service_name || "Corte Geral"
      srvMap[srvName] = (srvMap[srvName] || 0) + 1
    })

    const result = Object.entries(srvMap).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length]
    }))

    return result
  }, [filteredAppointments])

  // 4. Dados para o Gráfico de Status dos Agendamentos (Donut Chart)
  const statusDistributionData = useMemo(() => {
    return [
      { name: "Concluídos", value: kpiData.concluidos, color: "#FADD00" },
      { name: "Cancelados", value: kpiData.cancelados, color: "#504D35" },
      { name: "Ausentes", value: kpiData.ausentes, color: "#A59837" }
    ].filter((item) => item.value > 0)
  }, [kpiData])

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

      <div className="w-full relative z-10 animate-fade-in space-y-6 mt-[40px]">
        {/* Mensagem de Erro */}
        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 shadow-sm animate-fade-in">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cabeçalho da Página e Filtros Globais */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-[18pt] font-bold font-display flex items-center gap-2.5 text-foreground">
              <Sparkles className="text-primary w-7 h-7" /> Dashboard
              {loading && <RefreshCw size={16} className="animate-spin text-primary ml-2" />}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Indicadores chave, faturamento em tempo real e distribuição dos {services.length > 0 ? services.length : 6} serviços cadastrados na Barbearia Do Vale.
            </p>
          </div>

          {/* Controles de Filtros e Atualização */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown de Seleção de Barbeiro */}
            <div className="relative" ref={barberDropdownRef}>
              <button
                type="button"
                onClick={() => setIsBarberDropdownOpen((prev) => !prev)}
                className="flex items-center justify-between gap-2.5 bg-background border border-border hover:border-primary/50 text-foreground text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-xs min-w-[210px]"
              >
                <div className="flex items-center gap-2 truncate">
                  {selectedBarberFilter === "all" ? (
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                      <User size={13} />
                    </div>
                  ) : (
                    (() => {
                      const bIndex = barbers.findIndex((b) => String(b.id) === String(selectedBarberFilter))
                      const photo = selectedBarberObj?.photo || (
                        bIndex === 0 ? "/assets/foto_marcio.png" :
                        bIndex === 1 ? "/assets/foto_lucas.png" :
                        "/assets/foto_neto.png"
                      )
                      return (
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-gold-subtle shrink-0 bg-background flex items-center justify-center">
                          {photo ? (
                            <img src={photo} alt={selectedBarberObj?.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={13} className="text-muted-foreground" />
                          )}
                        </div>
                      )
                    })()
                  )}
                  <span className="truncate">
                    {selectedBarberFilter === "all"
                      ? "Todos os Profissionais"
                      : selectedBarberObj?.name || "Profissional"}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${isBarberDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isBarberDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#1c1c20] border border-border/80 rounded-2xl shadow-elevated z-50 overflow-hidden animate-scale-in py-1">
                  <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                    Filtrar por Profissional
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBarberFilter("all")
                      setIsBarberDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-muted/40 flex items-center justify-between transition-colors cursor-pointer text-xs ${
                      selectedBarberFilter === "all" ? "bg-primary/10 font-bold text-primary" : "text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                        <User size={14} />
                      </div>
                      <span className="font-semibold">Todos os Profissionais</span>
                    </div>
                    {selectedBarberFilter === "all" && <Check size={16} className="text-primary font-bold shrink-0" />}
                  </button>

                  {barbers.map((b, index) => {
                    const isSelected = String(selectedBarberFilter) === String(b.id)
                    const photo = b.photo || (
                      index === 0 ? "/assets/foto_marcio.png" :
                      index === 1 ? "/assets/foto_lucas.png" :
                      "/assets/foto_neto.png"
                    )
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBarberFilter(b.id)
                          setIsBarberDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-muted/40 flex items-center justify-between transition-colors cursor-pointer text-xs border-t border-border/20 ${
                          isSelected ? "bg-primary/10 font-bold text-primary" : "text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-border shrink-0 bg-background flex items-center justify-center">
                            {photo ? (
                              <img src={photo} alt={b.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={14} className="text-muted-foreground" />
                            )}
                          </div>
                          <span className="truncate font-semibold">{b.name}</span>
                        </div>
                        {isSelected && <Check size={16} className="text-primary font-bold shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Filtro por Período */}
            <div className="flex items-center bg-background border border-border rounded-xl p-1 gap-1">
              <button
                onClick={() => setPeriodFilter("month")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  periodFilter === "month" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mês Atual
              </button>
              <button
                onClick={() => setPeriodFilter("today")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  periodFilter === "today" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriodFilter("week")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  periodFilter === "week" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setPeriodFilter("custom")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  periodFilter === "custom" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Personalizado
              </button>
            </div>

            {/* Datas do Período Personalizado */}
            {periodFilter === "custom" && (
              <div className="flex items-center gap-2 animate-fade-in bg-background border border-border rounded-xl p-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-foreground text-xs font-mono focus:outline-none cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-foreground text-xs font-mono focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {/* Botão de Atualizar Dados */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-background border border-border hover:border-primary/40 text-foreground rounded-xl transition-all cursor-pointer"
              title="Atualizar métricas"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-primary" : "text-primary"} />
            </button>
          </div>
        </div>

        {/* CARDS DE KPIS / INDICADORES CHAVE (SHADCN UI STAT CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Faturamento Total */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Faturamento Total
              </span>
              <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="font-display font-black text-[32px] text-white">
              {formatCurrency(kpiData.totalReceitas)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight size={12} className="text-green-400" />
              <span>Receitas confirmadas e recebidas</span>
            </p>
          </div>

          {/* KPI 2: Lucro Líquido em Caixa */}
          <div className={`bg-card/40 backdrop-blur-sm border rounded-2xl p-5 shadow-sm relative overflow-hidden group transition-all ${
            kpiData.lucroLiquido >= 0 ? "border-gold-subtle" : "border-rose-500/40"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Lucro Líquido
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Wallet size={18} />
              </div>
            </div>
            <div className="font-display font-black text-[32px] text-white">
              {formatCurrency(kpiData.lucroLiquido)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Despesas operacionais: <span className="text-rose-400 font-mono">{formatCurrency(kpiData.totalDespesas)}</span>
            </p>
          </div>

          {/* KPI 3: Ticket Médio por Atendimento */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ticket Médio
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="font-display font-black text-[32px] text-white font-mono">
              {formatCurrency(kpiData.ticketMedio)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Média gerada por corte/serviço
            </p>
          </div>

          {/* KPI 4: Total de Atendimentos & Efetividade */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Atendimentos & Taxa
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Scissors size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="font-display font-black text-[32px] text-white">
                {kpiData.concluidos} <span className="text-xs text-muted-foreground font-normal">atendimentos</span>
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                {kpiData.taxaEfetividade}% ok
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {kpiData.totalAgendamentos} agendados • {kpiData.cancelados} cancelados
            </p>
          </div>
        </div>

        {/* SEÇÃO DE GRÁFICOS ANALÍTICOS (SHADCN CHART CARDS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico 1: Fluxo Financeiro (Evolução de Receitas vs Despesas) */}
          <div className="lg:col-span-2 bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" /> Faturamento Diário por Barbeiro
                </h3>
                <p className="text-xs text-muted-foreground">
                  Composição do faturamento empilhado por profissional a cada dia do período.
                </p>
              </div>
            </div>
            <FinancialTrendChart data={financialTrendData} />
          </div>

          {/* Gráfico 2: Status dos Agendamentos (Donut Chart) */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <CalendarDays size={18} className="text-primary" /> Efetividade de Agendamentos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Proporção de cortes concluídos, cancelados e ausentes.
                </p>
              </div>
            </div>
            <StatusDistributionChart data={statusDistributionData} />
          </div>
        </div>

        {/* SEGUNDA LINHA DE GRÁFICOS: Barbeiros e Serviços */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico 3: Desempenho por Barbeiro (Bar Chart) */}
          <div className="lg:col-span-2 bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <Users size={18} className="text-primary" /> Faturamento por Barbeiro
                </h3>
                <p className="text-xs text-muted-foreground">
                  Total de receita gerada por profissional no período selecionado.
                </p>
              </div>
            </div>
            <BarberPerformanceChart data={barberPerformanceData} />
          </div>

          {/* Gráfico 4: Distribuição dos Serviços Mais Vendidos */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <Scissors size={18} className="text-primary" /> Serviços Mais Vendidos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Participação por tipo de procedimento realizado.
                </p>
              </div>
            </div>
            <ServicesDistributionChart data={servicesDistributionData} />
          </div>
        </div>

        {/* FEED DE ATIVIDADES RECENTES & NAVEGAÇÃO RÁPIDA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Atendimentos do Dia */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                <Clock size={18} className="text-primary" /> Próximos Atendimentos do Dia
              </h3>
              <Link to="/agenda-barbeiros" className="text-xs font-bold text-primary hover:underline">
                Ver Agenda Completa ➔
              </Link>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Nenhum atendimento agendado para o período selecionado.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.slice(0, 5).map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between bg-background/50 border border-border/50 rounded-xl p-3 text-xs shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <User size={15} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{appt.client_name || "Cliente"}</div>
                        <div className="text-[10px] text-muted-foreground">{appt.service_name} • Barbeiro: {appt.barber_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-primary">{formatDateBR(appt.appointment_time)}</div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        appt.status === "completed" ? "bg-green-500/20 text-green-400" :
                        appt.status === "cancelled" ? "bg-rose-500/20 text-rose-400" :
                        "bg-primary/20 text-primary"
                      }`}>
                        {appt.status === "completed" ? "Concluído" : appt.status === "cancelled" ? "Cancelado" : "Confirmado"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimos Lançamentos do Caixa */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                <Wallet size={18} className="text-primary" /> Lançamentos Recentes do Caixa
              </h3>
              <Link to="/caixa" className="text-xs font-bold text-primary hover:underline">
                Gerenciar Caixa ➔
              </Link>
            </div>

            {filteredCaixa.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Nenhum lançamento de caixa no período selecionado.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCaixa.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-background/50 border border-border/50 rounded-xl p-3 text-xs shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        item.type === "receita" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}>
                        {item.type === "receita" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{item.description}</div>
                        <div className="text-[10px] text-muted-foreground">{item.category} {item.barber_name ? `• ${item.barber_name}` : ""}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${item.type === "receita" ? "text-green-400" : "text-rose-400"}`}>
                        {item.type === "receita" ? "+" : "-"} {formatCurrency(item.amount)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">{formatDateBR(item.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
