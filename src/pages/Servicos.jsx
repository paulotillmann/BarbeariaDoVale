import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { Scissors, Plus, Pencil, Trash2, Clock, Sparkles, Flame, CheckCircle2, AlertTriangle, Check } from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

export default function Servicos() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])

  // Modal / Form states
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState(null)
  const [serviceName, setServiceName] = useState("")
  const [serviceDescription, setServiceDescription] = useState("")
  const [serviceDurationMinutes, setServiceDurationMinutes] = useState(30)
  const [servicePrice, setServicePrice] = useState("")
  const [serviceBarbers, setServiceBarbers] = useState([])
  const [serviceSubmitting, setServiceSubmitting] = useState(false)
  const [serviceError, setServiceError] = useState("")
  const [serviceSuccess, setServiceSuccess] = useState("")

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

    async function fetchData() {
      try {
        const srvRes = await fetch(`${API_URL}/api/services`)
        if (srvRes.ok) {
          const srvData = await srvRes.json()
          setServices(srvData)
        } else {
          setServices([
            { id: "srv-corte", name: "Corte de Cabelo", price: 55, duration_minutes: 30, description: "Corte clássico com acabamento perfeito realizado pelos nossos profissionais de ponta." },
            { id: "srv-barba", name: "Barba Completa", price: 45, duration_minutes: 30, description: "Barboterapia completa com toalha quente, óleos essenciais e massagem facial." },
            { id: "srv-combo", name: "Combo Do Vale (Corte + Barba)", price: 90, duration_minutes: 60, description: "A experiência completa da Barbearia Do Vale com desconto exclusivo." }
          ])
        }

        const barbRes = await fetch(`${API_URL}/api/barbers`)
        if (barbRes.ok) {
          const barbData = await barbRes.json()
          setBarbers(barbData)
        }
      } catch (err) {
        console.error("Erro ao carregar serviços:", err)
      }
    }

    fetchData()
  }, [user, navigate])

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

  const resetServiceForm = () => {
    setEditingServiceId(null)
    setServiceName("")
    setServiceDescription("")
    setServiceDurationMinutes(30)
    setServicePrice("")
    setServiceBarbers([])
  }

  const handleEditServiceClick = (srv) => {
    setEditingServiceId(srv.id)
    setServiceName(srv.name || "")
    setServiceDescription(srv.description || "")
    setServiceDurationMinutes(srv.duration_minutes ?? 30)
    
    const cents = Math.round((srv.price || 0) * 100)
    const formattedPrice = (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
    setServicePrice(formattedPrice)
    setServiceBarbers(srv.barber_ids || [])
    setIsServiceModalOpen(true)
  }

  const handleServicePriceChange = (e) => {
    const value = e.target.value.replace(/\D/g, "")
    if (!value) {
      setServicePrice("")
      return
    }
    const numberValue = parseFloat(value) / 100
    const formatted = numberValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
    setServicePrice(formatted)
  }

  const handleSaveService = async (e) => {
    e.preventDefault()
    setServiceError("")
    setServiceSuccess("")
    setServiceSubmitting(true)

    const priceClean = servicePrice.replace(/\D/g, "")
    const priceFloat = priceClean ? parseFloat(priceClean) / 100 : 0

    if (!serviceName.trim()) {
      setServiceError("O nome do serviço é obrigatório.")
      setServiceSubmitting(false)
      return
    }

    const payload = {
      name: serviceName.trim(),
      description: serviceDescription.trim(),
      duration_minutes: Number(serviceDurationMinutes),
      price: priceFloat,
      barber_ids: serviceBarbers
    }

    try {
      const url = editingServiceId 
        ? `${API_URL}/api/services/${editingServiceId}` 
        : `${API_URL}/api/services`
      const method = editingServiceId ? "PUT" : "POST"

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
        throw new Error(data.error || "Erro ao salvar serviço.")
      }

      setServiceSuccess(editingServiceId ? "Serviço atualizado com sucesso!" : "Serviço cadastrado com sucesso!")
      setTimeout(() => {
        setServiceSuccess("")
      }, 5000)

      const updatedService = {
        id: data.service.id,
        name: data.service.name,
        description: data.service.description,
        duration_minutes: data.service.duration_minutes,
        price: data.service.price,
        barber_ids: data.service.barber_ids || []
      }

      if (editingServiceId) {
        setServices(prev => prev.map(s => s.id === editingServiceId ? updatedService : s))
      } else {
        setServices(prev => [...prev, updatedService])
      }

      setIsServiceModalOpen(false)
      resetServiceForm()
    } catch (err) {
      setServiceError(err.message)
    } finally {
      setServiceSubmitting(false)
    }
  }

  const handleDeleteService = (id) => {
    showConfirm(
      "Excluir Serviço",
      "Tem certeza que deseja excluir este serviço? Esta ação não poderá ser desfeita.",
      () => executeDeleteService(id)
    )
  }

  const executeDeleteService = async (id) => {
    setServiceError("")
    setServiceSuccess("")

    try {
      const res = await fetch(`${API_URL}/api/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao excluir serviço.")
      }

      setServiceSuccess("Serviço excluído com sucesso!")
      setTimeout(() => {
        setServiceSuccess("")
      }, 5000)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      setServiceError(err.message)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-transparent text-foreground pt-24 pb-28 lg:pt-8 lg:pb-12 px-4 md:px-8 relative lg:pl-[280px] sidebar-page-container flex flex-col justify-start">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        `}
      </style>

      {/* Sidebar de Navegação */}
      <Sidebar />

      <div className="container mx-auto max-w-5xl relative z-10 animate-fade-in">
        <div className="space-y-6">
          {serviceSuccess && (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-4 shadow-sm animate-fade-in">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{serviceSuccess}</span>
            </div>
          )}
          {serviceError && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 shadow-sm animate-fade-in">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{serviceError}</span>
            </div>
          )}

          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold font-display mb-2 flex items-center gap-2">
                  <Scissors className="text-primary w-5 h-5" /> Nosso Catálogo de Serviços
                </h2>
                <p className="text-sm text-muted-foreground">
                  Confira nossos procedimentos, tempos de execução e valores. Serviços executados sob medida com padrão de excelência.
                </p>
              </div>
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    resetServiceForm()
                    setIsServiceModalOpen(true)
                  }}
                  className="flex items-center justify-center gap-2 bg-gold-gradient hover:shadow-gold-sm text-black font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl transition-all self-start sm:self-auto shrink-0 cursor-pointer"
                >
                  <Plus size={16} /> Adicionar Serviço
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(services.length > 0 ? services : [
                { id: "srv-corte", name: "Corte de Cabelo", price: 55, duration_minutes: 30, description: "Corte clássico com acabamento perfeito realizado pelos nossos profissionais de ponta." },
                { id: "srv-barba", name: "Barba Completa", price: 45, duration_minutes: 30, description: "Barboterapia completa com toalha quente, óleos essenciais e massagem facial." },
                { id: "srv-combo", name: "Combo Do Vale (Corte + Barba)", price: 90, duration_minutes: 60, description: "A experiência completa da Barbearia Do Vale com desconto exclusivo." }
              ]).map((srv) => {
                const getServiceIcon = (id) => {
                  if (id.includes('combo')) return <Scissors size={20} className="text-primary" />
                  if (id.includes('barba')) return <Flame size={20} className="text-primary" />
                  return <Sparkles size={20} className="text-primary" />
                }
                return (
                  <div key={srv.id} className="bg-muted/30 border border-border/70 rounded-2xl p-6 hover:border-primary/45 transition-all duration-300 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div>
                      <div className="w-12 h-12 bg-background border border-border/60 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform duration-300">
                        {getServiceIcon(srv.id)}
                      </div>
                      <h4 className="font-bold text-base tracking-wide text-foreground mb-2">{srv.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-6">{srv.description || "Procedimento Do Vale de alto padrão"}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between border-t border-border/40 pt-4">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock size={13} /> {srv.duration_minutes === 0 ? "Livre" : `${srv.duration_minutes} min`}</span>
                        <span className="font-display font-black text-primary text-base">R$ {srv.price.toFixed(2).replace('.', ',')}</span>
                      </div>
                      {srv.barber_ids && srv.barber_ids.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/20">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Profissionais:</span>
                          <div className="flex flex-wrap gap-1">
                            {srv.barber_ids.map(bId => {
                              const barber = barbers.find(b => b.id === bId)
                              if (!barber) return null
                              return (
                                <span key={bId} className="text-[9px] bg-background/50 border border-border/50 text-foreground py-0.5 px-2 rounded-full font-medium">
                                  {barber.name.split(' ')[0]}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {user.role === 'admin' && (
                      <div className="flex gap-2.5 w-full border-t border-border/40 pt-4 mt-4">
                        <button
                          type="button"
                          onClick={() => handleEditServiceClick(srv)}
                          className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-background border border-border hover:border-primary/40 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-2 flex items-center justify-center bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground text-xs rounded-xl transition-all cursor-pointer border border-destructive/20 hover:border-destructive"
                          title="Excluir Serviço"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
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

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE SERVIÇOS */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1c1c20]/95 backdrop-blur-xl w-full max-w-lg border border-primary/30 rounded-2xl p-6 md:p-8 shadow-2xl relative animate-scale-in">
            <h3 className="text-xl font-bold font-display mb-6 text-primary flex items-center gap-2">
              {editingServiceId ? <Pencil size={20} /> : <Plus size={20} />}
              {editingServiceId ? "Editar Serviço" : "Cadastrar Novo Serviço"}
            </h3>

            {serviceError && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{serviceError}</span>
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Corte Degradê"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descrição / Detalhes</label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Descreva o procedimento e o que está incluso..."
                  rows={3}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Duração *</label>
                  <div className="flex gap-2">
                    {[
                      { value: 0, label: "Livre" },
                      { value: 30, label: "30 min" },
                      { value: 60, label: "60 min" }
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setServiceDurationMinutes(opt.value)}
                        className={`flex-1 py-3 px-4 rounded-xl border text-sm transition-all font-bold cursor-pointer ${
                          serviceDurationMinutes === opt.value
                            ? "bg-primary text-background border-primary"
                            : "bg-background border-border text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preço *</label>
                  <input
                    type="text"
                    required
                    value={servicePrice}
                    onChange={handleServicePriceChange}
                    placeholder="R$ 0,00"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all font-mono text-right"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Profissionais que realizam este serviço (Selecione múltiplos)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-1 bg-background/25 border border-border/40 rounded-xl">
                  {barbers.map((barber) => {
                    const isSelected = serviceBarbers.includes(barber.id)
                    return (
                      <button
                        type="button"
                        key={barber.id}
                        onClick={() => {
                          if (isSelected) {
                            setServiceBarbers(prev => prev.filter(id => id !== barber.id))
                          } else {
                            setServiceBarbers(prev => [...prev, barber.id])
                          }
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border/60 bg-background/30 text-muted-foreground hover:border-border"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isSelected ? "border-primary bg-primary text-background" : "border-muted-foreground/35"
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="text-xs truncate">{barber.name}</span>
                      </button>
                    )
                  })}
                  {barbers.length === 0 && (
                    <p className="text-xs text-muted-foreground col-span-2 text-center p-4">Nenhum profissional cadastrado.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/40 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsServiceModalOpen(false)
                    resetServiceForm()
                  }}
                  className="flex-1 py-3 px-4 bg-muted/40 hover:bg-muted/60 text-foreground text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={serviceSubmitting}
                  className="flex-1 py-3 px-4 bg-gold-gradient text-black text-xs uppercase tracking-wider font-bold rounded-xl shadow-gold-sm hover:shadow-gold-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {serviceSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : editingServiceId ? "Salvar Alterações" : "Cadastrar Serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
