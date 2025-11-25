import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";

// Lazy load de páginas de autenticação
const LoginAluno = lazy(() => import("./pages/auth/LoginAluno"));
const LoginMentor = lazy(() => import("./pages/auth/LoginMentor"));
const LoginGestor = lazy(() => import("./pages/auth/LoginGestor"));

// Lazy load de páginas do Aluno
const AlunoHome = lazy(() => import("./pages/aluno/AlunoHome"));
const AlunoEstudos = lazy(() => import("./pages/aluno/AlunoEstudos"));
const AlunoSimulados = lazy(() => import("./pages/aluno/AlunoSimulados"));
const AlunoMetricas = lazy(() => import("./pages/aluno/AlunoMetricas"));
const CronogramaWrapper = lazy(() => import("./pages/aluno/CronogramaWrapper"));
const AlunoConfiguracoes = lazy(() => import("./pages/aluno/AlunoConfiguracoes"));
const AlunoDiario = lazy(() => import("./pages/aluno/AlunoDiario"));
const AlunoMetas = lazy(() => import("./pages/aluno/AlunoMetas"));
const PainelGeral = lazy(() => import("./pages/aluno/conteudos/PainelGeral"));
const Matematica = lazy(() => import("./pages/aluno/conteudos/Matematica"));
const Biologia = lazy(() => import("./pages/aluno/conteudos/Biologia"));
const Fisica = lazy(() => import("./pages/aluno/conteudos/Fisica"));
const Quimica = lazy(() => import("./pages/aluno/conteudos/Quimica"));
const Historia = lazy(() => import("./pages/aluno/conteudos/Historia"));
const Geografia = lazy(() => import("./pages/aluno/conteudos/Geografia"));
const Linguagens = lazy(() => import("./pages/aluno/conteudos/Linguagens"));
const Filosofia = lazy(() => import("./pages/aluno/conteudos/Filosofia"));
const Sociologia = lazy(() => import("./pages/aluno/conteudos/Sociologia"));

// Lazy load de páginas do Mentor
const MentorHome = lazy(() => import("./pages/mentor/MentorHome"));
const MentorAlunos = lazy(() => import("./pages/mentor/MentorAlunos"));
const MentorConfiguracoes = lazy(() => import("./pages/mentor/MentorConfiguracoes"));
const MentorViewAluno = lazy(() => import("./pages/mentor/MentorViewAluno"));
const MentorPainelGeral = lazy(() => import("./pages/mentor/conteudos/MentorPainelGeral"));
const MentorMatematica = lazy(() => import("./pages/mentor/conteudos/Matematica"));
const MentorBiologia = lazy(() => import("./pages/mentor/conteudos/Biologia"));
const MentorFisica = lazy(() => import("./pages/mentor/conteudos/Fisica"));
const MentorQuimica = lazy(() => import("./pages/mentor/conteudos/Quimica"));
const MentorHistoria = lazy(() => import("./pages/mentor/conteudos/Historia"));
const MentorGeografia = lazy(() => import("./pages/mentor/conteudos/Geografia"));
const MentorLinguagens = lazy(() => import("./pages/mentor/conteudos/Linguagens"));
const MentorFilosofia = lazy(() => import("./pages/mentor/conteudos/Filosofia"));
const MentorSociologia = lazy(() => import("./pages/mentor/conteudos/Sociologia"));

// Lazy load de páginas do Gestor
const GestorHome = lazy(() => import("./pages/gestor/GestorHome"));
const GestorMentores = lazy(() => import("./pages/gestor/GestorMentores"));
const GestorAlunos = lazy(() => import("./pages/gestor/GestorAlunos"));
const GestorConfiguracoes = lazy(() => import("./pages/gestor/GestorConfiguracoes"));

// Componente de loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/* Rotas de Login */}
      <Route path="/login/aluno">
        <Suspense fallback={<PageLoader />}>
          <LoginAluno />
        </Suspense>
      </Route>
      <Route path="/login/mentor">
        <Suspense fallback={<PageLoader />}>
          <LoginMentor />
        </Suspense>
      </Route>
      <Route path="/login/gestor">
        <Suspense fallback={<PageLoader />}>
          <LoginGestor />
        </Suspense>
      </Route>
      
      {/* Rotas do Aluno */}
      <Route path="/aluno">
        {() => {
          console.log('[App] Rota /aluno renderizando');
          return (
            <DashboardLayout>
              <Suspense fallback={<PageLoader />}>
                <AlunoHome />
              </Suspense>
            </DashboardLayout>
          );
        }}
      </Route>
      <Route path="/aluno/estudos">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AlunoEstudos />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/simulados">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AlunoSimulados />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/metricas">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AlunoMetricas />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/cronograma">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <CronogramaWrapper />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/configuracoes">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AlunoConfiguracoes />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/diario">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AlunoDiario />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/metas">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AlunoMetas />
          </Suspense>
        </DashboardLayout>
      </Route>
      
      {/* Rotas de Conteúdos do Aluno */}
      <Route path="/aluno/conteudos">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <PainelGeral />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/matematica">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Matematica />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/biologia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Biologia />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/fisica">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Fisica />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/quimica">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Quimica />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/historia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Historia />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/geografia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Geografia />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/linguagens">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Linguagens />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/filosofia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Filosofia />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/sociologia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Sociologia />
          </Suspense>
        </DashboardLayout>
      </Route>
      
      {/* Rotas do Mentor */}
      <Route path="/mentor">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorHome />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/alunos">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorAlunos />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/alunos/:alunoId">
        {(params) => (
          <DashboardLayout>
            <Suspense fallback={<PageLoader />}>
              <MentorViewAluno alunoId={params.alunoId} />
            </Suspense>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/mentor/configuracoes">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorConfiguracoes />
          </Suspense>
        </DashboardLayout>
      </Route>
      
      {/* Rotas de Conteúdos do Mentor */}
      <Route path="/mentor/conteudos">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorPainelGeral />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/conteudos/matematica">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorMatematica />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/conteudos/biologia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorBiologia />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/conteudos/fisica">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorFisica />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/conteudos/quimica">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorQuimica />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/conteudos/historia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorHistoria />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/conteudos/geografia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorGeografia />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/conteudos/linguagens">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorLinguagens />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/conteudos/filosofia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorFilosofia />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/mentor/conteudos/sociologia">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <MentorSociologia />
          </Suspense>
        </DashboardLayout>
      </Route>
      
      {/* Rotas do Gestor */}
      <Route path="/gestor">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <GestorHome />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/gestor/mentores">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <GestorMentores />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/gestor/alunos">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <GestorAlunos />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/gestor/configuracoes">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <GestorConfiguracoes />
          </Suspense>
        </DashboardLayout>
      </Route>
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
