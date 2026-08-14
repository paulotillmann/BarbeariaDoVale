import React, { useState, useEffect } from "react"
import { 
  X, 
  User, 
  Scissors, 
  ShoppingBag, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Phone, 
  Layers, 
  Receipt,
  RotateCw
} from "lucide-react"
import { API_URL } from "../context/AuthContext.jsx"

export default function CustomerHistoryModal({ customer, isOpen, onClose, token }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [historyData, setHistoryData] = useState(null)
  const [activeTab, setActiveTab] = useState("all") // 'all' | 'services' | 'products'

  useEffect(() => {
    if (!isOpen || !customer?.id) return

    let isMounted = true
    async function fetchHistory() {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`${API_URL}/api/customers/${customer.id}/history`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || "Não foi possível carregar o histórico do cliente.")
        }
        const data = await response.json()
        if (isMounted) {
          setHistoryData(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Erro de conexão ao buscar histórico.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchHistory()

    return () => {
      isMounted = false
    }
  }, [isOpen, customer?.id, token])

  if (!isOpen || !customer) return null

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const formatDateTime = (isoString) => {
    if (!isoString) return { date: "--/--/----", time: "--:--" }
    try {
      const normalizedStr = isoString.includes("T") ? isoString : isoString.replace(" ", "T")
      const date = new Date(normalizedStr)
      if (isNaN(date.getTime())) {
        const parts = isoString.split(" ")
        return { date: parts[0] || isoString, time: parts[1]?.slice(0, 5) || "" }
      }
      const day = String(date.getDate()).padStart(2, "0")
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      return {
        date: `${day}/${month}/${year}`,
        time: `${hours}:${minutes}`,
        full: `${day}/${month}/${year} às ${hours}:${minutes}`
      }
    } catch {
      return { date: isoString, time: "", full: isoString }
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-500/15 text-green-400 border border-green-500/30 whitespace-nowrap">
            <CheckCircle2 size={12} /> Concluído
          </span>
        )
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/30 whitespace-nowrap">
            <CheckCircle2 size={12} /> Confirmado
          </span>
        )
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-destructive/15 text-destructive border border-destructive/30 whitespace-nowrap">
            <XCircle size={12} /> Cancelado
          </span>
        )
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
            <AlertCircle size={12} /> Falta
          </span>
        )
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border whitespace-nowrap">
            <Clock size={12} /> Pendente
          </span>
        )
    }
  }

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "PIX":
        return "PIX"
      case "CARTAO_CREDITO":
        return "Cartão de Crédito"
      case "CARTAO_DEBITO":
        return "Cartão de Débito"
      case "DINHEIRO":
        return "Dinheiro"
      case "A_PRAZO":
        return "A Prazo (Fiado)"
      default:
        return method || "Não informado"
    }
  }

  const summary = historyData?.summary || {
    total_services_paid: 0,
    total_products_paid: 0,
    total_services_count: 0,
    total_completed_services_count: 0,
    total_products_count: 0,
    last_service: null,
    last_product: null
  }

  const servicesList = historyData?.services || []
  const productsList = historyData?.products || []

  // Histórico unificado cronológico
  const unifiedList = [
    ...servicesList.map(s => ({
      type: "service",
      id: s.id,
      datetime: s.appointment_time || s.created_at,
      title: s.service_name || "Serviço Realizado",
      subtitle: s.barber_name ? `Barbeiro: ${s.barber_name}` : "Barbearia Do Vale",
      price: s.service_price,
      status: s.status,
      cancellation_reason: s.cancellation_reason,
      payment_method: s.payment_method,
      raw: s
    })),
    ...productsList.map((p, idx) => ({
      type: "product",
      id: p.sale_id ? `${p.sale_id}-${idx}` : `prod-${idx}`,
      datetime: p.sale_date,
      title: p.product_name,
      subtitle: `${p.quantity}x de ${formatCurrency(p.unit_price)}${p.barber_name ? ` • Atendido por ${p.barber_name}` : ""}`,
      price: p.total_price,
      status: "completed",
      payment_method: p.payment_method,
      raw: p
    }))
  ].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 animate-fade-in">
      <div className="bg-[#18181b]/95 backdrop-blur-2xl w-full max-w-5xl border border-primary/30 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[860px] animate-scale-in">
        
        {/* CABEÇALHO DO MODAL (FIXO) */}
        <div className="p-4 sm:p-5 border-b border-border/80 bg-gradient-to-r from-background/90 via-card/60 to-background/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-gold-subtle shadow-gold bg-background/80 flex items-center justify-center shrink-0">
              {customer.photo ? (
                <img 
                  src={customer.photo} 
                  alt={customer.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'block'
                    }
                  }}
                />
              ) : null}
              <User size={26} className={`text-primary/70 ${customer.photo ? 'hidden' : 'block'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary rounded-md border border-primary/30">
                  Ficha do Cliente
                </span>
                <span className="text-[11px] text-muted-foreground">ID: #{customer.id?.slice(0, 8)}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-foreground tracking-wide mt-0.5">
                {customer.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-0.5">
                {customer.phone && (
                  <a
                    href={`https://wa.me/55${customer.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <Phone size={12} /> {customer.phone}
                  </a>
                )}
                {customer.birth_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-muted-foreground/80" /> Nasc: {customer.birth_date.split("-").reverse().join("/")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-all cursor-pointer"
              title="Fechar Histórico"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
          
          {error && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3 shrink-0">
              <AlertTriangle size={18} className="shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-xs">Erro ao carregar dados</p>
                <p className="text-[11px] opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* 4 CARDS DE RESUMO / KPIS (FIXOS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            
            {/* Card 1: Total Pago em Serviços */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/80 hover:border-primary/40 rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total em Serviços
                </span>
                <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                  <Scissors size={14} />
                </div>
              </div>
              <div>
                <p className="text-xl font-black font-display text-primary tracking-tight">
                  {loading ? "--" : formatCurrency(summary.total_services_paid)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {summary.total_completed_services_count || 0} serviço(s) realizado(s)
                </p>
              </div>
            </div>

            {/* Card 2: Total Pago em Produtos */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/80 hover:border-amber-500/40 rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total em Produtos
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShoppingBag size={14} />
                </div>
              </div>
              <div>
                <p className="text-xl font-black font-display text-amber-400 tracking-tight">
                  {loading ? "--" : formatCurrency(summary.total_products_paid)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {summary.total_products_count || 0} item(ns) comprado(s)
                </p>
              </div>
            </div>

            {/* Card 3: Último Serviço Realizado */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/80 hover:border-primary/40 rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Último Serviço
                </span>
                <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                  <Calendar size={14} />
                </div>
              </div>
              {summary.last_service ? (
                <div>
                  <h4 className="font-bold text-xs text-foreground line-clamp-1" title={summary.last_service.service_name}>
                    {summary.last_service.service_name}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-primary font-medium mt-0.5">
                    <Clock size={11} />
                    <span className="line-clamp-1">{formatDateTime(summary.last_service.appointment_time).full}</span>
                  </div>
                  {summary.last_service.barber_name && (
                    <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">
                      Com {summary.last_service.barber_name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-0.5">
                  <p className="text-[11px] text-muted-foreground italic">Nenhum serviço registrado</p>
                </div>
              )}
            </div>

            {/* Card 4: Último Produto Comprado */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/80 hover:border-amber-500/40 rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Último Produto
                </span>
                <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                  <Receipt size={14} />
                </div>
              </div>
              {summary.last_product ? (
                <div>
                  <h4 className="font-bold text-xs text-foreground line-clamp-1" title={summary.last_product.product_name}>
                    {summary.last_product.product_name}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-amber-400 font-medium mt-0.5">
                    <Clock size={11} />
                    <span className="line-clamp-1">{formatDateTime(summary.last_product.sale_date).full}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {summary.last_product.quantity}x • {formatCurrency(summary.last_product.total_price)}
                  </p>
                </div>
              ) : (
                <div className="py-0.5">
                  <p className="text-[11px] text-muted-foreground italic">Nenhum produto comprado</p>
                </div>
              )}
            </div>

          </div>

          {/* NAVEGAÇÃO POR ABAS / FILTRO (FIXO) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "all"
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers size={13} /> Todos ({unifiedList.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("services")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "services"
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Scissors size={13} /> Serviços ({servicesList.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "products"
                    ? "bg-amber-500 text-black shadow-lg"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShoppingBag size={13} /> Produtos ({productsList.length})
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Histórico ordenado por data decrescente
            </span>
          </div>

          {/* GRID COM SCROLL VERTICAL E HORIZONTAL PRÓPRIO */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
                <RotateCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Carregando histórico do cliente...</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col">
                
                {/* VISUALIZAÇÃO: TODOS (LINHA DO TEMPO) */}
                {activeTab === "all" && (
                  <>
                    {unifiedList.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                        <Layers size={32} className="stroke-1 mb-2 text-muted-foreground/40" />
                        <p className="text-sm font-semibold">Nenhum registro encontrado no histórico.</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">O cliente ainda não realizou atendimentos nem compras.</p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-border/80 bg-card/30 custom-scrollbar">
                        <table className="w-full text-left text-xs text-foreground">
                          <thead className="bg-[#1c1c20] text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/80 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Tipo</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Data / Horário</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Descrição / Itens</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Profissional</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Status / Pagamento</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20] text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {unifiedList.map((item) => {
                              const { date, time } = formatDateTime(item.datetime)
                              return (
                                <tr key={item.id} className="hover:bg-muted/25 transition-colors">
                                  <td className="py-3 px-3.5 whitespace-nowrap">
                                    {item.type === "service" ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                        <Scissors size={11} /> Serviço
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        <ShoppingBag size={11} /> Produto
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3.5 whitespace-nowrap">
                                    <div className="font-semibold text-foreground">{date}</div>
                                    <div className="text-[10px] text-muted-foreground">{time}</div>
                                  </td>
                                  <td className="py-3 px-3.5">
                                    <div className="font-bold text-foreground text-xs leading-tight">{item.title}</div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">{item.subtitle}</div>
                                    {item.cancellation_reason && (
                                      <div className="text-[10px] text-destructive italic mt-0.5">
                                        Motivo: {item.cancellation_reason}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-3.5 whitespace-nowrap">
                                    <span className="text-xs font-medium text-foreground/90">
                                      {item.raw.barber_name || "—"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5 whitespace-nowrap">
                                    <div className="flex flex-col items-start gap-1">
                                      {item.type === "service" ? (
                                        getStatusBadge(item.status)
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-500/15 text-green-400 border border-green-500/30 whitespace-nowrap">
                                          <CheckCircle2 size={12} /> Compra
                                        </span>
                                      )}
                                      {item.payment_method && (
                                        <span className="text-[10px] text-muted-foreground">
                                          {getPaymentMethodLabel(item.payment_method)}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                    <span className={`font-mono font-bold text-xs ${
                                      item.status === "cancelled" || item.status === "absent"
                                        ? "text-muted-foreground line-through opacity-60"
                                        : item.type === "service" ? "text-primary" : "text-amber-400"
                                    }`}>
                                      {formatCurrency(item.price)}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* VISUALIZAÇÃO: SERVIÇOS REALIZADOS */}
                {activeTab === "services" && (
                  <>
                    {servicesList.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                        <Scissors size={32} className="stroke-1 mb-2 text-muted-foreground/40" />
                        <p className="text-sm font-semibold">Nenhum serviço realizado até o momento.</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Os agendamentos do cliente aparecerão aqui.</p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-border/80 bg-card/30 custom-scrollbar">
                        <table className="w-full text-left text-xs text-foreground">
                          <thead className="bg-[#1c1c20] text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/80 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Data / Hora</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Serviço(s)</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Barbeiro</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Status</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Forma de Pagamento</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20] text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {servicesList.map((s) => {
                              const { date, time } = formatDateTime(s.appointment_time || s.created_at)
                              return (
                                <tr key={s.id} className="hover:bg-muted/25 transition-colors">
                                  <td className="py-3 px-3.5 whitespace-nowrap">
                                    <div className="font-semibold text-foreground">{date}</div>
                                    <div className="text-[10px] text-muted-foreground">{time}</div>
                                  </td>
                                  <td className="py-3 px-3.5">
                                    <div className="font-bold text-foreground text-xs">{s.service_name || "Serviço"}</div>
                                    {s.cancellation_reason && (
                                      <div className="text-[10px] text-destructive italic mt-0.5">
                                        Motivo: {s.cancellation_reason}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-3.5 whitespace-nowrap">
                                    <span className="text-xs font-medium text-foreground/90">
                                      {s.barber_name || "—"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5 whitespace-nowrap">
                                    {getStatusBadge(s.status)}
                                  </td>
                                  <td className="py-3 px-3.5 whitespace-nowrap text-muted-foreground text-xs">
                                    {getPaymentMethodLabel(s.payment_method)}
                                  </td>
                                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                    <span className={`font-mono font-bold text-xs ${
                                      s.status === "cancelled" || s.status === "absent"
                                        ? "text-muted-foreground line-through opacity-60"
                                        : "text-primary"
                                    }`}>
                                      {formatCurrency(s.service_price)}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* VISUALIZAÇÃO: COMPRAS DE PRODUTOS */}
                {activeTab === "products" && (
                  <>
                    {productsList.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                        <ShoppingBag size={32} className="stroke-1 mb-2 text-muted-foreground/40" />
                        <p className="text-sm font-semibold">Nenhuma compra de produto registrada.</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">As vendas de produtos para este cliente aparecerão aqui.</p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-border/80 bg-card/30 custom-scrollbar">
                        <table className="w-full text-left text-xs text-foreground">
                          <thead className="bg-[#1c1c20] text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/80 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Data / Hora</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Produto</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20] text-center">Quantidade</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20] text-right">Valor Unitário</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20]">Pagamento</th>
                              <th className="py-2.5 px-3.5 bg-[#1c1c20] text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {productsList.map((p, idx) => {
                              const { date, time } = formatDateTime(p.sale_date)
                              return (
                                <tr key={p.sale_id ? `${p.sale_id}-${idx}` : idx} className="hover:bg-muted/25 transition-colors">
                                  <td className="py-3 px-3.5 whitespace-nowrap">
                                    <div className="font-semibold text-foreground">{date}</div>
                                    <div className="text-[10px] text-muted-foreground">{time}</div>
                                  </td>
                                  <td className="py-3 px-3.5">
                                    <div className="font-bold text-foreground text-xs">{p.product_name}</div>
                                    {p.barber_name && (
                                      <div className="text-[10px] text-muted-foreground mt-0.5">
                                        Vendido por {p.barber_name}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-mono font-bold text-xs">
                                      {p.quantity}x
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono text-muted-foreground text-xs">
                                    {formatCurrency(p.unit_price)}
                                  </td>
                                  <td className="py-3 px-3.5 whitespace-nowrap text-muted-foreground text-xs">
                                    {getPaymentMethodLabel(p.payment_method)}
                                  </td>
                                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                    <span className="font-mono font-bold text-xs text-amber-400">
                                      {formatCurrency(p.total_price)}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

              </div>
            )}
          </div>

        </div>

        {/* RODAPÉ DO MODAL (FIXO) */}
        <div className="p-3.5 sm:p-4 border-t border-border/80 bg-background/80 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer border border-border"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  )
}
