import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { 
  Wallet, 
  Scissors, 
  ShoppingBag, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Calendar as CalendarIcon, 
  RefreshCw, 
  DollarSign, 
  Sparkles,
  Percent,
  Clock,
  User,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ArrowLeftRight
} from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

function formatCurrency(val) {
  return (Number(val) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return ""
  const [year, month, day] = dateStr.split("-")
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day))
  
  const diasSemana = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
  ]
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]
  
  return {
    diaSemana: diasSemana[dateObj.getDay()],
    diaMes: `${day} de ${meses[dateObj.getMonth()]}`,
    completo: `${day}/${month}/${year}`
  }
}

function getTodayString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function MeuCaixa() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const initialDate = new Date()
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [viewMode, setViewMode] = useState("day") // 'day', 'month', 'all'
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth()) // 0-11
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear())
  const [pickerYear, setPickerYear] = useState(initialDate.getFullYear())
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const monthPickerRef = React.useRef(null)

  const [transactions, setTransactions] = useState([])
  const [barberProfile, setBarberProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("all") // 'all', 'servicos', 'produtos'
  const [showGross, setShowGross] = useState(false) // toggle entre Minha Comissão e Fat. Bruto

  const todayStr = useMemo(() => getTodayString(), [])
  const isToday = selectedDate === todayStr && viewMode === "day"

  // Fechar Month Picker ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target)) {
        setIsMonthPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Carregar dados do barbeiro e do caixa
  const fetchData = React.useCallback(async (isManualRefresh = false) => {
    if (!token) return
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError("")

    try {
      const headers = { Authorization: `Bearer ${token}` }

      // 1. Perfil do Barbeiro com comissões
      const barberRes = await fetch(`${API_URL}/api/barbers/me`, { headers })
      if (barberRes.ok) {
        const bData = await barberRes.json()
        setBarberProfile(bData)
      } else {
        // Tenta buscar lista geral de barbeiros e achar o id correspondente
        const allBarbersRes = await fetch(`${API_URL}/api/barbers`, { headers })
        if (allBarbersRes.ok) {
          const list = await allBarbersRes.json()
          const matched = list.find(b => b.id === user?.id || b.user_id === user?.id || b.name === user?.name)
          if (matched) setBarberProfile(matched)
        }
      }

      // 2. Lançamentos de caixa
      const caixaRes = await fetch(`${API_URL}/api/caixa`, { headers })
      if (caixaRes.ok) {
        const data = await caixaRes.json()
        setTransactions(Array.isArray(data.transactions) ? data.transactions : [])
      } else {
        const errData = await caixaRes.json().catch(() => ({}))
        setError(errData.error || "Não foi possível carregar as movimentações do caixa.")
      }
    } catch (err) {
      console.error("Erro ao carregar dados do meu caixa:", err)
      setError("Erro de conexão ao buscar os lançamentos.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, user?.id, user?.name])

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    fetchData()
  }, [user, navigate, fetchData])

  // Navegação de datas no modo dia
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() - 1)
    const nextY = date.getFullYear()
    const nextM = String(date.getMonth() + 1).padStart(2, "0")
    const nextD = String(date.getDate()).padStart(2, "0")
    setSelectedDate(`${nextY}-${nextM}-${nextD}`)
    setViewMode("day")
  }

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + 1)
    const nextY = date.getFullYear()
    const nextM = String(date.getMonth() + 1).padStart(2, "0")
    const nextD = String(date.getDate()).padStart(2, "0")
    setSelectedDate(`${nextY}-${nextM}-${nextD}`)
    setViewMode("day")
  }

  const handleToday = () => {
    setSelectedDate(todayStr)
    setViewMode("day")
  }

  // Percentuais de comissão
  const serviceCommissionPct = Number(barberProfile?.service_commission || 0)
  const productCommissionPct = Number(barberProfile?.product_commission || 0)

  // Filtrar lançamentos conforme o modo selecionado (dia, mês ou todos)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false
      const cleanDate = t.date.replace("T", " ").split(" ")[0]
      if (viewMode === "day") {
        return cleanDate === selectedDate
      }
      if (viewMode === "month") {
        const [y, m] = cleanDate.split("-").map(Number)
        return y === selectedYear && (m - 1) === selectedMonth
      }
      return true // 'all'
    })
  }, [transactions, selectedDate, viewMode, selectedYear, selectedMonth])

  // Categorização e Cálculos
  const dayCalculations = useMemo(() => {
    let servicosBruto = 0
    let servicosQtd = 0
    let produtosBruto = 0
    let produtosQtd = 0
    let outrosReceitas = 0
    let despesasTotal = 0

    const enrichedList = filteredTransactions.map(t => {
      const val = Number(t.amount) || 0
      const isServico = t.category === "Serviço" || t.id.startsWith("cx-srv-") || Boolean(t.appointment_id)
      const isProduto = t.category === "Venda de Produtos" || t.id.startsWith("caixa-sale-") || t.category === "Produto"
      
      let itemType = "outro"
      let commissionPct = 0
      let commissionVal = 0

      if (t.type === "despesa") {
        itemType = "despesa"
        despesasTotal += val
      } else if (isServico) {
        itemType = "servico"
        servicosBruto += val
        servicosQtd += 1
        commissionPct = serviceCommissionPct
        commissionVal = (val * commissionPct) / 100
      } else if (isProduto) {
        itemType = "produto"
        produtosBruto += val
        produtosQtd += 1
        commissionPct = productCommissionPct
        commissionVal = (val * commissionPct) / 100
      } else {
        itemType = "receita_avulsa"
        outrosReceitas += val
      }

      // Extrair horário
      let timeFormatted = ""
      if (t.date && t.date.includes(" ")) {
        timeFormatted = t.date.split(" ")[1]?.slice(0, 5) || ""
      } else if (t.date && t.date.includes("T")) {
        timeFormatted = t.date.split("T")[1]?.slice(0, 5) || ""
      }

      // Extrair títulos específicos e nome do cliente / produtos
      let displayTitle = t.description || "Lançamento"
      let displayClient = t.client_name || ""

      if (isServico) {
        if (t.service_names) {
          displayTitle = t.service_names
        } else if (t.description && t.description.includes("Serviço: ")) {
          const parts = t.description.split(" - Cliente: ")
          displayTitle = parts[0].replace("Serviço: ", "").trim()
          if (!displayClient && parts[1]) {
            displayClient = parts[1].trim()
          }
        }
      } else if (isProduto) {
        if (t.products_detail) {
          displayTitle = t.products_detail
        } else if (t.description && t.description.includes("Venda: ")) {
          const parts = t.description.split(" - Pagamento: ")
          displayTitle = parts[0].replace("Venda: ", "").trim()
        } else if (t.description && t.description.includes("Venda de Produtos")) {
          displayTitle = "Venda de Produtos"
        }
      }

      return {
        ...t,
        itemType,
        commissionPct,
        commissionVal,
        timeFormatted,
        displayTitle,
        displayClient
      }
    })

    const comissaoServicos = (servicosBruto * serviceCommissionPct) / 100
    const comissaoProdutos = (produtosBruto * productCommissionPct) / 100
    const totalMinhaComissao = comissaoServicos + comissaoProdutos
    const totalFaturamentoBruto = servicosBruto + produtosBruto + outrosReceitas

    return {
      servicosBruto,
      servicosQtd,
      produtosBruto,
      produtosQtd,
      outrosReceitas,
      despesasTotal,
      totalFaturamentoBruto,
      comissaoServicos,
      comissaoProdutos,
      totalMinhaComissao,
      list: enrichedList
    }
  }, [filteredTransactions, serviceCommissionPct, productCommissionPct])

  // Filtrar por aba
  const filteredList = useMemo(() => {
    if (activeTab === "servicos") {
      return dayCalculations.list.filter(item => item.itemType === "servico")
    }
    if (activeTab === "produtos") {
      return dayCalculations.list.filter(item => item.itemType === "produto")
    }
    return dayCalculations.list
  }, [dayCalculations.list, activeTab])

  const dateInfo = formatDateDisplay(selectedDate)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24 md:pb-28">
      <Sidebar />

      {/* Container Mobile Otimizado */}
      <main className="w-full max-w-lg mx-auto px-4 pt-4 md:pt-6 flex flex-col gap-4">
        
        {/* Cabeçalho do Profissional */}
        <div className="flex items-center justify-between bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              {barberProfile?.photo ? (
                <img 
                  src={barberProfile.photo} 
                  alt={barberProfile?.name || user?.name} 
                  className="w-full h-full object-cover rounded-xl" 
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center text-primary font-bold text-lg">
                  {(user?.name || "B").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground truncate max-w-[180px]">
                  {barberProfile?.name || user?.name || "Profissional"}
                </h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                  Barbeiro
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Percent size={12} className="text-primary" />
                  Serv: <strong className="text-foreground">{serviceCommissionPct}%</strong>
                </span>
                <span>•</span>
                <span>
                  Prod: <strong className="text-foreground">{productCommissionPct}%</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary transition-all border border-white/5 disabled:opacity-50 cursor-pointer"
            title="Atualizar dados"
            aria-label="Atualizar dados"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin text-primary" : ""} />
          </button>
        </div>

        {/* Barra de Filtros: Navegação por Dia + Filtro de Mês no mesmo alinhamento à direita */}
        <div className="bg-card border border-white/5 rounded-2xl p-3 shadow-md">
          <div className="flex items-center justify-between gap-2">
            
            {/* Navegação Dia Anterior */}
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-2 rounded-xl bg-muted/60 hover:bg-primary/20 hover:text-primary transition-all text-foreground cursor-pointer border border-white/5 shrink-0"
              title="Dia anterior"
              aria-label="Dia anterior"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Informação do Dia Selecionado */}
            <div className="flex-1 flex flex-col items-center justify-center text-center relative group min-w-0 px-1">
              <label htmlFor="mobile-date-picker" className="cursor-pointer flex flex-col items-center w-full">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
                  <CalendarIcon size={12} className="shrink-0" />
                  <span className="truncate">{dateInfo.diaSemana}</span>
                  {isToday && (
                    <span className="bg-primary text-primary-foreground text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">
                      Hoje
                    </span>
                  )}
                </div>
                <div className="text-xs font-extrabold text-foreground mt-0.5 tracking-tight group-hover:text-primary transition-colors truncate w-full">
                  {viewMode === "day"
                    ? dateInfo.completo
                    : viewMode === "month"
                    ? `Período do Mês (${["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][selectedMonth]} ${selectedYear})`
                    : "Todos os Períodos"}
                </div>
              </label>

              {/* Input invisível para calendário nativo */}
              <input
                id="mobile-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value)
                    setViewMode("day")
                  }
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-auto"
                aria-label="Selecionar data no calendário"
              />
            </div>

            {/* Navegação Próximo Dia */}
            <button
              type="button"
              onClick={handleNextDay}
              className="p-2 rounded-xl bg-muted/60 hover:bg-primary/20 hover:text-primary transition-all text-foreground cursor-pointer border border-white/5 shrink-0"
              title="Próximo dia"
              aria-label="Próximo dia"
            >
              <ChevronRight size={18} />
            </button>

            {/* Filtro de Mês no mesmo alinhamento (depois da seta da direita) */}
            <div className="relative shrink-0" ref={monthPickerRef}>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className={`flex items-center gap-1 py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
                  viewMode === "month" || isMonthPickerOpen
                    ? "border-primary/50 text-primary bg-primary/10"
                    : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 bg-muted/40"
                }`}
              >
                <span>
                  {viewMode === "month"
                    ? `${["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][selectedMonth]}`
                    : "Mês"}
                </span>
                <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${isMonthPickerOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Popup do Filtro de Mês */}
              {isMonthPickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#18181c] border border-white/10 rounded-2xl shadow-2xl z-50 p-4 animate-scale-in">
                  
                  {/* Navegação de Ano */}
                  <div className="flex items-center justify-between text-foreground mb-4 px-1">
                    <button
                      type="button"
                      onClick={() => setPickerYear((prev) => prev - 1)}
                      className="p-1 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Ano anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-black tracking-widest font-mono text-foreground">{pickerYear}</span>
                    <button
                      type="button"
                      onClick={() => setPickerYear((prev) => prev + 1)}
                      className="p-1 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Próximo ano"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Grid 3x4 de Meses */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((mName, idx) => {
                      const isSelected = viewMode === "month" && selectedMonth === idx && selectedYear === pickerYear
                      return (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(idx)
                            setSelectedYear(pickerYear)
                            setViewMode("month")
                            setIsMonthPickerOpen(false)
                          }}
                          className={`py-2.5 px-3 text-xs font-bold rounded-xl text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#d4af37] text-black font-black shadow-gold scale-105"
                              : "bg-white/5 hover:bg-white/10 text-foreground border border-transparent hover:border-white/10"
                          }`}
                        >
                          {mName}
                        </button>
                      )
                    })}
                  </div>

                  {/* Opções Dia Atual e Todos os Períodos */}
                  <div className="border-t border-white/10 pt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleToday()
                        setIsMonthPickerOpen(false)
                      }}
                      className="flex-1 py-2 px-3 rounded-xl border border-white/20 text-xs font-bold text-primary hover:border-primary/50 transition-all text-center cursor-pointer"
                    >
                      Dia Atual (Hoje)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("all")
                        setIsMonthPickerOpen(false)
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl border border-dashed text-xs font-bold transition-all text-center cursor-pointer ${
                        viewMode === "all"
                          ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
                          : "border-white/20 text-muted-foreground hover:text-foreground hover:border-white/40"
                      }`}
                    >
                      Todos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mensagem de Erro se houver */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* HERO CARD: Minha Comissão / Fat. Bruto do Dia */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#d4af37]/20 via-amber-950/30 to-background border border-white/10 p-5 shadow-gold/10 shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
              {showGross ? (
                <>
                  <TrendingUp size={14} className="text-[#d4af37]" /> Fat. Bruto:
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-[#d4af37]" /> Comissão:
                </>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-muted-foreground border border-white/5">
                {showGross ? "Bruto" : "Líquido"}
              </span>
              <button
                type="button"
                onClick={() => setShowGross(prev => !prev)}
                className="p-1.5 rounded-xl bg-black/40 hover:bg-black/70 text-[#d4af37] hover:text-amber-300 border border-white/10 hover:border-[#d4af37]/40 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
                title={showGross ? "Alternar para Minha Comissão" : "Alternar para Faturamento Bruto"}
                aria-label={showGross ? "Alternar para Minha Comissão" : "Alternar para Faturamento Bruto"}
              >
                <ArrowLeftRight size={14} />
              </button>
            </div>
          </div>

          <div className="text-3xl font-black text-foreground tracking-tight my-1 transition-all">
            {formatCurrency(
              showGross 
                ? dayCalculations.totalFaturamentoBruto 
                : dayCalculations.totalMinhaComissao
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-2.5 border border-white/5">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1 truncate">
                <Scissors size={11} className="text-[#d4af37] shrink-0" />
                <span className="truncate">
                  {showGross 
                    ? "Total em Serviço" 
                    : `Em Serviços (${serviceCommissionPct}%)`}
                </span>
              </div>
              <div className="text-sm font-bold text-foreground mt-0.5 truncate">
                {formatCurrency(
                  showGross 
                    ? dayCalculations.servicosBruto 
                    : dayCalculations.comissaoServicos
                )}
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-2.5 border border-white/5">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1 truncate">
                <ShoppingBag size={11} className="text-[#d4af37] shrink-0" />
                <span className="truncate">
                  {showGross 
                    ? "Total em Produtos" 
                    : `Em Produtos (${productCommissionPct}%)`}
                </span>
              </div>
              <div className="text-sm font-bold text-foreground mt-0.5 truncate">
                {formatCurrency(
                  showGross 
                    ? dayCalculations.produtosBruto 
                    : dayCalculations.comissaoProdutos
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Seção da Lista de Lançamentos do Dia */}
        <div className="bg-card/70 border border-white/5 rounded-3xl p-4 shadow-md flex flex-col gap-3">
          
          {/* Header da Lista e Abas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Lançamentos do Dia
              </h2>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
              {dayCalculations.list.length} {dayCalculations.list.length === 1 ? "item" : "itens"}
            </span>
          </div>

          {/* Filtros em Abas Rápidas */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({dayCalculations.list.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("servicos")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "servicos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Serviços ({dayCalculations.servicosQtd})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("produtos")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "produtos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Vendas ({dayCalculations.produtosQtd})
            </button>
          </div>

          {/* Conteúdo da Lista */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span className="text-xs font-medium">Carregando movimentações...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground mb-3">
                <Wallet size={24} />
              </div>
              <p className="text-sm font-bold text-foreground">Nenhum lançamento encontrado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                {activeTab === "all"
                  ? `Não há atendimentos ou vendas vinculados a você em ${dateInfo.completo}.`
                  : `Nenhum registro encontrado nesta categoria para a data selecionada.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredList.map((item) => {
                const isServico = item.itemType === "servico"
                const isProduto = item.itemType === "produto"
                const isDespesa = item.itemType === "despesa"

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-background/80 hover:bg-background border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3 shadow-sm"
                  >
                    {/* Ícone e Detalhes */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0 flex items-center justify-center">
                        {isServico && <Scissors size={20} className="text-primary" />}
                        {isProduto && <ShoppingBag size={20} className="text-amber-400" />}
                        {isDespesa && <ArrowDownRight size={20} className="text-red-400" />}
                        {!isServico && !isProduto && !isDespesa && <DollarSign size={20} className="text-emerald-400" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground truncate" title={item.displayTitle}>
                            {item.displayTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          {item.displayClient && (
                            <span className="flex items-center gap-1 text-primary font-semibold truncate">
                              <User size={11} className="shrink-0" />
                              <span className="truncate">{item.displayClient}</span>
                            </span>
                          )}
                          {item.displayClient && <span>•</span>}
                          {item.timeFormatted && (
                            <span className="flex items-center gap-0.5 shrink-0">
                              <Clock size={11} /> {item.timeFormatted}
                            </span>
                          )}
                          {!item.displayClient && !item.timeFormatted && (
                            <span className="capitalize font-medium">{item.category || "Geral"}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-foreground">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
