import React, { useState, useEffect, useRef } from "react"
import { ShoppingBag, Plus, Trash2, X, AlertTriangle, CheckCircle2, DollarSign, Package, Search } from "lucide-react"

const PAYMENT_METHODS = [
  { id: "PIX", label: "PIX" },
  { id: "CARTAO_CREDITO", label: "CARTÃO CRÉDITO" },
  { id: "CARTAO_DEBITO", label: "CARTÃO DÉBITO" },
  { id: "DINHEIRO", label: "DINHEIRO" },
  { id: "A_PRAZO", label: "A PRAZO" }
]

const INITIAL_DEFAULT_PRODUCTS = [
  {
    id: "prod-pomada-mate",
    name: "Pomada Modeladora Effect Mate 100g",
    description: "Pomada modeladora capilar com efeito fosco e fixação forte.",
    cost_price: 25.00,
    sale_price: 45.00,
    stock_quantity: 12
  },
  {
    id: "prod-oleo-barba",
    name: "Óleo Hidratante para Barba 30ml",
    description: "Óleo enriquecido com Argan e Jojoba para nutrição profunda.",
    cost_price: 20.00,
    sale_price: 38.00,
    stock_quantity: 8
  },
  {
    id: "prod-shampoo-barba",
    name: "Shampoo 2 em 1 Cabelo e Barba 250ml",
    description: "Shampoo especial para cabelo e barba.",
    cost_price: 30.00,
    sale_price: 52.00,
    stock_quantity: 2
  }
]

export default function SaleModal({
  isOpen,
  onClose,
  appointment,
  existingSale,
  products = [],
  onSaveSale,
  onDeleteSale
}) {
  const [paymentMethod, setPaymentMethod] = useState("PIX")
  const [items, setItems] = useState([])
  const [syncCaixa, setSyncCaixa] = useState(true)

  // Campos para adicionar novo item com busca de produto
  const [selectedProductId, setSelectedProductId] = useState("")
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const productDropdownRef = useRef(null)

  const [quantity, setQuantity] = useState("1")
  const [unitPrice, setUnitPrice] = useState("")

  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Garantir lista de produtos válida (API D1 ou fallback da barbearia)
  const activeProducts = (Array.isArray(products) && products.length > 0)
    ? products
    : INITIAL_DEFAULT_PRODUCTS

  // Fechar dropdown de produtos ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Atualizar quando o modal abrir ou mudar a venda existente
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("")
      setSuccessMsg("")
      setSelectedProductId("")
      setProductSearchTerm("")
      setIsProductDropdownOpen(false)
      setQuantity("1")
      setUnitPrice("")

      if (existingSale) {
        setPaymentMethod(existingSale.payment_method || "PIX")
        setSyncCaixa(existingSale.has_caixa !== undefined ? existingSale.has_caixa : true)

        if (Array.isArray(existingSale.items) && existingSale.items.length > 0) {
          setItems(
            existingSale.items.map(it => ({
              product_id: it.product_id,
              product_name: it.product_name || (activeProducts.find(p => String(p.id) === String(it.product_id))?.name || "Produto"),
              quantity: Number(it.quantity) || 1,
              unit_price: Number(it.unit_price) || 0
            }))
          )
        } else {
          setItems([])
        }
      } else {
        setPaymentMethod("PIX")
        setItems([])
        setSyncCaixa(true)
      }
    }
  }, [isOpen, existingSale, products, activeProducts])

  if (!isOpen || !appointment) return null

  // Ao selecionar um produto na busca, preencher ID e preço unitário da tabela de produtos do D1
  const handleSelectProduct = (prod) => {
    setSelectedProductId(prod.id)
    setProductSearchTerm(prod.name)
    setUnitPrice(String(prod.sale_price !== undefined ? prod.sale_price : 0))
    setIsProductDropdownOpen(false)
  }

  // Normalização insensível a maiúsculas/minúsculas e acentos (ex: "oleo" encontra "Óleo")
  const normalizeStr = (str) =>
    (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // Filtragem por conteúdo curinga ao digitar
  const filteredProductsList = activeProducts.filter(p => {
    const term = normalizeStr(productSearchTerm.trim())
    if (!term) return false
    if (selectedProductId && String(p.id) === String(selectedProductId) && normalizeStr(p.name.trim()) === term) return false
    return normalizeStr(p.name).includes(term)
  })

  // Adicionar item à lista temporária
  const handleAddItem = (e) => {
    e.preventDefault()
    setErrorMsg("")

    if (!selectedProductId) {
      setErrorMsg("Selecione um produto para adicionar.")
      return
    }

    const qtyNum = parseInt(quantity, 10)
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg("Informe uma quantidade válida superior a 0.")
      return
    }

    const priceNum = parseFloat(unitPrice.replace(",", "."))
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMsg("Informe um valor unitário válido.")
      return
    }

    const foundProd = products.find(p => String(p.id) === String(selectedProductId))
    const productName = foundProd ? foundProd.name : "Produto"

    // Se já existir na lista, atualiza quantidade
    const existingIndex = items.findIndex(it => String(it.product_id) === String(selectedProductId))
    if (existingIndex >= 0) {
      const updated = [...items]
      updated[existingIndex].quantity += qtyNum
      updated[existingIndex].unit_price = priceNum
      setItems(updated)
    } else {
      setItems(prev => [
        ...prev,
        {
          product_id: selectedProductId,
          product_name: productName,
          quantity: qtyNum,
          unit_price: priceNum
        }
      ])
    }

    setSelectedProductId("")
    setProductSearchTerm("")
    setIsProductDropdownOpen(false)
    setQuantity("1")
    setUnitPrice("")
  }

  // Remover item da lista
  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, idx) => idx !== index))
  }

  // Calcular total geral
  const totalAmount = items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0)

  // Salvar Venda
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    if (items.length === 0) {
      setErrorMsg("Adicione ao menos um produto à venda.")
      return
    }

    setSubmitting(true)
    try {
      await onSaveSale({
        id: existingSale ? existingSale.id : null,
        appointment_id: appointment.id,
        customer_id: appointment.client_id || null,
        payment_method: paymentMethod,
        items,
        sync_caixa: syncCaixa
      })
      setSuccessMsg("Venda salva com sucesso!")
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      setErrorMsg(err.message || "Erro ao salvar a venda.")
    } finally {
      setSubmitting(false)
    }
  }

  // Excluir Venda
  const handleDelete = async () => {
    if (!existingSale) return
    if (!window.confirm("Tem certeza que deseja excluir esta venda? O estoque e o caixa serão ajustados.")) return

    setSubmitting(true)
    try {
      await onDeleteSale(existingSale.id)
      setSuccessMsg("Venda excluída com sucesso!")
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      setErrorMsg(err.message || "Erro ao excluir venda.")
    } finally {
      setSubmitting(false)
    }
  }

  const clientName = appointment.client_name || "Cliente"
  const apptDateStr = appointment.appointment_time ? appointment.appointment_time.replace("T", " ") : ""

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#1c1c20]/95 backdrop-blur-xl w-full max-w-2xl border border-gold-subtle/40 rounded-2xl p-6 md:p-8 shadow-2xl relative animate-scale-in my-6">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-gradient/10 border border-gold-subtle/30 flex items-center justify-center text-primary">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                {existingSale ? "Editar Venda" : "Nova Venda de Produtos"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Cliente: <span className="text-primary font-bold">{clientName}</span> {apptDateStr ? `(${apptDateStr})` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensagens Globais */}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3.5 mb-4 animate-fade-in">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3.5 mb-4 animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Forma de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Forma de Pagamento *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const isSel = paymentMethod === pm.id
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      isSel
                        ? "bg-gold-gradient text-black border-gold-subtle shadow-md"
                        : "bg-background/40 text-muted-foreground border-border/60 hover:text-foreground"
                    }`}
                  >
                    {pm.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Adicionar Produto à Venda */}
          <div className="bg-background/40 border border-border/60 rounded-xl p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package size={14} className="text-primary" /> Adicionar Produtos à Venda
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-6 space-y-1 relative" ref={productDropdownRef}>
                <label className="text-[9px] font-bold uppercase text-muted-foreground">Produto (Digite para buscar)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => {
                      const val = e.target.value
                      setProductSearchTerm(val)
                      setSelectedProductId("")
                      setIsProductDropdownOpen(val.trim().length > 0)
                    }}
                    placeholder="Digite para buscar produto..."
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-2 pl-8 pr-8 text-xs text-foreground focus:outline-none transition-all"
                  />
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  {productSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearchTerm("")
                        setSelectedProductId("")
                        setUnitPrice("")
                        setIsProductDropdownOpen(false)
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Dropdown Autocomplete de Produtos (Exibe apenas ao digitar termo de busca) */}
                {isProductDropdownOpen && productSearchTerm.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#1c1c20] border border-gold-subtle/40 rounded-xl shadow-2xl z-[100] max-h-52 overflow-y-auto animate-scale-in">
                    {filteredProductsList.length > 0 ? (
                      filteredProductsList.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p)}
                          className="w-full text-left px-3 py-2.5 hover:bg-primary/20 border-b border-border/30 last:border-0 flex items-center justify-between cursor-pointer transition-colors text-xs"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-bold text-foreground truncate">{p.name}</span>
                            <span className="text-[9px] text-muted-foreground">
                              Estoque: {p.stock_quantity ?? 0} un.
                            </span>
                          </div>
                          <span className="font-mono font-bold text-primary shrink-0">
                            R$ {Number(p.sale_price || 0).toFixed(2)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        Nenhum produto encontrado.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] font-bold uppercase text-muted-foreground">Qtd</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-2 px-3 text-xs text-foreground text-center font-bold focus:outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] font-bold uppercase text-muted-foreground">Unit. (R$)</label>
                <input
                  type="text"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-2 px-3 text-xs text-foreground text-right font-mono focus:outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 bg-primary/20 hover:bg-primary border border-primary/40 text-primary hover:text-background text-xs font-extrabold uppercase rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Itens Adicionados */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Itens da Venda ({items.length})
            </span>

            {items.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border/50 rounded-xl text-xs text-muted-foreground">
                Nenhum produto adicionado à venda. Escolha um produto acima e clique em Add.
              </div>
            ) : (
              <div className="border border-border/60 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-background/80 text-muted-foreground font-bold uppercase text-[9px] border-b border-border/40">
                    <tr>
                      <th className="p-2.5">Produto</th>
                      <th className="p-2.5 text-center">Qtd</th>
                      <th className="p-2.5 text-right">Unit.</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                      <th className="p-2.5 text-center w-10">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {items.map((it, idx) => {
                      const subtotal = it.quantity * it.unit_price
                      return (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-2.5 font-semibold text-foreground truncate max-w-[180px]">
                            {it.product_name}
                          </td>
                          <td className="p-2.5 text-center font-bold font-mono">
                            {it.quantity}
                          </td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">
                            R$ {it.unit_price.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-primary">
                            R$ {subtotal.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1 rounded transition-colors cursor-pointer"
                              title="Remover produto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Opção de Integração com o Fluxo de Caixa */}
          <div className="bg-background/30 border border-border/40 p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="sync-caixa-check"
                checked={syncCaixa}
                onChange={(e) => setSyncCaixa(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-amber-500"
              />
              <label htmlFor="sync-caixa-check" className="text-xs font-bold text-foreground cursor-pointer select-none">
                Lançar entrada no Fluxo de Caixa (Receita)
              </label>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {syncCaixa ? "Integrado ao Caixa" : "Sem entrada no Caixa"}
            </span>
          </div>

          {/* Valor Total Geral */}
          <div className="bg-gold-gradient/10 border border-gold-subtle/40 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <DollarSign size={22} />
              <span className="font-bold uppercase tracking-wider text-xs">Total da Venda</span>
            </div>
            <span className="text-xl font-black font-mono text-primary">
              R$ {totalAmount.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            {existingSale && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="py-3 px-4 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/30 text-xs uppercase font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Excluir
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 bg-muted/40 hover:bg-muted/60 text-foreground text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer border border-border/40"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="flex-1 py-3 bg-gold-gradient hover:shadow-gold-sm text-black text-xs uppercase tracking-wider font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Salvar Venda"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
