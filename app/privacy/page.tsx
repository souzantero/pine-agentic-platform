import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: Fevereiro de 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Introdução</h2>
            <p>
              A Pine Software (&quot;nós&quot;, &quot;nosso&quot; ou &quot;empresa&quot;), inscrita no CNPJ
              37.100.281/0001-64, com sede na Av. Sete de Setembro, 6556,
              Curitiba/PR, é responsável pelo tratamento dos seus dados pessoais
              conforme descrito nesta Política de Privacidade.
            </p>
            <p>
              Esta política descreve como coletamos, usamos, armazenamos e
              protegemos suas informações quando você utiliza a plataforma Pineai.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Dados que Coletamos</h2>
            <p>Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Dados de cadastro:</strong> nome, e-mail e senha para
                criação e acesso à sua conta.
              </li>
              <li>
                <strong>Dados da organização:</strong> nome e identificador da
                organização que você cria ou participa.
              </li>
              <li>
                <strong>Dados de uso:</strong> conversas com os agentes de IA,
                documentos enviados à base de conhecimento e configurações da
                plataforma.
              </li>
              <li>
                <strong>Dados técnicos:</strong> informações coletadas
                automaticamente pelos servidores durante o acesso à plataforma.
              </li>
              <li>
                <strong>Dados de pagamento:</strong> para planos pagos, os dados
                de pagamento (cartão de crédito, endereço de cobrança) são
                coletados e processados diretamente pelo Stripe, nosso
                processador de pagamentos. A Pine Software NÃO armazena dados
                completos de cartão de crédito em seus servidores.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Como Usamos seus Dados</h2>
            <p>Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer e manter a plataforma Pineai funcionando.</li>
              <li>Processar suas conversas com os agentes de IA.</li>
              <li>Indexar documentos na base de conhecimento da sua organização.</li>
              <li>Enviar comunicações importantes sobre sua conta ou o serviço.</li>
              <li>Melhorar e desenvolver novos recursos da plataforma.</li>
              <li>Garantir a segurança e prevenir fraudes.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos seus dados pessoais. Compartilhamos informações apenas
              nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Provedores de IA:</strong> enviamos o conteúdo das suas
                conversas para os provedores de modelos de linguagem (OpenAI,
                Anthropic, Google, etc.) configurados pela sua organização para
                processamento.
              </li>
              <li>
                <strong>Provedores de infraestrutura:</strong> utilizamos serviços
                de nuvem para hospedar e processar dados.
              </li>
              <li>
                <strong>Processador de pagamentos:</strong> utilizamos o Stripe
                para processar pagamentos de planos pagos. Ao realizar uma
                assinatura, seus dados de pagamento são enviados diretamente ao
                Stripe e estão sujeitos à{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Política de Privacidade do Stripe
                </a>
                .
              </li>
              <li>
                <strong>Obrigações legais:</strong> quando exigido por lei ou
                ordem judicial.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros. Utilizamos
              criptografia em trânsito (HTTPS/TLS) para proteger a comunicação
              entre seu navegador e nossos servidores. Implementamos medidas
              técnicas e organizacionais para proteger suas informações contra
              acesso não autorizado, perda ou destruição.
            </p>
            <p>
              Documentos enviados à base de conhecimento são armazenados no
              provedor de storage configurado pela sua organização (ex: Amazon S3).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Seus Direitos</h2>
            <p>
              Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar a exclusão dos seus dados.</li>
              <li>Revogar consentimento a qualquer momento.</li>
              <li>Solicitar portabilidade dos dados.</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato pelo e-mail{" "}
              <a
                href="mailto:ai@pine.net.br"
                className="text-primary hover:underline"
              >
                ai@pine.net.br
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme
              necessário para fornecer os serviços. Para solicitar a exclusão
              dos seus dados, entre em contato pelo e-mail{" "}
              <a
                href="mailto:ai@pine.net.br"
                className="text-primary hover:underline"
              >
                ai@pine.net.br
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Recomendamos que
              você revise esta página regularmente para se manter informado
              sobre eventuais alterações.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Contato</h2>
            <p>
              Para dúvidas sobre esta política ou sobre o tratamento dos seus
              dados, entre em contato:
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
