import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { Users, Plus, Search, AlertTriangle, CheckCircle2, User, Pencil, Trash2, Sparkles, Upload } from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

export default function Clientes() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

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
  const [appointments, setAppointments] = useState([])

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  })

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    if (user.role === "admin" || user.role === "barber") {
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
    } else {
      async function loadAppts() {
        try {
          const response = await fetch(`${API_URL}/api/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            setAppointments(data)
          }
        } catch (err) {
          console.error("Erro ao carregar agendamentos:", err)
        }
      }
      loadAppts()
    }
  }, [user, token, navigate])

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

  const formatDateTime = (isoString) => {
    try {
      const date = new Date(isoString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return isoString
    }
  }

  const formatBirthDate = (dateStr) => {
    if (!dateStr) return ""
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
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
      
      if (editingCustomerId) {
        setCustomerList(prev => prev.map(c => c.id === editingCustomerId ? data.customer : c))
      } else {
        setCustomerList(prev => [...prev, data.customer])
      }

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

  if (!user) return null

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background text-foreground pt-24 pb-28 lg:pb-12 px-4 md:px-8 relative lg:pl-[280px] sidebar-page-container flex flex-col justify-start">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        `}
      </style>

      {/* Sidebar de Navegação */}
      <Sidebar />

      <div className="container mx-auto px-1 max-w-5xl relative z-10 animate-scale-in lg:fixed lg:left-[280px] sidebar-fixed-content lg:right-10 lg:top-1/2 lg:-translate-y-1/2 lg:h-[calc(80vh+80px)] lg:w-auto lg:max-w-none lg:overflow-y-auto lg:pr-4">
        <div className="space-y-6 animate-scale-in">
          {(user.role === "admin" || user.role === "barber") ? (
            <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated relative overflow-hidden">
              
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
                                  <p className="text-[10px] text-muted-foreground mt-0.5">Cadastrado em {formatDateTime(c.created_at || new Date().toISOString())}</p>
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
                                className="p-2 flex items-center justify-center bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground text-xs rounded-xl transition-all cursor-pointer border border-destructive/20 hover:border-destructive"
                                title="Excluir Cliente"
                              >
                                <Trash2 size={12} />
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
