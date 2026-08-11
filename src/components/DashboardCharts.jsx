import React, { useState } from "react"
import { createPortal } from "react-dom"
import { MoreVertical, Scissors, ShoppingBag, X, Maximize2 } from "lucide-react"
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
    const dayData = payload[0]?.payload
    const detailsMap = dayData?.details || {}
    const total = dayData?.total || 0

    return (
      <div className="bg-[#18181b]/95 backdrop-blur-md border border-border/80 rounded-xl p-3.5 shadow-2xl text-xs space-y-2.5 min-w-[240px] z-50">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <span className="font-bold text-foreground font-mono text-sm">{label}</span>
          <span className="font-extrabold text-primary font-mono text-sm">{formatCurrency(total)}</span>
        </div>
        {payload.map((entry, idx) => {
          if (!entry.value || entry.dataKey === "total" || entry.dataKey === "details") return null
          const bName = entry.dataKey
          const det = detailsMap[bName] || {
            faturamento: entry.value,
            atendimentoValor: entry.value,
            atendimentoQtd: 0,
            produtosValor: 0,
            produtosQtd: 0
          }

          return (
            <div key={idx} className="border-t border-border/30 pt-2 space-y-1">
              <div className="flex items-center justify-between font-bold gap-2" style={{ color: entry.color }}>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                  <span className="truncate">{bName}</span>
                </span>
                <span className="font-mono shrink-0 ml-2">{formatCurrency(det.faturamento)}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-3">
                <span>Atendimento:</span>
                <span className="font-semibold font-mono text-foreground">
                  {formatCurrency(det.atendimentoValor)} ({det.atendimentoQtd} {det.atendimentoQtd === 1 ? 'serviço' : 'serviços'})
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-3">
                <span>Produtos:</span>
                <span className="font-semibold font-mono text-foreground">
                  {formatCurrency(det.produtosValor)} ({det.produtosQtd} {det.produtosQtd === 1 ? 'item' : 'itens'})
                </span>
              </div>
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
      <div className="bg-[#18181b]/95 backdrop-blur-md border border-border/80 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[220px] z-50">
        <p className="font-bold text-primary border-b border-border/40 pb-1.5 text-sm">{label}</p>

        <div className="flex items-center justify-between font-bold text-foreground">
          <span>Faturamento:</span>
          <span className="text-green-400 font-mono font-black text-sm">{formatCurrency(data.faturamento)}</span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
          <span>Atendimento:</span>
          <span className="font-bold text-foreground font-mono">
            {formatCurrency(data.atendimentoValor || 0)} ({data.atendimentoQtd || 0} {data.atendimentoQtd === 1 ? 'serviço' : 'serviços'})
          </span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
          <span>Produtos:</span>
          <span className="font-bold text-foreground font-mono">
            {formatCurrency(data.produtosValor || 0)} ({data.produtosQtd || 0} {data.produtosQtd === 1 ? 'item' : 'itens'})
          </span>
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

export function FinancialTrendChart({ data = [], viewMode = "simplificado" }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-muted/10">
        Nenhum dado financeiro no período selecionado
      </div>
    )
  }

  // Extrair chaves dos barbeiros (excluindo 'date', 'total' e 'details')
  const barberKeys = Object.keys(data[0] || {}).filter(
    (k) => k !== "date" && k !== "total" && k !== "details"
  )

  const BARBER_PALETTE = ["#FADD00", "#A59837", "#504D35", "#CFBB23", "#7A733D", "#33322B"]
  const isSimplificado = viewMode === "simplificado"

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap="-100%" margin={{ top: 35, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
          <Tooltip content={<FinancialTooltip />} />

          {!isSimplificado && (
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
              formatter={(value) => {
                if (value === "total" || value === "Faturamento Total") return null
                return <span className="text-muted-foreground capitalize font-medium">{value}</span>
              }}
            />
          )}

          {isSimplificado ? (
            <Bar dataKey="total" name="Faturamento do Dia" fill="#FADD00" radius={[8, 8, 0, 0]}>
              <LabelList
                dataKey="total"
                position="top"
                formatter={(val) =>
                  Number(val) > 0
                    ? `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    : ""
                }
                style={{ fill: "#ffffff", fontSize: "18pt", fontWeight: "900", fontFamily: "monospace" }}
              />
            </Bar>
          ) : (
            <>
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
                  style={{ fill: "#ffffff", fontSize: "18pt", fontWeight: "900", fontFamily: "monospace" }}
                />
              </Bar>
            </>
          )}
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
    const pct = Math.max(12, Math.round((item.value / maxVal) * 82))
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
                    className="h-full rounded-r-full transition-all duration-500 flex items-center justify-start px-3 shadow-sm border border-black/10 shrink-0"
                  >
                    <span
                      className={`text-[10pt] font-bold truncate max-w-full tracking-wide uppercase ${
                        item.isLightColor ? "text-black" : "text-white"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  {/* Quantidade exibida FORA DA BARRA (10pt) */}
                  <span className="text-[10pt] font-black font-mono text-foreground shrink-0 ml-2 bg-background/80 border border-border/60 px-2 py-0.5 rounded-md shadow-xs">
                    {item.value} srv
                  </span>
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
        <div className="w-full lg:w-64 shrink-0 grid grid-cols-2 gap-x-4 gap-y-3 items-center pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-border/40 pt-3 lg:pt-0">
          {/* Coluna 1 (Ímpares: 1, 3, 5) */}
          <div className="space-y-3">
            {col1.map((item) => (
              <div key={item.name} className="space-y-0.5">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
                  <span className="text-[10.5px] font-semibold text-muted-foreground leading-tight break-words uppercase">{item.name}</span>
                </div>
                <div className="text-sm font-extrabold font-mono text-foreground pl-4 flex items-center gap-1.5">
                  <span>{item.pct}%</span>
                  <span className="text-[10px] font-normal text-muted-foreground font-sans">({item.value} srv)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Coluna 2 (Pares: 2, 4, 6) */}
          <div className="space-y-3">
            {col2.map((item) => (
              <div key={item.name} className="space-y-0.5">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
                  <span className="text-[10.5px] font-semibold text-muted-foreground leading-tight break-words uppercase">{item.name}</span>
                </div>
                <div className="text-sm font-extrabold font-mono text-foreground pl-4 flex items-center gap-1.5">
                  <span>{item.pct}%</span>
                  <span className="text-[10px] font-normal text-muted-foreground font-sans">({item.value} srv)</span>
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
    <div className="h-72 w-full flex flex-col items-center justify-between gap-2">
      <div className="w-full h-44 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={68}
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

      {/* Legenda posicionada abaixo do gráfico */}
      <div className="w-full flex flex-col justify-center gap-1.5 text-xs text-muted-foreground border-t border-border/30 pt-2 px-1">
        {data.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
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

export function ProductsDistributionChart({ data = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full flex flex-col items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-muted/10 p-6 space-y-2 text-center animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
          <ShoppingBag size={20} />
        </div>
        <span className="font-bold text-foreground text-sm">Nenhum produto vendido no período</span>
        <span className="text-[11px] text-muted-foreground max-w-xs">
          Não foram encontradas vendas de produtos para calcular a distribuição com os filtros atuais.
        </span>
      </div>
    )
  }

  const DEFAULT_COLORS = ["#FADD00", "#CFBB23", "#A59837", "#7A733D", "#504D35", "#33322B", "#8C8638", "#B5A730"]

  // Ordenar produtos pela quantidade sold decrescente
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  const maxVal = sortedData[0]?.value || 1

  // No card do dashboard exibe apenas os TOP 5
  const top5Data = sortedData.slice(0, 5)

  const processItems = (items) => {
    return items.map((item, idx) => {
      const pct = Math.max(12, Math.round((item.value / maxVal) * 82))
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
  }

  const processedTop5 = processItems(top5Data)
  const processedAll = processItems(sortedData)

  const col1Top5 = processedTop5.filter((_, idx) => idx % 2 === 0)
  const col2Top5 = processedTop5.filter((_, idx) => idx % 2 === 1)

  return (
    <div className="w-full flex flex-col justify-between h-full pt-1 space-y-4">
      {/* Cabeçalho de Ações: Botão "Ver todos" e ícone */}
      <div className="flex items-center justify-between -mt-2">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Top 5 Produtos
        </span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
        >
          <Maximize2 size={13} />
          <span>Ver todos ({sortedData.length})</span>
        </button>
      </div>

      {/* Grade Principal: Esquerda (Gráfico Top 5) x Direita (Legenda em 2 colunas) */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 flex-1 min-h-0">
        {/* Lado Esquerdo: Gráfico de Barras Horizontais com Eixo X e Guias Pontilhadas */}
        <div className="flex-1 flex flex-col justify-between relative min-h-[210px]">
          {/* Linhas pontilhadas verticais de guia (0%, 25%, 50%, 75%, 100%) */}
          <div className="absolute inset-0 left-6 right-0 bottom-6 pointer-events-none flex justify-between z-0">
            <div className="border-r border-dashed border-border/25 h-full"></div>
            <div className="border-r border-dashed border-border/25 h-full"></div>
            <div className="border-r border-dashed border-border/25 h-full"></div>
            <div className="border-r border-dashed border-border/25 h-full"></div>
            <div className="border-r border-dashed border-border/25 h-full"></div>
          </div>

          {/* Lista de Barras de Produtos com Números de Ranking 1 a 5 */}
          <div className="space-y-2.5 relative z-10 flex-1 flex flex-col justify-between py-1">
            {processedTop5.map((item) => (
              <div key={item.name} className="flex items-center gap-2.5 h-7">
                <span className="w-4 text-xs font-mono font-bold text-muted-foreground text-center shrink-0">
                  {item.rank}
                </span>
                <div className="flex-1 h-full relative flex items-center">
                  <div
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    className="h-full rounded-r-full transition-all duration-500 flex items-center justify-start px-3 shadow-sm border border-black/10 shrink-0"
                  >
                    <span
                      className={`text-[10pt] font-bold truncate max-w-full tracking-wide uppercase ${
                        item.isLightColor ? "text-black" : "text-white"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  {/* Quantidade exibida FORA DA BARRA (10pt) */}
                  <span className="text-[10pt] font-black font-mono text-foreground shrink-0 ml-2 bg-background/80 border border-border/60 px-2 py-0.5 rounded-md shadow-xs">
                    {item.value} un
                  </span>
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

        {/* Lado Direito: Estatísticas de Porcentagem em 2 Colunas (Top 5) */}
        <div className="w-full lg:w-64 shrink-0 grid grid-cols-2 gap-x-4 gap-y-3 items-center pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-border/40 pt-3 lg:pt-0">
          <div className="space-y-3">
            {col1Top5.map((item) => (
              <div key={item.name} className="space-y-0.5">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
                  <span className="text-[10.5px] font-semibold text-muted-foreground leading-tight break-words uppercase">{item.name}</span>
                </div>
                <div className="text-sm font-extrabold font-mono text-foreground pl-4 flex items-center gap-1.5">
                  <span>{item.pct}%</span>
                  <span className="text-[10px] font-normal text-muted-foreground font-sans">({item.value} un)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {col2Top5.map((item) => (
              <div key={item.name} className="space-y-0.5">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
                  <span className="text-[10.5px] font-semibold text-muted-foreground leading-tight break-words uppercase">{item.name}</span>
                </div>
                <div className="text-sm font-extrabold font-mono text-foreground pl-4 flex items-center gap-1.5">
                  <span>{item.pct}%</span>
                  <span className="text-[10px] font-normal text-muted-foreground font-sans">({item.value} un)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL COMPLETO DE PRODUTOS VENDIDOS (RENDERIZADO VIA PORTAL NO DOCUMENT.BODY) */}
      {isModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] p-4 md:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-[#1c1c20] border border-gold-subtle/40 rounded-2xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 relative animate-scale-in my-auto">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                    Produtos Mais Vendidos (Visão Completa)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ranking total de produtos vendidos no período selecionado ({sortedData.length} {sortedData.length === 1 ? 'item' : 'itens'}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Gráfico Completo */}
            <div className="flex flex-col lg:flex-row items-stretch justify-between gap-8 pt-2">
              {/* Barras em lista vertical */}
              <div className="flex-1 space-y-3.5 relative min-h-[300px]">
                <div className="space-y-3.5 relative z-10">
                  {processedAll.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 h-9">
                      <span className="w-6 text-xs font-mono font-bold text-muted-foreground text-center shrink-0">
                        #{item.rank}
                      </span>
                      <div className="flex-1 h-full relative flex items-center">
                        <div
                          style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                          className="h-full rounded-r-full transition-all duration-500 flex items-center justify-between px-4 shadow-sm border border-black/10 min-w-[140px]"
                        >
                          <span
                            className={`text-xs font-bold truncate max-w-[65%] tracking-wide uppercase ${
                              item.isLightColor ? "text-black" : "text-white"
                            }`}
                          >
                            {item.name}
                          </span>
                          <span
                            className={`text-xs font-mono font-extrabold shrink-0 ml-2 ${
                              item.isLightColor ? "text-black" : "text-white"
                            }`}
                          >
                            {item.value} un ({item.pct}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela Resumo com Percentuais e Totais */}
              <div className="w-full lg:w-80 shrink-0 bg-background/50 border border-border/50 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block border-b border-border/40 pb-2">
                  Detalhamento de Vendas
                </span>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {processedAll.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-0">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-foreground truncate uppercase">{item.name}</span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="font-bold text-primary">{item.value} un</span>
                        <span className="text-muted-foreground text-[10px] ml-1">({item.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex justify-end pt-4 border-t border-border/40">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-6 bg-primary text-background font-black text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-md"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// Tooltip customizado para o gráfico de Serviços vs Produtos (Donut)
const ServicesVsProductsTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    if (!data.name || data.name === "Sem vendas") return null

    return (
      <div className="bg-[#18181b]/95 backdrop-blur-md border border-border/80 rounded-xl p-3 shadow-xl text-xs space-y-1 z-50">
        <p className="font-bold text-foreground flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          {data.name}
        </p>
        <p className="text-muted-foreground font-mono">
          Valor: <span className="font-bold text-foreground">{formatCurrency(data.rawValue)}</span>
        </p>
        <p className="text-muted-foreground font-mono">
          Participação: <span className="font-bold text-primary">{data.pct}%</span>
        </p>
        {data.count > 0 && (
          <p className="text-muted-foreground text-[10px]">
            Quantidade: <span className="font-semibold text-foreground">{data.count} {data.name === "Serviços" ? "serviço(s)" : "item(ns)"}</span>
          </p>
        )}
      </div>
    )
  }
  return null
}

export function ServicesVsProductsChart({
  servicesTotal = 0,
  productsTotal = 0,
  servicesCount = 0,
  productsCount = 0
}) {
  const sTotal = Number(servicesTotal) || 0
  const pTotal = Number(productsTotal) || 0
  const totalValue = sTotal + pTotal

  const pctServicos = totalValue > 0 ? ((sTotal / totalValue) * 100).toFixed(1) : "0.0"
  const pctProdutos = totalValue > 0 ? ((pTotal / totalValue) * 100).toFixed(1) : "0.0"

  const itemsList = [
    {
      name: "Serviços",
      value: sTotal > 0 ? sTotal : (totalValue === 0 ? 1 : 0.0001),
      rawValue: sTotal,
      count: servicesCount,
      pct: pctServicos,
      color: "#FADD00"
    },
    {
      name: "Produtos",
      value: pTotal > 0 ? pTotal : (totalValue === 0 ? 0 : 0.0001),
      rawValue: pTotal,
      count: productsCount,
      pct: pctProdutos,
      color: "#504D35"
    }
  ]


  const chartSlices = totalValue === 0
    ? [{ name: "Sem vendas", value: 1, color: "#3f3f46" }]
    : itemsList.filter((it) => it.rawValue > 0)

  return (
    <div className="w-full flex flex-col justify-between items-center h-full space-y-4 pt-1">
      {/* Container do Gráfico Donut com Valor Total Central */}
      <div className="relative w-full h-[236px] flex items-center justify-center min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartSlices}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={totalValue > 0 && sTotal > 0 && pTotal > 0 ? 4 : 0}
              dataKey="value"
              stroke="none"
            >
              {chartSlices.map((entry, index) => (
                <Cell key={`cell-svp-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ServicesVsProductsTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Texto do Centro do Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          <span className="text-lg md:text-xl font-black font-mono text-white tracking-tight leading-tight drop-shadow-sm">
            {formatCurrency(totalValue)}
          </span>
          <span className="text-[10px] md:text-[11px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
            total geral
          </span>
        </div>
      </div>


      {/* Legenda em Formato de Tabela (Modelo em Anexo) */}
      <div className="w-full space-y-2 pt-1 border-t border-border/30">
        {/* Cabeçalho da Tabela */}
        <div className="flex items-center justify-between text-[11pt] font-bold uppercase tracking-wider text-muted-foreground pb-2 px-1">
          <span>ITEM</span>
          <span>VALOR / PERCENTUAL</span>
        </div>

        {/* Linhas de Itens */}
        <div className="space-y-2">
          {itemsList.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between py-2 border-b border-border/20 px-1 text-[12pt]"
            >
              {/* Lado Esquerdo: Barra de Cor + Nome */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-1.5 h-4.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold text-foreground text-[12pt]">{item.name}</span>
              </div>

              {/* Lado Direito: Valor Total + Pill de Percentual */}
              <div className="flex items-center gap-2.5 font-mono shrink-0">
                <span className="font-extrabold text-foreground text-[12pt]">
                  {formatCurrency(item.rawValue)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[12pt] font-black bg-primary/20 text-primary border border-primary/40 shadow-xs">
                  {item.pct}%
                </span>
              </div>
            </div>
          ))}

          {/* Linha de Soma Total */}
          <div className="flex items-center justify-between py-2.5 px-2.5 mt-1 rounded-xl bg-primary/10 border border-primary/30 text-[12pt] font-bold">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-4.5 rounded-full shrink-0 bg-primary" />
              <span className="font-extrabold text-foreground text-[12pt]">Soma Total</span>
            </div>
            <div className="flex items-center gap-2.5 font-mono shrink-0">
              <span className="font-black text-primary text-[13pt]">
                {formatCurrency(totalValue)}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[12pt] font-black bg-primary/30 text-primary border border-primary/50 shadow-xs">
                100%
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}


