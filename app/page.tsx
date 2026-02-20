import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-black">
      {/* Header */}
      <header className="border-b border-black/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <a
            href="https://wa.me/5541992413811?text=Olá! Gostaria de conversar sobre soluções de IA para minha empresa."
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold uppercase tracking-widest hover:opacity-60 transition-opacity"
          >
            Vamos Conversar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="py-28 md:py-40">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight leading-tight">
              Tecnologia para quem tem mais o que fazer.
            </h1>
            <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto leading-relaxed">
              Arquitetamos sistemas de IA que absorvem o operacional e devolvem o
              seu tempo estratégico. Simples, elegante e invisível.
            </p>
            <div>
              <a
                href="https://wa.me/5541992413811?text=Olá! Gostaria de conversar sobre soluções de IA para minha empresa."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-black text-white text-sm font-semibold uppercase tracking-widest px-8 py-4 hover:opacity-80 transition-opacity"
              >
                Vamos Conversar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto — O Santo Precisa Bater */}
      <section className="py-28 md:py-40 border-t border-black/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
              O santo precisa bater.
            </h2>
            <div className="space-y-6 text-lg text-black/60 leading-relaxed">
              <p>
                A PINE não é para todo mundo. E tudo bem.
              </p>
              <p>
                Não trabalhamos com quem quer &quot;testar uma IA rapidinho&quot; ou
                precisa ser convencido de que o mundo mudou. Trabalhamos com
                quem já entendeu que a inteligência artificial não é tendência —
                é infraestrutura. E que está pronto para usá-la com a seriedade
                que ela merece.
              </p>
              <p>
                Nossos clientes são donos de empresa, diretores e gestores que
                valorizam precisão, discrição e resultado. Pessoas que não
                precisam de promessas mirabolantes — precisam de execução
                silenciosa e elegante.
              </p>
              <p>
                Se esse é o seu caso, vamos conversar. Se não, sem ressentimentos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* A Nova Realidade — O Trabalho Mudou */}
      <section className="py-28 md:py-40 border-t border-black/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
              O trabalho mudou.
            </h2>
            <div className="space-y-6 text-lg text-black/60 leading-relaxed">
              <p>
                A IA não é mais uma promessa. É a infraestrutura invisível que
                já sustenta as empresas mais inteligentes do mercado. Ela não
                substitui pessoas — ela redesenha funções. Transforma analistas
                em estrategistas. Operadores em orquestradores.
              </p>
              <p>
                A pergunta não é se a sua empresa vai usar IA. É se você vai
                ser quem define as regras do jogo ou quem corre atrás.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visão — Além do Óbvio */}
      <section className="py-28 md:py-40 border-t border-black/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
              Além do óbvio.
            </h2>
            <div className="space-y-6 text-lg text-black/60 leading-relaxed">
              <p>
                A maioria vê a IA como um chatbot. Nós vemos como uma tela em
                branco. Cada empresa é uma arquitetura única — com seus
                processos, sua linguagem, seus dados. Não existe solução de
                prateleira para quem leva o próprio negócio a sério.
              </p>
              <p>
                A PINE desenha sistemas sob medida. Inteligência que entende o
                seu contexto, fala a sua língua e opera dentro das suas regras.
                Sem barulho. Sem fricção. Sem complicação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* O Jeito PINE */}
      <section className="py-28 md:py-40 border-t border-black/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-16">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
              O jeito PINE.
            </h2>
            <div className="space-y-16">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-widest text-black/30">
                  01 — Consultoria
                </p>
                <p className="text-lg text-black/60 leading-relaxed">
                  Entramos na sua operação antes de tocar em qualquer tecnologia.
                  Mapeamos processos, entendemos gargalos e identificamos onde a
                  IA gera impacto real — não onde parece bonito no slide.
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-widest text-black/30">
                  02 — Implementação
                </p>
                <p className="text-lg text-black/60 leading-relaxed">
                  Desenhamos e construímos a solução sob medida. Agentes
                  inteligentes que conhecem seus dados, falam a língua da sua
                  equipe e operam dentro das suas regras. Tudo integrado, sem
                  fricção.
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-widest text-black/30">
                  03 — Validação
                </p>
                <p className="text-lg text-black/60 leading-relaxed">
                  Acompanhamos os resultados de perto. Ajustamos, refinamos e
                  garantimos que a inteligência entregue funciona no mundo real —
                  não só no ambiente de teste. Só saímos quando o sistema roda
                  sozinho.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-28 md:py-40 border-t border-black/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
              Vamos conversar.
            </h2>
            <div>
              <a
                href="https://wa.me/5541992413811?text=Olá! Gostaria de conversar sobre soluções de IA para minha empresa."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-black text-white text-sm font-semibold uppercase tracking-widest px-8 py-4 hover:opacity-80 transition-opacity"
              >
                Vamos Conversar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 text-sm text-black/40">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <a
                href="mailto:ai@pine.net.br"
                className="hover:text-black transition-colors"
              >
                ai@pine.net.br
              </a>
              <span className="hidden sm:inline">|</span>
              <a
                href="https://instagram.com/pine.ia"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors"
              >
                @pine.ia
              </a>
              <span className="hidden sm:inline">|</span>
              <a
                href="https://linkedin.com/company/pine-ia"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors"
              >
                LinkedIn
              </a>
              <span className="hidden sm:inline">|</span>
              <span>PINE — 2025</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Link href="/privacy" className="hover:text-black transition-colors">
                Privacidade
              </Link>
              <Link href="/terms" className="hover:text-black transition-colors">
                Termos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
