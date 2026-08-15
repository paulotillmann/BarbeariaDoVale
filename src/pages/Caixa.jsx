import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Scissors, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Check,
  ChevronDown,
  ShoppingBag
} from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"
import SaleModal from "../components/SaleModal.jsx"

const ITEMS_PER_PAGE = 12

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

function formatCurrency(val) {
  return (Number(val) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

export default function Caixa() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState([])
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Filtros, Busca e Paginação
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all") // 'all', 'receita', 'despesa'
  const [periodFilter, setPeriodFilter] = useState("month") // 'month' (padrão), 'today', 'week', 'custom', 'all'
  const [selectedBarberFilter, setSelectedBarberFilter] = useState("all") // 'all' ou barber_id
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
  const [currentPage, setCurrentPage] = useState(1)

  // Modal de Transação
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formType, setFormType] = useState("despesa")
  const [formDescription, setFormDescription] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formCategory, setFormCategory] = useState("Geral")
  const [formDate, setFormDate] = useState("")
  const [formBarberId, setFormBarberId] = useState("")
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Modal de Confirmação
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  })

  // Modal de Vendas
  const [products, setProducts] = useState([])
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [selectedAppointmentForSale, setSelectedAppointmentForSale] = useState(null)

  const loadData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      // 1. Carregar Caixa
      const res = await fetch(`${API_URL}/api/caixa`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao carregar dados do caixa.")
      }
      const data = await res.json()
      setTransactions(data.transactions || [])

      // 2. Carregar Barbeiros (para associação em despesas/comissões ou filtros)
      const bRes = await fetch(`${API_URL}/api/barbers`)
      if (bRes.ok) {
        const bData = await bRes.json()
        setBarbers(bData || [])
      }

      // 3. Carregar Produtos para autocomplete de vendas
      const pRes = await fetch(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (pRes.ok) {
        const pData = await pRes.json()
        setProducts(Array.isArray(pData) ? pData : [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleOpenSaleModal = async (transaction) => {
    setError("")
    let saleId = null
    if (transaction.id && transaction.id.startsWith("caixa-sale-")) {
      saleId = transaction.id.replace("caixa-sale-", "")
    } else if (transaction.appointment_id) {
      try {
        const sRes = await fetch(`${API_URL}/api/sales/appointment/${transaction.appointment_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (sRes.ok) {
          const sData = await sRes.json()
          if (sData && sData.id) saleId = sData.id
        }
      } catch (err) {
        console.error("Erro ao buscar venda associada:", err)
      }
    }

    if (!saleId) {
      setError("Não foi possível localizar o código da venda associada.")
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        throw new Error("Venda não encontrada.")
      }
      const saleData = await res.json()
      if (!saleData) {
        throw new Error("Venda não encontrada.")
      }

      setSelectedSale(saleData)
      setSelectedAppointmentForSale({
        id: saleData.appointment_id || transaction.appointment_id || null,
        client_name: saleData.client_name || "Cliente",
        client_id: saleData.customer_id || null,
        appointment_time: saleData.appointment_time || transaction.date || ""
      })
      setIsSaleModalOpen(true)
    } catch (err) {
      setError(err.message || "Erro ao carregar dados da venda.")
    }
  }

  const handleSaveSale = async (salePayload) => {
    const url = salePayload.id ? `${API_URL}/api/sales/${salePayload.id}` : `${API_URL}/api/sales`
    const method = salePayload.id ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(salePayload)
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || "Erro ao salvar a venda.")
    }

    setSuccess("Venda atualizada com sucesso! Alterações sincronizadas no caixa e agendamentos.")
    setTimeout(() => setSuccess(""), 5000)
    await loadData()
  }

  const handleDeleteSale = async (saleId) => {
    const res = await fetch(`${API_URL}/api/sales/${saleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || "Erro ao excluir a venda.")
    }

    setSuccess("Venda e lançamento de caixa excluídos com sucesso!")
    setTimeout(() => setSuccess(""), 5000)
    await loadData()
  }

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    loadData()
  }, [user, navigate, loadData])

  const handleSyncManual = async () => {
    setSyncing(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`${API_URL}/api/caixa/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro ao sincronizar agendamentos.")
      }
      setSuccess(
        data.synced_count > 0
          ? `${data.synced_count} receita(s) de agendamento(s) sincronizada(s) com sucesso!`
          : "Caixa já está atualizado com todos os agendamentos realizados."
      )
      setTimeout(() => setSuccess(""), 5000)
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
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

  const resetForm = () => {
    setEditingId(null)
    setFormType("despesa")
    setFormDescription("")
    setFormAmount("")
    setFormCategory("Geral")
    setFormDate("")
    setFormBarberId("")
  }

  const handleOpenNewModal = (type = "despesa") => {
    resetForm()
    setFormType(type)
    // Define a data atual como padrão no input
    const now = new Date()
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setFormDate(localIso)
    setIsModalOpen(true)
  }

  const handleEditClick = (item) => {
    setEditingId(item.id)
    setFormType(item.type)
    setFormDescription(item.description || "")

    const cents = Math.round((item.amount || 0) * 100)
    const formattedPrice = (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
    setFormAmount(formattedPrice)

    setFormCategory(item.category || "Geral")
    setFormBarberId(item.barber_id || "")

    if (item.date) {
      const formattedIso = item.date.replace(" ", "T").slice(0, 16)
      setFormDate(formattedIso)
    } else {
      setFormDate("")
    }

    setIsModalOpen(true)
  }

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, "")
    if (!value) {
      setFormAmount("")
      return
    }
    const numberValue = parseFloat(value) / 100
    const formatted = numberValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
    setFormAmount(formatted)
  }

  const handleSaveTransaction = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setFormSubmitting(true)

    const priceClean = formAmount.replace(/\D/g, "")
    const priceFloat = priceClean ? parseFloat(priceClean) / 100 : 0

    if (!formDescription.trim()) {
      setError("A descrição é obrigatória.")
      setFormSubmitting(false)
      return
    }

    if (priceFloat <= 0) {
      setError("Informe um valor válido maior que zero.")
      setFormSubmitting(false)
      return
    }

    const payload = {
      type: formType,
      description: formDescription.trim(),
      amount: priceFloat,
      category: formCategory.trim() || "Geral",
      date: formDate ? formDate.replace("T", " ") : undefined,
      barber_id: formBarberId || null
    }

    try {
      const url = editingId ? `${API_URL}/api/caixa/${editingId}` : `${API_URL}/api/caixa`
      const method = editingId ? "PUT" : "POST"

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
        throw new Error(data.error || "Erro ao salvar lançamento.")
      }

      setSuccess(editingId ? "Lançamento atualizado com sucesso!" : "Lançamento registrado com sucesso!")
      setTimeout(() => setSuccess(""), 5000)

      setIsModalOpen(false)
      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteTransaction = (id) => {
    showConfirm(
      "Excluir Lançamento",
      "Tem certeza que deseja excluir este lançamento do caixa? Esta ação alterará os totais do fluxo de caixa.",
      () => executeDeleteTransaction(id)
    )
  }

  const executeDeleteTransaction = async (id) => {
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`${API_URL}/api/caixa/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao excluir lançamento.")
      }

      setSuccess("Lançamento excluído com sucesso!")
      setTimeout(() => setSuccess(""), 5000)
      await loadData()
    } catch (err) {
      setError(err.message)
    }
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

  // Filtragem local das transações baseada na busca, tipo, período e profissional
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Filtro por tipo
      if (typeFilter !== "all" && t.type !== typeFilter) {
        return false
      }

      // 2. Filtro por período
      if (periodFilter !== "all" && t.date) {
        const itemDateStr = t.date.split(" ")[0] // YYYY-MM-DD
        const now = new Date()
        const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

        if (periodFilter === "today") {
          if (itemDateStr !== todayStr) return false
        } else if (periodFilter === "month") {
          const monthStr = String(selectedMonth + 1).padStart(2, "0")
          const targetPrefix = `${selectedYear}-${monthStr}`
          if (!itemDateStr.startsWith(targetPrefix)) {
            return false
          }
        } else if (periodFilter === "week") {
          const d = new Date(itemDateStr + "T00:00:00")
          const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24)
          if (diffDays < 0 || diffDays > 7) return false
        } else if (periodFilter === "custom") {
          if (startDate && itemDateStr < startDate) return false
          if (endDate && itemDateStr > endDate) return false
        }
      }

      // 3. Filtro por profissional
      if (selectedBarberFilter !== "all" && selectedBarberFilter !== "") {
        const selectedB = barbers.find((b) => String(b.id) === String(selectedBarberFilter))
        const barberNameClean = selectedB ? selectedB.name.trim().toLowerCase() : ""

        const matchesId = t.barber_id && String(t.barber_id) === String(selectedBarberFilter)
        const matchesName = barberNameClean && t.barber_name && (
          t.barber_name.trim().toLowerCase() === barberNameClean ||
          t.barber_name.trim().toLowerCase().includes(barberNameClean) ||
          barberNameClean.includes(t.barber_name.trim().toLowerCase())
        )

        if (!matchesId && !matchesName) {
          return false
        }
      }

      // 4. Filtro por termo de busca (descrição, categoria, barbeiro, valor)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchDesc = t.description?.toLowerCase().includes(term)
        const matchCat = t.category?.toLowerCase().includes(term)
        const matchBarber = t.barber_name?.toLowerCase().includes(term)
        const matchAmount = t.amount?.toString().includes(term)
        if (!matchDesc && !matchCat && !matchBarber && !matchAmount) {
          return false
        }
      }

      return true
    })
  }, [transactions, typeFilter, periodFilter, selectedMonth, selectedYear, startDate, endDate, searchTerm, selectedBarberFilter, barbers])

  // Resetar para a primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, periodFilter, startDate, endDate, selectedBarberFilter, selectedMonth, selectedYear])

  // Paginação dos lançamentos filtrados (12 itens por página)
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTransactions, currentPage])

  // Recalcular os totais filtrados dinamicamente
  const filteredSummary = useMemo(() => {
    let rec = 0
    let desp = 0
    let serv = 0
    let prod = 0

    filteredTransactions.forEach((t) => {
      const v = Number(t.amount) || 0
      if (t.type === "receita") {
        rec += v
        const isProduto = t.category === "Venda de Produtos" || t.category === "Produto" || (t.id && t.id.startsWith("caixa-sale-"))
        if (isProduto) {
          prod += v
        } else {
          serv += v
        }
      } else if (t.type === "despesa") {
        desp += v
      }
    })

    const pctServ = rec > 0 ? (serv / rec) * 100 : 0
    const pctProd = rec > 0 ? (prod / rec) * 100 : 0

    return {
      total_receitas: rec,
      total_despesas: desp,
      saldo: rec - desp,
      total_servicos: serv,
      total_produtos: prod,
      pct_servicos: pctServ,
      pct_produtos: pctProd
    }
  }, [filteredTransactions])

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
        {/* Notificações */}
        {success && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-4 shadow-sm animate-fade-in">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 shadow-sm animate-fade-in">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cabeçalho da Página */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[18pt] font-bold font-display mb-2 flex items-center gap-2 text-foreground">
                <Wallet className="text-primary w-7 h-7" /> Fluxo de Caixa
              </h2>
              <p className="text-sm text-muted-foreground">
                Controle financeiro completo da Barbearia Do Vale. Lançamentos de receitas de serviços e despesas operacionais.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSyncManual}
                disabled={syncing}
                className="flex items-center justify-center gap-2 bg-background border border-border/80 hover:border-primary/40 text-foreground font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Sincronizar receitas de agendamentos realizados"
              >
                <RefreshCw size={15} className={syncing ? "animate-spin text-primary" : "text-primary"} />
                {syncing ? "Sincronizando..." : "Sincronizar Agendamentos"}
              </button>

              <button
                onClick={() => handleOpenNewModal("despesa")}
                className="flex items-center justify-center gap-2 bg-destructive/20 border border-destructive/40 hover:bg-destructive/30 text-destructive-foreground font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer"
              >
                <Plus size={15} /> Nova Despesa
              </button>

              <button
                onClick={() => handleOpenNewModal("receita")}
                className="flex items-center justify-center gap-2 bg-gold-gradient hover:shadow-gold-sm text-black font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Plus size={15} /> Nova Receita
              </button>
            </div>
          </div>

          {/* Cards de Resumo Financeiro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Card Total Receitas */}
            <div className="bg-muted/30 border border-green-500/30 rounded-2xl p-5 relative overflow-hidden group shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ArrowUpRight size={16} className="text-green-400" /> Total Receitas
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="font-display font-black text-2xl text-green-400">
                  {formatCurrency(filteredSummary.total_receitas)}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Entradas de serviços e vendas
              </p>
            </div>

            {/* Card Soma de Serviços */}
            <div className="bg-muted/30 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden group shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Scissors size={16} className="text-amber-400" /> Serviços
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Scissors size={18} />
                  </div>
                </div>
                <div className="font-display font-black text-2xl text-amber-400">
                  {formatCurrency(filteredSummary.total_servicos)}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/20">
                <p className="text-[10px] text-muted-foreground">
                  Cortes & Serviços
                </p>
                <span className="text-xs font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg font-mono shadow-xs">
                  {filteredSummary.pct_servicos.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Card Produtos Vendidos */}
            <div className="bg-muted/30 border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden group shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShoppingBag size={16} className="text-cyan-400" /> Produtos
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <div className="font-display font-black text-2xl text-cyan-400">
                  {formatCurrency(filteredSummary.total_produtos)}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/20">
                <p className="text-[10px] text-muted-foreground">
                  Venda de Produtos
                </p>
                <span className="text-xs font-black text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-lg font-mono shadow-xs">
                  {filteredSummary.pct_produtos.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Card Total Despesas */}
            <div className="bg-muted/30 border border-rose-500/30 rounded-2xl p-5 relative overflow-hidden group shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ArrowDownRight size={16} className="text-rose-400" /> Total Despesas
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <TrendingDown size={18} />
                  </div>
                </div>
                <div className="font-display font-black text-2xl text-rose-400">
                  {formatCurrency(filteredSummary.total_despesas)}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Saídas operacionais e custos
              </p>
            </div>

            {/* Card Saldo Líquido */}
            <div className={`bg-muted/30 border rounded-2xl p-5 relative overflow-hidden group shadow-sm flex flex-col justify-between ${
              filteredSummary.saldo >= 0 ? "border-gold-subtle" : "border-destructive/40"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <DollarSign size={16} className="text-primary" /> Saldo em Caixa
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Wallet size={18} />
                  </div>
                </div>
                <div className={`font-display font-black text-2xl ${
                  filteredSummary.saldo >= 0 ? "text-primary" : "text-rose-400"
                }`}>
                  {filteredSummary.saldo < 0
                    ? `- ${formatCurrency(Math.abs(filteredSummary.saldo))}`
                    : formatCurrency(filteredSummary.saldo)}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Balanço final do período
              </p>
            </div>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6 pt-4 border-t border-border/40">
            {/* Campo de Busca por Texto */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por descrição, categoria, cliente ou barbeiro..."
                className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filtros por Profissional, Tipo e Período */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Dropdown de Filtro por Profissional */}
              <div className="relative" ref={barberDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsBarberDropdownOpen((prev) => !prev)}
                  className="flex items-center justify-between gap-2.5 bg-background border border-border hover:border-primary/50 text-foreground text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-xs min-w-[200px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    {selectedBarberFilter === "all" ? (
                      <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                        <User size={13} />
                      </div>
                    ) : (
                      (() => {
                        const selectedBarber = barbers.find((b) => String(b.id) === String(selectedBarberFilter))
                        const bIndex = barbers.findIndex((b) => String(b.id) === String(selectedBarberFilter))
                        const photo = selectedBarber?.photo || (
                          bIndex === 0 ? "/assets/marcio-barber.jpeg" :
                          bIndex === 1 ? "/assets/lucas-barber.jpeg" :
                          "/assets/neto-barber.jpeg"
                        )
                        return (
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-gold-subtle shrink-0 bg-background flex items-center justify-center">
                            {photo ? (
                              <img src={photo} alt={selectedBarber?.name} className="w-full h-full object-cover" />
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
                        : (barbers.find((b) => String(b.id) === String(selectedBarberFilter))?.name || "Profissional")}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${isBarberDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isBarberDropdownOpen && (
                  <div className="absolute right-0 lg:left-0 lg:right-auto top-full mt-1.5 w-64 bg-[#1c1c20] border border-border/80 rounded-2xl shadow-elevated z-50 overflow-hidden animate-scale-in py-1">
                    <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                      Filtrar por Profissional
                    </div>

                    {/* Opção Todos */}
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

                    {/* Lista de Barbeiros */}
                    {barbers.map((b, index) => {
                      const isSelected = String(selectedBarberFilter) === String(b.id)
                      const photo = b.photo || (
                        index === 0 ? "/assets/marcio-barber.jpeg" :
                        index === 1 ? "/assets/lucas-barber.jpeg" :
                        "/assets/neto-barber.jpeg"
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

              {/* Filtro por Tipo */}
              <div className="flex items-center bg-background border border-border rounded-xl p-1">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    typeFilter === "all" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setTypeFilter("receita")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    typeFilter === "receita" ? "bg-green-500 text-black" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Receitas
                </button>
                <button
                  onClick={() => setTypeFilter("despesa")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    typeFilter === "despesa" ? "bg-rose-500 text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Despesas
                </button>
              </div>

              {/* Filtro por Mês Selector (Month Picker) */}
              <div className="relative" ref={monthPickerRef}>
                <button
                  type="button"
                  onClick={() => {
                    setPickerYear(selectedYear)
                    setIsMonthPickerOpen((prev) => !prev)
                  }}
                  className={`flex items-center justify-between gap-2.5 bg-background border text-xs font-bold py-2 px-3.5 rounded-xl transition-all cursor-pointer shadow-xs min-w-[170px] ${
                    periodFilter === "month"
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
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#1c1c20] border border-border/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in p-4">
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
                            className={`py-2 px-3 text-xs font-bold rounded-xl text-center transition-all cursor-pointer ${
                              isSelected
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
                        className={`w-full py-2 px-3 rounded-xl border border-dashed text-xs font-bold transition-all text-center cursor-pointer ${
                          periodFilter === "all"
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

              {/* Filtros de Atalho de Período */}
              <div className="flex items-center bg-background border border-border rounded-xl p-1 gap-1">
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
                  onClick={() => setPeriodFilter("all")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    periodFilter === "all" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Geral
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

              {/* Datas para filtro personalizado */}
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
            </div>
          </div>

          {/* Grid / Tabela de Lançamentos */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Carregando lançamentos do caixa...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-muted/10 space-y-3">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
              <h4 className="text-base font-bold text-foreground">Nenhum lançamento encontrado</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {searchTerm || typeFilter !== "all" || periodFilter !== "all"
                  ? "Tente ajustar os filtros ou os termos de busca informados."
                  : "Nenhum lançamento foi registrado ainda. Agendamentos concluídos serão adicionados automaticamente ou você pode inserir manualmente."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-4">Data / Hora</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Descrição</th>
                    <th className="py-3.5 px-4">Profissional</th>
                    <th className="py-3.5 px-4 text-right">Valor</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  {paginatedTransactions.map((t) => {
                    const isReceita = t.type === "receita"
                    const dateFormatted = formatDateBR(t.date)

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        {/* Data */}
                        <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-primary/70" />
                            {dateFormatted}
                          </span>
                        </td>

                        {/* Tipo (Badge) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isReceita ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/15 border border-green-500/30 text-green-400 font-bold px-2.5 py-1 rounded-full">
                              <ArrowUpRight size={12} /> Receita
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold px-2.5 py-1 rounded-full">
                              <ArrowDownRight size={12} /> Despesa
                            </span>
                          )}
                        </td>

                        {/* Categoria */}
                        <td className="py-3.5 px-4 font-semibold text-foreground whitespace-nowrap">
                          <span className="bg-background/60 border border-border/50 px-2.5 py-1 rounded-lg">
                            {t.category || "Geral"}
                          </span>
                        </td>

                        {/* Descrição */}
                        <td className="py-3.5 px-4 max-w-xs font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <span className="line-clamp-2">{t.description}</span>
                            {t.appointment_id && (
                              <span className="shrink-0 text-[9px] bg-primary/10 border border-primary/30 text-primary font-bold px-1.5 py-0.5 rounded" title="Gerado automaticamente de agendamento">
                                <Scissors size={10} className="inline mr-1" /> Auto
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Profissional */}
                        <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                          {t.barber_name ? (
                            <span className="font-semibold text-foreground">
                              {t.barber_name}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Valor */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm whitespace-nowrap">
                          <span className={isReceita ? "text-green-400" : "text-rose-400"}>
                            {isReceita ? "+ " : "- "}
                            {formatCurrency(Math.abs(Number(t.amount) || 0))}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {(t.id?.startsWith("caixa-sale-") || t.category === "Venda de Produtos") && (
                              <button
                                onClick={() => handleOpenSaleModal(t)}
                                className="p-1.5 rounded-lg bg-gold-gradient/10 border border-gold-subtle/40 hover:bg-gold-gradient hover:text-black text-primary transition-all cursor-pointer shadow-xs"
                                title="Ver / Editar Informações da Venda"
                              >
                                <ShoppingBag size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(t)}
                              className="p-1.5 rounded-lg bg-background border border-border hover:border-primary/50 text-foreground hover:text-primary transition-all cursor-pointer"
                              title="Editar Lançamento"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive text-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                              title="Excluir Lançamento"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Controles de Paginação (12 itens por página) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/40 bg-muted/20">
                  <div className="text-xs text-muted-foreground">
                    Mostrando <span className="font-bold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> até{" "}
                    <span className="font-bold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}</span> de{" "}
                    <span className="font-bold text-foreground">{filteredTransactions.length}</span> lançamentos
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-background border border-border hover:border-primary/50 text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
                      title="Página Anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          currentPage === page
                            ? "bg-primary text-background font-black shadow-sm"
                            : "bg-background border border-border/70 text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-background border border-border hover:border-primary/50 text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
                      title="Próxima Página"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO PERSONALIZADO */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1c1c20]/95 backdrop-blur-xl w-full max-w-sm border border-destructive/30 rounded-2xl p-6 md:p-8 shadow-2xl relative animate-scale-in text-center">
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

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE TRANSAÇÕES DO CAIXA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1c1c20]/95 backdrop-blur-xl w-full max-w-lg border border-primary/30 rounded-2xl p-6 md:p-8 shadow-2xl relative animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-display text-primary flex items-center gap-2">
                {editingId ? <Pencil size={20} /> : <Plus size={20} />}
                {editingId ? "Editar Lançamento" : `Novo Lançamento (${formType === 'receita' ? 'Receita' : 'Despesa'})`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Seleção do Tipo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Tipo de Lançamento *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormType("receita")}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      formType === "receita"
                        ? "bg-green-500/20 border-green-500 text-green-400"
                        : "bg-background border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <ArrowUpRight size={16} /> Receita (+ Entrada)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("despesa")}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      formType === "despesa"
                        ? "bg-rose-500/20 border-rose-500 text-rose-400"
                        : "bg-background border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <ArrowDownRight size={16} /> Despesa (- Saída)
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Descrição do Lançamento *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={formType === 'receita' ? "Ex: Venda de pomada modeladora" : "Ex: Conta de energia elétrica / Aluguel"}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Valor */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAmount}
                    onChange={handleAmountChange}
                    placeholder="R$ 0,00"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all font-mono text-right font-bold text-primary"
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Serviço">Serviço</option>
                    <option value="Produto">Produto</option>
                    <option value="Aluguel">Aluguel</option>
                    <option value="Contas">Contas (Água/Luz/Internet)</option>
                    <option value="Salário">Salário / Comissão</option>
                    <option value="Manutenção">Manutenção / Equipamentos</option>
                    <option value="Geral">Geral / Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data e Hora */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Data e Hora do Lançamento
                  </label>
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                {/* Profissional (Opcional) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Profissional Associado (Opcional)
                  </label>
                  <select
                    value={formBarberId}
                    onChange={(e) => setFormBarberId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Nenhum / Geral da Barbearia</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t border-border/40 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="flex-1 py-3 px-4 bg-muted/40 hover:bg-muted/60 text-foreground text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-3 px-4 bg-gold-gradient text-black text-xs uppercase tracking-wider font-bold rounded-xl shadow-gold-sm hover:shadow-gold-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : editingId ? "Salvar Alterações" : "Registrar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE INFORMAÇÕES E EDIÇÃO DE VENDA */}
      {isSaleModalOpen && (
        <SaleModal
          isOpen={isSaleModalOpen}
          onClose={() => {
            setIsSaleModalOpen(false)
            setSelectedSale(null)
            setSelectedAppointmentForSale(null)
          }}
          appointment={selectedAppointmentForSale}
          existingSale={selectedSale}
          products={products}
          onSaveSale={handleSaveSale}
          onDeleteSale={handleDeleteSale}
        />
      )}
    </div>
  )
}
