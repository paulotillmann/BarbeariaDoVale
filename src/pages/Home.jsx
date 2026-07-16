import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import {
  Scissors,
  Clock,
  MapPin,
  Phone,
  Briefcase,
  ArrowRight,
  Calendar,
  Sparkles,
  Droplet,
  Flame,
  MessageCircle
} from "lucide-react"
import Logo from "../components/Logo.jsx"

const Instagram = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)


export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleBookingClick = () => {
    navigate("/agendar")
  }

  const services = [
    {
      title: "CORTE",
      desc: "Corte clássico com acabamento perfeito realizado pelos nossos profissionais de ponta.",
      time: "30 min",
      price: "R$ 55,00",
      icon: <Scissors className="w-6 h-6" />
    },
    {
      title: "BARBA",
      desc: "Corte de barba com vaporizador. Técnica que utiliza vapor quente para suavizar os pelos faciais e abrir os poros, tornando o processo de barbear muito mais confortável e eficaz, além de hidratar a pele e reduzir irritações.",
      time: "30 min",
      price: "R$ 55,00",
      icon: <Flame className="w-6 h-6" />
    },
    {
      title: "BARBATERAPIA",
      desc: "Um serviço exclusivo e relaxante que vai além do tradicional corte de barba, oferecendo uma experiência completa de cuidados faciais. Envolve vaporizador, óleos essenciais, massagem facial e toalhas quentes.",
      time: "30 min",
      price: "R$ 70,00",
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      title: "HIDRATAÇÃO",
      desc: "Tratamento que restaura a umidade e nutrientes dos fios masculinos, combatendo o ressecamento e danos externos. Proporciona cabelo mais macio, com brilho e visual saudável.",
      time: "30 min",
      price: "R$ 35,00",
      icon: <Droplet className="w-6 h-6" />
    },
    {
      title: "SOBRANCELHA",
      desc: "Procedimento que modela e alinha as sobrancelhas, realçando a expressão e a harmonia facial. Envolve a remoção precisa de pelos para criar um contorno natural e equilibrado.",
      time: "30 min",
      price: "R$ 35,00",
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      title: "CORTE E BARBA",
      desc: "Combo completo: corte clássico com acabamento perfeito e barba feita com vaporizador e toalha quente. O visual definitivo Do Vale.",
      time: "60 min",
      price: "R$ 110,00",
      icon: <Scissors className="w-6 h-6" />
    }
  ]



  const team = [
    {
      name: "MARCIO DO VALE",
      role: "Barbeiro Profissional",
      photo: "/assets/foto_marcio.png"
    },
    {
      name: "LUCAS DO VALE",
      role: "Barbeiro Profissional",
      photo: "/assets/foto_lucas.png"
    },
    {
      name: "PAULO TILLMANN",
      role: "Barbeiro Profissional",
      photo: "/assets/foto_neto.png"
    }
  ]

  const handleScroll = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="bg-background min-h-screen text-foreground overflow-x-hidden pt-16">
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-hero-gradient">
        {/* Background Gradients and Pattern - Premium */}
        <div className="absolute inset-0 bg-hero-gradient"></div>
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-30"></div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Shield Logo - Premium */}
            <div className="flex justify-center mb-12 animate-fade-in">
              <img src="/assets/logo-nova-sem-borda.png" alt="Barbearia Do Vale" className="h-[152px] md:h-[200px] w-auto object-contain border-none outline-none shadow-none" style={{border: 'none'}} />
            </div>

            {/* Heading - Premium */}
            <h1 className="font-rye text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 tracking-tight leading-[1.1] animate-fade-in animate-delay-200">
              A Arte da <span className="gold-text">Transformação Visual</span>
            </h1>

            {/* Subtitle - Premium */}
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in animate-delay-300">
              Experimente o melhor ambiente e os melhores barbeiros. Desfrute de um atendimento mais que especial pela nossa equipe.
            </p>

            {/* CTA Buttons - Premium */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20 max-w-lg mx-auto sm:max-w-none animate-fade-in animate-delay-400">
              <button
                onClick={handleBookingClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gold-gradient text-primary-foreground font-semibold shadow-gold-lg hover:shadow-gold hover:-translate-y-1 active:translate-y-0 h-16 rounded-xl px-12 text-lg transition-all duration-500 cursor-pointer"
              >
                <Calendar className="w-5 h-5 mr-1" />
                Agende seu Horário
              </button>
              <button
                onClick={() => handleScroll("services")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 border border-gold-subtle bg-transparent text-primary hover:bg-primary/5 hover:border-primary/40 h-16 rounded-xl px-12 text-lg font-medium transition-all duration-500 cursor-pointer"
              >
                Saiba Mais
              </button>
            </div>

            {/* Stats - Premium */}
            <div className="grid grid-cols-3 gap-8 md:gap-16 max-w-3xl mx-auto border-t border-gold-subtle pt-12">
              <div className="text-center group">
                <div className="font-display text-4xl md:text-5xl lg:text-6xl font-bold gold-text-solid mb-2 group-hover:scale-105 transition-transform duration-300">10+</div>
                <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-[0.2em] font-semibold">Anos de Experiência</div>
              </div>
              <div className="text-center group">
                <div className="font-display text-4xl md:text-5xl lg:text-6xl font-bold gold-text-solid mb-2 group-hover:scale-105 transition-transform duration-300">1000+</div>
                <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-[0.2em] font-semibold">Clientes Satisfeitos</div>
              </div>
              <div className="text-center group">
                <div className="font-display text-4xl md:text-5xl lg:text-6xl font-bold gold-text-solid mb-2 group-hover:scale-105 transition-transform duration-300">3</div>
                <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-[0.2em] font-semibold">Profissionais</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Premium */}
      <section id="services" className="py-24 md:py-40 bg-card/20 border-y border-gold-subtle">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold-subtle px-4 py-2 text-xs font-semibold text-primary uppercase tracking-[0.2em] bg-primary/5 mb-6 animate-fade-in">
              Procedimentos
            </div>
            <h2 className="font-rye text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 tracking-tight animate-fade-in animate-delay-100">
              Nossos <span className="gold-text">Serviços</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg leading-relaxed animate-fade-in animate-delay-200">
              Conheça nossos principais procedimentos e valores. Agende agora o seu atendimento.
            </p>
          </div>

          {/* Services Grid - Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((svc, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gold-subtle glass-card shadow-elevated hover:-translate-y-2 transition-all duration-500 group flex flex-col justify-between overflow-hidden animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="p-8 md:p-10 flex-1 flex flex-col">
                  {/* Icon Frame - Premium */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-gold-subtle flex items-center justify-center text-primary mb-8 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                    {svc.icon}
                  </div>
                  {/* Title */}
                  <h3 className="font-display text-xl lg:text-2xl font-bold mb-4 tracking-wide">{svc.title}</h3>
                  {/* Desc */}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1 line-clamp-[5]">
                    {svc.desc}
                  </p>
                  {/* Info Footer - Premium */}
                  <div className="flex items-center justify-between border-t border-gold-subtle pt-6 mt-auto">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                      <Clock className="w-5 h-5 text-primary" />
                      {svc.time}
                    </div>
                    <div className="font-display text-xl lg:text-2xl font-bold gold-text-solid text-right">{svc.price}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16 md:mt-20">
            <button 
              onClick={handleBookingClick}
              className="inline-flex items-center justify-center gap-2.5 bg-gold-gradient text-primary-foreground font-bold shadow-gold-lg hover:shadow-gold hover:-translate-y-1 active:translate-y-0 h-16 rounded-xl px-12 text-base transition-all duration-500 cursor-pointer"
            >
              Agendar um Atendimento
            </button>
          </div>
        </div>
      </section>



      {/* Barbers / Team Section - Premium */}
      <section id="team" className="py-24 md:py-40 bg-card/20 border-y border-gold-subtle">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold-subtle px-4 py-2 text-xs font-semibold text-primary uppercase tracking-[0.2em] bg-primary/5 mb-6 animate-fade-in">
              Nossa Equipe
            </div>
            <h2 className="font-rye text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 tracking-tight animate-fade-in animate-delay-100">
              Barbeiros <span className="gold-text">Especialistas</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg leading-relaxed animate-fade-in animate-delay-200">
              Nossos talentosos barbeiros são verdadeiros artistas, especialistas em cortes clássicos e barbas estilizadas.
            </p>
          </div>

          {/* Team Grid - Premium */}
          <div className="flex flex-wrap justify-center gap-12 lg:gap-16 max-w-6xl mx-auto">
            {team.map((barber, i) => (
              <div
                key={i}
                className="w-full max-w-[290px] rounded-2xl border border-gold-subtle glass-card shadow-elevated hover:-translate-y-2 transition-all duration-500 group overflow-hidden animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Photo container - Premium */}
                <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                  <img
                    src={barber.photo}
                    alt={barber.name}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Border glow on hover */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/30 transition-all duration-500"></div>
                  {/* Instagram float button - Premium */}
                  <a
                    href="https://www.instagram.com/barbeariadovale/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-5 right-5 w-12 h-12 rounded-full bg-background/60 backdrop-blur-md border border-gold-subtle flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-primary hover:text-primary-foreground shadow-lg hover:shadow-gold"
                    aria-label={`Instagram de ${barber.name}`}
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Final Call to Action - Premium */}
      <section className="py-24 md:py-40 relative overflow-hidden border-t border-gold-subtle">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/8"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-accent/10 rounded-full blur-[180px] opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-rye text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-8 tracking-tight animate-fade-in">
              Pronto para ter o <span className="gold-text">Melhor Visual?</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-14 max-w-2xl mx-auto leading-relaxed animate-fade-in animate-delay-100">
              Agende seu horário agora mesmo e experimente o atendimento premium da nossa barbearia.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 max-w-lg mx-auto sm:max-w-none animate-fade-in animate-delay-200">
              <button 
                onClick={handleBookingClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gold-gradient text-primary-foreground font-bold shadow-gold-lg hover:shadow-gold hover:-translate-y-1 active:translate-y-0 h-16 rounded-xl px-12 text-lg transition-all duration-500 cursor-pointer"
              >
                <Calendar className="w-5 h-5 mr-1" />
                Agendar Online
              </button>
              
              <a
                href="https://api.whatsapp.com/send/?phone=5534988537720&text=Olá,+gostaria+de+tirar+uma+dúvida+com+a+equipe+da+Do+Vale!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 border border-gold-subtle bg-transparent text-primary hover:bg-primary/5 hover:border-primary/40 h-16 rounded-xl px-12 text-lg font-medium transition-all duration-500"
              >
                <MessageCircle className="w-5 h-5 mr-1 text-[#25D366]" />
                (34) 98853-7720
              </a>

              <a
                href="https://api.whatsapp.com/send/?phone=5534999217720&text=Olá,+gostaria+de+tirar+uma+dúvida+com+a+equipe+da+Do+Vale!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 border border-gold-subtle bg-transparent text-primary hover:bg-primary/5 hover:border-primary/40 h-16 rounded-xl px-12 text-lg font-medium transition-all duration-500"
              >
                <MessageCircle className="w-5 h-5 mr-1 text-[#25D366]" />
                (34) 99921-7720
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Premium */}
      <footer className="bg-card border-t border-gold-subtle">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14 lg:gap-12">
            {/* Branding Column */}
            <div className="space-y-7">
              <img src="/assets/logo-nova-sem-borda.png" alt="Barbearia Do Vale" className="h-[118px] w-auto object-contain border-none" style={{border: 'none'}} />
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                Experiência premium em barbearia. Cortes clássicos e modernos com os melhores profissionais.
              </p>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                CNPJ: 33.854.292/0001-89
              </p>
              <div className="flex gap-5">
                <a
                  href="https://www.instagram.com/barbeariadovale/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-muted border border-gold-subtle flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary/50 hover:scale-110 transition-all duration-300"
                  aria-label="Instagram da Barbearia Do Vale"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Units Column */}
            <div>
              <h4 className="font-display text-lg font-bold mb-7 tracking-wide text-foreground">Nossa Unidade</h4>
              <ul className="space-y-5 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-primary" />
                  <span className="leading-relaxed">Av: Senador Melo Viana 709 - Bairro: Goiás - Araguari/MG</span>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="font-display text-lg font-bold mb-7 tracking-wide text-foreground">Contato</h4>
              <ul className="space-y-5">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-5 h-5 flex-shrink-0 text-primary" />
                  <a
                    href="https://api.whatsapp.com/send/?phone=5534988537720&text=Olá,+gostaria+de+tirar+uma+dúvida+com+a+equipe+da+Do+Vale!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors text-sm font-medium"
                  >
                    (34) 98853-7720
                  </a>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-5 h-5 flex-shrink-0 text-primary" />
                  <a
                    href="https://api.whatsapp.com/send/?phone=5534999217720&text=Olá,+gostaria+de+tirar+uma+dúvida+com+a+equipe+da+Do+Vale!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors text-sm font-medium"
                  >
                    (34) 99921-7720
                  </a>
                </li>
              </ul>
            </div>

            {/* Hours Column */}
            <div>
              <h4 className="font-display text-lg font-bold mb-7 tracking-wide text-foreground">Horário</h4>
              <ul className="space-y-5">
                <li className="flex items-start gap-3 text-muted-foreground text-sm">
                  <Clock className="w-5 h-5 mt-1 flex-shrink-0 text-primary" />
                  <div className="leading-relaxed">
                    <p className="font-semibold text-foreground mb-2 tracking-wide">Horário de Funcionamento</p>
                    <p>Seg - Sex: 09:00 - 19:00</p>
                    <p>Sábado: 09:00 - 16:00</p>
                    <p>Domingo: Fechado</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright & Legal */}
          <div className="border-t border-gold-subtle mt-16 pt-10 flex flex-col md:flex-row items-center justify-between gap-5">
            <p className="text-muted-foreground text-xs md:text-sm tracking-wide">
              © {new Date().getFullYear()} Barbearia Do Vale LTDA. Todos os direitos reservados.
            </p>
            <div className="flex gap-8 text-xs md:text-sm">
              <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors tracking-wide">
                Privacidade
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors tracking-wide">
                Termos de Uso
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
