import { Link } from 'wouter';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';

export default function Privacidade() {
  const { appTitle, appLogo } = useBranding();
  const dataAtualizacao = '24 de dezembro de 2024';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={appLogo} alt={appTitle} className="h-10 w-10 rounded-lg" />
            <span className="font-bold text-xl text-emerald-600">{appTitle}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/sobre" className="text-sm font-medium text-gray-600 hover:text-emerald-600">Sobre</Link>
            <Link href="/termos" className="text-sm font-medium text-gray-600 hover:text-emerald-600">Termos</Link>
            <Link href="/privacidade" className="text-sm font-medium text-emerald-600">Privacidade</Link>
            <Link href="/contato" className="text-sm font-medium text-gray-600 hover:text-emerald-600">Contato</Link>
          </nav>
          <Link href="/login/aluno">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Política de Privacidade
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Última atualização: {dataAtualizacao}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Introdução
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A {appTitle} está comprometida em proteger sua privacidade. Esta Política de 
                Privacidade explica como coletamos, usamos, divulgamos e protegemos suas 
                informações pessoais quando você usa nossa plataforma.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Ao usar nossos serviços, você concorda com a coleta e uso de informações de 
                acordo com esta política. Esta política está em conformidade com a Lei Geral 
                de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Informações que Coletamos
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Coletamos os seguintes tipos de informações:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                2.1 Informações de Cadastro
              </h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Foto de perfil (opcional)</li>
                <li>Informações de autenticação</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                2.2 Dados de Uso da Plataforma
              </h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Tempo de estudo por matéria</li>
                <li>Metas e objetivos definidos</li>
                <li>Notas de simulados e redações</li>
                <li>Cronogramas e planejamentos</li>
                <li>Anotações e diário de bordo</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                2.3 Dados Técnicos
              </h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Endereço IP</li>
                <li>Tipo de navegador e dispositivo</li>
                <li>Sistema operacional</li>
                <li>Páginas visitadas e tempo de permanência</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Como Usamos suas Informações
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Fornecer e manter nossos serviços</li>
                <li>Personalizar sua experiência na plataforma</li>
                <li>Gerar métricas e análises de desempenho</li>
                <li>Enviar comunicações importantes sobre o serviço</li>
                <li>Melhorar nossos produtos e serviços</li>
                <li>Detectar e prevenir fraudes</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Publicidade e Cookies
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A versão gratuita da {appTitle} exibe anúncios de terceiros, incluindo o 
                Google AdSense. Esses serviços podem usar cookies para:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>Exibir anúncios personalizados com base em seus interesses</li>
                <li>Medir a eficácia das campanhas publicitárias</li>
                <li>Limitar o número de vezes que você vê um anúncio</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300">
                Você pode gerenciar suas preferências de cookies através das configurações 
                do seu navegador ou visitando{' '}
                <a 
                  href="https://www.google.com/settings/ads" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  Configurações de Anúncios do Google
                </a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Compartilhamento de Informações
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar dados com:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>Mentores:</strong> Se você estiver vinculado a um mentor, ele terá acesso aos seus dados de estudo</li>
                <li><strong>Instituições:</strong> Se sua conta for gerenciada por uma escola ou cursinho</li>
                <li><strong>Prestadores de serviço:</strong> Empresas que nos ajudam a operar a plataforma (hospedagem, análise)</li>
                <li><strong>Parceiros de publicidade:</strong> Dados anonimizados para exibição de anúncios</li>
                <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Segurança dos Dados
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Implementamos medidas de segurança técnicas e organizacionais para proteger 
                suas informações, incluindo:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                <li>Armazenamento seguro em servidores protegidos</li>
                <li>Controle de acesso restrito aos dados</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Seus Direitos (LGPD)
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                De acordo com a LGPD, você tem direito a:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>Confirmação:</strong> Saber se tratamos seus dados pessoais</li>
                <li><strong>Acesso:</strong> Obter cópia dos seus dados pessoais</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos ou desatualizados</li>
                <li><strong>Anonimização:</strong> Solicitar anonimização de dados desnecessários</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Eliminação:</strong> Solicitar exclusão dos seus dados</li>
                <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                Para exercer esses direitos, entre em contato através da nossa{' '}
                <Link href="/contato" className="text-emerald-600 hover:underline">
                  página de contato
                </Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Retenção de Dados
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Mantemos seus dados pessoais enquanto sua conta estiver ativa ou conforme 
                necessário para fornecer nossos serviços. Após o encerramento da conta:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Dados de uso são excluídos em até 30 dias</li>
                <li>Dados de faturamento são mantidos por 5 anos (obrigação legal)</li>
                <li>Backups são eliminados em até 90 dias</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Menores de Idade
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Nossa plataforma é destinada a estudantes de todas as idades. Para menores 
                de 18 anos, recomendamos que o cadastro seja feito com conhecimento e 
                supervisão dos pais ou responsáveis legais. Não coletamos intencionalmente 
                dados de menores de 13 anos sem consentimento dos responsáveis.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Alterações nesta Política
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
                sobre alterações significativas por e-mail ou através de aviso na plataforma. 
                Recomendamos revisar esta página regularmente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Contato
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Se você tiver dúvidas sobre esta Política de Privacidade ou quiser exercer 
                seus direitos, entre em contato:
              </p>
              <ul className="list-none text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>E-mail:</strong> privacidade@plataformaorbita.com.br</li>
                <li><strong>Página de contato:</strong>{' '}
                  <Link href="/contato" className="text-emerald-600 hover:underline">
                    Fale Conosco
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} {appTitle}. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/sobre" className="hover:text-emerald-600">Sobre</Link>
            <Link href="/termos" className="hover:text-emerald-600">Termos</Link>
            <Link href="/privacidade" className="hover:text-emerald-600">Privacidade</Link>
            <Link href="/contato" className="hover:text-emerald-600">Contato</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
