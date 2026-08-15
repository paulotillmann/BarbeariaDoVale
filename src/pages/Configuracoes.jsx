import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { Settings, ShieldAlert, AlertTriangle, CheckCircle2, Pencil, Trash2, MessageSquare, Clock } from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

export default function Configuracoes() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [userList, setUserList] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [permissionsError, setPermissionsError] = useState("")
  const [permissionsSuccess, setPermissionsSuccess] = useState("")

  // Modal de edição de usuário states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [editUserName, setEditUserName] = useState("")
  const [editUserPhone, setEditUserPhone] = useState("")
  const [editUserEmail, setEditUserEmail] = useState("")
  const [editUserRole, setEditUserRole] = useState("client")
  const [userSubmitting, setUserSubmitting] = useState(false)
  const [userModalError, setUserModalError] = useState("")

  // Modal de confirmação personalizado state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  })

  // WhatsApp Logs states
  const [whatsappLogs, setWhatsappLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsStatusFilter, setLogsStatusFilter] = useState("")
  const [logsTypeFilter, setLogsTypeFilter] = useState("")

  // Configurações Gerais states
  const [shopName, setShopName] = useState(() => localStorage.getItem("shopName") || "Barbearia Do Vale")
  const [shopAddress, setShopAddress] = useState(() => localStorage.getItem("shopAddress") || "Av. Senador Melo Viana, 709 - Goiás, Araguari/MG")
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem("shopPhone") || "(34) 99868-4036")
  const [shopOpenHours, setShopOpenHours] = useState(() => localStorage.getItem("shopOpenHours") || "Segunda a Sábado das 08:00 às 19:00")
  const [inactivityMinutes, setInactivityMinutes] = useState(() => localStorage.getItem("inactivityMinutes") || "5")
  const [settingsSuccess, setSettingsSuccess] = useState("")

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    if (user.role !== "admin") {
      navigate("/dashboard")
      return
    }

    async function loadUsers() {
      setUsersLoading(true)
      setPermissionsError("")
      try {
        const response = await fetch(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setUserList(data)
        } else {
          const data = await response.json()
          setPermissionsError(data.error || "Erro ao carregar lista de usuários.")
        }
      } catch {
        setPermissionsError("Erro de conexão ao carregar usuários.")
      } finally {
        setUsersLoading(false)
      }
    }

    loadUsers()
    loadWhatsappLogs("", "")
  }, [user, token, navigate])

  const loadWhatsappLogs = async (statusFilter, typeFilter) => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)
      if (typeFilter) params.append("message_type", typeFilter)
      const res = await fetch(`${API_URL}/api/whatsapp-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWhatsappLogs(data.logs || [])
      }
    } catch {
      // silently ignore log errors
    } finally {
      setLogsLoading(false)
    }
  }

  const handleLogsStatusFilter = (val) => {
    setLogsStatusFilter(val)
    loadWhatsappLogs(val, logsTypeFilter)
  }

  const handleLogsTypeFilter = (val) => {
    setLogsTypeFilter(val)
    loadWhatsappLogs(logsStatusFilter, val)
  }

  const formatLogDate = (dateStr) => {
    if (!dateStr) return "—"
    const d = new Date(dateStr.replace(" ", "T"))
    if (isNaN(d)) return dateStr
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
  }

  const formatLogPhone = (phone) => {
    if (!phone) return "—"
    const d = phone.replace(/\D/g, "")
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
    return phone
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

  const handleRoleChange = async (userId, newRole) => {
    setPermissionsError("")
    setPermissionsSuccess("")
    
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar cargo.")
      }

      setPermissionsSuccess(`Cargo de ${newRole.toUpperCase()} atualizado com sucesso!`)
      setTimeout(() => {
        setPermissionsSuccess("")
      }, 5000)
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      setPermissionsError(err.message)
    }
  }

  const formatPhoneNumber = (value) => {
    if (!value) return ""
    const digits = value.replace(/[^\d]/g, "")
    if (digits.length > 11) return formatPhoneNumber(digits.slice(0, 11))
    if (digits.length > 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    if (digits.length > 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    if (digits.length > 2) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    }
    if (digits.length > 0) {
      return `(${digits}`
    }
    return digits
  }

  const handleEditUserClick = (usr) => {
    setEditingUserId(usr.id)
    setEditUserName(usr.name || "")
    setEditUserPhone(formatPhoneNumber(usr.phone || ""))
    setEditUserEmail(usr.email || "")
    setEditUserRole(usr.role || "client")
    setUserModalError("")
    setIsUserModalOpen(true)
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()
    setUserSubmitting(true)
    setUserModalError("")
    setPermissionsError("")
    setPermissionsSuccess("")

    try {
      const res = await fetch(`${API_URL}/api/users/${editingUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editUserName.trim(),
          phone: editUserPhone.trim(),
          email: editUserEmail.trim(),
          role: editUserRole
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar usuário.")
      }

      setPermissionsSuccess("Usuário atualizado com sucesso!")
      setTimeout(() => {
        setPermissionsSuccess("")
      }, 5000)

      setUserList(prev => prev.map(u => u.id === editingUserId ? { ...u, ...data.user } : u))
      setIsUserModalOpen(false)
    } catch (err) {
      setUserModalError(err.message)
    } finally {
      setUserSubmitting(false)
    }
  }

  const handleDeleteUserClick = (usr) => {
    if (usr.id === user.id) {
      setPermissionsError("Você não pode excluir a sua própria conta de administrador.")
      return
    }

    showConfirm(
      "Excluir Usuário",
      `Tem certeza que deseja excluir o usuário "${usr.name}"? Esta ação não pode ser desfeita.`,
      () => executeDeleteUser(usr.id)
    )
  }

  const executeDeleteUser = async (userId) => {
    setPermissionsError("")
    setPermissionsSuccess("")

    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao excluir usuário.")
      }

      setPermissionsSuccess("Usuário excluído com sucesso!")
      setTimeout(() => {
        setPermissionsSuccess("")
      }, 5000)

      setUserList(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      setPermissionsError(err.message)
    }
  }

  const handleSaveSettings = (e) => {
    e.preventDefault()
    setSettingsSuccess("")
    
    localStorage.setItem("shopName", shopName)
    localStorage.setItem("shopAddress", shopAddress)
    localStorage.setItem("shopPhone", shopPhone)
    localStorage.setItem("shopOpenHours", shopOpenHours)
    localStorage.setItem("inactivityMinutes", inactivityMinutes || "5")

    window.dispatchEvent(new Event("storage_inactivity_updated"))
    
    setSettingsSuccess("Configurações gerais salvas com sucesso!")
    setTimeout(() => {
      setSettingsSuccess("")
    }, 5000)
  }

  if (!user || user.role !== "admin") return null

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-transparent text-foreground pt-24 pb-28 lg:pb-12 px-4 md:px-8 relative lg:pl-[280px] sidebar-page-container flex flex-col justify-start">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        `}
      </style>

      {/* Sidebar de Navegação */}
      <Sidebar />

      <div className="container mx-auto px-1 max-w-5xl relative z-10 animate-scale-in lg:fixed lg:left-[280px] sidebar-fixed-content lg:right-10 lg:top-1/2 lg:-translate-y-1/2 lg:h-[calc(80vh+80px)] lg:w-auto lg:max-w-none lg:overflow-y-auto lg:pr-4">
        <div className="space-y-6 animate-scale-in">
          <div className="bg-card/40 backdrop-blur-sm border border-border/80 rounded-2xl p-6 md:p-8 shadow-elevated relative overflow-hidden">
            
            <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2.5 border-b border-border/80 pb-4">
              <Settings className="text-primary w-5 h-5" /> Configurações do Sistema
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Lado Esquerdo: Controle de Usuários e Permissões */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <ShieldAlert size={16} /> Usuários e Permissões
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gerencie os cadastros, cargos e exclusão dos usuários registrados na barbearia.
                </p>

                {permissionsError && (
                  <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{permissionsError}</span>
                  </div>
                )}

                {permissionsSuccess && (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl p-3 animate-scale-in">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{permissionsSuccess}</span>
                  </div>
                )}

                {usersLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-muted-foreground">Carregando usuários...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border/80 bg-background/20 max-h-[350px] overflow-y-auto pr-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/80 text-muted-foreground uppercase font-bold tracking-wider bg-background/45 sticky top-0 z-10">
                          <th className="py-3 px-4">Nome</th>
                          <th className="py-3 px-4">Função</th>
                          <th className="py-3 px-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userList.map((usr) => (
                          <tr 
                            key={usr.id} 
                            className={`border-b border-border/40 hover:bg-muted/5 transition-colors ${
                              usr.id === user.id ? "bg-primary/5" : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-semibold">
                              <div className="text-[12pt] font-bold text-foreground" title={usr.name}>{usr.name}</div>
                              <div className="text-[10pt] text-muted-foreground font-normal mt-0.5">{usr.phone ? formatPhoneNumber(usr.phone) : usr.email || "Sem contato"}</div>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                disabled={usr.id === user.id}
                                value={usr.role}
                                onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                                className="bg-background border border-border focus:border-primary rounded-lg py-1 px-2 text-[10px] focus:outline-none transition-all disabled:opacity-45 cursor-pointer"
                              >
                                <option value="client">Cliente</option>
                                <option value="barber">Barbeiro</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditUserClick(usr)}
                                  className="p-1.5 bg-background border border-border hover:border-primary/50 text-foreground hover:text-primary rounded-lg transition-all cursor-pointer"
                                  title="Editar Usuário"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={usr.id === user.id}
                                  onClick={() => handleDeleteUserClick(usr)}
                                  className="p-1.5 bg-destructive/10 border border-destructive/20 hover:bg-destructive text-destructive hover:text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Excluir Usuário"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Lado Direito: Configurações Gerais */}
              <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-border/60 pt-6 lg:pt-0 lg:pl-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Settings size={16} /> Configurações Gerais
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Configure os dados principais da barbearia apresentados no dashboard do cliente.
                </p>

                {settingsSuccess && (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl p-3 animate-scale-in">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome da Barbearia</label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="Ex: Barbearia Do Vale"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endereço Principal</label>
                    <input
                      type="text"
                      required
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      placeholder="Endereço da Barbearia"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone de Contato</label>
                    <input
                      type="text"
                      required
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      placeholder="Ex: (34) 99868-4036"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Horários de Funcionamento</label>
                    <input
                      type="text"
                      required
                      value={shopOpenHours}
                      onChange={(e) => setShopOpenHours(e.target.value)}
                      placeholder="Ex: Segunda a Sábado das 08:00 às 19:00"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-primary" /> Tempo de Inatividade (Minutos)
                      </span>
                      <span className="text-[9px] text-primary/80 font-normal">Padrão: 5 min</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      required
                      value={inactivityMinutes}
                      onChange={(e) => setInactivityMinutes(e.target.value)}
                      placeholder="Ex: 5"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Tempo sem interação do usuário para encerramento automático da sessão.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gold-gradient text-primary-foreground font-bold h-11 rounded-xl text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </form>
              </div>

            </div>

            {/* Seção: Logs de Envio WhatsApp */}
            <div className="mt-8 pt-8 border-t border-border/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <MessageSquare size={16} /> Logs de Envio WhatsApp
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={logsStatusFilter}
                    onChange={(e) => handleLogsStatusFilter(e.target.value)}
                    className="bg-background border border-border focus:border-primary rounded-lg py-1.5 px-2 text-[11px] focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Todos os status</option>
                    <option value="sent">Enviado</option>
                    <option value="failed">Falhou</option>
                    <option value="pending">Pendente</option>
                  </select>
                  <select
                    value={logsTypeFilter}
                    onChange={(e) => handleLogsTypeFilter(e.target.value)}
                    className="bg-background border border-border focus:border-primary rounded-lg py-1.5 px-2 text-[11px] focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="confirmation">Confirmação</option>
                    <option value="reminder">Lembrete</option>
                    <option value="cancellation">Cancelamento</option>
                  </select>
                </div>
              </div>

              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-muted-foreground">Carregando logs...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/80 bg-background/20 max-h-[350px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground uppercase font-bold tracking-wider bg-background/45 sticky top-0 z-10">
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Telefone</th>
                        <th className="py-3 px-4">Serviço</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Agendamento</th>
                        <th className="py-3 px-4">Enviado em</th>
                        <th className="py-3 px-4">Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whatsappLogs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                            Nenhum log encontrado.
                          </td>
                        </tr>
                      ) : whatsappLogs.map((log) => (
                        <tr key={log.id} className="border-b border-border/40 hover:bg-muted/5 transition-colors">
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              log.message_type === "confirmation"
                                ? "bg-blue-500/15 text-blue-400"
                                : log.message_type === "reminder"
                                ? "bg-yellow-500/15 text-yellow-400"
                                : "bg-red-500/15 text-red-400"
                            }`}>
                              {log.message_type === "confirmation" ? "Confirmação"
                                : log.message_type === "reminder" ? "Lembrete"
                                : "Cancelamento"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">{log.customer_name || "—"}</td>
                          <td className="py-3 px-4 text-foreground/80">{formatLogPhone(log.phone)}</td>
                          <td className="py-3 px-4 text-foreground/70">{log.service_names || "—"}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              log.status === "sent"
                                ? "bg-green-500/15 text-green-400"
                                : log.status === "failed"
                                ? "bg-red-500/15 text-red-400"
                                : "bg-yellow-500/15 text-yellow-400"
                            }`}>
                              {log.status === "sent" ? "✓ Enviado"
                                : log.status === "failed" ? "✗ Falhou"
                                : "⏳ Pendente"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground/60 font-mono text-[10px]">
                            {log.appointment_id ? `${log.appointment_id.slice(0, 8)}...` : "—"}
                          </td>
                          <td className="py-3 px-4 text-foreground/70">{formatLogDate(log.sent_at)}</td>
                          <td className="py-3 px-4 text-foreground/70">{formatLogDate(log.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {whatsappLogs.length > 0 && (
                <p className="text-[10px] text-muted-foreground text-right">
                  {whatsappLogs.length} registro{whatsappLogs.length !== 1 ? "s" : ""} exibido{whatsappLogs.length !== 1 ? "s" : ""} (máx. 200)
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO PERSONALIZADO DE EXCLUSÃO */}
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
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE USUÁRIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1c1c20]/95 backdrop-blur-xl w-full max-w-md border border-primary/30 rounded-2xl p-6 md:p-8 shadow-2xl relative animate-scale-in">
            <h3 className="text-xl font-bold font-display mb-6 text-primary flex items-center gap-2">
              <Pencil size={20} /> Editar Cadastro de Usuário
            </h3>

            {userModalError && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 mb-6">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{userModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  placeholder="Nome do usuário"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Celular / WhatsApp</label>
                <input
                  type="text"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(formatPhoneNumber(e.target.value))}
                  placeholder="Ex: (34) 98821-8498"
                  maxLength={15}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">E-mail de Acesso</label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  placeholder="Ex: cliente@email.com"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Perfil / Função no Sistema</label>
                <select
                  disabled={editingUserId === user.id}
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="client">Cliente</option>
                  <option value="barber">Barbeiro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border/40 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 border border-border hover:bg-muted rounded-xl h-12 font-medium transition-colors cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userSubmitting}
                  className="flex-1 bg-gold-gradient text-primary-foreground font-bold h-12 rounded-xl text-sm uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  {userSubmitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    "Salvar Dados"
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
