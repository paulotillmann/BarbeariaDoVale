import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Scissors,
  ShoppingBag,
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
  ChevronLeft,
  ChevronRight,
  Check,
  Percent,
  Calendar,
  Sparkles,
  PieChart as PieChartIcon
} from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"
import {
  FinancialTrendChart,
  DailyTicketTrendChart,
  BarberPerformanceChart,
  ServicesDistributionChart,
  ProductsDistributionChart,
  ServicesVsProductsChart
} from "../components/DashboardCharts.jsx"
import TopClientsChart from "../components/TopClientsChart.jsx"



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
  const [salesList, setSalesList] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  // Filtros Globais: Período e Barbeiro
  const [periodFilter, setPeriodFilter] = useState("month") // 'month' (padrão), 'today', 'week', 'custom', 'all'
  const [selectedBarberFilter, setSelectedBarberFilter] = useState("all") // 'all' ou id do barbeiro
  const [isBarberDropdownOpen, setIsBarberDropdownOpen] = useState(false)
  const barberDropdownRef = useRef(null)

  // Filtro de Mês e Ano Selecionados (Month Picker)
  const initialDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth()) // 0-11
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear())
  const [pickerYear, setPickerYear] = useState(initialDate.getFullYear())
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const monthPickerRef = useRef(null)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [financialViewMode, setFinancialViewMode] = useState("simplificado") // 'simplificado' (padrão) ou 'detalhado'

  const loadAllData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const headers = { Authorization: `Bearer ${token}` }

      const [apptRes, caixaRes, barbRes, srvRes, salesRes, custRes] = await Promise.all([
        fetch(`${API_URL}/api/appointments`, { headers }),
        fetch(`${API_URL}/api/caixa`, { headers }),
        fetch(`${API_URL}/api/barbers`),
        fetch(`${API_URL}/api/services`),
        fetch(`${API_URL}/api/sales/all`, { headers }),
        fetch(`${API_URL}/api/customers`, { headers })
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

      if (salesRes && salesRes.ok) {
        const salesData = await salesRes.json()
        setSalesList(salesData || [])
      }

      if (custRes && custRes.ok) {
        const custData = await custRes.json()
        setCustomers(custData || [])
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

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (barberDropdownRef.current && !barberDropdownRef.current.contains(event.target)) {
        setIsBarberDropdownOpen(false)
      }
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target)) {
        setIsMonthPickerOpen(false)
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
        const monthStr = String(selectedMonth + 1).padStart(2, "0")
        const targetPrefix = `${selectedYear}-${monthStr}`
        return datePart.startsWith(targetPrefix)
      } else if (periodFilter === "custom") {
        if (startDate && datePart < startDate) return false
        if (endDate && datePart > endDate) return false
        return true
      }

      return true
    })
  }, [appointments, selectedBarberFilter, selectedBarberObj, periodFilter, selectedMonth, selectedYear, startDate, endDate])

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
        const monthStr = String(selectedMonth + 1).padStart(2, "0")
        const targetPrefix = `${selectedYear}-${monthStr}`
        return datePart.startsWith(targetPrefix)
      } else if (periodFilter === "custom") {
        if (startDate && datePart < startDate) return false
        if (endDate && datePart > endDate) return false
        return true
      }

      return true
    })
  }, [caixaTransactions, selectedBarberFilter, selectedBarberObj, periodFilter, selectedMonth, selectedYear, startDate, endDate])

  // Vendas de produtos filtradas por Período e Barbeiro
  const filteredSales = useMemo(() => {
    const now = new Date()
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

    return salesList.filter((s) => {
      // 1. Filtro por Barbeiro
      if (selectedBarberFilter !== "all") {
        const barbNameClean = selectedBarberObj ? selectedBarberObj.name.trim().toLowerCase() : ""
        const matchesId = s.barber_id && String(s.barber_id) === String(selectedBarberFilter)
        const matchesName = barbNameClean && s.barber_name && s.barber_name.trim().toLowerCase().includes(barbNameClean)
        if (!matchesId && !matchesName) return false
      }

      // 2. Filtro por Período
      const dateStr = s.created_at || s.date
      if (!dateStr) return true
      const datePart = dateStr.split("T")[0].split(" ")[0]

      if (periodFilter === "today") {
        return datePart === todayStr
      } else if (periodFilter === "week") {
        const d = new Date(datePart + "T00:00:00")
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24)
        return diffDays >= 0 && diffDays <= 7
      } else if (periodFilter === "month") {
        const monthStr = String(selectedMonth + 1).padStart(2, "0")
        const targetPrefix = `${selectedYear}-${monthStr}`
        return datePart.startsWith(targetPrefix)
      } else if (periodFilter === "custom") {
        if (startDate && datePart < startDate) return false
        if (endDate && datePart > endDate) return false
        return true
      }

      return true
    })
  }, [salesList, selectedBarberFilter, selectedBarberObj, periodFilter, selectedMonth, selectedYear, startDate, endDate])

  // KPI Calculations
  const kpiData = useMemo(() => {
    let totalReceitas = 0
    let totalDespesas = 0

    filteredCaixa.forEach((t) => {
      const val = Number(t.amount) || 0
      if (t.type === "receita") totalReceitas += val
      else if (t.type === "despesa") totalDespesas += val
    })

    // Agrupar agendamentos por atendimento único (evitar multiplicar contagem em combos multi-serviço)
    const seenAppts = new Map()
    filteredAppointments.forEach((a) => {
      const cleanTime = String(a.appointment_time || "").trim().replace(" ", "T")
      const key = `${a.barber_id || a.barber_name}_${cleanTime}_${a.client_id || a.customer_id || a.client_name || a.phone || a.id}`
      if (!seenAppts.has(key)) {
        seenAppts.set(key, a.status)
      } else {
        const prevStatus = seenAppts.get(key)
        if ((a.status === "completed" || a.status === "confirmed") && prevStatus !== "completed") {
          seenAppts.set(key, a.status)
        }
      }
    })

    const apptStatuses = Array.from(seenAppts.values())
    const totalAgendamentos = apptStatuses.length
    const concluidos = apptStatuses.filter((st) => st === "completed" || st === "confirmed").length
    const cancelados = apptStatuses.filter((st) => st === "cancelled").length
    const ausentes = apptStatuses.filter((st) => st === "absent").length

    const lucroLiquido = totalReceitas - totalDespesas
    const ticketMedio = concluidos > 0 ? totalReceitas / concluidos : 0
    const taxaEfetividade = totalAgendamentos > 0 ? Math.round((concluidos / totalAgendamentos) * 100) : 100

    // Cálculo do Ticket Médio de Produtos Vendidos
    let totalReceitaProdutos = 0
    let totalVendasProdutosCount = 0
    let totalItensProdutosCount = 0
    const processedSaleIds = new Set()

    filteredSales.forEach((s) => {
      let items = s.items
      if (typeof items === "string") {
        try { items = JSON.parse(items) } catch { items = [] }
      }

      if (s.id) processedSaleIds.add(String(s.id))

      let saleAmount = Number(s.total || s.total_price || s.total_amount || s.amount || 0)
      let itemsInSale = 0

      if (Array.isArray(items) && items.length > 0) {
        items.forEach((it) => {
          const qty = Number(it.quantity) || 1
          itemsInSale += qty
          if (!saleAmount) {
            const price = Number(it.unit_price || it.price || 0)
            saleAmount += qty * price
          }
        })
      }

      totalReceitaProdutos += saleAmount
      totalVendasProdutosCount += 1
      totalItensProdutosCount += (itemsInSale || 1)
    })

    filteredCaixa.forEach((t) => {
      if (t.type !== "receita") return
      const catLower = (t.category || "").toLowerCase()
      const descLower = (t.description || "").toLowerCase()

      const isProdutoCategory =
        catLower.includes("produto") ||
        catLower.includes("venda") ||
        (t.id && String(t.id).startsWith("caixa-sale-"))

      const isProdutoDesc =
        descLower.includes("produto") ||
        descLower.includes("venda") ||
        descLower.includes("pomada") ||
        descLower.includes("óleo") ||
        descLower.includes("oleo") ||
        descLower.includes("shampoo") ||
        descLower.includes("balm")

      if (!isProdutoCategory && !isProdutoDesc) return

      if (t.id && String(t.id).startsWith("caixa-sale-")) {
        const saleId = String(t.id).replace("caixa-sale-", "")
        if (processedSaleIds.has(saleId)) return
      }
      if (t.sale_id && processedSaleIds.has(String(t.sale_id))) return

      const val = Number(t.amount) || 0
      const match = t.description ? t.description.match(/\((\d+)\s+iten/i) || t.description.match(/\((\d+)\s+item/i) : null
      const itemQty = match ? parseInt(match[1], 10) : 1

      totalReceitaProdutos += val
      totalVendasProdutosCount += 1
      totalItensProdutosCount += itemQty
    })

    const ticketMedioProdutos = totalVendasProdutosCount > 0 ? totalReceitaProdutos / totalVendasProdutosCount : 0

    return {
      totalReceitas,
      totalDespesas,
      lucroLiquido,
      ticketMedio,
      ticketMedioProdutos,
      totalReceitaProdutos,
      totalVendasProdutosCount,
      totalItensProdutosCount,
      totalAgendamentos,
      concluidos,
      cancelados,
      ausentes,
      taxaEfetividade
    }
  }, [filteredCaixa, filteredAppointments, filteredSales])

  // 1. Dados para o Gráfico de Fluxo Financeiro (Barras Empilhadas por Barbeiro por dia)
  const financialTrendData = useMemo(() => {
    const daysMap = {}

    // Lista dos nomes dos barbeiros conhecidos
    const barberNamesSet = new Set(barbers.map((b) => b.name))

    const initBarberDay = (dateKey, formattedLabel, barbName) => {
      barberNamesSet.add(barbName)
      if (!daysMap[dateKey]) {
        daysMap[dateKey] = { dateKey, date: formattedLabel, total: 0, details: {} }
      }
      if (!daysMap[dateKey].details[barbName]) {
        daysMap[dateKey].details[barbName] = {
          faturamento: 0,
          atendimentoValor: 0,
          atendimentoQtd: 0,
          produtosValor: 0,
          produtosQtd: 0
        }
      }
    }

    // Processar APENAS lançamentos efetivados no caixa.
    // cx-srv-* = serviços sincronizados automaticamente após o horário do agendamento.
    // caixa-sale-* = vendas de produtos.
    // Demais receitas = lançamentos manuais avulsos.
    filteredCaixa.forEach((t) => {
      if (t.type !== "receita" || !t.date) return

      const dateKey = t.date.split(" ")[0].split("T")[0] // YYYY-MM-DD
      const dayParts = dateKey.split("-")
      const formattedLabel = dayParts.length === 3 ? `${dayParts[2]}/${dayParts[1]}` : dateKey

      const barbName = t.barber_name || "Geral"
      initBarberDay(dateKey, formattedLabel, barbName)

      const val = Number(t.amount) || 0
      const isProduto = t.category === "Venda de Produtos" || t.category === "Produto" || (t.id && t.id.startsWith("caixa-sale-"))

      if (isProduto) {
        const match = t.description ? t.description.match(/\((\d+)\s+iten/i) || t.description.match(/\((\d+)\s+item/i) : null
        const itemQty = match ? parseInt(match[1], 10) : 1

        daysMap[dateKey].details[barbName].produtosValor += val
        daysMap[dateKey].details[barbName].produtosQtd += itemQty
      } else {
        daysMap[dateKey].details[barbName].atendimentoValor += val
        daysMap[dateKey].details[barbName].atendimentoQtd += 1
      }

      daysMap[dateKey].details[barbName].faturamento += val
      daysMap[dateKey].total += val
    })

    const barberList = Array.from(barberNamesSet)
    const sortedKeys = Object.keys(daysMap).sort()

    return sortedKeys.map((k) => {
      const dayObj = { date: daysMap[k].date, total: daysMap[k].total, details: daysMap[k].details }
      barberList.forEach((bName) => {
        const det = daysMap[k].details[bName]
        dayObj[bName] = det ? det.faturamento : 0
      })
      return dayObj
    })
  }, [barbers, filteredCaixa])

  // 1.5. Dados para o Gráfico do Ticket Médio Diário (Linhas Suaves: Serviços x Produtos)
  const dailyTicketTrendData = useMemo(() => {
    const daysMap = {}

    filteredCaixa.forEach((t) => {
      if (t.type !== "receita" || !t.date) return

      const dateKey = t.date.split(" ")[0].split("T")[0] // YYYY-MM-DD
      const dayParts = dateKey.split("-")
      const formattedLabel = dayParts.length === 3 ? `${dayParts[2]}/${dayParts[1]}` : dateKey

      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          dateKey,
          date: formattedLabel,
          atendimentoValor: 0,
          atendimentoQtd: 0,
          produtosValor: 0,
          produtosVendasQtd: 0
        }
      }

      const val = Number(t.amount) || 0
      const isProduto = t.category === "Venda de Produtos" || t.category === "Produto" || (t.id && String(t.id).startsWith("caixa-sale-"))

      if (isProduto) {
        daysMap[dateKey].produtosValor += val
        daysMap[dateKey].produtosVendasQtd += 1
      } else {
        daysMap[dateKey].atendimentoValor += val
        daysMap[dateKey].atendimentoQtd += 1
      }
    })

    const sortedKeys = Object.keys(daysMap).sort()

    return sortedKeys.map((k) => {
      const d = daysMap[k]
      const ticketServicos = d.atendimentoQtd > 0 ? d.atendimentoValor / d.atendimentoQtd : 0
      const ticketProdutos = d.produtosVendasQtd > 0 ? d.produtosValor / d.produtosVendasQtd : 0

      return {
        date: d.date,
        atendimentoValor: d.atendimentoValor,
        atendimentoQtd: d.atendimentoQtd,
        produtosValor: d.produtosValor,
        produtosVendasQtd: d.produtosVendasQtd,
        ticketServicos: Number(ticketServicos.toFixed(2)),
        ticketProdutos: Number(ticketProdutos.toFixed(2))
      }
    })
  }, [filteredCaixa])

  // 2. Dados para o Gráfico de Desempenho por Barbeiro (Bar Chart)
  const barberPerformanceData = useMemo(() => {
    const barbMap = {}

    barbers.forEach((b) => {
      barbMap[b.name] = {
        name: b.name,
        faturamento: 0,
        atendimentoValor: 0,
        atendimentoQtd: 0,
        produtosValor: 0,
        produtosQtd: 0
      }
    })

    // Apenas lançamentos efetivados no caixa: cx-srv-* = serviços, caixa-sale-* = produtos
    filteredCaixa.forEach((t) => {
      if (t.type !== "receita") return
      const barbName = t.barber_name || "Geral"
      if (!barbMap[barbName]) {
        barbMap[barbName] = {
          name: barbName,
          faturamento: 0,
          atendimentoValor: 0,
          atendimentoQtd: 0,
          produtosValor: 0,
          produtosQtd: 0
        }
      }

      const val = Number(t.amount) || 0
      const isServiceSync = t.id && t.id.startsWith("cx-srv-")
      const isProduto = t.category === "Venda de Produtos" || t.category === "Produto" || (t.id && t.id.startsWith("caixa-sale-"))

      if (isProduto) {
        const match = t.description ? t.description.match(/\((\d+)\s+iten/i) || t.description.match(/\((\d+)\s+item/i) : null
        const itemQty = match ? parseInt(match[1], 10) : 1
        barbMap[barbName].produtosValor += val
        barbMap[barbName].produtosQtd += itemQty
      } else {
        barbMap[barbName].atendimentoValor += val
        if (isServiceSync) barbMap[barbName].atendimentoQtd += 1
        else barbMap[barbName].atendimentoQtd += 1
      }

      barbMap[barbName].faturamento += val
    })

    return Object.values(barbMap).filter(
      (item) => item.faturamento > 0 || item.atendimentoQtd > 0 || item.produtosQtd > 0
    )
  }, [barbers, filteredCaixa])

  // 3. Dados para o Gráfico de Distribuição dos Serviços (Donut Chart)
  const servicesDistributionData = useMemo(() => {
    const srvMap = {}
    const COLORS = ["#FADD00", "#CFBB23", "#A59837", "#7A733D", "#504D35", "#33322B"]

    // Conjunto de appointment_ids que já têm lançamento de serviço no caixa
    const caixaApptIds = new Set(
      filteredCaixa
        .filter(t => t.id && t.id.startsWith("cx-srv-"))
        .map(t => t.appointment_id)
        .filter(Boolean)
    )

    filteredAppointments.forEach((a) => {
      if (a.status === "cancelled") return
      if (!caixaApptIds.has(a.id)) return // só conta se efetivado no caixa

      const svcIds = a.service_ids
        ? a.service_ids.split(',').filter(Boolean)
        : (a.service_id ? [a.service_id] : [])

      if (svcIds.length > 0) {
        svcIds.forEach(svcId => {
          const srv = services.find(s => s.id === svcId)
          const srvName = srv ? srv.name : (a.service_name || "Corte Geral")
          srvMap[srvName] = (srvMap[srvName] || 0) + 1
        })
      } else {
        const srvName = a.service_name || "Corte Geral"
        srvMap[srvName] = (srvMap[srvName] || 0) + 1
      }
    })

    const result = Object.entries(srvMap).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length]
    }))

    return result
  }, [filteredAppointments, filteredCaixa, services])

  // 4. Métricas para o Gráfico de Distribuição Serviços vs Produtos (Donut Chart)
  // Soma exclusivamente os lançamentos cx-srv-* efetivados no caixa
  const servicesTotalFromCaixa = useMemo(() => {
    let sum = 0
    filteredCaixa.forEach((t) => {
      if (t.type === "receita" && t.id && t.id.startsWith("cx-srv-")) {
        sum += Number(t.amount) || 0
      }
    })
    return sum
  }, [filteredCaixa])

  const servicesVsProductsMetrics = useMemo(() => {
    const productsTotal = kpiData.totalReceitaProdutos || 0
    const servicesTotal = servicesTotalFromCaixa

    const servicesCount = kpiData.concluidos || 0
    const productsCount = kpiData.totalItensProdutosCount || 0

    return {
      servicesTotal,
      productsTotal,
      servicesCount,
      productsCount
    }
  }, [kpiData, servicesTotalFromCaixa])

  // 5. Dados para o Gráfico de Distribuição dos Produtos Mais Vendidos


  const productsDistributionData = useMemo(() => {
    const prodMap = {}
    const COLORS = ["#FADD00", "#CFBB23", "#A59837", "#7A733D", "#504D35", "#33322B", "#8C8638", "#B5A730"]

    // Conjunto para evitar duplicar vendas que já foram contadas pelo salesList
    const processedSaleIds = new Set()

    // 1. Somar itens das vendas registradas na API de Vendas (salesList)
    filteredSales.forEach((s) => {
      let items = s.items
      if (typeof items === "string") {
        try { items = JSON.parse(items) } catch { items = [] }
      }
      if (Array.isArray(items) && items.length > 0) {
        if (s.id) processedSaleIds.add(String(s.id))
        items.forEach((it) => {
          const name = it.product_name || it.name || "Produto"
          const qty = Number(it.quantity) || 1
          prodMap[name] = (prodMap[name] || 0) + qty
        })
      }
    })

    // Helper para extrair nome e quantidade da descrição da transação do Caixa
    const parseCaixaDescription = (desc) => {
      if (!desc) return { name: "Venda de Produtos", qty: 1 }

      let qty = 1
      const matchQty = desc.match(/\((\d+)\s+iten/i) || desc.match(/\((\d+)\s+item/i) || desc.match(/^(\d+)\s*x\s+/i)
      if (matchQty) {
        qty = parseInt(matchQty[1], 10) || 1
      }

      let cleanName = desc
        .replace(/\(\d+\s+itens?\)/gi, "")
        .replace(/\(\d+\s+item?\)/gi, "")
        .trim()

      // Remover textos de forma de pagamento comuns (ex: "- Pagamento: PIX", "- PIX", "- DINHEIRO")
      cleanName = cleanName
        .replace(/-\s*pagamento:\s*[a-z0-9_ ]+/gi, "")
        .replace(/-\s*(pix|dinheiro|cartao_credito|cartao_debito|cartao|cartão|a_prazo|a prazo)\b/gi, "")
        .trim()

      if (cleanName.includes(" - ")) {
        cleanName = cleanName.split(" - ").pop().trim()
      } else if (cleanName.toLowerCase().startsWith("venda de ")) {
        cleanName = cleanName.replace(/^venda de /i, "").trim()
      } else if (cleanName.toLowerCase().startsWith("venda ")) {
        cleanName = cleanName.replace(/^venda /i, "").trim()
      }

      const cleanLower = cleanName.toLowerCase()
      if (
        !cleanName ||
        cleanLower === "produtos" ||
        cleanLower === "produto" ||
        cleanLower.startsWith("pagamento:") ||
        ["pix", "dinheiro", "cartao_credito", "cartao_debito", "a_prazo", "cartao", "cartão"].includes(cleanLower)
      ) {
        cleanName = "Venda de Produtos"
      }

      return { name: cleanName, qty }
    }

    // 2. Somar itens das movimentações do caixa
    filteredCaixa.forEach((t) => {
      const isReceita = t.type === "receita"
      const catLower = (t.category || "").toLowerCase()
      const descLower = (t.description || "").toLowerCase()

      const isProdutoCategory =
        catLower.includes("produto") ||
        catLower.includes("venda") ||
        (t.id && String(t.id).startsWith("caixa-sale-"))

      const isProdutoDesc =
        descLower.includes("produto") ||
        descLower.includes("venda") ||
        descLower.includes("pomada") ||
        descLower.includes("óleo") ||
        descLower.includes("oleo") ||
        descLower.includes("shampoo") ||
        descLower.includes("balm")

      if (!isReceita || (!isProdutoCategory && !isProdutoDesc)) return

      // Evitar duplicar se a transação for vinculada a uma venda já contada com itens em filteredSales
      if (t.id && String(t.id).startsWith("caixa-sale-")) {
        const saleId = String(t.id).replace("caixa-sale-", "")
        if (processedSaleIds.has(saleId)) return
      }
      if (t.sale_id && processedSaleIds.has(String(t.sale_id))) return

      const { name, qty } = parseCaixaDescription(t.description)
      prodMap[name] = (prodMap[name] || 0) + qty
    })

    const result = Object.entries(prodMap).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length]
    }))

    return result
  }, [filteredSales, filteredCaixa])

  // 6. Dados para o Gráfico de Ranking dos Top Clientes (Serviços + Produtos)
  const topClientsData = useMemo(() => {
    const clientMap = new Map()

    const getOrCreateClient = (id, fallbackName, phone) => {
      const key = id
        ? String(id)
        : phone
          ? `phone_${phone}`
          : fallbackName
            ? `name_${fallbackName.trim().toLowerCase()}`
            : "unknown"

      if (!clientMap.has(key)) {
        const cust = customers.find(
          (c) =>
            String(c.id) === String(id) ||
            (phone && c.phone === phone) ||
            (fallbackName && c.name?.trim().toLowerCase() === fallbackName.trim().toLowerCase())
        )
        clientMap.set(key, {
          id: cust?.id || id || key,
          name: cust?.name || fallbackName || "Cliente",
          phone: cust?.phone || phone || "",
          photo: cust?.photo || "",
          servicesTotal: 0,
          servicesCount: 0,
          productsTotal: 0,
          productsCount: 0,
          totalSpent: 0
        })
      }
      return clientMap.get(key)
    }

    const servicePriceMap = new Map()
    services.forEach((s) => servicePriceMap.set(String(s.id), Number(s.price || s.valor || 0)))

    const caixaApptPriceMap = new Map()
    filteredCaixa.forEach((t) => {
      if (t.appointment_id) caixaApptPriceMap.set(String(t.appointment_id), Number(t.amount || 0))
      if (t.id && t.id.startsWith("cx-srv-")) {
        const apptId = t.id.replace("cx-srv-", "")
        caixaApptPriceMap.set(apptId, Number(t.amount || 0))
      }
    })

    filteredAppointments.forEach((a) => {
      if (a.status === "cancelled") return
      const clientId = a.client_id || a.customer_id
      const clientName = a.client_name || a.customer_name || a.name
      const clientPhone = a.phone || a.client_phone

      if (!clientId && !clientName) return

      const client = getOrCreateClient(clientId, clientName, clientPhone)

      let price = Number(a.price || a.total_price || a.value || a.amount || a.service_price || 0)
      if (!price && caixaApptPriceMap.has(String(a.id))) {
        price = caixaApptPriceMap.get(String(a.id))
      }
      if (!price) {
        const rawIds = a.service_ids || a.service_id
        if (rawIds) {
          const ids = Array.isArray(rawIds) ? rawIds : String(rawIds).split(",").filter(Boolean)
          ids.forEach((sId) => {
            price += servicePriceMap.get(String(sId)) || 0
          })
        }
      }

      client.servicesTotal += price
      client.servicesCount += 1
      client.totalSpent += price
    })

    filteredSales.forEach((s) => {
      let clientId = s.customer_id || s.client_id
      let clientName = s.customer_name || s.client_name
      let clientPhone = s.customer_phone || s.phone

      if (!clientId && s.appointment_id) {
        const matchedAppt = appointments.find((a) => String(a.id) === String(s.appointment_id))
        if (matchedAppt) {
          clientId = matchedAppt.client_id || matchedAppt.customer_id
          clientName = clientName || matchedAppt.client_name
          clientPhone = clientPhone || matchedAppt.phone
        }
      }

      if (!clientId && !clientName) return

      const client = getOrCreateClient(clientId, clientName, clientPhone)

      let saleTotal = Number(s.total || s.total_price || s.total_amount || s.amount || 0)
      let itemsCount = 0

      let items = s.items
      if (typeof items === "string") {
        try {
          items = JSON.parse(items)
        } catch {
          items = []
        }
      }
      if (Array.isArray(items) && items.length > 0) {
        items.forEach((it) => {
          const qty = Number(it.quantity) || 1
          itemsCount += qty
          if (!saleTotal) {
            saleTotal += qty * Number(it.unit_price || it.price || 0)
          }
        })
      } else {
        itemsCount = 1
      }

      client.productsTotal += saleTotal
      client.productsCount += itemsCount
      client.totalSpent += saleTotal
    })

    return Array.from(clientMap.values())
      .filter((c) => c.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
  }, [filteredAppointments, filteredSales, filteredCaixa, appointments, services, customers])

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
        <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 relative z-30">
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
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#1c1c20] border border-border/80 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-scale-in py-1">
                  <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                    Filtrar por Profissional
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBarberFilter("all")
                      setIsBarberDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-muted/40 flex items-center justify-between transition-colors cursor-pointer text-xs ${selectedBarberFilter === "all" ? "bg-primary/10 font-bold text-primary" : "text-foreground"
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
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-muted/40 flex items-center justify-between transition-colors cursor-pointer text-xs border-t border-border/20 ${isSelected ? "bg-primary/10 font-bold text-primary" : "text-foreground"
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

            {/* Filtro por Mês Selector (Modelo em Anexo) */}
            <div className="relative" ref={monthPickerRef}>
              <button
                type="button"
                onClick={() => {
                  setPickerYear(selectedYear)
                  setIsMonthPickerOpen((prev) => !prev)
                }}
                className={`flex items-center justify-between gap-2.5 bg-background border text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-xs ${periodFilter === "month"
                    ? "border-primary text-foreground bg-primary/10"
                    : "border-border hover:border-primary/50 text-foreground"
                  }`}
              >
                <Calendar size={15} className="text-primary shrink-0" />
                <div className="flex items-center gap-1 font-sans">
                  <span>01 - {new Date(selectedYear, selectedMonth + 1, 0).getDate()}</span>
                  <span className="text-primary font-black ml-0.5">
                    {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][selectedMonth]}
                  </span>
                  <span>{selectedYear}</span>
                </div>
                <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${isMonthPickerOpen ? "rotate-180" : ""}`} />
              </button>

              {isMonthPickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#1c1c20] border border-border/80 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-scale-in p-4">
                  {/* Cabeçalho do Ano */}
                  <div className="flex items-center justify-between text-foreground mb-3 px-1">
                    <button
                      type="button"
                      onClick={() => setPickerYear((prev) => prev - 1)}
                      className="p-1.5 hover:bg-muted/50 rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Ano anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-bold tracking-wider font-mono text-foreground">{pickerYear}</span>
                    <button
                      type="button"
                      onClick={() => setPickerYear((prev) => prev + 1)}
                      className="p-1.5 hover:bg-muted/50 rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Próximo ano"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="border-b border-dashed border-border/40 mb-3" />

                  {/* Grid de Meses (3x4) */}
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((mName, idx) => {
                      const isSelected = periodFilter === "month" && selectedMonth === idx && selectedYear === pickerYear
                      return (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(idx)
                            setSelectedYear(pickerYear)
                            setPeriodFilter("month")
                            setIsMonthPickerOpen(false)
                          }}
                          className={`py-2 px-3 text-xs font-bold rounded-xl text-center transition-all cursor-pointer ${isSelected
                              ? "bg-primary text-background font-black shadow-gold scale-105"
                              : "bg-muted/20 hover:bg-muted/50 text-foreground/80 hover:text-foreground border border-transparent hover:border-border/40"
                            }`}
                        >
                          {mName}
                        </button>
                      )
                    })}
                  </div>

                  <div className="border-t border-dashed border-border/40 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodFilter("all")
                        setIsMonthPickerOpen(false)
                      }}
                      className={`w-full py-2 px-3 rounded-xl border border-dashed text-xs font-bold transition-all text-center cursor-pointer ${periodFilter === "all"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                    >
                      Todos os Períodos
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Demais Filtros Solicitados: Hoje, 7 Dias, Personalizado */}
            <div className="flex items-center bg-background border border-border rounded-xl p-1 gap-1">
              <button
                onClick={() => setPeriodFilter("today")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${periodFilter === "today" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriodFilter("week")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${periodFilter === "week" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setPeriodFilter("custom")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${periodFilter === "custom" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
          <div className={`bg-card/40 backdrop-blur-sm border rounded-2xl p-5 shadow-sm relative overflow-hidden group transition-all ${kpiData.lucroLiquido >= 0 ? "border-gold-subtle" : "border-rose-500/40"
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
                Ticket Médio (Serviços)
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="font-display font-black text-[32px] text-white font-mono">
              {formatCurrency(kpiData.ticketMedio)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Média gerada por serviço
            </p>
          </div>

          {/* KPI 4: Ticket Médio de Produtos Vendidos */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ticket Médio (Produtos)
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div className="font-display font-black text-[32px] text-white font-mono">
              {formatCurrency(kpiData.ticketMedioProdutos)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Média gerada por venda de produtos
            </p>
          </div>

          {/* KPI 5: Total de Atendimentos & Efetividade */}
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
                {kpiData.concluidos} <span className="text-xs text-muted-foreground font-normal">atend.</span>
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

        {/* SEÇÃO DE GRÁFICOS ANALÍTICOS: PRIMEIRA LINHA - FATURAMENTO DIÁRIO (LARGURA TOTAL) */}
        <div className="grid grid-cols-1 gap-6">
          {/* Gráfico 1: Fluxo Financeiro (Faturamento Diário) */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" /> Faturamento Diário
                </h3>
                <p className="text-xs text-muted-foreground">
                  {financialViewMode === "simplificado"
                    ? "Faturamento total consolidado por dia."
                    : "Composição do faturamento empilhado por profissional a cada dia do período."}
                </p>
              </div>

              {/* Selector de Modo: Detalhado / Simplificado (Pill Toggle) */}
              <div className="bg-background/80 border border-border/60 p-1 rounded-full flex items-center gap-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setFinancialViewMode("detalhado")}
                  className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${financialViewMode === "detalhado"
                      ? "bg-primary text-background shadow-xs font-black"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  detalhado
                </button>
                <button
                  type="button"
                  onClick={() => setFinancialViewMode("simplificado")}
                  className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${financialViewMode === "simplificado"
                      ? "bg-primary text-background shadow-xs font-black"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  simplificado
                </button>
              </div>
            </div>
            <FinancialTrendChart data={financialTrendData} viewMode={financialViewMode} />
          </div>
        </div>

        {/* SEGUNDA LINHA DE GRÁFICOS: TICKET MÉDIO DIÁRIO (2/3) X FATURAMENTO POR BARBEIRO (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico 2: Ticket Médio Diário de Vendas de Produtos x Serviços Realizados (2/3 da largura) */}
          <div className="lg:col-span-2 bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <DollarSign size={18} className="text-primary" /> Ticket Médio Diário (Produtos x Serviços)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Evolução comparativa da média gerada por vendas de produtos vs atendimentos prestados.
                </p>
              </div>
            </div>
            <DailyTicketTrendChart data={dailyTicketTrendData} />
          </div>

          {/* Gráfico 3: Desempenho por Barbeiro (1/3 da largura) */}
          <div className="lg:col-span-1 bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <Users size={18} className="text-primary" /> Faturamento por Barbeiro
                </h3>
                <p className="text-xs text-muted-foreground">
                  Total de receita gerada por profissional no período.
                </p>
              </div>
            </div>
            <BarberPerformanceChart data={barberPerformanceData} />
          </div>
        </div>

        {/* TERCEIRA LINHA DE GRÁFICOS: PRODUTOS MAIS VENDIDOS (2/3) X SERVIÇOS MAIS VENDIDOS (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico 3: Produtos Mais Vendidos (2/3 da largura) */}
          <div className="lg:col-span-2 bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <ShoppingBag size={18} className="text-primary" /> Produtos Mais Vendidos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Participação por quantidade de produtos vendidos.
                </p>
              </div>
            </div>
            <ProductsDistributionChart data={productsDistributionData} />
          </div>

          {/* Gráfico 4: Distribuição dos Serviços Mais Vendidos (1/3 da largura) */}
          <div className="lg:col-span-1 bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
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

        {/* QUARTA LINHA DE GRÁFICOS: TOP CLIENTES (1/2) X SERVIÇOS VS PRODUTOS (1/2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 5: Ranking dos Top Clientes */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <Users size={18} className="text-primary" /> Top Clientes (Serviços & Produtos)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ranking dos clientes que mais investiram em serviços e produtos na Barbearia Do Vale no período.
                </p>
              </div>
            </div>
            <TopClientsChart data={topClientsData} />
          </div>

          {/* Gráfico 6: Distribuição por Categoria (Serviços vs Produtos) */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3 gap-2">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <PieChartIcon size={18} className="text-primary" /> Serviços vs Produtos
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  Soma total do faturamento.
                </p>
              </div>
              <div className="text-right bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5 shrink-0">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block">Soma Total</span>
                <span className="text-xs font-black font-mono text-primary">
                  {formatCurrency(servicesVsProductsMetrics.servicesTotal + servicesVsProductsMetrics.productsTotal)}
                </span>
              </div>
            </div>
            <ServicesVsProductsChart
              servicesTotal={servicesVsProductsMetrics.servicesTotal}
              productsTotal={servicesVsProductsMetrics.productsTotal}
              servicesCount={servicesVsProductsMetrics.servicesCount}
              productsCount={servicesVsProductsMetrics.productsCount}
            />
          </div>
        </div>

        {/* QUINTA LINHA: PRÓXIMOS ATENDIMENTOS DO DIA (LARGURA TOTAL 100%) */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-elevated flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-2">
                  <Clock size={18} className="text-primary" /> Próximos Atendimentos do Dia
                </h3>
                <p className="text-xs text-muted-foreground">
                  Visão consolidada dos agendamentos programados para o período selecionado.
                </p>
              </div>
              <Link to="/agenda-barbeiros" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>Ver Agenda Completa</span> ➔
              </Link>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-muted/5">
                Nenhum atendimento agendado para o período selecionado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {[...filteredAppointments]
                  .sort((a, b) => (b.appointment_time || "").localeCompare(a.appointment_time || ""))
                  .slice(0, 9)
                  .map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between bg-background/50 border border-border/50 hover:border-primary/40 rounded-xl p-3.5 text-xs shadow-xs transition-all">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <User size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate">{appt.client_name || "Cliente"}</div>
                        <div className="text-[10.5px] text-muted-foreground truncate">{appt.service_name} • <span className="text-foreground/80">{appt.barber_name}</span></div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-primary">{formatDateBR(appt.appointment_time)}</div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${appt.status === "completed" ? "bg-green-500/20 text-green-400" :
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
        </div>
      </div>
    </div>
  )
}
