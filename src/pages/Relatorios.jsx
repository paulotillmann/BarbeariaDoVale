import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { 
  FileText, 
  Users, 
  Package, 
  Wallet, 
  Percent, 
  TrendingUp, 
  CalendarRange, 
  Printer, 
  X, 
  Search, 
  Scissors,
  Calculator,
  CheckCircle2
} from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

export default function Relatorios() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  // Estados gerais
  const [activeReport, setActiveReport] = useState(null)

  // Filtros de busca/data para os relatórios
  const [searchFilter, setSearchFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedBarberId, setSelectedBarberId] = useState("todos")

  // Estado específico para o relatório de comissões
  const [isCommissionCalculated, setIsCommissionCalculated] = useState(false)
  const [commissionResults, setCommissionResults] = useState([])

  // Dados carregados da API
  const [customersData, setCustomersData] = useState([])
  const [productsData, setProductsData] = useState([])
  const [cashFlowData, setCashFlowData] = useState([])
  const [appointmentsData, setAppointmentsData] = useState([])
  const [barbersData, setBarbersData] = useState([])
  const [salesData, setSalesData] = useState([])
  const [servicesData, setServicesData] = useState([])

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    // Carrega dados iniciais da API
    async function loadInitialData() {
      try {
        const headers = { Authorization: `Bearer ${token}` }
        
        // Clientes
        fetch(`${API_URL}/api/customers`, { headers })
          .then(res => res.ok ? res.json() : [])
          .then(data => setCustomersData(Array.isArray(data) ? data : []))
          .catch(() => {})

        // Produtos
        fetch(`${API_URL}/api/products`, { headers })
          .then(res => res.ok ? res.json() : [])
          .then(data => setProductsData(Array.isArray(data) ? data : []))
          .catch(() => {})

        // Serviços (para cálculo de valores de atendimentos)
        fetch(`${API_URL}/api/services`)
          .then(res => res.ok ? res.json() : [])
          .then(data => setServicesData(Array.isArray(data) ? data : []))
          .catch(() => {})

        // Agendamentos
        fetch(`${API_URL}/api/appointments`, { headers })
          .then(res => res.ok ? res.json() : [])
          .then(data => setAppointmentsData(Array.isArray(data) ? data : []))
          .catch(() => {})

        // Barbeiros
        fetch(`${API_URL}/api/barbers`, { headers })
          .then(res => res.ok ? res.json() : [])
          .then(data => setBarbersData(Array.isArray(data) ? data : []))
          .catch(() => {})

        // Fluxo de caixa
        fetch(`${API_URL}/api/caixa`, { headers })
          .then(res => res.ok ? res.json() : {})
          .then(data => setCashFlowData(Array.isArray(data.transactions) ? data.transactions : (Array.isArray(data) ? data : [])))
          .catch(() => {})

        // Vendas de produtos
        fetch(`${API_URL}/api/sales/all`, { headers })
          .then(res => res.ok ? res.json() : [])
          .then(data => setSalesData(Array.isArray(data) ? data : []))
          .catch(() => {})

      } catch (err) {
        console.error("Erro ao carregar dados dos relatórios:", err)
      }
    }

    loadInitialData()
  }, [user, token, navigate])

  // Helper para obter o valor real de um agendamento / serviço
  const getAppointmentPrice = (a) => {
    // 1. Valor direto no objeto do agendamento
    const directPrice = Number(a.price || a.total_price || a.value || a.amount || 0)
    if (directPrice > 0) return directPrice

    // 2. Busca no lançamento sincronizado do Caixa
    const matchedTx = cashFlowData.find(t => t.appointment_id === a.id || t.id === `cx-srv-${a.id}`)
    if (matchedTx && Number(matchedTx.amount || matchedTx.valor) > 0) {
      return Number(matchedTx.amount || matchedTx.valor)
    }

    // 3. Busca o preço cadastrado na tabela de Serviços pelos service_ids
    const rawIds = a.service_ids || a.service_id
    if (!rawIds) return 0

    const ids = Array.isArray(rawIds)
      ? rawIds
      : String(rawIds).split(',').filter(Boolean)

    let sum = 0
    ids.forEach(id => {
      const srv = servicesData.find(s => String(s.id) === String(id))
      if (srv) {
        sum += Number(srv.price || srv.valor || 0)
      }
    })
    return sum
  }

  // Reseta o estado de cálculo de comissão ao trocar de relatório ou alterar filtros
  const handleOpenReport = (reportId) => {
    setActiveReport(reportId)
    setSearchFilter("")
    setStartDate("")
    setEndDate("")
    setSelectedBarberId("todos")
    setIsCommissionCalculated(false)
    setCommissionResults([])
  }

  // Função para calcular a comissão dos profissionais com base nos filtros
  const handleCalculateCommissions = () => {
    const targetBarbers = selectedBarberId === "todos"
      ? barbersData
      : barbersData.filter(b => String(b.id) === String(selectedBarberId))

    const calculated = targetBarbers.map((barber) => {
      const barberIdStr = String(barber.id)
      const barberNameClean = (barber.name || "").trim().toLowerCase()

      // 1. Filtrar Agendamentos/Serviços do Barbeiro no período
      const barberAppts = appointmentsData.filter((a) => {
        // Status: concluído/confirmado (não cancelado)
        if (a.status === 'cancelled' || a.status === 'cancelado') return false

        // Barbeiro
        const apptBarberId = String(a.barber_id || a.barberId || "")
        const apptBarberName = (a.barber_name || a.barberName || "").trim().toLowerCase()
        const isBarberMatch = apptBarberId === barberIdStr || (barberNameClean && apptBarberName.includes(barberNameClean))
        if (!isBarberMatch) return false

        // Data
        const apptDateStr = (a.appointment_time || a.date || a.created_at || "").split("T")[0].split(" ")[0]
        if (startDate && apptDateStr < startDate) return false
        if (endDate && apptDateStr > endDate) return false

        return true
      })

      const serviceCount = barberAppts.length
      const serviceTotal = barberAppts.reduce((acc, a) => acc + getAppointmentPrice(a), 0)
      const serviceCommPct = Number(barber.service_commission ?? barber.serviceCommission ?? barber.commission_rate ?? 50)
      const serviceCommValue = (serviceTotal * serviceCommPct) / 100

      // 2. Filtrar Vendas de Produtos do Barbeiro no período (a partir de salesData e caixaTransactions)
      let productCount = 0
      let productTotal = 0

      // Vendas via API de Sales
      salesData.forEach((s) => {
        const sBarberId = String(s.barber_id || s.barberId || "")
        const sBarberName = (s.barber_name || s.barberName || "").trim().toLowerCase()
        const isBarberMatch = sBarberId === barberIdStr || (barberNameClean && sBarberName.includes(barberNameClean))
        if (!isBarberMatch) return

        const sDateStr = (s.created_at || s.date || "").split("T")[0].split(" ")[0]
        if (startDate && sDateStr < startDate) return false
        if (endDate && sDateStr > endDate) return false

        let items = s.items
        if (typeof items === "string") {
          try { items = JSON.parse(items) } catch { items = [] }
        }

        let saleTotal = Number(s.total || s.total_price || s.total_amount || s.amount || 0)
        let saleQty = 0

        if (Array.isArray(items) && items.length > 0) {
          items.forEach((it) => {
            const q = Number(it.quantity) || 1
            saleQty += q
            if (!saleTotal) {
              saleTotal += q * (Number(it.unit_price || it.price || 0))
            }
          })
        }

        productCount += (saleQty || 1)
        productTotal += saleTotal
      })

      // Vendas adicionais registradas direto no Caixa (se não duplicadas)
      cashFlowData.forEach((t) => {
        if (t.type !== "receita") return
        const catLower = (t.category || "").toLowerCase()
        const descLower = (t.description || "").toLowerCase()
        const isProduto = catLower.includes("produto") || descLower.includes("produto") || (t.id && String(t.id).startsWith("caixa-sale-"))
        if (!isProduto) return

        const tBarberId = String(t.barber_id || "")
        const tBarberName = (t.barber_name || "").trim().toLowerCase()
        const isBarberMatch = tBarberId === barberIdStr || (barberNameClean && tBarberName.includes(barberNameClean))
        if (!isBarberMatch) return

        const tDateStr = (t.date || t.created_at || "").split(" ")[0].split("T")[0]
        if (startDate && tDateStr < startDate) return false
        if (endDate && tDateStr > endDate) return false

        // Evita duplicar se a venda já foi processada em salesData
        if (t.id && String(t.id).startsWith("caixa-sale-")) {
          const saleId = String(t.id).replace("caixa-sale-", "")
          if (salesData.some(s => String(s.id) === saleId)) return
        }

        const val = Number(t.amount || t.valor || 0)
        const match = t.description ? t.description.match(/\((\d+)\s+iten/i) || t.description.match(/\((\d+)\s+item/i) : null
        const qty = match ? parseInt(match[1], 10) : 1

        productCount += qty
        productTotal += val
      })

      const productCommPct = Number(barber.product_commission ?? barber.productCommission ?? 10)
      const productCommValue = (productTotal * productCommPct) / 100

      const totalCommission = serviceCommValue + productCommValue

      return {
        barberId: barber.id,
        barberName: barber.name,
        serviceCount,
        serviceTotal,
        serviceCommPct,
        serviceCommValue,
        productCount,
        productTotal,
        productCommPct,
        productCommValue,
        totalCommission
      }
    })

    setCommissionResults(calculated)
    setIsCommissionCalculated(true)
  }

  const reportsList = [
    {
      id: "clientes",
      title: "Clientes",
      icon: <Users className="w-6 h-6" />,
      description: "Listagem cadastral de clientes com informações de contato, telefone, endereço, data de nascimento e histórico de cadastro.",
      badge: "Cadastro & Fichas"
    },
    {
      id: "produtos",
      title: "Produtos",
      icon: <Package className="w-6 h-6" />,
      description: "Relatório de inventário e estoque de produtos com preços de custo, venda, quantidade disponível e valor total em estoque.",
      badge: "Estoque & Vendas"
    },
    {
      id: "fluxo_caixa",
      title: "Fluxo de Caixa",
      icon: <Wallet className="w-6 h-6" />,
      description: "Demonstrativo financeiro completo com movimentações de entradas, saídas, formas de pagamento e saldo total do caixa.",
      badge: "Financeiro & Caixa"
    },
    {
      id: "comissao_profissional",
      title: "Comissão do Profissional",
      icon: <Percent className="w-6 h-6" />,
      description: "Relatório detalhado de comissões calculadas por serviços e produtos para cada profissional no período filtrado.",
      badge: "Repasse & Equipe"
    },
    {
      id: "faturamento",
      title: "Faturamento",
      icon: <TrendingUp className="w-6 h-6" />,
      description: "Balanço geral de faturamento consolidado por período, divisão entre serviços e produtos vendidos e média de ticket.",
      badge: "Receita & Balanço"
    },
    {
      id: "agendamentos",
      title: "Agendamentos",
      icon: <CalendarRange className="w-6 h-6" />,
      description: "Histórico completo de horários marcados, atendimentos concluídos, cancelamentos e valores por cliente e barbeiro.",
      badge: "Agenda & Atendimentos"
    }
  ]

  const formatCurrency = (val) => {
    const num = Number(val) || 0
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (isoString) => {
    if (!isoString) return "-"
    try {
      const parts = isoString.split("T")[0].split("-")
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return isoString
    } catch {
      return isoString
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Filtragem de dados para os outros relatórios
  const getFilteredAppointments = () => {
    return appointmentsData.filter(item => {
      if (startDate && new Date(item.date || item.created_at) < new Date(startDate)) return false
      if (endDate && new Date(item.date || item.created_at) > new Date(endDate + 'T23:59:59')) return false
      if (selectedBarberId !== "todos" && String(item.barber_id || item.barberId) !== String(selectedBarberId)) return false
      if (searchFilter) {
        const search = searchFilter.toLowerCase()
        const clientName = (item.customer_name || item.clientName || "").toLowerCase()
        const barberName = (item.barber_name || item.barberName || "").toLowerCase()
        const serviceName = (item.service_name || item.serviceName || "").toLowerCase()
        if (!clientName.includes(search) && !barberName.includes(search) && !serviceName.includes(search)) return false
      }
      return true
    })
  }

  const getFilteredCustomers = () => {
    if (!searchFilter) return customersData
    const search = searchFilter.toLowerCase()
    return customersData.filter(c => 
      (c.name && c.name.toLowerCase().includes(search)) ||
      (c.phone && c.phone.includes(search)) ||
      (c.address && c.address.toLowerCase().includes(search))
    )
  }

  const getFilteredProducts = () => {
    if (!searchFilter) return productsData
    const search = searchFilter.toLowerCase()
    return productsData.filter(p => 
      (p.name && p.name.toLowerCase().includes(search)) ||
      (p.category && p.category.toLowerCase().includes(search))
    )
  }

  // Somatórias do relatório de comissão para a linha de totais
  const sumCommissionTotals = () => {
    return commissionResults.reduce((acc, curr) => {
      acc.serviceCount += curr.serviceCount
      acc.serviceTotal += curr.serviceTotal
      acc.serviceCommValue += curr.serviceCommValue
      acc.productCount += curr.productCount
      acc.productTotal += curr.productTotal
      acc.productCommValue += curr.productCommValue
      acc.totalCommission += curr.totalCommission
      return acc
    }, {
      serviceCount: 0,
      serviceTotal: 0,
      serviceCommValue: 0,
      productCount: 0,
      productTotal: 0,
      productCommValue: 0,
      totalCommission: 0
    })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-transparent text-foreground pt-24 pb-28 lg:pt-8 lg:pb-12 pr-[40px] pl-4 md:pl-8 relative lg:pl-[274px] sidebar-page-container flex flex-col justify-start">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

          @media print {
            @page {
              size: portrait;
              margin: 8mm 8mm 8mm 8mm;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              height: auto !important;
              min-height: 100% !important;
              overflow: visible !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-area, #printable-area * {
              visibility: visible !important;
            }
            /* Desativa restrições de contêineres e modais que cortam o relatório */
            .fixed, .overflow-y-auto, .overflow-hidden, div[class*="max-h-"] {
              position: static !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            #printable-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              color: #000000 !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            #printable-area *, #printable-area span, #printable-area p, #printable-area h1, #printable-area h2, #printable-area td, #printable-area th {
              color: #000000 !important;
            }
            .no-print {
              display: none !important;
            }
            .print-table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
            }
            .print-table th, .print-table td {
              border: 1px solid #cbd5e1 !important;
              padding: 5px 6px !important;
              text-align: left !important;
              color: #000000 !important;
              font-size: 8.5pt !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
            }
            .print-table th {
              background-color: #f1f5f9 !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
              font-size: 8pt !important;
            }
            .print-table tfoot td {
              background-color: #f1f5f9 !important;
              font-weight: bold !important;
              border-top: 2px solid #000000 !important;
              font-size: 9pt !important;
            }
          }
        `}
      </style>

      {/* Sidebar Navigation */}
      <Sidebar />

      <div className="w-full relative z-10 animate-fade-in no-print">
        <div className="space-y-6 mt-[40px]">
          
          {/* Header da Tela */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/80 pb-6 mb-6">
              <div>
                <h2 className="text-[18pt] font-bold font-display flex items-center gap-2.5">
                  <FileText className="text-primary w-7 h-7" /> Relatórios do Sistema
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione um relatório abaixo para visualizar os dados consolidados e emitir em PDF/Impressão.
                </p>
              </div>
            </div>

            {/* Lista dos 6 Relatórios no formato de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportsList.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleOpenReport(report.id)}
                  className="bg-muted/30 border border-border/80 hover:border-primary/60 rounded-2xl p-5 hover:bg-card/60 transition-all duration-300 shadow-sm flex items-start gap-4 cursor-pointer group relative overflow-hidden"
                >
                  {/* Ícone representativo no estilo do modelo em anexo */}
                  <div className="w-13 h-13 rounded-2xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0 group-hover:bg-gold-gradient group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    {report.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors tracking-wide">
                        {report.title}
                      </h3>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {report.badge}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-primary group-hover:translate-x-1 transition-transform duration-300">
                      <Printer size={13} /> Visualizar e Imprimir PDF &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO E IMPRESSÃO DE RELATÓRIO */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#121215] border border-gold-subtle rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/80 bg-card/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-gradient text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
                  {reportsList.find(r => r.id === activeReport)?.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
                    Relatório de {reportsList.find(r => r.id === activeReport)?.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Barbearia Do Vale &bull; Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={activeReport === "comissao_profissional" && !isCommissionCalculated}
                  title={activeReport === "comissao_profissional" && !isCommissionCalculated ? "Preencha os filtros e clique em 'Gerar Dados' para habilitar a impressão" : "Imprimir relatório em PDF"}
                  className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 font-bold h-10 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    activeReport === "comissao_profissional" && !isCommissionCalculated
                      ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed border border-border"
                      : "bg-gold-gradient text-primary-foreground shadow-gold hover:shadow-gold-lg hover:scale-102"
                  }`}
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReport(null)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Filters */}
            <div className="p-4 bg-muted/20 border-b border-border/60 flex flex-wrap items-center gap-3 text-xs shrink-0">
              {activeReport !== "comissao_profissional" && (
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar dados..."
                    className="w-full bg-background/60 border border-border focus:border-primary rounded-xl py-2 pl-9 pr-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none"
                  />
                </div>
              )}

              {(activeReport === "agendamentos" || activeReport === "comissao_profissional" || activeReport === "faturamento" || activeReport === "fluxo_caixa") && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Início:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value)
                        if (activeReport === "comissao_profissional") setIsCommissionCalculated(false)
                      }}
                      className="bg-background/60 border border-border focus:border-primary rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none"
                      title="Data Inicial"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fim:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value)
                        if (activeReport === "comissao_profissional") setIsCommissionCalculated(false)
                      }}
                      className="bg-background/60 border border-border focus:border-primary rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none"
                      title="Data Final"
                    />
                  </div>
                </>
              )}

              {(activeReport === "comissao_profissional" || activeReport === "agendamentos") && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Profissional:</span>
                  <select
                    value={selectedBarberId}
                    onChange={(e) => {
                      setSelectedBarberId(e.target.value)
                      if (activeReport === "comissao_profissional") setIsCommissionCalculated(false)
                    }}
                    className="bg-background/60 border border-border focus:border-primary rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none cursor-pointer min-w-[180px]"
                  >
                    <option value="todos">Todos os Profissionais</option>
                    {barbersData.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botão GERAR DADOS exclusivo do relatório de Comissão do Profissional */}
              {activeReport === "comissao_profissional" && (
                <button
                  type="button"
                  onClick={handleCalculateCommissions}
                  className="inline-flex items-center justify-center gap-2 bg-gold-gradient text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:scale-102 transition-all cursor-pointer ml-auto"
                >
                  <Calculator size={15} /> Gerar Dados
                </button>
              )}
            </div>

            {/* Modal Body / Report Preview */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Conteúdo Imprimível */}
              <div id="printable-area" className="bg-card/20 p-4 md:p-6 rounded-2xl border border-border/40 space-y-6">
                
                {/* Header Institucional Elegante do Relatório (Tela e Impressão) */}
                <div className="border-b border-border/80 pb-3 mb-4 print:border-b-2 print:border-black">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src="/assets/logo-nova-sem-borda.png" alt="Barbearia Do Vale" className="h-12 md:h-14 w-auto object-contain shrink-0" />
                      <div>
                        <h1 className="text-base md:text-lg font-black uppercase tracking-wider text-foreground print:text-black font-display leading-tight">BARBEARIA DO VALE</h1>
                        <h2 className="text-[11px] font-bold text-primary print:text-gray-800 uppercase tracking-widest mt-0.5">
                          RELATÓRIO DE {reportsList.find(r => r.id === activeReport)?.title?.toUpperCase()}
                        </h2>
                      </div>
                    </div>
                    <div className="text-right text-[9px] text-muted-foreground print:text-gray-700 space-y-0.5 font-mono shrink-0">
                      <p><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p><strong>Responsável:</strong> {user.name}</p>
                      <p><strong>Página:</strong> 1 de 1</p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-border/60 print:border-gray-300 text-[10px] text-muted-foreground print:text-gray-800 flex justify-between items-center gap-2">
                    <span>
                      <strong>Período:</strong> {startDate ? formatDate(startDate) : "Início do Sistema"} até {endDate ? formatDate(endDate) : "Data Atual"}
                    </span>
                    <span className="text-right">
                      <strong>Profissional:</strong> {selectedBarberId === "todos" ? "Todos os Profissionais" : (barbersData.find(b => String(b.id) === String(selectedBarberId))?.name || "Selecionado")}
                    </span>
                  </div>
                </div>

                {/* 1. RELATÓRIO DE CLIENTES */}
                {activeReport === "clientes" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
                      <span>Fichas Cadastrais ({getFilteredCustomers().length} Clientes)</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse print-table">
                        <thead>
                          <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                            <th className="p-3">Nome do Cliente</th>
                            <th className="p-3">Celular / WhatsApp</th>
                            <th className="p-3">Data Nascimento</th>
                            <th className="p-3">Endereço</th>
                            <th className="p-3">Cadastrado em</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {getFilteredCustomers().length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-6 text-center text-muted-foreground">
                                Nenhum cliente encontrado para os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            getFilteredCustomers().map((c) => (
                              <tr key={c.id} className="hover:bg-muted/20">
                                <td className="p-3 font-semibold text-foreground">{c.name}</td>
                                <td className="p-3 text-primary font-medium">{c.phone || "-"}</td>
                                <td className="p-3 text-muted-foreground">{c.birth_date ? formatDate(c.birth_date) : "-"}</td>
                                <td className="p-3 text-muted-foreground">{c.address || "-"}</td>
                                <td className="p-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. RELATÓRIO DE PRODUTOS */}
                {activeReport === "produtos" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 no-print">
                      <div className="bg-background/40 border border-border p-4 rounded-xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Itens em Estoque</span>
                        <p className="text-xl font-bold text-primary mt-1">
                          {getFilteredProducts().reduce((acc, p) => acc + (Number(p.quantity || p.stock || 0)), 0)} unidades
                        </p>
                      </div>
                      <div className="bg-background/40 border border-border p-4 rounded-xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor Total de Custo</span>
                        <p className="text-xl font-bold text-foreground mt-1">
                          {formatCurrency(getFilteredProducts().reduce((acc, p) => acc + ((Number(p.cost_price || p.costPrice || 0)) * Number(p.quantity || p.stock || 0)), 0))}
                        </p>
                      </div>
                      <div className="bg-background/40 border border-border p-4 rounded-xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor Total em Venda</span>
                        <p className="text-xl font-bold text-emerald-400 mt-1">
                          {formatCurrency(getFilteredProducts().reduce((acc, p) => acc + ((Number(p.price || 0)) * Number(p.quantity || p.stock || 0)), 0))}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse print-table">
                        <thead>
                          <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                            <th className="p-3">Produto</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3 text-center">Qtd. Estoque</th>
                            <th className="p-3 text-right">Preço Custo</th>
                            <th className="p-3 text-right">Preço Venda</th>
                            <th className="p-3 text-right">Total em Venda</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {getFilteredProducts().length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-6 text-center text-muted-foreground">
                                Nenhum produto encontrado para os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            getFilteredProducts().map((p) => {
                              const qty = Number(p.quantity || p.stock || 0)
                              const price = Number(p.price || 0)
                              const cost = Number(p.cost_price || p.costPrice || 0)
                              return (
                                <tr key={p.id} className="hover:bg-muted/20">
                                  <td className="p-3 font-semibold text-foreground">{p.name}</td>
                                  <td className="p-3 text-muted-foreground">{p.category || "Geral"}</td>
                                  <td className="p-3 text-center font-bold text-foreground">{qty}</td>
                                  <td className="p-3 text-right text-muted-foreground">{formatCurrency(cost)}</td>
                                  <td className="p-3 text-right font-medium text-foreground">{formatCurrency(price)}</td>
                                  <td className="p-3 text-right font-bold text-primary">{formatCurrency(qty * price)}</td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. RELATÓRIO DE FLUXO DE CAIXA */}
                {activeReport === "fluxo_caixa" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 no-print">
                      <div className="bg-background/40 border border-border p-4 rounded-xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Total de Entradas</span>
                        <p className="text-xl font-bold text-green-400 mt-1">
                          {formatCurrency(cashFlowData.filter(i => (i.type || i.tipo) === 'entrada' || Number(i.amount || i.valor) > 0).reduce((acc, i) => acc + Math.abs(Number(i.amount || i.valor || 0)), 0))}
                        </p>
                      </div>
                      <div className="bg-background/40 border border-border p-4 rounded-xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Total de Saídas</span>
                        <p className="text-xl font-bold text-rose-400 mt-1">
                          {formatCurrency(cashFlowData.filter(i => (i.type || i.tipo) === 'saida' || Number(i.amount || i.valor) < 0).reduce((acc, i) => acc + Math.abs(Number(i.amount || i.valor || 0)), 0))}
                        </p>
                      </div>
                      <div className="bg-background/40 border border-border p-4 rounded-xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Saldo Consolidado</span>
                        <p className="text-xl font-bold text-primary mt-1">
                          {formatCurrency(cashFlowData.reduce((acc, i) => {
                            const val = Number(i.amount || i.valor || 0)
                            const isExpense = (i.type || i.tipo) === 'saida'
                            return acc + (isExpense ? -Math.abs(val) : Math.abs(val))
                          }, 0))}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse print-table">
                        <thead>
                          <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                            <th className="p-3">Data/Hora</th>
                            <th className="p-3">Descrição da Movimentação</th>
                            <th className="p-3">Forma Pgto</th>
                            <th className="p-3 text-center">Tipo</th>
                            <th className="p-3 text-right">Valor (R$)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {cashFlowData.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-6 text-center text-muted-foreground">
                                Nenhuma movimentação financeira registrada no período.
                              </td>
                            </tr>
                          ) : (
                            cashFlowData.map((item, idx) => {
                              const isExpense = (item.type || item.tipo) === 'saida' || Number(item.amount || item.valor) < 0
                              return (
                                <tr key={item.id || idx} className="hover:bg-muted/20">
                                  <td className="p-3 text-muted-foreground">{formatDate(item.created_at || item.date)}</td>
                                  <td className="p-3 font-semibold text-foreground">{item.description || item.descricao || "Movimentação de Caixa"}</td>
                                  <td className="p-3 text-muted-foreground">{item.payment_method || item.formaPgto || "Dinheiro/Pix"}</td>
                                  <td className="p-3 text-center font-bold">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${isExpense ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                      {isExpense ? 'Saída' : 'Entrada'}
                                    </span>
                                  </td>
                                  <td className={`p-3 text-right font-bold ${isExpense ? 'text-rose-400' : 'text-green-400'}`}>
                                    {isExpense ? '-' : '+'}{formatCurrency(Math.abs(Number(item.amount || item.valor || 0)))}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. RELATÓRIO DE COMISSÃO DO PROFISSIONAL (REFORMULADO) */}
                {activeReport === "comissao_profissional" && (
                  <div className="space-y-4">
                    {!isCommissionCalculated ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl bg-muted/10 p-6">
                        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3">
                          <Calculator size={28} />
                        </div>
                        <h4 className="text-base font-bold text-foreground">Aguardando geração dos dados de comissão</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                          Selecione a **Data Inicial**, **Data Final** e o **Profissional** nos filtros acima e clique no botão <span className="text-primary font-bold">"Gerar Dados"</span> para realizar os cálculos e ativar a impressão em PDF.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2 no-print">
                          <span>Demonstrativo de Comissões por Serviço e Produto ({commissionResults.length} Profissionais)</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse print-table">
                            <thead>
                              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                                <th className="p-3">Profissional</th>
                                <th className="p-3 text-center">Qtd. Serv.</th>
                                <th className="p-3 text-right">Total Serv. (R$)</th>
                                <th className="p-3 text-right">% Com. Serv.</th>
                                <th className="p-3 text-right">Com. Serv. (R$)</th>
                                <th className="p-3 text-center">Qtd. Prod.</th>
                                <th className="p-3 text-right">Total Prod. (R$)</th>
                                <th className="p-3 text-right">% Com. Prod.</th>
                                <th className="p-3 text-right">Com. Prod. (R$)</th>
                                <th className="p-3 text-right text-primary font-bold">Total Comissão (R$)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {commissionResults.length === 0 ? (
                                <tr>
                                  <td colSpan="10" className="p-6 text-center text-muted-foreground">
                                    Nenhum dado de comissão encontrado para os filtros selecionados.
                                  </td>
                                </tr>
                              ) : (
                                commissionResults.map((item) => (
                                  <tr key={item.barberId} className="hover:bg-muted/20">
                                    <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                                      <Scissors size={14} className="text-primary shrink-0 no-print" />
                                      <span>{item.barberName}</span>
                                    </td>
                                    <td className="p-3 text-center font-bold text-foreground">{item.serviceCount}</td>
                                    <td className="p-3 text-right text-muted-foreground">{formatCurrency(item.serviceTotal)}</td>
                                    <td className="p-3 text-right text-primary font-medium">{item.serviceCommPct}%</td>
                                    <td className="p-3 text-right font-bold text-foreground">{formatCurrency(item.serviceCommValue)}</td>
                                    <td className="p-3 text-center font-bold text-foreground">{item.productCount}</td>
                                    <td className="p-3 text-right text-muted-foreground">{formatCurrency(item.productTotal)}</td>
                                    <td className="p-3 text-right text-primary font-medium">{item.productCommPct}%</td>
                                    <td className="p-3 text-right font-bold text-foreground">{formatCurrency(item.productCommValue)}</td>
                                    <td className="p-3 text-right font-black text-primary text-sm">{formatCurrency(item.totalCommission)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                            {commissionResults.length > 0 && (() => {
                              const totals = sumCommissionTotals()
                              return (
                                <tfoot>
                                  <tr className="border-t-2 border-primary/40 bg-primary/10 font-bold text-xs">
                                    <td className="p-3 uppercase tracking-wider text-foreground">Totais Gerais</td>
                                    <td className="p-3 text-center text-foreground">{totals.serviceCount}</td>
                                    <td className="p-3 text-right text-foreground">{formatCurrency(totals.serviceTotal)}</td>
                                    <td className="p-3 text-right text-muted-foreground">-</td>
                                    <td className="p-3 text-right text-foreground">{formatCurrency(totals.serviceCommValue)}</td>
                                    <td className="p-3 text-center text-foreground">{totals.productCount}</td>
                                    <td className="p-3 text-right text-foreground">{formatCurrency(totals.productTotal)}</td>
                                    <td className="p-3 text-right text-muted-foreground">-</td>
                                    <td className="p-3 text-right text-foreground">{formatCurrency(totals.productCommValue)}</td>
                                    <td className="p-3 text-right text-primary text-sm font-black">{formatCurrency(totals.totalCommission)}</td>
                                  </tr>
                                </tfoot>
                              )
                            })()}
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 5. RELATÓRIO DE FATURAMENTO */}
                {activeReport === "faturamento" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 no-print">
                      <div className="bg-background/40 border border-border p-4 rounded-xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Faturamento em Serviços</span>
                        <p className="text-xl font-bold text-primary mt-1">
                          {formatCurrency(getFilteredAppointments().reduce((acc, a) => acc + getAppointmentPrice(a), 0))}
                        </p>
                      </div>
                      <div className="bg-background/40 border border-border p-4 rounded-xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Faturamento em Produtos</span>
                        <p className="text-xl font-bold text-foreground mt-1">
                          {formatCurrency(productsData.reduce((acc, p) => acc + ((Number(p.price || 0)) * (Number(p.sold_count || 0))), 0))}
                        </p>
                      </div>
                      <div className="bg-background/40 border border-border p-4 rounded-xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Faturamento Bruto Total</span>
                        <p className="text-xl font-bold text-emerald-400 mt-1">
                          {formatCurrency(getFilteredAppointments().reduce((acc, a) => acc + getAppointmentPrice(a), 0) + productsData.reduce((acc, p) => acc + ((Number(p.price || 0)) * (Number(p.sold_count || 0))), 0))}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse print-table">
                        <thead>
                          <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                            <th className="p-3">Categoria da Receita</th>
                            <th className="p-3 text-center">Volume de Vendas / Atendimentos</th>
                            <th className="p-3 text-right">Ticket Médio</th>
                            <th className="p-3 text-right">Faturamento Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          <tr className="hover:bg-muted/20">
                            <td className="p-3 font-semibold text-foreground">Serviços da Barbearia</td>
                            <td className="p-3 text-center font-bold text-foreground">{getFilteredAppointments().length} atends.</td>
                            <td className="p-3 text-right text-muted-foreground">
                              {formatCurrency(getFilteredAppointments().length > 0 ? getFilteredAppointments().reduce((acc, a) => acc + getAppointmentPrice(a), 0) / getFilteredAppointments().length : 0)}
                            </td>
                            <td className="p-3 text-right font-bold text-primary">
                              {formatCurrency(getFilteredAppointments().reduce((acc, a) => acc + getAppointmentPrice(a), 0))}
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/20">
                            <td className="p-3 font-semibold text-foreground">Venda de Produtos</td>
                            <td className="p-3 text-center font-bold text-foreground">
                              {productsData.reduce((acc, p) => acc + Number(p.sold_count || 0), 0)} itens
                            </td>
                            <td className="p-3 text-right text-muted-foreground">
                              {formatCurrency(productsData.length > 0 ? productsData.reduce((acc, p) => acc + Number(p.price || 0), 0) / productsData.length : 0)}
                            </td>
                            <td className="p-3 text-right font-bold text-primary">
                              {formatCurrency(productsData.reduce((acc, p) => acc + ((Number(p.price || 0)) * (Number(p.sold_count || 0))), 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. RELATÓRIO DE AGENDAMENTOS */}
                {activeReport === "agendamentos" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
                      <span>Listagem de Agendamentos ({getFilteredAppointments().length} Registros)</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse print-table">
                        <thead>
                          <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                            <th className="p-3">Data / Hora</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Profissional</th>
                            <th className="p-3">Serviço Solicitado</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {getFilteredAppointments().length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-6 text-center text-muted-foreground">
                                Nenhum agendamento encontrado para o período/filtro selecionado.
                              </td>
                            </tr>
                          ) : (
                            getFilteredAppointments().map((a, idx) => (
                              <tr key={a.id || idx} className="hover:bg-muted/20">
                                <td className="p-3 text-muted-foreground font-medium">{formatDate(a.date || a.created_at)} {a.time || ""}</td>
                                <td className="p-3 font-semibold text-foreground">{a.customer_name || a.clientName || "Cliente"}</td>
                                <td className="p-3 text-muted-foreground">{a.barber_name || a.barberName || "Profissional"}</td>
                                <td className="p-3 text-muted-foreground">{a.service_name || a.serviceName || "Corte de Cabelo"}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    a.status === 'confirmed' || a.status === 'concluido' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    a.status === 'canceled' || a.status === 'cancelado' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {a.status === 'confirmed' || a.status === 'concluido' ? 'Concluído' : a.status === 'canceled' || a.status === 'cancelado' ? 'Cancelado' : 'Agendado'}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-bold text-primary">{formatCurrency(getAppointmentPrice(a))}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-card/60 border-t border-border/80 flex justify-between items-center text-xs text-muted-foreground shrink-0 no-print">
              <span>Barbearia Do Vale &bull; Sistema de Gestão</span>
              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="px-4 py-2 border border-border hover:bg-muted text-foreground font-bold rounded-xl transition-all cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
