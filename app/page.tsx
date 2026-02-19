import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  BookOpen,
  Lock,
  Search,
  Plug,
  Truck,
  MessageCircle,
  Mail,
  BadgeCheck,
  Zap,
  Users,
  User,
  Clock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="mailto:ai@pine.net.br">
                <Mail className="mr-2 h-4 w-4" />
                ai@pine.net.br
              </a>
            </Button>
            <Button asChild>
              <a
                href="https://wa.me/5541992413811?text=Olá! Gostaria de agendar um diagnóstico de IA para minha empresa."
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com especialista
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* 1. Hero Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Toda a inteligência do seu
              <br />
              <span className="text-primary">negócio em um só lugar.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Mapeamos seus processos e criamos assistentes de IA que conhecem
              cada detalhe da sua empresa, respondendo com base nos seus
              arquivos e sistemas em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a
                  href="https://wa.me/5541992413811?text=Olá! Gostaria de agendar um diagnóstico de IA para minha empresa."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Agendar Diagnóstico de IA
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:ai@pine.net.br">Falar por e-mail</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. A Nova Ordem de Eficiência */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mx-auto">
                <Zap className="h-4 w-4" />
                A Nova Ordem de Eficiência
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                A IA não vai simplesmente ajudar sua equipe.
                <br />
                <span className="text-primary">Ela vai redesenhar quem sobrevive no seu mercado.</span>
              </h2>
            </div>

            {/* O Gancho */}
            <div className="max-w-3xl mx-auto space-y-8 mb-20">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Você já percebeu que a estrutura de um escritório hoje é
                praticamente a mesma de 20 anos atrás? Setores inchados, processos
                lentos e informações presas em cabeças ou pastas.{" "}
                <strong className="text-foreground">
                  O mundo mudou, mas a sua estrutura de custos e produtividade
                  continua &quot;quadradinha&quot;.
                </strong>
              </p>

              {/* A Provocação */}
              <p className="text-lg text-muted-foreground leading-relaxed">
                Enquanto uma empresa tradicional precisa de 10 pessoas para rodar
                um processo, o seu concorrente que já entendeu o jogo vai rodar o
                mesmo processo com{" "}
                <strong className="text-foreground">
                  apenas uma pessoa orquestrando assistentes digitais
                </strong>
                . Ele vai ser mais rápido, mais barato e mais preciso. Agora imagine
                essas mesmas 10 pessoas, cada uma orquestrando seus próprios
                assistentes — o resultado não é 10x.{" "}
                <strong className="text-foreground">É 50x</strong>. Isso não é sobre
                reduzir equipes. É sobre aperfeiçoar cada profissional que você já tem.
              </p>
            </div>

            {/* Visual comparativo: Modelo Tradicional vs Modelo Pineai */}
            <div className="grid md:grid-cols-2 gap-6 mb-20 max-w-4xl mx-auto">
              <div className="bg-background border border-dashed rounded-2xl p-8 space-y-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Modelo Tradicional
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">5 pessoas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground/50" />
                    <span className="text-sm text-muted-foreground">5 dias</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-red-500/70">Sujeito a erro humano</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-2xl font-bold text-muted-foreground">1 tarefa</p>
                </div>
              </div>

              <div className="bg-background border-2 border-primary rounded-2xl p-8 space-y-5 relative">
                <div className="absolute -top-3 right-6">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Seu concorrente já faz isso
                  </span>
                </div>
                <p className="text-xs font-medium text-primary uppercase tracking-wider">
                  Modelo Pineai
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm">1 orquestrador + assistentes de IA</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-sm">5 minutos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-primary">Precisão baseada em dados reais</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-2xl font-bold">1 tarefa</p>
                </div>
              </div>
            </div>

            {/* A Solução + Fechamento */}
            <div className="max-w-3xl mx-auto space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                <strong className="text-foreground">A Pineai não vende software.</strong>{" "}
                Nós entramos na sua operação, mapeamos seus processos e instalamos
                um cérebro digital privado. Nós transformamos seus colaboradores
                atuais nos orquestradores dessa inteligência. Colocamos a IA no
                núcleo da sua empresa para que{" "}
                <strong className="text-foreground">
                  você seja quem dita o ritmo do mercado
                </strong>
                , e não quem tenta correr atrás dele.
              </p>
              <p className="text-lg font-semibold text-foreground">
                Nós não queremos te vender uma ferramenta. Queremos te mostrar
                como a sua empresa vai operar daqui a 2 anos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cérebro Digital / Conhecimento Vivo */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="bg-background border rounded-xl p-6 shadow-lg space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <p className="text-sm">
                        Qual o prazo de garantia do produto X para o cliente Y?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary/10 rounded-lg px-4 py-3">
                      <p className="text-sm">
                        De acordo com o contrato firmado em 15/03/2025, o produto
                        X possui garantia de 24 meses para o cliente Y, com
                        cobertura total de peças e mão de obra.
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium shadow-lg">
                  Resposta em segundos
                </div>
              </div>

              <div className="space-y-6 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Search className="h-4 w-4" />
                  Cérebro Digital
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Conhecimento vivo,
                  <br />
                  respostas na hora
                </h2>
                <p className="text-lg text-muted-foreground">
                  Chega de procurar informações em manuais de 200 páginas ou
                  planilhas infinitas. Pergunte e receba a resposta exata na hora,
                  com base nos documentos reais da sua empresa.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Respostas precisas citando a fonte original
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Entende contratos, manuais, planilhas e relatórios
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Disponível 24/7 para toda a equipe
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      O conhecimento da empresa nunca mais se perde
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Adeus ao Trabalho Manual / Sincronização */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Plug className="h-4 w-4" />
                  Sincronização Automática
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Adeus ao
                  <br />
                  trabalho manual
                </h2>
                <p className="text-lg text-muted-foreground">
                  Não perca tempo subindo arquivos um a um. Nós conectamos a IA
                  direto na sua fonte de dados — servidores, nuvem, pastas
                  compartilhadas. Seus assistentes aprendem sozinhos conforme
                  sua empresa cresce.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Conexão direta com seus servidores e pastas
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Integração com as ferramentas que você já usa (SAP, Salesforce, etc.)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Atualização automática conforme seus dados mudam
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Zero esforço técnico da sua equipe
                    </span>
                  </li>
                </ul>
              </div>

              <div className="relative">
                <div className="bg-background border rounded-xl p-6 shadow-lg space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Plug className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Servidores de arquivos</p>
                      <p className="text-sm text-green-600">Conectado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Plug className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">ERP / CRM</p>
                      <p className="text-sm text-green-600">Conectado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Plug className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Pastas compartilhadas</p>
                      <p className="text-sm text-green-600">Conectado</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium shadow-lg">
                  Tudo sincronizado
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Privacidade Total / Instalação Privada */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Instalação Privada
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Privacidade total.
                  <br />
                  Seus dados protegidos.
                </h2>
                <p className="text-lg text-muted-foreground">
                  Diferente de IAs públicas, a Pineai é instalada no seu
                  ambiente. Suas informações estratégicas são protegidas e
                  nunca usadas para treinar outros modelos.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Seus dados nunca saem da sua empresa
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Nenhuma informação é usada para treinar modelos externos
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Controle total de acessos e permissões por equipe
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Em conformidade com LGPD e regulamentações do setor
                    </span>
                  </li>
                </ul>
              </div>

              <div className="relative">
                <div className="bg-background border rounded-xl p-8 shadow-lg space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-semibold text-lg">Ambiente Isolado</p>
                    <p className="text-sm text-muted-foreground">
                      Sua IA roda em infraestrutura dedicada, separada de
                      qualquer outro cliente.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Criptografia</p>
                      <p className="text-sm font-medium">Ponta a ponta</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Conformidade</p>
                      <p className="text-sm font-medium">LGPD</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Acesso</p>
                      <p className="text-sm font-medium">Controlado</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Treinamento</p>
                      <p className="text-sm font-medium">Bloqueado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. O Jeito Pineai - Passo a Passo */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">O Jeito Pineai</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Nós cuidamos de tudo. Você só precisa usar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative bg-background border rounded-2xl p-8 space-y-4 text-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-bold h-8 w-8 rounded-full inline-flex items-center justify-center">
                  1
                </span>
              </div>
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Search className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Diagnóstico</h3>
              <p className="text-muted-foreground text-sm">
                Entendemos onde sua equipe perde mais tempo e quais processos
                podem ser automatizados com inteligência artificial.
              </p>
            </div>

            <div className="relative bg-background border rounded-2xl p-8 space-y-4 text-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-bold h-8 w-8 rounded-full inline-flex items-center justify-center">
                  2
                </span>
              </div>
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Plug className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Conexão</h3>
              <p className="text-muted-foreground text-sm">
                Nós fazemos a ponte entre seus dados e a nossa tecnologia.
                Conectamos seus sistemas, documentos e bases de dados.
              </p>
            </div>

            <div className="relative bg-background border rounded-2xl p-8 space-y-4 text-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-bold h-8 w-8 rounded-full inline-flex items-center justify-center">
                  3
                </span>
              </div>
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Truck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Entrega</h3>
              <p className="text-muted-foreground text-sm">
                Você recebe um assistente pronto para uso, personalizado para
                suas regras de negócio. Sua equipe usa desde o primeiro dia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Soluções - Enterprise / Consultoria */}
      <section id="solucoes" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Soluções sob medida para sua empresa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Cada empresa é única. Por isso, criamos projetos personalizados
              com implantação acompanhada e suporte dedicado.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-background border-2 border-primary rounded-2xl p-10 space-y-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                  Consultoria Personalizada
                </span>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                  Enterprise
                  <Shield className="h-5 w-5 text-blue-500" />
                </h3>
                <p className="text-muted-foreground">
                  Projetos personalizados com implantação acompanhada
                  e suporte dedicado para sua organização.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Diagnóstico completo dos seus processos</span>
                </li>
                <li className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Assistentes especializados para seu negócio</span>
                </li>
                <li className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Instalação privada no seu ambiente</span>
                </li>
                <li className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Conexão com seus sistemas (ERP, CRM, bases de dados)</span>
                </li>
                <li className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Treinamento da equipe incluso</span>
                </li>
                <li className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Suporte dedicado e acompanhamento contínuo</span>
                </li>
                <li className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>SLA garantido</span>
                </li>
              </ul>
              <Button size="lg" className="w-full" asChild>
                <a
                  href="https://wa.me/5541992413811?text=Olá! Gostaria de agendar um diagnóstico de IA para minha empresa."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Agendar Diagnóstico Gratuito
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Sem compromisso. Entendemos sua operação antes de qualquer proposta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold">
              Pronto para transformar sua operação?
            </h2>
            <p className="text-muted-foreground">
              Agende um diagnóstico gratuito e descubra como a inteligência
              artificial pode acelerar os resultados da sua empresa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a
                  href="https://wa.me/5541992413811?text=Olá! Gostaria de agendar um diagnóstico de IA para minha empresa."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Falar pelo WhatsApp
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:ai@pine.net.br">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar e-mail
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Logo e descrição */}
            <div className="space-y-4">
              <Logo size="md" />
              <p className="text-sm text-muted-foreground">
                Toda a inteligência do seu negócio em um só lugar.
              </p>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h4 className="font-semibold">Contato</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <a
                    href="mailto:ai@pine.net.br"
                    className="hover:text-foreground transition-colors inline-flex items-center gap-2"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    ai@pine.net.br
                  </a>
                </p>
                <p>
                  <a
                    href="https://wa.me/5541992413811"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors inline-flex items-center gap-2"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                </p>
                <p>Av. Sete de Setembro, 6556</p>
                <p>Curitiba/PR</p>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Política de Privacidade
                  </Link>
                </p>
                <p>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Termos de Uso
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <span>&copy; 2025 Pine Software. Todos os direitos reservados.</span>
            <span>CNPJ: 37.100.281/0001-64</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
