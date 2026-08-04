import React from "react"
import { MoreVertical, Scissors } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList
} from "recharts"

const formatCurrency = (val) => {
  return (Number(val) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

// Tooltip customizado para o gráfico de faturamento empilhado por barbeiro por dia
const FinancialTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, curr) => {
      if (curr.dataKey === "total") return acc
      return acc + (Number(curr.value) || 0)
    }, 0)
    return (
      <div className="bg-[#18181b]/95 backdrop-blur-md border border-border/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[160px]">
        <div className="flex items-center justify-between border-b border-border/40 pb-1">
          <span className="font-bold text-foreground font-mono">{label}</span>
          <span className="font-extrabold text-primary font-mono">{formatCurrency(total)}</span>
        </div>
        {payload.map((entry, idx) => {
          if (!entry.value || entry.dataKey === "total") return null
          return (
            <div key={idx} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-bold font-mono text-foreground">{formatCurrency(entry.value)}</span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

// Tooltip customizado para o gráfico de barbeiros
const BarberTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#18181b]/95 backdrop-blur-md border border-border/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[150px]">
        <p className="font-bold text-primary border-b border-border/40 pb-1">{label}</p>
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span>Faturamento:</span>
          <span className="font-bold text-green-400 font-mono">{formatCurrency(data.faturamento)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span>Atendimentos:</span>
          <span className="font-bold text-foreground font-mono">{data.atendimentos} cortes</span>
        </div>
      </div>
    )
  }
  return null
}

// Tooltip customizado para os gráficos Donut
const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-[#18181b]/95 backdrop-blur-md border border-border/80 rounded-xl p-3 shadow-xl text-xs space-y-1">
        <p className="font-bold text-foreground flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color || data.payload.color }}></span>
          {data.name}
        </p>
        <p className="text-muted-foreground font-mono">
          <span className="font-bold text-foreground">{data.value}</span> ({data.payload.percent ? `${(data.payload.percent * 100).toFixed(0)}%` : ""})
        </p>
      </div>
    )
  }
  return null
}

export function FinancialTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-muted/10">
        Nenhum dado financeiro no período selecionado
      </div>
    )
  }

  // Extrair chaves dos barbeiros (excluindo 'date' e 'total')
  const barberKeys = Object.keys(data[0] || {}).filter(
    (k) => k !== "date" && k !== "total"
  )

  const BARBER_PALETTE = ["#FADD00", "#A59837", "#504D35", "#CFBB23", "#7A733D", "#33322B"]

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap="-100%" margin={{ top: 35, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
          <Tooltip content={<FinancialTooltip />} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
            formatter={(value) => {
              if (value === "total" || value === "Faturamento Total") return null
              return <span className="text-muted-foreground capitalize font-medium">{value}</span>
            }}
          />
          {barberKeys.map((barberName, idx) => (
            <Bar
              key={barberName}
              dataKey={barberName}
              name={barberName}
              stackId="faturamento"
              fill={BARBER_PALETTE[idx % BARBER_PALETTE.length]}
              radius={idx === barberKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
          {/* Barra transparente de sobreposição para exibir com 100% de garantia o valor total no topo de TODOS os dias */}
          <Bar dataKey="total" name="Faturamento Total" fill="transparent" stroke="none" legendType="none">
            <LabelList
              dataKey="total"
              position="top"
              formatter={(val) =>
                Number(val) > 0
                  ? `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                  : ""
              }
              style={{ fill: "#ffffff", fontSize: "14pt", fontWeight: "900", fontFamily: "monospace" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarberPerformanceChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-muted/10">
        Nenhum atendimento registrado por barbeiro no período
      </div>
    )
  }

  const values = data.map((d) => Number(d.faturamento) || 0)
  const maxVal = Math.max(...values, 0)
  const minVal = Math.min(...values)

  const getBarColor = (val) => {
    const num = Number(val) || 0
    if (num === maxVal && maxVal > 0) {
      return "#FADD00"
    }
    if (num === minVal && values.length > 1 && maxVal !== minVal) {
      return "#504D35"
    }
    return "#A59837"
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 35, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
          <Tooltip content={<BarberTooltip />} />
          <Bar dataKey="faturamento" name="Faturamento" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.faturamento)} />
            ))}
            <LabelList
              dataKey="faturamento"
              position="top"
              formatter={(val) => `R$${Number(val || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              style={{ fill: "#ffffff", fontSize: "18pt", fontWeight: "900", fontFamily: "monospace" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ServicesDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full flex flex-col items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-muted/10 p-6 space-y-2 text-center animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
          <Scissors size={20} />
        </div>
        <span className="font-bold text-foreground text-sm">Nenhum serviço registrado no período</span>
        <span className="text-[11px] text-muted-foreground max-w-xs">
          Não foram encontrados agendamentos para calcular a distribuição dos serviços com os filtros atuais.
        </span>
      </div>
    )
  }

  const DEFAULT_COLORS = ["#FADD00", "#CFBB23", "#A59837", "#7A733D", "#504D35", "#33322B"]

  // Ordenar serviços pelo valor decrescente e limitar aos 6 principais
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 6)
  const maxVal = sortedData[0]?.value || 1

  const processedData = sortedData.map((item, idx) => {
    const pct = Math.max(15, Math.round((item.value / maxVal) * 100))
    const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
    const isLightColor = ["#FADD00", "#CFBB23", "#A59837"].includes(color)
    return {
      ...item,
      rank: idx + 1,
      pct,
      color,
      isLightColor
    }
  })

  // Separar em 2 colunas para o painel de estatísticas da direita (1, 3, 5 e 2, 4, 6)
  const col1 = processedData.filter((_, idx) => idx % 2 === 0)
  const col2 = processedData.filter((_, idx) => idx % 2 === 1)

  return (
    <div className="w-full flex flex-col justify-between h-full pt-1 space-y-4">
      {/* Botão de Opções / Três Pontos superior direito */}
      <div className="flex justify-end -mt-2 -mr-1">
        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Grade Principal: Esquerda (Gráfico) x Direita (Legenda de % em 2 colunas) */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 flex-1 min-h-0">
        {/* Lado Esquerdo: Gráfico de Barras Horizontais com Eixo X e Guias Pontilhadas */}
        <div className="flex-1 flex flex-col justify-between relative min-h-[220px]">
          {/* Linhas pontilhadas verticais de guia (0%, 25%, 50%, 75%, 100%) */}
          <div className="absolute inset-0 left-6 right-0 bottom-6 pointer-events-none flex justify-between z-0">
            <div className="border-r border-dashed border-border/25 h-full"></div>
            <div className="border-r border-dashed border-border/25 h-full"></div>
            <div className="border-r border-dashed border-border/25 h-full"></div>
            <div className="border-r border-dashed border-border/25 h-full"></div>
            <div className="border-r border-dashed border-border/25 h-full"></div>
          </div>

          {/* Lista de Barras de Serviços com Números de Ranking 1 a 6 */}
          <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-between py-1">
            {processedData.map((item) => (
              <div key={item.name} className="flex items-center gap-2.5 h-7">
                <span className="w-4 text-xs font-mono font-bold text-muted-foreground text-center shrink-0">
                  {item.rank}
                </span>
                <div className="flex-1 h-full relative flex items-center">
                  <div
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    className="h-full rounded-r-full transition-all duration-500 flex items-center justify-center px-3 shadow-sm border border-black/10"
                  >
                    <span
                      className={`text-[10px] sm:text-xs font-bold truncate max-w-full tracking-wide ${
                        item.isLightColor ? "text-black" : "text-white"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Eixo X com Porcentagens (0%, 25%, 50%, 75%, 100%) */}
          <div className="flex justify-between pl-6 text-[10px] font-mono text-muted-foreground pt-2 z-10 border-t border-border/20">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Lado Direito: Estatísticas de Porcentagem em 2 Colunas */}
        <div className="w-full lg:w-64 shrink-0 grid grid-cols-2 gap-x-4 gap-y-4 items-center pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-border/40 pt-4 lg:pt-0">
          {/* Coluna 1 (Ímpares: 1, 3, 5) */}
          <div className="space-y-4">
            {col1.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
                  <span className="text-[10.5px] font-semibold text-muted-foreground leading-tight break-words">{item.name}</span>
                </div>
                <div className="text-base font-extrabold font-mono text-foreground pl-4">
                  {item.pct}%
                </div>
              </div>
            ))}
          </div>

          {/* Coluna 2 (Pares: 2, 4, 6) */}
          <div className="space-y-4">
            {col2.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
                  <span className="text-[10.5px] font-semibold text-muted-foreground leading-tight break-words">{item.name}</span>
                </div>
                <div className="text-base font-extrabold font-mono text-foreground pl-4">
                  {item.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatusDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-muted/10">
        Sem agendamentos registrados
      </div>
    )
  }

  const DEFAULT_STATUS_COLORS = ["#FADD00", "#504D35", "#A59837", "#CFBB23", "#7A733D", "#33322B"]

  return (
    <div className="h-72 w-full flex flex-row items-center justify-between gap-2">
      <div className="flex-1 h-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-st-${index}`} fill={entry.color || DEFAULT_STATUS_COLORS[index % DEFAULT_STATUS_COLORS.length]} stroke="#18181b" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda posicionada à direita */}
      <div className="flex flex-col justify-center gap-2.5 text-xs text-muted-foreground w-36 shrink-0 pr-1">
        {data.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || DEFAULT_STATUS_COLORS[idx % DEFAULT_STATUS_COLORS.length] }}></span>
              <span className="truncate text-foreground font-medium">{entry.name}</span>
            </div>
            <span className="font-bold text-foreground font-mono shrink-0">({entry.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
