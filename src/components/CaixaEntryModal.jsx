import React, { useState, useEffect } from "react"
import { X, ReceiptText, DollarSign, CreditCard, Banknote, Zap, AlertTriangle, CheckCircle2, RotateCcw, Lock } from "lucide-react"
import { API_URL } from "../context/AuthContext.jsx"

const PAYMENT_METHODS = [
  { id: "DINHEIRO", label: "Dinheiro", icon: Banknote, color: "hover:border-emerald-500 hover:text-emerald-400" },
  { id: "PIX", label: "PIX", icon: Zap, color: "hover:border-teal-500 hover:text-teal-400" },
  { id: "CARTAO_CREDITO", label: "Cartão Crédito", icon: CreditCard, color: "hover:border-amber-500 hover:text-amber-400" },
  { id: "CARTAO_DEBITO", label: "Cartão Débito", icon: CreditCard, color: "hover:border-blue-500 hover:text-blue-400" }
]

export default function CaixaEntryModal({
  isOpen,
  onClose,
  appointment,
  token,
  onSaveSuccess
}) {
  const [paymentMethod, setPaymentMethod] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Inicializar dados ao abrir o modal
  useEffect(() => {
    if (appointment && isOpen) {
      setError("")
      setSuccess("")
      
      // Forma de pagamento
      const initialMethod = appointment.caixa_payment_method || appointment.payment_method || ""
      setPaymentMethod(initialMethod)

      // Valor: priorizar o que já está lançado no caixa, senão o valor real do serviço
      const defaultPrice = appointment.service_price !== undefined && appointment.service_price !== null
        ? Number(appointment.service_price)
        : (Number(appointment.price) || 0)

      const initialAmount = appointment.caixa_amount !== undefined && appointment.caixa_amount !== null
        ? Number(appointment.caixa_amount)
        : defaultPrice

      setAmount(initialAmount > 0 ? initialAmount.toFixed(2) : defaultPrice.toFixed(2))
    }
  }, [appointment, isOpen])

  if (!isOpen || !appointment) return null

  // Valor original/padrão dos serviços
  const originalPrice = appointment.service_price !== undefined && appointment.service_price !== null
    ? Number(appointment.service_price)
    : (Number(appointment.price) || 0)

  // Formatar data para exibição
  const formatDateTime = (timeStr) => {
    if (!timeStr) return ""
    const parts = timeStr.replace("T", " ").split(" ")
    const dateParts = parts[0].split("-")
    const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : parts[0]
    const timeFormatted = parts[1] ? parts[1].slice(0, 5) : ""
    return timeFormatted ? `${dateFormatted} às ${timeFormatted}` : dateFormatted
  }

  const handleRestoreDefaultPrice = () => {
    setAmount(originalPrice.toFixed(2))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount < 0) {
      setError("Por favor, insira um valor válido.")
      setLoading(false)
      return
    }

    try {
      const caixaId = appointment.caixa_id || `cx-srv-${appointment.id}`

      const res = await fetch(`${API_URL}/api/caixa/${caixaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numAmount,
          payment_method: paymentMethod || null
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar lançamento do caixa.")
      }

      setSuccess("Lançamento do caixa atualizado com sucesso!")

      if (onSaveSuccess) {
        onSaveSuccess({
          appointmentId: appointment.id,
          caixa_id: caixaId,
          amount: numAmount,
          payment_method: paymentMethod || null
        })
      }

      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      setError(err.message || "Erro de conexão ao salvar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-fade-in">
      <div className="bg-[#1c1c20]/95 backdrop-blur-xl w-full max-w-lg border border-primary/30 rounded-2xl p-6 md:p-8 shadow-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
              <ReceiptText size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                Lançamento no Caixa
              </h3>
              <p className="text-xs text-muted-foreground">
                Dados financeiros do atendimento registrado
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-muted/30"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alertas */}
        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3 mb-4 animate-shake">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl p-3 mb-4 animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Seção 1: Informações do Agendamento (Somente Leitura / Bloqueadas) */}
          <div className="space-y-2.5 bg-background/40 border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Lock size={11} className="text-primary/70" /> Dados do Atendimento (Somente Leitura)
              </span>
              <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-0.5 rounded-full">
                Receita de Serviço
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Cliente:</span>
                <span className="font-bold text-foreground truncate block" title={appointment.client_name}>
                  {appointment.client_name || "Cliente"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Profissional:</span>
                <span className="font-bold text-foreground truncate block" title={appointment.barber_name}>
                  {appointment.barber_name || "Profissional"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Serviço:</span>
                <span className="font-bold text-foreground truncate block" title={appointment.service_name}>
                  {appointment.service_name || "Serviço"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Data / Horário:</span>
                <span className="font-bold font-mono text-primary truncate block">
                  {formatDateTime(appointment.appointment_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Seção 2: Forma de Pagamento (Editável) */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
              <span>Forma de Pagamento *</span>
              {paymentMethod && (
                <span className="text-[10px] text-emerald-400 font-normal">
                  Selecionado: {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod}
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                const isSelected = paymentMethod === method.id

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500/50"
                        : `bg-background/60 border-border/60 text-muted-foreground ${method.color} hover:bg-muted/20`
                    }`}
                  >
                    <Icon size={18} className={isSelected ? "text-emerald-400" : "text-muted-foreground"} />
                    <span className="text-[10px] uppercase tracking-wider text-center">{method.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Seção 3: Valor do Serviço (Editável, com padrão real) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                Valor Cobrado do Serviço (R$) *
              </label>
              {Number(amount) !== originalPrice && originalPrice > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreDefaultPrice}
                  className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  title="Restaurar para o valor de tabela do serviço"
                >
                  <RotateCcw size={10} /> Restaurar Padrão (R$ {originalPrice.toFixed(2)})
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold font-mono text-muted-foreground">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 pl-11 pr-4 text-base font-bold font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Valor padrão do serviço: <span className="font-mono font-bold text-foreground">R$ {originalPrice.toFixed(2)}</span>
            </p>
          </div>

          {/* Rodapé / Botões */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 bg-muted/40 hover:bg-muted/60 text-foreground text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer border border-border/40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gold-gradient hover:shadow-gold-lg text-primary-foreground text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-gold cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <DollarSign size={15} />
                  <span>Salvar Pagamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
