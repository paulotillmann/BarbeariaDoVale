import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth, API_URL } from "../context/AuthContext.jsx"
import { CalendarDays, Scissors, Clock, User, Sparkles } from "lucide-react"
import Sidebar from "../components/Sidebar.jsx"

export default function Dashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` }

        // 1. Carregar Agendamentos
        const apptRes = await fetch(`${API_URL}/api/appointments`, { headers })
        if (apptRes.ok) {
          const apptData = await apptRes.json()
          setAppointments(apptData)
        }

        // 2. Carregar Serviços
        const srvRes = await fetch(`${API_URL}/api/services`)
        if (srvRes.ok) {
          const srvData = await srvRes.json()
          setServices(srvData)
        } else {
          setServices([
            { id: "srv-corte", name: "Corte de Cabelo", price: 55, duration_minutes: 30 },
            { id: "srv-barba", name: "Barba Completa", price: 45, duration_minutes: 30 },
            { id: "srv-combo", name: "Combo Do Vale (Corte + Barba)", price: 90, duration_minutes: 60 }
          ])
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      }
    }

    fetchData()
  }, [user, token, navigate])

  const formatDateTime = (isoString) => {
    try {
      const date = new Date(isoString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} às ${hours}:${minutes}`
    } catch {
      return isoString.replace('T', ' ')
    }
  }

  const getNextAppointment = () => {
    const activeAppts = appointments.filter(a => a.status === 'confirmed')
    if (activeAppts.length === 0) return null

    const sorted = [...activeAppts].sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))
    const now = new Date()
    const upcoming = sorted.find(a => new Date(a.appointment_time) > now)
    return upcoming || sorted[0]
  }

  const nextAppt = getNextAppointment()

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
        <div className="space-y-8 animate-scale-in">
          {/* Estatísticas / Grid de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card/40 border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                <CalendarDays size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Agendamentos Ativos</span>
                <span className="text-2xl font-black text-foreground mt-1 block font-display">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </span>
              </div>
            </div>

            <div className="bg-card/40 border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                <Scissors size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Serviços Disponíveis</span>
                <span className="text-2xl font-black text-foreground mt-1 block font-display">
                  {services.length > 0 ? services.length : 3}
                </span>
              </div>
            </div>

            <div className="bg-card/40 border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Categoria do Perfil</span>
                <span className="text-sm font-black text-primary uppercase tracking-wider mt-1 block font-display">
                  {user.role === 'admin' ? 'Administrador' : user.role === 'barber' ? 'Barbeiro' : 'Cliente Gold'}
                </span>
              </div>
            </div>
          </div>

          {/* Próximo Atendimento Destacado */}
          {nextAppt ? (
            <div className="bg-muted/30 border border-primary/25 rounded-2xl p-6 shadow-md relative overflow-hidden group">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 inline-block mb-3">
                    Próximo Agendamento
                  </span>
                  <h3 className="font-bold text-lg text-foreground tracking-wide font-display uppercase">
                    {nextAppt.service_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock size={13} className="text-primary/70" /> {formatDateTime(nextAppt.appointment_time)}</span>
                    <span className="flex items-center gap-1.5"><User size={13} className="text-primary/70" /> {user.role === 'client' ? `Barbeiro: ${nextAppt.barber_name}` : `Cliente: ${nextAppt.client_name}`}</span>
                  </div>
                </div>
                <Link 
                  to="/agenda"
                  className="px-5 py-2.5 bg-muted border border-border hover:border-primary/40 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer text-foreground inline-flex items-center justify-center"
                >
                  Ver na Agenda
                </Link>
              </div>
            </div>
          ) : null}

          {/* CTA ou Resumo de Boas vindas específico por perfil */}
          {user.role === 'client' ? (
            <div className="bg-card/40 border border-gold-subtle rounded-2xl p-8 shadow-elevated text-center relative overflow-hidden group">
              <h3 className="font-rye text-2xl md:text-3xl text-primary mb-3">Pronto para dar aquele trato no visual?</h3>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6 leading-relaxed">
                Agende seu horário online em poucos cliques. Escolha o serviço, seu barbeiro favorito e o melhor horário para você.
              </p>
              <Link
                to="/agenda"
                className="inline-flex items-center justify-center gap-2 bg-gold-gradient text-primary-foreground font-bold h-14 rounded-xl px-8 text-base shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <CalendarDays size={18} /> Agendar Agora
              </Link>
            </div>
          ) : (
            <div className="bg-card/40 border border-gold-subtle rounded-2xl p-8 shadow-elevated relative overflow-hidden group">
              <h3 className="font-rye text-xl md:text-2xl text-primary mb-3">Boas-vindas à Área de Profissionais</h3>
              <p className="text-muted-foreground text-sm max-w-2xl mb-6 leading-relaxed">
                Use o menu lateral flutuante para gerenciar os seus atendimentos, gerenciar as contas de usuários (Administrador) ou visualizar os serviços e equipe de barbeiros do Vale.
              </p>
              <Link
                to="/agenda"
                className="inline-flex items-center justify-center gap-2 bg-gold-gradient text-primary-foreground font-bold h-12 rounded-xl px-6 text-xs uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <CalendarDays size={16} /> Ver Agenda de Atendimentos
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
