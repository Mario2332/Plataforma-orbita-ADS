import { Link } from 'wouter';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';

export default function Termos() {
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
            <Link href="/termos" className="text-sm font-medium text-emerald-600">Termos</Link>
            <Link href="/privacidade" className="text-sm font-medium text-gray-600 hover:text-emerald-600">Privacidade</Link>
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
            Termos de Uso
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Última atualização: {dataAtualizacao}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Aceitação dos Termos
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Ao acessar e usar a {appTitle}, você concorda em cumprir e estar vinculado a estes 
                Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá 
                acessar ou usar nossos serviços.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Estes termos se aplicam a todos os visitantes, usuários e outras pessoas que 
                acessam ou usam a plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Descrição do Serviço
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A {appTitle} é uma plataforma de gestão de estudos que oferece:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Controle de tempo de estudo por matéria</li>
                <li>Cronograma de estudos personalizado</li>
                <li>Métricas e análises de desempenho</li>
                <li>Gestão de metas e objetivos</li>
                <li>Registro de simulados e redações</li>
                <li>Diário de bordo para acompanhamento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Cadastro e Conta
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Para utilizar a plataforma, você deve criar uma conta fornecendo informações 
                precisas e completas. Você é responsável por:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Manter a confidencialidade de sua senha</li>
                <li>Todas as atividades que ocorrem em sua conta</li>
                <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
                <li>Manter suas informações de cadastro atualizadas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Uso Aceitável
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Ao usar nossa plataforma, você concorda em não:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Violar qualquer lei ou regulamento aplicável</li>
                <li>Compartilhar sua conta com terceiros</li>
                <li>Tentar acessar áreas restritas da plataforma</li>
                <li>Usar a plataforma para fins comerciais não autorizados</li>
                <li>Transmitir vírus ou código malicioso</li>
                <li>Interferir no funcionamento normal da plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Propriedade Intelectual
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, ícones, 
                imagens e software, é propriedade da {appTitle} ou de seus licenciadores e 
                está protegido por leis de direitos autorais.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Você não pode reproduzir, distribuir, modificar ou criar trabalhos derivados 
                sem autorização prévia por escrito.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Conteúdo do Usuário
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Você mantém a propriedade de todo o conteúdo que você cria na plataforma 
                (dados de estudo, metas, anotações, etc.). Ao usar nossos serviços, você nos 
                concede uma licença limitada para armazenar e processar esse conteúdo 
                exclusivamente para fornecer o serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Planos e Pagamentos
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A {appTitle} oferece planos gratuitos e pagos. Para planos pagos:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Os preços são informados antes da contratação</li>
                <li>A cobrança é feita conforme o ciclo escolhido (mensal/anual)</li>
                <li>Você pode cancelar a qualquer momento</li>
                <li>Não há reembolso proporcional em caso de cancelamento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Publicidade
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A versão gratuita da plataforma pode exibir anúncios de terceiros. Esses 
                anúncios são fornecidos por parceiros de publicidade e podem usar cookies 
                para personalização. Ao usar a versão gratuita, você concorda com a exibição 
                desses anúncios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Limitação de Responsabilidade
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A {appTitle} é fornecida "como está" e "conforme disponível". Não garantimos 
                que o serviço será ininterrupto, seguro ou livre de erros. Em nenhuma 
                circunstância seremos responsáveis por danos indiretos, incidentais ou 
                consequenciais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Modificações dos Termos
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                Alterações significativas serão notificadas por e-mail ou através da 
                plataforma. O uso continuado após as alterações constitui aceitação dos 
                novos termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Encerramento
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, 
                por qualquer motivo, incluindo violação destes termos. Você pode encerrar 
                sua conta a qualquer momento através das configurações da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                12. Lei Aplicável
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Estes termos são regidos pelas leis da República Federativa do Brasil. 
                Qualquer disputa será resolvida nos tribunais competentes do Brasil.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                13. Contato
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco 
                através da nossa <Link href="/contato" className="text-emerald-600 hover:underline">página de contato</Link> ou 
                pelo e-mail: contato@plataformaorbita.com.br
              </p>
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
