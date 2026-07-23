import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { User, Plus, Pencil, Trash2, CheckCircle2, AlertTriangle, Upload } from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

export default function Profissionais() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [barbers, setBarbers] = useState([])
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false)
  const [editingBarberId, setEditingBarberId] = useState(null)
  const [barberName, setBarberName] = useState("")
  const [barberPhone, setBarberPhone] = useState("")
  const [barberPhoto, setBarberPhoto] = useState("")
  const [barberBirthDate, setBarberBirthDate] = useState("")
  const [barberSpecialty, setBarberSpecialty] = useState("")
  const [barberHiredAt, setBarberHiredAt] = useState("")
  const [barberServiceCommission, setBarberServiceCommission] = useState(0)
  const [barberProductCommission, setBarberProductCommission] = useState(0)
  const [barberSubmitting, setBarberSubmitting] = useState(false)
  const [barberError, setBarberError] = useState("")
  const [barberSuccess, setBarberSuccess] = useState("")

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

    async function loadBarbers() {
      try {
        const res = await fetch(`${API_URL}/api/barbers`)
        if (res.ok) {
          const data = await res.json()
          setBarbers(data)
        } else {
          setBarbers([
            { id: "barb-marcio", name: "MARCIO DO VALE", phone: "(34) 99868-4036" },
            { id: "barb-lucas", name: "LUCAS DO VALE", phone: "(34) 99868-4036" },
            { id: "barb-paulo", name: "PAULO TILLMANN", phone: "(34) 99868-4036" }
          ])
        }
      } catch (err) {
        console.error("Erro ao carregar barbeiros:", err)
      }
    }

    loadBarbers()
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

  const formatBirthDate = (dateStr) => {
    if (!dateStr) return ""
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  const resetBarberForm = () => {
    setEditingBarberId(null)
    setBarberName("")
    setBarberPhone("")
    setBarberPhoto("")
    setBarberBirthDate("")
    setBarberSpecialty("")
    setBarberHiredAt("")
    setBarberServiceCommission(0)
    setBarberProductCommission(0)
  }

  const handleEditBarberClick = (barb) => {
    setEditingBarberId(barb.id)
    setBarberName(barb.name || "")
    setBarberPhone(barb.phone || "")
    setBarberPhoto(barb.photo || "")
    setBarberBirthDate(barb.birth_date || "")
    setBarberSpecialty(barb.specialty || "")
    setBarberHiredAt(barb.hired_at || "")
    setBarberServiceCommission(barb.service_commission ?? 0)
    setBarberProductCommission(barb.product_commission ?? 0)
    setIsBarberModalOpen(true)
  }

  const handleBarberPhoneChange = (e) => {
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
    setBarberPhone(value)
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

  const handleBarberPhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    compressAndSetImage(
      file,
      (compressedBase64) => setBarberPhoto(compressedBase64),
      (errMsg) => setBarberError(errMsg)
    )
  }

  const handleSaveBarber = async (e) => {
    e.preventDefault()
    setBarberSubmitting(true)
    setBarberError("")
    setBarberSuccess("")

    const payload = {
      name: barberName.trim(),
      phone: barberPhone.trim(),
      photo: barberPhoto.trim(),
      birth_date: barberBirthDate.trim(),
      specialty: barberSpecialty.trim(),
      hired_at: barberHiredAt.trim(),
      service_commission: Number(barberServiceCommission) || 0,
      product_commission: Number(barberProductCommission) || 0
    }

    try {
      const url = editingBarberId 
        ? `${API_URL}/api/barbers/${editingBarberId}` 
        : `${API_URL}/api/barbers`
      const method = editingBarberId ? "PUT" : "POST"

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
        throw new Error(data.error || "Erro ao salvar profissional.")
      }

      setBarberSuccess(editingBarberId ? "Profissional atualizado com sucesso!" : "Profissional cadastrado com sucesso!")
      setTimeout(() => {
        setBarberSuccess("")
      }, 5000)

      if (editingBarberId) {
        setBarbers(prev => prev.map(b => b.id === editingBarberId ? data.barber : b))
      } else {
        setBarbers(prev => [...prev, data.barber])
      }

      setIsBarberModalOpen(false)
      resetBarberForm()
    } catch (err) {
      setBarberError(err.message)
    } finally {
      setBarberSubmitting(false)
    }
  }

  const handleDeleteBarber = (id) => {
    showConfirm(
      "Excluir Profissional",
      "Tem certeza que deseja excluir este profissional? Esta ação não poderá ser desfeita.",
      () => executeDeleteBarber(id)
    )
  }

  const executeDeleteBarber = async (id) => {
    setBarberError("")
    setBarberSuccess("")

    try {
      const res = await fetch(`${API_URL}/api/barbers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao excluir profissional.")
      }

      setBarberSuccess("Profissional excluído com sucesso!")
      setTimeout(() => {
        setBarberSuccess("")
      }, 5000)
      setBarbers(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      setBarberError(err.message)
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
          {barberSuccess && (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl p-4 shadow-sm animate-fade-in">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{barberSuccess}</span>
            </div>
          )}

          {barberError && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 shadow-sm animate-fade-in">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{barberError}</span>
            </div>
          )}

          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold font-display mb-2 flex items-center gap-2">
                  <User className="text-primary w-5 h-5" /> Profissionais
                </h2>
                <p className="text-sm text-muted-foreground">
                  Profissionais qualificados com ampla experiência no mercado, prontos para entregar o melhor visual para você.
                </p>
              </div>
              {user.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    resetBarberForm()
                    setIsBarberModalOpen(true)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-gradient text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                >
                  <Plus size={14} /> Novo Profissional
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
              {barbers.map((barb, index) => {
                const photo = barb.photo || (
                  index === 0 ? "/assets/foto_marcio.png" :
                  index === 1 ? "/assets/foto_lucas.png" :
                  "/assets/foto_neto.png"
                )
                return (
                  <div key={barb.id} className="w-full max-w-[280px] bg-muted/20 border border-border/85 rounded-2xl p-6 shadow-md hover:border-primary/40 transition-all duration-300 text-center flex flex-col items-center group relative">
                    <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-border/80 group-hover:border-primary/50 transition-colors duration-300 shadow-md mb-4 bg-background">
                      <img src={photo} alt={barb.name} className="w-full h-full object-cover object-top scale-102 group-hover:scale-108 transition-transform duration-500" />
                    </div>
                    <h4 className="font-bold text-sm uppercase tracking-wide text-foreground mt-2">{barb.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">{barb.specialty || "Especialista Do Vale"}</span>
                    
                    <div className="space-y-1.5 text-left w-full text-xs text-muted-foreground border-t border-border/40 pt-4 mt-4 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground/80">WhatsApp:</span>
                        <a 
                          href={`https://wa.me/55${barb.phone.replace(/\D/g, "")}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline hover:text-accent font-medium tracking-wide"
                        >
                          {barb.phone}
                        </a>
                      </div>
                      {barb.hired_at && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground/80">Profissional desde:</span>
                          <span className="text-foreground/90">{formatBirthDate(barb.hired_at)}</span>
                        </div>
                      )}
                      {user.role === 'admin' && (
                        <div className="border-t border-border/30 pt-2 mt-2 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-foreground/80">Comissão Serviços:</span>
                            <span className="font-bold text-primary">{barb.service_commission ?? 0}%</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-foreground/80">Comissão Produtos:</span>
                            <span className="font-bold text-primary">{barb.product_commission ?? 0}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {user.role === 'admin' && (
                      <div className="flex gap-2.5 w-full border-t border-border/40 pt-4 mt-4">
                        <button
                          type="button"
                          onClick={() => handleEditBarberClick(barb)}
                          className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-background border border-border hover:border-primary/40 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBarber(barb.id)}
                          className="p-2 flex items-center justify-center bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground text-xs rounded-xl transition-all cursor-pointer border border-destructive/20 hover:border-destructive"
                          title="Excluir Profissional"
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

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE PROFISSIONAIS */}
      {isBarberModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1c1c20]/95 backdrop-blur-xl w-full max-w-lg border border-primary/30 rounded-2xl p-6 md:p-8 shadow-2xl relative animate-scale-in">
            <h3 className="text-xl font-bold font-display mb-6 text-primary flex items-center gap-2">
              {editingBarberId ? <Pencil size={20} /> : <Plus size={20} />}
              {editingBarberId ? "Editar Ficha de Profissional" : "Cadastrar Novo Profissional"}
            </h3>

            {barberError && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{barberError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBarber} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={barberName}
                    onChange={(e) => setBarberName(e.target.value)}
                    placeholder="Ex: Paulo Tillmann"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Celular / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={barberPhone}
                    onChange={handleBarberPhoneChange}
                    placeholder="Ex: (34) 98821-8498"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data de Nascimento</label>
                  <input
                    type="date"
                    value={barberBirthDate}
                    onChange={(e) => setBarberBirthDate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Especialidade (Especialista em)</label>
                  <input
                    type="text"
                    value={barberSpecialty}
                    onChange={(e) => setBarberSpecialty(e.target.value)}
                    placeholder="Ex: Cortes clássicos"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Profissional Desde (Data)</label>
                  <input
                    type="date"
                    value={barberHiredAt}
                    onChange={(e) => setBarberHiredAt(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comissão de Serviços (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={barberServiceCommission}
                    onChange={(e) => setBarberServiceCommission(e.target.value)}
                    placeholder="Ex: 50"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comissão por Produto (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={barberProductCommission}
                    onChange={(e) => setBarberProductCommission(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Foto do Profissional</label>
                  <div className="flex items-center gap-4 bg-background/40 border border-border p-4 rounded-xl">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gold-subtle shadow-sm bg-background/50 flex items-center justify-center shrink-0">
                      {barberPhoto ? (
                        <img src={barberPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label 
                        htmlFor="barber-photo-upload-input" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl border border-border cursor-pointer transition-all hover:scale-102"
                      >
                        <Upload size={14} /> Selecionar Foto
                      </label>
                      <input 
                        type="file" 
                        id="barber-photo-upload-input" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleBarberPhotoUpload} 
                      />
                      <p className="text-[9px] text-muted-foreground leading-normal">Selecione uma imagem (PNG, JPG) de até 2MB para salvar no perfil.</p>
                      {barberPhoto && (
                        <button 
                          type="button" 
                          onClick={() => setBarberPhoto("")}
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
                    setIsBarberModalOpen(false)
                    resetBarberForm()
                  }}
                  className="flex-1 border border-border hover:bg-muted rounded-xl h-12 font-medium transition-colors cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={barberSubmitting}
                  className="flex-1 bg-gold-gradient text-primary-foreground font-bold h-12 rounded-xl text-sm uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  {barberSubmitting ? (
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
