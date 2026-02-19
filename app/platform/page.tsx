import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Bot, Shield, Users, Zap, ArrowRight, Database, DatabaseZap, Check, FileText, Settings, Plug, Building, Cloud, Target } from "lucide-react";

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Seus dados, seus sistemas
              <br />
              <span className="text-primary">sua IA</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Automatize tarefas, acelere decisões e potencialize sua equipe com
              agentes de IA personalizados para o seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Começar grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Base Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Database className="h-4 w-4" />
                  Base de Conhecimento
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Seus documentos,
                  <br />
                  respostas inteligentes
                </h2>
                <p className="text-lg text-muted-foreground">
                  Faça upload de PDFs, documentos e arquivos da sua empresa.
                  O agente aprende com seu conteúdo e responde com base nas
                  informações reais do seu negócio.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Upload de documentos em qualquer formato
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Busca semântica com IA de última geração
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Respostas precisas citando suas fontes
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Múltiplas coleções para organizar por projeto ou equipe
                    </span>
                  </li>
                </ul>
              </div>

              <div className="relative">
                <div className="bg-background border rounded-xl p-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Manual de Produtos.pdf</p>
                        <p className="text-sm text-muted-foreground">2.4 MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Políticas Internas.docx</p>
                        <p className="text-sm text-muted-foreground">890 KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">FAQ Atendimento.pdf</p>
                        <p className="text-sm text-muted-foreground">1.1 MB</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium shadow-lg">
                  3 documentos indexados
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SQL Integration Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="bg-muted/50 border rounded-xl p-6 font-mono text-sm">
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-2">
                    <p><span className="text-blue-500">SELECT</span> cliente, valor, status</p>
                    <p><span className="text-blue-500">FROM</span> pedidos</p>
                    <p><span className="text-blue-500">WHERE</span> data &gt;= <span className="text-green-500">&apos;2025-01-01&apos;</span></p>
                    <p><span className="text-blue-500">ORDER BY</span> valor <span className="text-blue-500">DESC</span></p>
                    <p><span className="text-blue-500">LIMIT</span> <span className="text-orange-500">10</span>;</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium shadow-lg">
                  Em breve
                </div>
              </div>

              <div className="space-y-6 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <DatabaseZap className="h-4 w-4" />
                  Integração SQL
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Conecte seus bancos,
                  <br />
                  pergunte em português
                </h2>
                <p className="text-lg text-muted-foreground">
                  Integre PostgreSQL, MySQL e outros bancos de dados.
                  O agente transforma perguntas em queries e retorna
                  insights dos seus dados em tempo real.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Conexão plug and play com principais bancos
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Queries geradas automaticamente pela IA
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Apenas leitura - seus dados sempre seguros
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Relatórios e análises instantâneas via chat
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ERP/CRM Integration Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Plug className="h-4 w-4" />
                  Integrações
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Conecte seu ERP e CRM
                  <br />
                  ao poder da IA
                </h2>
                <p className="text-lg text-muted-foreground">
                  Integre sistemas como SAP, Salesforce, HubSpot, Totvs e outros.
                  O agente acessa dados em tempo real e executa ações diretamente
                  nos seus sistemas de gestão.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Consulta de clientes, pedidos e estoque via chat
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Criação de leads, oportunidades e tickets automaticamente
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Relatórios e dashboards gerados por linguagem natural
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      APIs seguras com controle de permissões granular
                    </span>
                  </li>
                </ul>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background border rounded-xl p-5 flex flex-col items-center gap-3 text-center">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="font-medium">SAP</p>
                  </div>
                  <div className="bg-background border rounded-xl p-5 flex flex-col items-center gap-3 text-center">
                    <div className="h-12 w-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
                      <Cloud className="h-6 w-6 text-sky-600" />
                    </div>
                    <p className="font-medium">Salesforce</p>
                  </div>
                  <div className="bg-background border rounded-xl p-5 flex flex-col items-center gap-3 text-center">
                    <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Target className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="font-medium">HubSpot</p>
                  </div>
                  <div className="bg-background border rounded-xl p-5 flex flex-col items-center gap-3 text-center">
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Building className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="font-medium">Totvs</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium shadow-lg">
                  Em breve
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customization Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Settings className="h-4 w-4" />
                  100% Configurável
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Sua infraestrutura,
                  <br />
                  suas regras
                </h2>
                <p className="text-lg text-muted-foreground">
                  Configure cada aspecto da plataforma para se adaptar ao modelo
                  da sua organização. Escolha provedores, ajuste parâmetros e
                  personalize o comportamento dos agentes.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Provedores de IA: OpenAI, Anthropic, Google, OpenRouter
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Busca na web: Tavily e outros mecanismos
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Storage: Amazon S3 para seus documentos
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Parâmetros de ferramentas e features personalizáveis
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                {/* Provider Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background border rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">OpenAI</p>
                      <p className="text-xs text-muted-foreground">GPT-4, GPT-4o</p>
                    </div>
                  </div>
                  <div className="bg-background border rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Anthropic</p>
                      <p className="text-xs text-muted-foreground">Claude 3.5, 4</p>
                    </div>
                  </div>
                  <div className="bg-background border rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Google</p>
                      <p className="text-xs text-muted-foreground">Gemini Pro</p>
                    </div>
                  </div>
                  <div className="bg-background border rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">OpenRouter</p>
                      <p className="text-xs text-muted-foreground">100+ modelos</p>
                    </div>
                  </div>
                </div>

                {/* Config Preview */}
                <div className="bg-background border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Busca na Web</span>
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">Ativo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage S3</span>
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">Configurado</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Embeddings</span>
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">OpenAI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Tudo que sua equipe precisa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Uma plataforma completa para criar, gerenciar e escalar agentes de IA
              em toda a organização.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Múltiplos Provedores</h3>
              <p className="text-muted-foreground text-sm">
                Conecte OpenAI, Anthropic, Google e outros. Use o melhor modelo
                para cada tarefa.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Multi-tenant</h3>
              <p className="text-muted-foreground text-sm">
                Gerencie múltiplas organizações com controle de acesso granular
                e permissões por função.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Ferramentas Integradas</h3>
              <p className="text-muted-foreground text-sm">
                Busca na web em tempo real, leitura de páginas e análise de
                conteúdo integrados.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Seguro e Privado</h3>
              <p className="text-muted-foreground text-sm">
                Seus dados nunca são usados para treinar modelos.
                Controle total sobre suas informações.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece gratuitamente e faça upgrade quando precisar de mais recursos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-background border rounded-2xl p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="text-muted-foreground mt-2">
                  7 dias para experimentar a plataforma
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$0</span>
                <span className="text-muted-foreground">/7 dias</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>1 membro</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>1 coleção de conhecimento</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>50 conversas</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>200 chamadas de ferramentas/mês</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>100MB de armazenamento</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Arquivos até 10MB</span>
                </li>
              </ul>
              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link href="/auth/signup">Começar grátis</Link>
              </Button>
            </div>

            {/* Team Plan */}
            <div className="bg-background border-2 border-primary rounded-2xl p-8 space-y-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Mais popular
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  Team
                  <Zap className="h-5 w-5 text-yellow-500" />
                </h3>
                <p className="text-muted-foreground mt-2">
                  Para equipes que precisam de mais poder
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$149</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>10 membros</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>10 coleções de conhecimento</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>1.000 conversas/mês</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>5.000 chamadas de ferramentas/mês</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>5GB de armazenamento</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Arquivos até 50MB</span>
                </li>
              </ul>
              <Button size="lg" className="w-full" asChild>
                <Link href="/auth/signup">Começar agora</Link>
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-background border rounded-2xl p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  Enterprise
                  <Shield className="h-5 w-5 text-blue-500" />
                </h3>
                <p className="text-muted-foreground mt-2">
                  Para grandes organizações com necessidades específicas
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Membros ilimitados</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Todos os recursos do Team</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Armazenamento personalizado</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Suporte prioritário</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>SLA garantido</span>
                </li>
              </ul>
              <Button variant="outline" size="lg" className="w-full" asChild>
                <a href="mailto:ai@pine.net.br">Falar com vendas</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground">
              Crie sua conta gratuitamente e comece a usar agentes de IA
              em minutos. Sem cartão de crédito.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Criar conta grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Logo e descrição */}
            <div className="space-y-4">
              <Link href="/">
                <Logo size="md" />
              </Link>
              <p className="text-sm text-muted-foreground">
                Seus dados, seus sistemas, sua IA.
              </p>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h4 className="font-semibold">Contato</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <a
                    href="mailto:ai@pine.net.br"
                    className="hover:text-foreground transition-colors"
                  >
                    ai@pine.net.br
                  </a>
                </p>
                <p>Av. Sete de Setembro, 6556</p>
                <p>Curitiba/PR</p>
              </div>
            </div>

            {/* Links */}
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
