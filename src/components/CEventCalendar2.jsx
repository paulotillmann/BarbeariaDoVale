import React, { useState, useEffect, useRef } from "react"
import { Clock, User, Plus, X } from "lucide-react"

/**
 * CEventCalendar2 - Componente de Grade de Agendamentos
 * Disposição: Horários em Linhas (09:00 às 20:00, slots de 30 minutos) x Barbeiros em Colunas.
 */
export default function CEventCalendar2({
  barbers = [],
  appointments = [],
  selectedDate = "",
  isMobile = false,
  onSelectSlot,
  onCancelSlot,
  onSelectAppointment
}) {
  const scrollContainerRef = useRef(null)
  const lastMouseMoveRef = useRef(Date.now())
  const [now, setNow] = useState(new Date())

  // Rastrear movimento do mouse e interações do usuário para detectar inatividade
  useEffect(() => {
    const handleActivity = () => {
      lastMouseMoveRef.current = Date.now()
    }

    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("mousedown", handleActivity)
    window.addEventListener("touchstart", handleActivity)
    window.addEventListener("touchmove", handleActivity)
    window.addEventListener("keydown", handleActivity)

    return () => {
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("mousedown", handleActivity)
      window.removeEventListener("touchstart", handleActivity)
      window.removeEventListener("touchmove", handleActivity)
      window.removeEventListener("keydown", handleActivity)
    }
  }, [])

  // Atualizar horário atual a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(interval)
  }, [])

  // Gerar slots de 30 min das 09:00 às 20:00
  const timeSlots = []
  for (let hour = 9; hour < 20; hour++) {
    const hStr = String(hour).padStart(2, "0")
    timeSlots.push(`${hStr}:00`)
    timeSlots.push(`${hStr}:30`)
  }

  // Helper para obter a data atual local no formato YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  // Filtrar agendamentos do dia selecionado
  const dayAppointments = appointments.filter((appt) => {
    if (!appt || !appt.appointment_time) return false
    const cleanTime = String(appt.appointment_time).trim().replace(" ", "T")
    return cleanTime.startsWith(selectedDate)
  })

  // Função auxiliar para parse de horário em minutos a partir de 00:00
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0
    const [h, m] = timeStr.split(":").map(Number)
    return (h || 0) * 60 + (m || 0)
  }

  // Função auxiliar para formatar minutos no formato 00h00 (ex: 01h30, 00h30)
  const formatDurationHM = (totalMinutes) => {
    const mins = Number(totalMinutes) || 0
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    const hStr = String(hours).padStart(2, "0")
    const mStr = String(minutes).padStart(2, "0")
    return `${hStr}h${mStr}`
  }

  // Verificar se a data selecionada é hoje (usando timezone local)
  const todayStr = getTodayStr()
  const isToday = selectedDate === todayStr

  // Cálculo da posição do horário atual na grade
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startGridMinutes = 9 * 60 // 09:00 (540 min)
  const endGridMinutes = 20 * 60 // 20:00 (1200 min)
  const isTimeInGridRange = currentMinutes >= startGridMinutes && currentMinutes <= endGridMinutes

  // Posição no eixo vertical (top) em pixels para a linha do horário atual
  const lineTopPx = 57 + (currentMinutes - startGridMinutes) * (56 / 30)

  // Rolar automaticamente para o horário atual ao abrir a tela ou mudar a data
  useEffect(() => {
    if (!scrollContainerRef.current) return

    if (isToday && isTimeInGridRange) {
      const targetScroll = Math.max(0, (currentMinutes - startGridMinutes) * (56 / 30) - 120)
      scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: "smooth" })
    } else {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [selectedDate, isToday, isTimeInGridRange, currentMinutes, startGridMinutes])

  // Rolar o grid automaticamente a cada 5 minutos para a linha do horário atual (somente se o mouse estiver parado)
  useEffect(() => {
    const FIVE_MINUTES_MS = 5 * 60 * 1000

    const interval = setInterval(() => {
      if (!scrollContainerRef.current) return

      const isMouseIdle = Date.now() - lastMouseMoveRef.current >= 4000
      const d = new Date()
      const currMins = d.getHours() * 60 + d.getMinutes()
      const inRange = currMins >= startGridMinutes && currMins <= endGridMinutes

      if (isToday && inRange && isMouseIdle) {
        const targetScroll = Math.max(0, (currMins - startGridMinutes) * (56 / 30) - 120)
        scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: "smooth" })
      }
    }, FIVE_MINUTES_MS)

    return () => clearInterval(interval)
  }, [isToday, startGridMinutes, endGridMinutes])

  // Obter o agendamento que começa ou cobre um slot para um determinado barbeiro
  const getAppointmentForSlot = (barberId, slotTime) => {
    const slotMinutes = timeToMinutes(slotTime)

    const matches = dayAppointments.filter((appt) => {
      // Ignorar cancelamentos comuns sem motivo de bloqueio
      if (appt.status === "cancelled" && !appt.cancellation_reason) return false

      // Encontrar objeto do barbeiro correspondente às colunas
      const barbObj = barbers.find(
        (b) => String(b.id) === String(barberId) || (b.user_id && String(b.user_id) === String(barberId))
      )
      const targetId = barbObj ? String(barbObj.id) : String(barberId)
      const targetUserId = barbObj && barbObj.user_id ? String(barbObj.user_id) : null

      const apptBarberId = appt.barber_id ? String(appt.barber_id) : ""

      // Match flexível por ID, User_ID ou Nome do Barbeiro (igualdade exata)
      const matchesId =
        apptBarberId === targetId ||
        (targetUserId && apptBarberId === targetUserId)

      const matchesName =
        barbObj &&
        barbObj.name &&
        appt.barber_name &&
        barbObj.name.trim().toLowerCase() === appt.barber_name.trim().toLowerCase()

      if (!matchesId && !matchesName) return false

      // Parse do horário do agendamento (normaliza T ou espaço)
      const cleanTime = String(appt.appointment_time).trim().replace(" ", "T")
      const timePart = cleanTime.split("T")[1] || ""
      const apptTime = timePart.slice(0, 5)
      const apptMinutes = timeToMinutes(apptTime)

      const duration =
        appt.duration_minutes !== undefined && appt.duration_minutes !== null
          ? Number(appt.duration_minutes)
          : 30
      const apptEndMinutes = apptMinutes + (duration === 0 ? 30 : duration)

      return slotMinutes >= apptMinutes && slotMinutes < apptEndMinutes
    })

    if (matches.length === 0) return undefined

    // Priorizar agendamentos confirmados em relação a bloqueios no mesmo horário
    const confirmedMatch = matches.find((a) => a.status !== "cancelled")
    if (confirmedMatch) return confirmedMatch

    return matches[0]
  }

  // Verificar se o slot já passou em relação ao horário atual
  const isSlotPast = (slotTime) => {
    if (!selectedDate || !slotTime) return false
    const slotDateTime = new Date(`${selectedDate}T${slotTime}`)
    return slotDateTime < now
  }

  // Verificar se o slot é o início de um agendamento
  const isStartOfAppointment = (appt, slotTime) => {
    if (!appt || !appt.appointment_time) return false
    const cleanTime = String(appt.appointment_time).trim().replace(" ", "T")
    const timePart = cleanTime.split("T")[1] || ""
    return timePart.slice(0, 5) === slotTime
  }

  return (
    <div className="w-full bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl shadow-elevated overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Grade de Agendamentos Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar relative"
      >
        {/* Linha Pontilhada do Horário Atual */}
        {isToday && isTimeInGridRange && (
          <div
            style={{ top: `${lineTopPx}px` }}
            className="absolute left-0 right-0 z-30 pointer-events-none flex items-center transition-all duration-500"
          >
            <div className="sticky left-0 z-40 flex items-center justify-end w-24 shrink-0 pr-1">
              <span className="bg-rose-500 text-white font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse">
                {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-background shadow-[0_0_10px_rgba(244,63,94,0.9)] ml-1 translate-x-1" />
            </div>
            <div className="flex-1 h-0 border-t-2 border-dashed border-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </div>
        )}

        <table className={`w-full border-collapse text-left table-fixed ${isMobile || barbers.length === 1 ? "w-full min-w-0" : "min-w-[650px] md:min-w-0"}`}>
          <colgroup>
            <col className={barbers.length === 1 ? "w-16 md:w-24" : "w-20 md:w-24"} />
            {barbers.map((barber, index) => (
              <col key={barber.id || index} style={{ width: `${100 / Math.max(1, barbers.length)}%` }} />
            ))}
          </colgroup>
          {/* Cabeçalho: Colunas com Barbeiros */}
          <thead className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/80">
            <tr>
              <th className="w-16 md:w-24 p-2 md:p-3 text-center text-[10px] md:text-xs font-black uppercase tracking-widest text-primary border-r border-border/60 bg-black/40">
                <div className="flex items-center justify-center gap-1">
                  <Clock size={14} /> Horário
                </div>
              </th>
              {barbers.map((barber, index) => {
                const barberPhoto =
                  barber.photo ||
                  (index === 0
                    ? "/assets/foto_marcio.png"
                    : index === 1
                      ? "/assets/foto_lucas.png"
                      : "/assets/foto_neto.png")

                return (
                  <th
                    key={barber.id || index}
                    className="p-2 md:p-3 text-center border-r border-border/40 last:border-r-0 min-w-0"
                  >
                    <div className="flex items-center justify-center gap-2 md:gap-2.5">
                      <div className="w-9 h-9 md:w-12 md:h-12 rounded-full overflow-hidden border border-gold-subtle shadow-xs bg-background flex items-center justify-center shrink-0">
                        {barberPhoto ? (
                          <img
                            src={barberPhoto}
                            alt={barber.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={20} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="font-extrabold text-xs md:text-sm text-foreground leading-tight truncate">
                          {barber.name}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Barbeiro
                        </div>
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Corpo: Linhas com Horários */}
          <tbody className="divide-y divide-border/40">
            {timeSlots.map((slotTime, slotIndex) => {
              const isHourHeader = slotTime.endsWith(":00")
              const isPastSlot = isSlotPast(slotTime)

              return (
                <tr
                  key={slotTime}
                  className={`h-14 transition-colors duration-150 ${isHourHeader ? "bg-background/20" : "bg-transparent"
                    }`}
                >
                  <td className="p-1 md:p-2.5 text-center border-r border-border/60 bg-black/20 text-[9pt] md:text-[10pt] font-mono font-bold text-muted-foreground sticky left-0 z-10 h-14">
                    <span
                      className={`inline-block px-1.5 md:px-2 py-0.5 rounded-lg border ${isHourHeader
                          ? "bg-primary/10 text-primary border-primary/30 font-black"
                          : "border-transparent text-muted-foreground/80"
                        }`}
                    >
                      {slotTime}
                    </span>
                  </td>

                  {barbers.map((barber) => {
                    const appt = getAppointmentForSlot(barber.id, slotTime)

                    if (appt) {
                      const isCancelledBlock = appt.status === "cancelled"

                      if (isCancelledBlock) {
                        // Verificar se o slot anterior é uma continuação do mesmo bloqueio
                        if (slotIndex > 0) {
                          const prevSlotTime = timeSlots[slotIndex - 1]
                          const prevAppt = getAppointmentForSlot(barber.id, prevSlotTime)
                          if (
                            prevAppt &&
                            prevAppt.status === "cancelled" &&
                            (prevAppt.cancellation_reason || "") === (appt.cancellation_reason || "")
                          ) {
                            return null // Ocupado pelo rowSpan do primeiro slot da sequência
                          }
                        }

                        // Calcular quantos slots consecutivos possuem o mesmo motivo de bloqueio
                        let blockSlotCount = 1
                        const reasonStr = appt.cancellation_reason || ""
                        for (let k = slotIndex + 1; k < timeSlots.length; k++) {
                          const nextSlot = timeSlots[k]
                          const nextAppt = getAppointmentForSlot(barber.id, nextSlot)
                          if (
                            nextAppt &&
                            nextAppt.status === "cancelled" &&
                            (nextAppt.cancellation_reason || "") === reasonStr
                          ) {
                            blockSlotCount++
                          } else {
                            break
                          }
                        }

                        const rowSpan = blockSlotCount
                        const totalBlockMinutes = blockSlotCount * 30

                        // Calcular horário final do bloqueio
                        const [startH, startM] = slotTime.split(":").map(Number)
                        const endMinTotal = startH * 60 + startM + totalBlockMinutes
                        const endHStr = String(Math.floor(endMinTotal / 60)).padStart(2, "0")
                        const endMStr = String(endMinTotal % 60).padStart(2, "0")
                        const blockEndTimeStr = `${endHStr}:${endMStr}`

                        const formattedDuration = formatDurationHM(totalBlockMinutes)

                        return (
                          <td
                            key={`${barber.id}-${slotTime}`}
                            rowSpan={rowSpan}
                            className="p-1 border-r border-border/30 last:border-r-0 relative align-top"
                          >
                            <button
                              type="button"
                              onClick={() => onSelectAppointment && onSelectAppointment(appt)}
                              style={{ minHeight: `${rowSpan * 56 - 8}px`, height: "100%" }}
                              className="w-full p-2.5 rounded-xl shadow-md border border-dashed bg-rose-500/15 border-rose-500/40 text-rose-300 hover:scale-[1.01] active:scale-[0.99] transition-all text-left flex flex-col justify-between gap-1 cursor-pointer group overflow-hidden relative"
                            >
                              <div className="flex flex-col gap-0.5 w-full">
                                <span className="font-extrabold text-[12pt] text-rose-300 truncate">
                                  {appt.cancellation_reason ? appt.cancellation_reason : "HORÁRIO BLOQUEADO"}
                                </span>
                                <span className="text-[10pt] font-bold text-rose-300/80 truncate">
                                  Bloqueio de Agenda
                                </span>
                              </div>
                              <div className="flex items-center justify-between w-full mt-1 pt-1 border-t border-rose-500/30 text-[9.5pt] font-bold font-mono text-rose-300/90">
                                <span>{slotTime} às {blockEndTimeStr}</span>
                                <span className="bg-rose-500/25 text-rose-300 px-1.5 py-0.5 rounded text-[9pt] font-extrabold border border-rose-500/30">
                                  {formattedDuration}
                                </span>
                              </div>
                            </button>
                          </td>
                        )
                      }

                      // Agendamento normal de cliente
                      const isStart = isStartOfAppointment(appt, slotTime)
                      if (!isStart) {
                        return null
                      }

                      const duration =
                        appt.duration_minutes !== undefined && appt.duration_minutes !== null && appt.duration_minutes > 0
                          ? Number(appt.duration_minutes)
                          : 30
                      const calculatedSlots = Math.max(1, Math.ceil(duration / 30))
                      const remainingSlotsInDay = timeSlots.length - slotIndex
                      const rowSpan = Math.min(calculatedSlots, remainingSlotsInDay)

                      // Calcular horário final do agendamento
                      const [startH, startM] = slotTime.split(":").map(Number)
                      const endMinTotal = startH * 60 + startM + duration
                      const endHStr = String(Math.floor(endMinTotal / 60)).padStart(2, "0")
                      const endMStr = String(endMinTotal % 60).padStart(2, "0")
                      const apptEndTimeStr = `${endHStr}:${endMStr}`

                      return (
                        <td
                          key={`${barber.id}-${slotTime}`}
                          rowSpan={rowSpan}
                          className="p-1 border-r border-border/30 last:border-r-0 relative align-top"
                        >
                          <button
                            type="button"
                            onClick={() => onSelectAppointment && onSelectAppointment(appt)}
                            style={{ minHeight: `${rowSpan * 56 - 8}px`, height: "100%" }}
                            className="w-full p-2.5 rounded-xl shadow-md border bg-gold-gradient text-black border-gold-subtle hover:scale-[1.01] active:scale-[0.99] transition-all text-left flex flex-col justify-between gap-1 cursor-pointer group overflow-hidden relative"
                          >
                            <div className="flex flex-col gap-0.5 w-full">
                              <div className="flex items-center justify-between w-full gap-1">
                                <span className="font-extrabold text-[12pt] truncate text-black">
                                  {appt.client_name || "Cliente"}
                                </span>
                                {appt.price && (
                                  <span className="bg-black/20 text-black px-1.5 py-0.5 rounded font-mono font-black text-[10px] shrink-0">
                                    R$ {Number(appt.price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10pt] font-bold text-black/90 truncate">
                                {appt.service_name || appt.services?.name || "Serviço"}
                              </div>
                            </div>
                            <div className="flex items-center justify-between w-full mt-1 pt-1 border-t border-black/15 text-[9.5pt] font-bold font-mono text-black/80">
                              <span>{slotTime} às {apptEndTimeStr}</span>
                              <span className="bg-black/15 px-1.5 py-0.5 rounded text-[9pt] font-extrabold">{formatDurationHM(duration)}</span>
                            </div>
                          </button>
                        </td>
                      )
                    }

                    return (
                      <td
                        key={`${barber.id}-${slotTime}`}
                        className={`border-r border-border/30 last:border-r-0 relative h-14 align-top ${
                          isPastSlot ? "p-0" : "p-1"
                        }`}
                      >
                        {isPastSlot ? (
                          <div
                            className="w-full h-full bg-amber-500/15 text-amber-400/40 cursor-not-allowed flex items-center justify-center text-xs font-bold select-none"
                            title="Horário encerrado"
                          >
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all flex items-center justify-center gap-1.5 md:gap-2 group p-0.5 md:p-1">
                            <button
                              type="button"
                              onClick={() => onSelectSlot && onSelectSlot(barber.id, slotTime)}
                              className="w-8 h-8 md:w-7 md:h-7 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-background flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 transform md:group-hover:scale-110 shadow-sm cursor-pointer"
                              title={`Novo Agendamento com ${barber.name} às ${slotTime}`}
                            >
                              <Plus size={16} strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onCancelSlot && onCancelSlot(barber.id, slotTime)}
                              className="w-8 h-8 md:w-7 md:h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 transform md:group-hover:scale-110 shadow-sm cursor-pointer"
                              title={`Cancelar / Bloquear horário de ${barber.name} às ${slotTime}`}
                            >
                              <X size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
