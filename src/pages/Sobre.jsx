import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Award, Users, ShieldCheck, Heart } from "lucide-react"
import Logo from "../components/Logo.jsx"
import Card from "../components/Card.jsx"

export default function Sobre() {
  return (
    <div className="bg-background min-h-screen text-foreground pt-24 pb-16 relative overflow-hidden">
      {/* Background Lights */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Back Link */}
        <div className="max-w-3xl mx-auto mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Início
          </Link>
        </div>

        {/* Content Container */}
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Main Info */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo showText={false} className="h-20 w-auto" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Sobre a <span className="gold-text">Brooklyn</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              Nascida da paixão pela clássica cultura de barbearias e o desejo de oferecer uma experiência premium de cuidado masculino em Natal-RN.
            </p>
          </div>

          {/* Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <Card titulo="Nossa Missão">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Award className="w-5 h-5" />
                  <span className="font-display font-bold">Qualidade Indiscutível</span>
                </div>
                Oferecer não apenas um corte de cabelo ou barba, mas sim uma experiência completa de relaxamento, autoestima e renovação do visual.
              </div>
            </Card>

            <Card titulo="Nossos Valores">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-display font-bold">Respeito & Tradição</span>
                </div>
                Honrar as técnicas clássicas da barbearia enquanto abraçamos tendências modernas, valorizando cada detalhe e cada profissional do nosso time.
              </div>
            </Card>
          </div>

          {/* Text block */}
          <div className="border border-border/50 bg-card/40 rounded-3xl p-8 md:p-10 leading-relaxed text-muted-foreground space-y-6">
            <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/30 pb-3 mb-2">
              <Users className="w-5 h-5 text-primary" /> A Maior Rede de Natal
            </h3>
            <p>
              Com 3 unidades estrategicamente localizadas em Natal, a Barbearia Brooklyn consolidou-se como referência em atendimento ao cliente e infraestrutura premium. Nossos ambientes são projetados para oferecer o máximo conforto, desde uma recepção acolhedora até cadeiras de alta qualidade e atendimento impecável.
            </p>
            <p>
              Venha tomar um café, refrigerante ou cerveja gelada conosco enquanto nossos barbeiros especialistas cuidam do seu visual.
            </p>
            <div className="pt-4 flex items-center gap-2 text-sm font-semibold text-primary">
              <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
              <span>Feito com paixão pela Barbearia Brooklyn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
