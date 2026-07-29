import React, { useState, useRef, useEffect } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

export default function CCalendar24({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef(null)

  // Parse YYYY-MM-DD string to Date object safely
  const parseDateStr = (dateStr) => {
    if (!dateStr) return new Date()
    const [y, m, d] = dateStr.split("-").map(Number)
    return new Date(y, m - 1, d)
  }

  const currentDateObj = parseDateStr(value)
  const [viewYear, setViewYear] = useState(currentDateObj.getFullYear())
  const [viewMonth, setViewMonth] = useState(currentDateObj.getMonth())

  useEffect(() => {
    if (value) {
      const d = parseDateStr(value)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((prev) => prev - 1)
    } else {
      setViewMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((prev) => prev + 1)
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  const handleSelectDay = (dayNumber) => {
    const yyyy = viewYear
    const mm = String(viewMonth + 1).padStart(2, "0")
    const dd = String(dayNumber).padStart(2, "0")
    const formatted = `${yyyy}-${mm}-${dd}`
    onChange(formatted)
    setIsOpen(false)
  }

  // Calculate grid days for current month view
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Format date for button display: DD/MM/YYYY
  const displayFormattedDate = () => {
    if (!value) return "Selecione uma data"
    const [y, m, d] = value.split("-")
    return `${d}/${m}/${y}`
  }

  const today = new Date()
  const isToday = (dayNum) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === dayNum
    )
  }

  const isSelected = (dayNum) => {
    if (!value) return false
    const [y, m, d] = value.split("-").map(Number)
    return y === viewYear && m - 1 === viewMonth && d === dayNum
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Botão de Disparo (Trigger) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group/pick-date flex items-center justify-between gap-2.5 bg-black/50 hover:bg-black/70 border border-gold-subtle text-foreground text-[14pt] font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
      >
        <span className="font-display font-bold tracking-wide text-foreground text-[14pt]">
          {displayFormattedDate()}
        </span>
        <CalendarIcon
          size={18}
          className="text-primary opacity-80 group-hover/pick-date:opacity-100 transition-opacity shrink-0"
        />
      </button>

      {/* Popover com Calendário (c-calendar-24) */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 sm:right-0 sm:left-auto top-full mt-2 z-[9999] bg-[#1c1c20]/95 backdrop-blur-xl border border-gold-subtle/50 rounded-2xl p-4 shadow-2xl animate-scale-in w-[280px]">
          {/* Cabeçalho do Mês e Navegação */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-muted/60 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-foreground capitalize tracking-wide">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-muted/60 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-[10px] font-bold text-muted-foreground/70 uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Grid de Dias do Mês */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Células vazias do início */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}

            {/* Dias do mês */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const selected = isSelected(dayNum)
              const todayDay = isToday(dayNum)

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    selected
                      ? "bg-gold-gradient text-black font-black shadow-gold scale-105"
                      : todayDay
                      ? "border border-primary text-primary font-bold hover:bg-primary/20"
                      : "text-foreground hover:bg-muted/60 hover:text-primary"
                  }`}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
