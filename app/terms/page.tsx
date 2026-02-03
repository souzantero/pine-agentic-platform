import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: Fevereiro de 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou usar a plataforma Pineai, operada pela Pine Software
              (CNPJ 37.100.281/0001-64), você concorda com estes Termos de Uso.
              Se não concordar, não utilize o serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Descrição do Serviço</h2>
            <p>
              O Pineai é uma plataforma de agentes de inteligência artificial que
              permite:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criar e gerenciar conversas com agentes de IA.</li>
              <li>Fazer upload de documentos para criação de base de conhecimento.</li>
              <li>Configurar diferentes provedores de IA e ferramentas.</li>
              <li>Gerenciar organizações com múltiplos membros e permissões.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Cadastro e Conta</h2>
            <p>
              Para usar o Pineai, você deve criar uma conta fornecendo
              informações verdadeiras e completas. Você é responsável por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Manter a confidencialidade da sua senha.</li>
              <li>Todas as atividades realizadas na sua conta.</li>
              <li>Notificar imediatamente sobre uso não autorizado.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Uso Aceitável</h2>
            <p>Você concorda em não usar o Pineai para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violar leis ou regulamentos aplicáveis.</li>
              <li>Enviar conteúdo ilegal, difamatório ou que viole direitos de terceiros.</li>
              <li>Tentar acessar sistemas ou dados não autorizados.</li>
              <li>Interferir no funcionamento da plataforma.</li>
              <li>Fazer engenharia reversa ou copiar o software.</li>
              <li>Revender ou sublicenciar o acesso ao serviço.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Conteúdo do Usuário</h2>
            <p>
              Você mantém a propriedade de todo conteúdo que envia ao Pineai
              (documentos, mensagens, etc.). Ao usar o serviço, você nos concede
              licença para processar esse conteúdo conforme necessário para
              fornecer o serviço.
            </p>
            <p>
              Você é responsável por garantir que tem os direitos necessários
              sobre o conteúdo enviado e que ele não viola direitos de terceiros.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Provedores de IA</h2>
            <p>
              O Pineai integra com provedores terceiros de modelos de linguagem
              (OpenAI, Anthropic, Google, etc.). O uso desses serviços está
              sujeito aos termos de cada provedor. Não nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Precisão ou adequação das respostas geradas pelos modelos de IA.</li>
              <li>Indisponibilidade dos provedores terceiros.</li>
              <li>Mudanças nos termos ou preços dos provedores.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Planos e Preços</h2>
            <p>
              O Pineai oferece diferentes planos de assinatura:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Free:</strong> Gratuito por 7 dias, com limites de uso (1 membro,
                1 coleção, 50 conversas, 200 chamadas de ferramentas/mês, 100MB
                de armazenamento). Após o período de teste, é necessário fazer
                upgrade para continuar usando.
              </li>
              <li>
                <strong>Team:</strong> R$149/mês, com limites expandidos (10 membros,
                10 coleções, 1.000 conversas/mês, 5.000 chamadas de ferramentas/mês,
                5GB de armazenamento).
              </li>
              <li>
                <strong>Enterprise:</strong> Preço personalizado, para grandes
                organizações com necessidades específicas.
              </li>
            </ul>
            <p>
              Os limites e preços podem ser alterados mediante aviso prévio de
              30 dias. Usuários ativos serão notificados por e-mail sobre
              qualquer alteração.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Pagamento e Cobrança</h2>
            <p>
              Para planos pagos, as seguintes condições se aplicam:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Ciclo de cobrança:</strong> A cobrança é mensal, realizada
                na data de contratação do plano.
              </li>
              <li>
                <strong>Renovação automática:</strong> Assinaturas são renovadas
                automaticamente a cada mês até o cancelamento.
              </li>
              <li>
                <strong>Processamento de pagamento:</strong> Os pagamentos são
                processados pelo Stripe, um provedor terceiro de pagamentos.
                Ao fornecer dados de pagamento, você concorda com os{" "}
                <a
                  href="https://stripe.com/legal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Termos de Serviço do Stripe
                </a>
                .
              </li>
              <li>
                <strong>Falha no pagamento:</strong> Em caso de falha na cobrança,
                tentaremos novamente nos dias seguintes. Após falhas repetidas,
                o plano pode ser rebaixado para Free.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Cancelamento e Reembolso</h2>
            <p>
              Você pode cancelar sua assinatura a qualquer momento através das
              configurações de billing da plataforma ou entrando em contato
              conosco. Ao cancelar:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Você manterá acesso ao plano pago até o final do período já pago.
              </li>
              <li>
                Após o término do período, sua organização será rebaixada para
                o plano Free.
              </li>
              <li>
                Não oferecemos reembolso proporcional por dias não utilizados,
                exceto em casos excepcionais a nosso critério.
              </li>
            </ul>
            <p>
              Se você exceder os limites do plano Free após o rebaixamento,
              algumas funcionalidades podem ficar indisponíveis até que você
              faça upgrade ou remova o excedente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Disponibilidade</h2>
            <p>
              Nos esforçamos para manter o Pineai disponível, mas não garantimos
              funcionamento ininterrupto. Podemos realizar manutenções programadas
              ou de emergência que afetem temporariamente o acesso.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Limitação de Responsabilidade</h2>
            <p>
              O Pineai é fornecido &quot;como está&quot;. Na máxima extensão permitida
              por lei, não nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Danos indiretos, incidentais ou consequenciais.</li>
              <li>Perda de dados, lucros ou oportunidades de negócio.</li>
              <li>Decisões tomadas com base nas respostas dos agentes de IA.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">12. Propriedade Intelectual</h2>
            <p>
              O Pineai, incluindo software, design, marcas e conteúdo, é
              propriedade da Pine Software e protegido por leis de propriedade
              intelectual. Estes termos não concedem direitos sobre nossa
              propriedade intelectual além do uso do serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">13. Encerramento de Conta</h2>
            <p>
              Para cancelar sua conta, entre em contato pelo e-mail{" "}
              <a
                href="mailto:ai@pine.net.br"
                className="text-primary hover:underline"
              >
                ai@pine.net.br
              </a>
              . Podemos suspender ou encerrar seu acesso por violação destes
              termos, mediante aviso prévio quando possível.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">14. Alterações nos Termos</h2>
            <p>
              Podemos modificar estes termos a qualquer momento. Recomendamos
              que você revise esta página regularmente. O uso continuado da
              plataforma após alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">15. Legislação Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis brasileiras. Qualquer disputa
              será resolvida no foro da comarca de Curitiba/PR.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">16. Contato</h2>
            <p>
              Para dúvidas sobre estes termos, entre em contato:
            </p>
            <ul className="list-none space-y-1">
              <li>
                <strong>E-mail:</strong>{" "}
                <a
                  href="mailto:ai@pine.net.br"
                  className="text-primary hover:underline"
                >
                  ai@pine.net.br
                </a>
              </li>
              <li>
                <strong>Endereço:</strong> Av. Sete de Setembro, 6556 - Curitiba/PR
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
