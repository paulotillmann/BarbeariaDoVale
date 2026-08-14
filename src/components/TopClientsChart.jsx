import React, { useState } from "react"
import { createPortal } from "react-dom"
import { Users, Maximize2, X, Scissors, ShoppingBag, Phone, Award, ArrowUpRight } from "lucide-react"

// Formata valores em K para >= 1000 e em reais simples para < 1000
function formatValueK(val) {
  const num = Number(val) || 0
  if (num >= 1000) {
    const kVal = num / 1000
    const formatted = kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1).replace(/\.0$/, "")
    return `R$ ${formatted}k`
  }
  return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatCurrency(val) {
  return (Number(val) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

// Paleta degradê de 10 passos (Dourado quente -> Bronze escuro)
const TOP_10_COLORS = [
  "#FADD00", // #1 - Dourado vibrante / mais quente
  "#EDCA0E", // #2
  "#DFB71C", // #3
  "#CFBB23", // #4
  "#BFA72C", // #5
  "#A59837", // #6
  "#8F853A", // #7
  "#7A733D", // #8
  "#656039", // #9
  "#504D35"  // #10 - Mais escuro
]

// Paleta degradê de 20 passos para o modal Top 20
const TOP_20_COLORS = [
  "#FADD00", "#F2D30A", "#EAC714", "#E1BB1E", "#D8AF28",
  "#CFBB23", "#C4A72B", "#B99E30", "#AE9534", "#A59837",
  "#998B39", "#8D7E3B", "#81713D", "#7A733D", "#6F673B",
  "#645B38", "#5A5136", "#504D35", "#43402F", "#33322B"
]

export default function TopClientsChart({ data = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex flex-col items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl bg-muted/10 p-6 space-y-2 text-center animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
          <Users size={20} />
        </div>
        <span className="font-bold text-foreground text-sm">Nenhum gasto de cliente registrado no período</span>
        <span className="text-[11px] text-muted-foreground max-w-xs">
          Não foram encontrados agendamentos ou vendas no período selecionado para calcular o ranking dos clientes.
        </span>
      </div>
    )
  }

  // Ordenação estritamente decrescente
  const sortedData = [...data].sort((a, b) => b.totalSpent - a.totalSpent)
  const top10Data = sortedData.slice(0, 10)
  const top20Data = sortedData.slice(0, 20)

  const maxVal = top10Data[0]?.totalSpent || 1
  const maxVal20 = top20Data[0]?.totalSpent || 1

  // Processa dados para as barras
  const processItems = (items, referenceMax, palette) => {
    return items.map((item, idx) => {
      const pct = Math.max(12, Math.min(80, Math.round((item.totalSpent / referenceMax) * 80)))
      const color = palette[idx % palette.length]
      const isLightColor = idx < 3
      return {
        ...item,
        rank: idx + 1,
        pct,
        color,
        isLightColor,
        formattedK: formatValueK(item.totalSpent)
      }
    })
  }

  const processedTop10 = processItems(top10Data, maxVal, TOP_10_COLORS)
  const processedTop20 = processItems(top20Data, maxVal20, TOP_20_COLORS)

  // Ticks para o eixo X do Top 10
  const tickStep = maxVal / 4
  const xTicks = [0, tickStep, tickStep * 2, tickStep * 3, maxVal]

  // Ticks para o eixo X do Top 20
  const tickStep20 = maxVal20 / 4
  const xTicks20 = [0, tickStep20, tickStep20 * 2, tickStep20 * 3, maxVal20]

  // Totais do Top 20 para resumo
  const totalTop20Revenue = top20Data.reduce((acc, c) => acc + c.totalSpent, 0)
  const totalTop20Services = top20Data.reduce((acc, c) => acc + c.servicesTotal, 0)
  const totalTop20Products = top20Data.reduce((acc, c) => acc + c.productsTotal, 0)

  return (
    <div className="w-full flex flex-col justify-between h-full pt-1 space-y-4">
      {/* Cabeçalho do Card com Botão Ver Top 20 */}
      <div className="flex items-center justify-between -mt-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Top 10 Clientes
          </span>
          <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-bold">
            Serviços & Produtos
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
        >
          <Maximize2 size={13} />
          <span>Ver Top 20</span>
        </button>
      </div>

      {/* Container Principal do Gráfico de Barras Horizontais */}
      <div className="w-full flex-1 flex flex-col justify-between relative min-h-[340px] pt-1">
        {/* Linhas de grade verticais pontilhadas (0%, 25%, 50%, 75%, 100%) */}
        <div className="absolute inset-0 left-7 right-2 bottom-6 pointer-events-none flex justify-between z-0">
          <div className="border-r border-dashed border-border/25 h-full"></div>
          <div className="border-r border-dashed border-border/25 h-full"></div>
          <div className="border-r border-dashed border-border/25 h-full"></div>
          <div className="border-r border-dashed border-border/25 h-full"></div>
          <div className="border-r border-dashed border-border/25 h-full"></div>
        </div>

        {/* Lista de Barras Horizontais do Top 10 (Ordem Decrescente) */}
        <div className="space-y-2 relative z-10 flex-1 flex flex-col justify-between py-1">
          {processedTop10.map((item) => (
            <div
              key={item.id || item.name}
              className="flex items-center gap-2.5 h-6.5"
            >
              {/* Número do Ranking */}
              <span className="w-5 text-[11px] font-mono font-bold text-muted-foreground text-center shrink-0">
                {item.rank}
              </span>

              {/* Barra com Nome dentro e Valor na Frente */}
              <div className="flex-1 h-full relative flex items-center">
                <div
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  className="h-full rounded-r-md transition-all duration-500 flex items-center justify-start px-3 shadow-xs border border-black/10 shrink-0 min-w-[90px]"
                >
                  <span
                    className={`text-[10pt] font-bold truncate max-w-full tracking-wide uppercase ${
                      item.isLightColor ? "text-black" : "text-white"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                {/* Valor exibido FORA DA BARRA, na frente */}
                <span className="text-[12pt] font-black font-mono text-foreground shrink-0 ml-2 bg-background/80 border border-border/60 px-2 py-0.5 rounded-md shadow-xs">
                  {item.formattedK}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Eixo X com Valores Formatados em K */}
        <div className="flex justify-between pl-7 pr-2 text-[10px] font-mono text-muted-foreground pt-2 z-10 border-t border-border/20">
          {xTicks.map((val, idx) => (
            <span key={idx} className="font-semibold">
              {formatValueK(val)}
            </span>
          ))}
        </div>
      </div>

      {/* MODAL EXPANDIDO COM OS TOP 20 CLIENTES */}
      {isModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] p-3 sm:p-4 md:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-[#1c1c20] border border-gold-subtle/40 rounded-2xl md:rounded-3xl p-5 md:p-7 w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 relative animate-scale-in my-auto">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                    Ranking dos Top 20 Clientes
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Clientes que mais investiram em serviços e produtos na Barbearia Do Vale no período.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer"
                title="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cards de Resumo do Top 20 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-background/60 border border-border/50 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Faturamento Top 20
                  </span>
                  <span className="text-base font-black font-mono text-white">
                    {formatCurrency(totalTop20Revenue)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <ArrowUpRight size={16} />
                </div>
              </div>

              <div className="bg-background/60 border border-border/50 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Total em Serviços
                  </span>
                  <span className="text-base font-black font-mono text-primary">
                    {formatCurrency(totalTop20Services)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Scissors size={16} />
                </div>
              </div>

              <div className="bg-background/60 border border-border/50 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Total em Produtos
                  </span>
                  <span className="text-base font-black font-mono text-foreground">
                    {formatCurrency(totalTop20Products)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <ShoppingBag size={16} />
                </div>
              </div>
            </div>

            {/* Conteúdo: Gráfico Top 20 + Detalhamento Lateral */}
            <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 pt-1">
              
              {/* Lado Esquerdo: Gráfico dos Top 20 */}
              <div className="flex-1 space-y-2 relative min-h-[500px]">
                {/* Linhas de grade verticais */}
                <div className="absolute inset-0 left-7 right-2 bottom-6 pointer-events-none flex justify-between z-0">
                  <div className="border-r border-dashed border-border/25 h-full"></div>
                  <div className="border-r border-dashed border-border/25 h-full"></div>
                  <div className="border-r border-dashed border-border/25 h-full"></div>
                  <div className="border-r border-dashed border-border/25 h-full"></div>
                  <div className="border-r border-dashed border-border/25 h-full"></div>
                </div>

                {/* Barras do Top 20 */}
                <div className="space-y-1.5 relative z-10 flex-1 flex flex-col justify-between py-1">
                  {processedTop20.map((item) => (
                    <div key={item.id || item.name} className="flex items-center gap-2.5 h-6">
                      <span className="w-5 text-[10px] font-mono font-bold text-muted-foreground text-center shrink-0">
                        #{item.rank}
                      </span>
                      <div className="flex-1 h-full relative flex items-center">
                        <div
                          style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                          className="h-full rounded-r-md transition-all duration-500 flex items-center justify-start px-3 shadow-xs border border-black/10 shrink-0 min-w-[100px]"
                        >
                          <span
                            className={`text-[9.5pt] font-bold truncate max-w-full tracking-wide uppercase ${
                              item.isLightColor ? "text-black" : "text-white"
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>

                        {/* Valor na frente da barra */}
                        <span className="text-[11pt] font-black font-mono text-foreground shrink-0 ml-2 bg-background/80 border border-border/60 px-1.5 py-0.5 rounded-md shadow-xs">
                          {item.formattedK}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Eixo X com Ticks */}
                <div className="flex justify-between pl-7 pr-2 text-[10px] font-mono text-muted-foreground pt-2 z-10 border-t border-border/20">
                  {xTicks20.map((val, idx) => (
                    <span key={idx} className="font-semibold">
                      {formatValueK(val)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lado Direito: Tabela Detalhada com Lista dos Clientes */}
              <div className="w-full lg:w-84 shrink-0 bg-background/50 border border-border/50 rounded-2xl p-4 space-y-3 flex flex-col">
                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block border-b border-border/40 pb-2">
                  Detalhamento dos Top 20
                </span>
                
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 flex-1">
                  {processedTop20.map((item) => (
                    <div
                      key={item.id || item.name}
                      className="bg-card/40 border border-border/40 hover:border-primary/40 rounded-xl p-2.5 space-y-1 text-xs transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border border-black/20"
                            style={{ backgroundColor: item.color, color: item.isLightColor ? "#000" : "#fff" }}
                          >
                            #{item.rank}
                          </span>
                          <span className="font-bold text-foreground truncate uppercase text-[11px]">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-black font-mono text-primary shrink-0 text-xs">
                          {formatCurrency(item.totalSpent)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pl-7 pt-0.5">
                        <span>Serviços: <strong className="text-foreground">{formatCurrency(item.servicesTotal)}</strong> ({item.servicesCount})</span>
                        <span>Produtos: <strong className="text-foreground">{formatCurrency(item.productsTotal)}</strong> ({item.productsCount})</span>
                      </div>

                      {item.phone && (
                        <div className="pl-7 pt-0.5 flex items-center gap-1 text-[10px] text-primary/80">
                          <Phone size={10} />
                          <span>{item.phone}</span>
                        </div>
                      )}
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
