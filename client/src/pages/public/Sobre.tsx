import { Link } from 'wouter';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BookOpen, 
  Target, 
  BarChart3, 
  Calendar, 
  Users, 
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function Sobre() {
  const { appTitle, appLogo } = useBranding();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={appLogo} alt={appTitle} className="h-10 w-10 rounded-lg" />
            <span className="font-bold text-xl text-emerald-600">{appTitle}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/sobre" className="text-sm font-medium text-emerald-600">Sobre</Link>
            <Link href="/termos" className="text-sm font-medium text-gray-600 hover:text-emerald-600">Termos</Link>
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Sobre a {appTitle}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Somos uma plataforma completa de gestão de estudos, desenvolvida para ajudar estudantes 
            a alcançarem seus objetivos acadêmicos através de organização, métricas e acompanhamento 
            personalizado.
          </p>
        </div>
      </section>

      {/* Nossa Missão */}
      <section className="bg-emerald-50 dark:bg-emerald-900/20 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Nossa Missão
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed mb-8">
              Democratizar o acesso a ferramentas de alta performance para estudantes de todo o Brasil. 
              Acreditamos que com as ferramentas certas, qualquer estudante pode alcançar resultados 
              extraordinários em vestibulares, concursos e provas.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Educação de Qualidade</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ferramentas baseadas em metodologias comprovadas de estudo
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Acessibilidade</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plataforma gratuita para estudantes de todo o Brasil
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Resultados</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Foco em métricas e dados para melhorar seu desempenho
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            O que oferecemos
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Controle de Tempo de Estudo</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Cronômetro integrado para registrar suas horas de estudo por matéria. 
                  Acompanhe quanto tempo você dedica a cada disciplina e identifique 
                  oportunidades de melhoria.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Cronograma de Estudos</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Organize sua rotina de estudos com nosso cronograma inteligente. 
                  Defina horários, metas semanais e acompanhe seu progresso diariamente.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Métricas e Análises</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Visualize seu progresso através de gráficos e estatísticas detalhadas. 
                  Entenda seus pontos fortes e fracos para otimizar seus estudos.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Gestão de Metas</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Defina metas de estudo semanais e mensais. Acompanhe seu progresso 
                  e mantenha-se motivado com visualização clara dos seus objetivos.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Controle de Simulados</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Registre seus simulados, notas por área e acompanhe sua evolução 
                  ao longo do tempo. Compare seu desempenho entre diferentes provas.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Gestão de Redações</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Acompanhe suas notas de redação, tempo médio de escrita e evolução. 
                  Identifique padrões e melhore sua performance na escrita.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Comece a estudar de forma inteligente
          </h2>
          <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de estudantes que já estão usando a {appTitle} para 
            organizar seus estudos e alcançar seus objetivos.
          </p>
          <Link href="/login/aluno">
            <Button size="lg" variant="secondary" className="font-semibold">
              Criar conta gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={appLogo} alt={appTitle} className="h-8 w-8 rounded-lg" />
                <span className="font-bold text-white">{appTitle}</span>
              </div>
              <p className="text-sm">
                Plataforma completa de gestão de estudos para estudantes que buscam 
                alta performance.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/sobre" className="hover:text-white">Sobre</Link></li>
                <li><Link href="/login/aluno" className="hover:text-white">Área do Aluno</Link></li>
                <li><Link href="/login/mentor" className="hover:text-white">Área do Mentor</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-white">Política de Privacidade</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contato" className="hover:text-white">Fale Conosco</Link></li>
                <li><a href="mailto:contato@plataformaorbita.com.br" className="hover:text-white">contato@plataformaorbita.com.br</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} {appTitle}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
