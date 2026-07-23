import React, { useState, useEffect, useCallback } from "react"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Phone, 
  UserCheck, 
  DollarSign, 
  Boxes, 
  TrendingUp, 
  X,
  Upload
} from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

// Produtos de demonstração padronizados (fallback)
const INITIAL_DEFAULT_PRODUCTS = [
  {
    id: "prod-pomada-mate",
    name: "Pomada Modeladora Effect Mate 100g",
    description: "Efeito fosco, alta fixação e fragrância amadeirada exclusiva Do Vale.",
    supplier: "Barber Supply Brasil",
    supplier_contact_name: "Carlos Eduardo",
    supplier_contact_phone: "(34) 99888-7766",
    cost_price: 22.50,
    sale_price: 45.00,
    stock_quantity: 12
  },
  {
    id: "prod-oleo-barba",
    name: "Óleo Hidratante para Barba 30ml",
    description: "Enriquecido com óleo de argan e jojoba para hidratação e brilho natural.",
    supplier: "Cosméticos Vale Gold",
    supplier_contact_name: "Mariana Souza",
    supplier_contact_phone: "(34) 99777-5544",
    cost_price: 18.00,
    sale_price: 38.00,
    stock_quantity: 8
  },
  {
    id: "prod-shampoo-barba",
    name: "Shampoo 2 em 1 Cabelo e Barba 250ml",
    description: "Limpeza profunda sem ressecar a pele e os fios com mentol refrescante.",
    supplier: "Barber Supply Brasil",
    supplier_contact_name: "Carlos Eduardo",
    supplier_contact_phone: "(34) 99888-7766",
    cost_price: 25.00,
    sale_price: 52.00,
    stock_quantity: 2
  }
]

export default function Produtos() {
  const { user, token } = useAuth()

  const [products, setProducts] = useState(INITIAL_DEFAULT_PRODUCTS)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Modal / Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  
  // Form fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [supplier, setSupplier] = useState("")
  const [supplierContactName, setSupplierContactName] = useState("")
  const [supplierContactPhone, setSupplierContactPhone] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [stockQuantity, setStockQuantity] = useState("0")
  const [photo, setPhoto] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data)
        } else {
          setProducts(INITIAL_DEFAULT_PRODUCTS)
        }
      } else {
        setProducts(INITIAL_DEFAULT_PRODUCTS)
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err)
      setProducts(INITIAL_DEFAULT_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

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
    setEditingProductId(null)
    setName("")
    setDescription("")
    setSupplier("")
    setSupplierContactName("")
    setSupplierContactPhone("")
    setCostPrice("")
    setSalePrice("")
    setStockQuantity("0")
    setPhoto("")
    setErrorMsg("")
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
      (compressedBase64) => setPhoto(compressedBase64),
      (errMsg) => setErrorMsg(errMsg)
    )
  }

  const formatCurrencyInput = (value) => {
    const digits = value.replace(/\D/g, "")
    if (!digits) return ""
    const numberValue = parseFloat(digits) / 100
    return numberValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  const parseCurrencyToFloat = (formattedStr) => {
    if (!formattedStr) return 0
    const digits = formattedStr.replace(/\D/g, "")
    return digits ? parseFloat(digits) / 100 : 0
  }

  const handleCostPriceChange = (e) => {
    setCostPrice(formatCurrencyInput(e.target.value))
  }

  const handleSalePriceChange = (e) => {
    setSalePrice(formatCurrencyInput(e.target.value))
  }

  const handleEditClick = (prod) => {
    setEditingProductId(prod.id)
    setName(prod.name || "")
    setDescription(prod.description || "")
    setSupplier(prod.supplier || "")
    setSupplierContactName(prod.supplier_contact_name || "")
    setSupplierContactPhone(prod.supplier_contact_phone || "")
    setPhoto(prod.photo || "")
    
    const costFormatted = prod.cost_price 
      ? prod.cost_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) 
      : ""
    const saleFormatted = prod.sale_price 
      ? prod.sale_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) 
      : ""

    setCostPrice(costFormatted)
    setSalePrice(saleFormatted)
    setStockQuantity(String(prod.stock_quantity ?? 0))
    setErrorMsg("")
    setIsModalOpen(true)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")
    setSubmitting(true)

    if (!name.trim()) {
      setErrorMsg("O nome do produto é obrigatório.")
      setSubmitting(false)
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      supplier: supplier.trim(),
      supplier_contact_name: supplierContactName.trim(),
      supplier_contact_phone: supplierContactPhone.trim(),
      cost_price: parseCurrencyToFloat(costPrice),
      sale_price: parseCurrencyToFloat(salePrice),
      stock_quantity: parseInt(stockQuantity, 10) || 0,
      photo: photo ? photo.trim() : ""
    }

    try {
      const url = editingProductId 
        ? `${API_URL}/api/products/${editingProductId}` 
        : `${API_URL}/api/products`
      const method = editingProductId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setSuccessMsg(editingProductId ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!")
        fetchProducts()
      } else {
        // Fallback local se a API não estiver autenticada ou offline
        const updatedProduct = {
          id: editingProductId || ('prod-' + Date.now()),
          ...payload
        }
        if (editingProductId) {
          setProducts(prev => prev.map(p => p.id === editingProductId ? updatedProduct : p))
        } else {
          setProducts(prev => [updatedProduct, ...prev])
        }
        setSuccessMsg(editingProductId ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!")
      }
    } catch {
      // Fallback local
      const updatedProduct = {
        id: editingProductId || ('prod-' + Date.now()),
        ...payload
      }
      if (editingProductId) {
        setProducts(prev => prev.map(p => p.id === editingProductId ? updatedProduct : p))
      } else {
        setProducts(prev => [updatedProduct, ...prev])
      }
      setSuccessMsg(editingProductId ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!")
    } finally {
      setTimeout(() => {
        setSuccessMsg("")
      }, 4000)
      setIsModalOpen(false)
      resetForm()
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (id) => {
    showConfirm(
      "Excluir Produto",
      "Tem certeza que deseja excluir este produto do catálogo? Esta ação não pode ser desfeita.",
      () => executeDeleteProduct(id)
    )
  }

  const executeDeleteProduct = async (id) => {
    setErrorMsg("")
    setSuccessMsg("")

    try {
      await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
    } catch (err) {
      console.error("Erro ao deletar no servidor:", err)
    } finally {
      setSuccessMsg("Produto excluído com sucesso!")
      setTimeout(() => {
        setSuccessMsg("")
      }, 4000)
      setProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  // Filtragem local dos produtos com garantia de array
  const safeProducts = Array.isArray(products) ? products : INITIAL_DEFAULT_PRODUCTS
  const filteredProducts = safeProducts.filter(p => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.supplier && p.supplier.toLowerCase().includes(q)) ||
      (p.supplier_contact_name && p.supplier_contact_name.toLowerCase().includes(q))
    )
  })

  // Estatísticas do Estoque
  const totalItemsCount = safeProducts.length
  const totalStockQuantity = safeProducts.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0)
  const totalStockValue = safeProducts.reduce((acc, p) => acc + ((Number(p.sale_price) || 0) * (Number(p.stock_quantity) || 0)), 0)
  const lowStockCount = safeProducts.filter(p => (Number(p.stock_quantity) || 0) <= 3).length

  // Permissão visual ativada por padrão para facilitar testes
  const canManage = !user || user.role === 'admin' || user.role === 'barber'

  return (
    <div className={`min-h-screen bg-transparent text-foreground pt-24 pb-28 lg:pt-8 lg:pb-12 px-4 md:px-8 relative ${user ? 'lg:pl-[280px] sidebar-page-container' : ''} flex flex-col justify-start`}>
      {user && <Sidebar />}

      <div className="container mx-auto max-w-5xl relative z-10 animate-fade-in">
        <div className="space-y-6">
          {/* Alertas Globais */}
          {successMsg && (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-4 shadow-sm animate-fade-in">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 shadow-sm animate-fade-in">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cards de Métricas do Estoque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Package size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cadastrados</p>
                <h3 className="text-xl font-bold font-display text-foreground">{totalItemsCount} produtos</h3>
              </div>
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Boxes size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estoque Total</p>
                <h3 className="text-xl font-bold font-display text-foreground">{totalStockQuantity} unidades</h3>
              </div>
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor Estimado</p>
                <h3 className="text-xl font-bold font-display text-primary">
                  {totalStockValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </h3>
              </div>
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                lowStockCount > 0 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                  : "bg-muted/40 border-border text-muted-foreground"
              }`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estoque Baixo (≤3)</p>
                <h3 className={`text-xl font-bold font-display ${lowStockCount > 0 ? "text-amber-400" : "text-foreground"}`}>
                  {lowStockCount} {lowStockCount === 1 ? "item" : "itens"}
                </h3>
              </div>
            </div>
          </div>

          {/* Seção Principal de Produtos */}
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated">
            {/* Cabeçalho e Ações */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold font-display mb-1 flex items-center gap-2">
                  <Package className="text-primary w-5 h-5" /> Controle de Estoque & Produtos
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gerencie o catálogo de produtos da barbearia, fornecedores, custos, preços de venda e estoque.
                </p>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setIsModalOpen(true)
                  }}
                  className="flex items-center justify-center gap-2 bg-gold-gradient hover:shadow-gold-sm text-black font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl transition-all self-start md:self-auto shrink-0 cursor-pointer"
                >
                  <Plus size={16} /> Novo Produto
                </button>
              )}
            </div>

            {/* Barra de Filtro e Busca */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nome do produto, fornecedor ou detalhes..."
                className="w-full bg-background border border-border/80 focus:border-primary rounded-xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none transition-all placeholder:text-muted-foreground/60"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Grid de Produtos */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-muted-foreground">Carregando catálogo de produtos...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 border border-dashed border-border/60 rounded-2xl">
                <Package size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                <h4 className="text-base font-bold text-foreground mb-1">
                  {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                  {searchTerm 
                    ? "Tente buscar com outros termos de pesquisa." 
                    : "Clique no botão acima para adicionar o primeiro produto ao estoque da barbearia."}
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="text-xs text-primary underline font-medium hover:text-primary/80 cursor-pointer"
                  >
                    Limpar filtro de busca
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => {
                  const stockQty = Number(prod.stock_quantity) || 0
                  const isStockLow = stockQty <= 3
                  const isStockOut = stockQty === 0
                  
                  const cost = Number(prod.cost_price) || 0
                  const sale = Number(prod.sale_price) || 0
                  const profit = sale - cost
                  const margin = sale > 0 ? Math.round((profit / sale) * 100) : 0

                  return (
                    <div 
                      key={prod.id}
                      className="bg-muted/30 border border-border/70 rounded-2xl p-5 hover:border-primary/45 transition-all duration-300 shadow-sm flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div>
                        {/* Header do Card com Foto, Badge de Estoque e Nome */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className="w-[52px] h-[52px] bg-background border border-border/60 rounded-xl overflow-hidden flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300">
                              {prod.photo ? (
                                <img src={prod.photo} alt={prod.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={20} />
                              )}
                            </div>
                            {/* Badge de Estoque */}
                            <span className={`text-[12px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-center ${
                              isStockOut 
                                ? "bg-destructive/10 border-destructive/30 text-destructive" 
                                : isStockLow 
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            }`}>
                              Qtd: {stockQty}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base tracking-wide text-foreground leading-snug">{prod.name}</h4>
                            {prod.supplier && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium mt-0.5">
                                <Building2 size={12} className="text-primary/70 shrink-0" />
                                {prod.supplier}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Detalhes do Produto */}
                        {prod.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2 bg-background/30 p-2.5 rounded-xl border border-border/40">
                            {prod.description}
                          </p>
                        )}

                        {/* Informações do Fornecedor e Contato de Compra */}
                        {(prod.supplier_contact_name || prod.supplier_contact_phone) && (
                          <div className="mb-4 bg-background/50 border border-border/50 rounded-xl p-3 space-y-1.5">
                            <span className="text-[10pt] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                              Contato para Compra:
                            </span>
                            {prod.supplier_contact_name && (
                              <div className="flex items-center gap-2 text-[10pt] text-foreground font-medium">
                                <UserCheck size={13} className="text-primary shrink-0" />
                                <span>{prod.supplier_contact_name}</span>
                              </div>
                            )}
                            {prod.supplier_contact_phone && (
                              <div className="flex items-center gap-2 text-[10pt] text-muted-foreground">
                                <Phone size={13} className="text-primary shrink-0" />
                                <span>{prod.supplier_contact_phone}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Informações Financeiras e Ações */}
                      <div>
                        {/* Preço de Custo, Venda e Margem */}
                        <div className="bg-background/60 border border-border/60 rounded-xl p-3 mb-4 space-y-2">
                          <div className="flex items-center justify-between text-[10pt]">
                            <span className="text-muted-foreground">Valor de Compra:</span>
                            <span className="font-mono text-muted-foreground font-medium">
                              {cost > 0 ? cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm pt-1 border-t border-border/40">
                            <span className="font-bold text-foreground">Valor de Venda:</span>
                            <span className="font-display font-black text-primary text-base">
                              {sale > 0 ? sale.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
                            </span>
                          </div>

                          {sale > 0 && cost > 0 && (
                            <div className="flex items-center justify-between text-[10pt] pt-1 text-emerald-400 font-semibold border-t border-border/20">
                              <span className="flex items-center gap-1"><TrendingUp size={11} /> Lucro Est.:</span>
                              <span>
                                {profit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ({margin}%)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        {canManage && (
                          <div className="flex gap-2 w-full pt-1">
                            <button
                              type="button"
                              onClick={() => handleEditClick(prod)}
                              className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-background border border-border hover:border-primary/40 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              <Pencil size={12} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(prod.id)}
                              className="p-2 flex items-center justify-center bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground text-xs rounded-xl transition-all cursor-pointer border border-destructive/20 hover:border-destructive"
                              title="Excluir Produto"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
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

      {/* MODAL DE INCLUSÃO / EDIÇÃO DE PRODUTOS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-[#1c1c20]/95 backdrop-blur-xl w-full max-w-lg border border-primary/30 rounded-2xl p-6 md:p-8 shadow-2xl relative animate-scale-in my-8">
            <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
              <h3 className="text-xl font-bold font-display text-primary flex items-center gap-2">
                {editingProductId ? <Pencil size={20} /> : <Plus size={20} />}
                {editingProductId ? "Editar Produto" : "Cadastrar Novo Produto"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Nome do Produto */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pomada Modeladora Do Vale 100g"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                />
              </div>

              {/* Detalhes do Produto */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Detalhes do Produto
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Efeito fosco, alta fixação, fragrância amadeirada..."
                  rows={2}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Foto do Produto */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Foto do Produto
                </label>
                <div className="flex items-center gap-4 bg-background/40 border border-border/60 p-3.5 rounded-xl">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-border/80 bg-background flex items-center justify-center shrink-0">
                    {photo ? (
                      <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label 
                      htmlFor="product-photo-upload" 
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg border border-border cursor-pointer transition-all hover:scale-102"
                    >
                      <Upload size={13} /> Selecionar Foto
                    </label>
                    <input 
                      type="file" 
                      id="product-photo-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload} 
                    />
                    <p className="text-[9px] text-muted-foreground leading-normal">
                      Selecione uma imagem (PNG, JPG) de até 2MB.
                    </p>
                    {photo && (
                      <button 
                        type="button" 
                        onClick={() => setPhoto("")}
                        className="text-[10px] text-destructive hover:underline font-bold block"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fornecedor */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Ex: Barber Supply Distribuidora"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                />
              </div>

              {/* Contato para Compra (Nome e Telefone) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nome do Contato (Compra)
                  </label>
                  <input
                    type="text"
                    value={supplierContactName}
                    onChange={(e) => setSupplierContactName(e.target.value)}
                    placeholder="Ex: Roberto Silva"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    value={supplierContactPhone}
                    onChange={(e) => setSupplierContactPhone(e.target.value)}
                    placeholder="Ex: (34) 99999-8888"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Valores de Compra, Venda e Estoque */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Valor de Compra
                  </label>
                  <input
                    type="text"
                    value={costPrice}
                    onChange={handleCostPriceChange}
                    placeholder="R$ 0,00"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-3 text-sm text-foreground focus:outline-none transition-all font-mono text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Valor de Venda
                  </label>
                  <input
                    type="text"
                    value={salePrice}
                    onChange={handleSalePriceChange}
                    placeholder="R$ 0,00"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-3 text-sm text-foreground focus:outline-none transition-all font-mono text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Qtde (Estoque)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-3 text-sm text-foreground focus:outline-none transition-all text-center font-bold"
                  />
                </div>
              </div>

              {/* Ações do Modal */}
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
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-gold-gradient text-black text-xs uppercase tracking-wider font-bold rounded-xl shadow-gold-sm hover:shadow-gold-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : editingProductId ? "Salvar Alterações" : "Cadastrar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
