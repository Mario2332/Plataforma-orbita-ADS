import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import AlunoHome from "./pages/aluno/AlunoHome";
import AlunoEstudos from "./pages/aluno/AlunoEstudos";
import AlunoSimulados from "./pages/aluno/AlunoSimulados";
import AlunoMetricas from "./pages/aluno/AlunoMetricas";
import AlunoCronograma from "./pages/aluno/AlunoCronograma";
import AlunoConfiguracoes from "./pages/aluno/AlunoConfiguracoes";
import AlunoDiario from "./pages/aluno/AlunoDiario";
import PainelGeral from "./pages/aluno/conteudos/PainelGeral";
import Matematica from "./pages/aluno/conteudos/Matematica";
import Biologia from "./pages/aluno/conteudos/Biologia";
import Fisica from "./pages/aluno/conteudos/Fisica";
import Quimica from "./pages/aluno/conteudos/Quimica";
import Historia from "./pages/aluno/conteudos/Historia";
import Geografia from "./pages/aluno/conteudos/Geografia";
import Linguagens from "./pages/aluno/conteudos/Linguagens";
import Filosofia from "./pages/aluno/conteudos/Filosofia";
import Sociologia from "./pages/aluno/conteudos/Sociologia";
import MentorHome from "./pages/mentor/MentorHome";
import MentorAlunos from "./pages/mentor/MentorAlunos";
import MentorConfiguracoes from "./pages/mentor/MentorConfiguracoes";
import MentorViewAluno from "./pages/mentor/MentorViewAluno";
import GestorHome from "./pages/gestor/GestorHome";
import GestorMentores from "./pages/gestor/GestorMentores";
import GestorAlunos from "./pages/gestor/GestorAlunos";
import GestorConfiguracoes from "./pages/gestor/GestorConfiguracoes";
import DashboardLayout from "./components/DashboardLayout";
import LoginAluno from "./pages/auth/LoginAluno";
import LoginMentor from "./pages/auth/LoginMentor";
import LoginGestor from "./pages/auth/LoginGestor";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/* Rotas de Login */}
      <Route path="/login/aluno" component={LoginAluno} />
      <Route path="/login/mentor" component={LoginMentor} />
      <Route path="/login/gestor" component={LoginGestor} />
      
      {/* Rotas do Aluno */}
      <Route path="/aluno">
        <DashboardLayout>
          <AlunoHome />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/estudos">
        <DashboardLayout>
          <AlunoEstudos />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/simulados">
        <DashboardLayout>
          <AlunoSimulados />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/metricas">
        <DashboardLayout>
          <AlunoMetricas />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/cronograma">
        <DashboardLayout>
          <AlunoCronograma />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/diario">
        <DashboardLayout>
          <AlunoDiario />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/configuracoes">
        <DashboardLayout>
          <AlunoConfiguracoes />
        </DashboardLayout>
      </Route>
      
      {/* Rotas de Conteúdos do Aluno */}
      <Route path="/aluno/conteudos">
        <DashboardLayout>
          <PainelGeral />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/matematica">
        <DashboardLayout>
          <Matematica />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/biologia">
        <DashboardLayout>
          <Biologia />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/fisica">
        <DashboardLayout>
          <Fisica />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/quimica">
        <DashboardLayout>
          <Quimica />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/historia">
        <DashboardLayout>
          <Historia />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/geografia">
        <DashboardLayout>
          <Geografia />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/linguagens">
        <DashboardLayout>
          <Linguagens />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/filosofia">
        <DashboardLayout>
          <Filosofia />
        </DashboardLayout>
      </Route>
      <Route path="/aluno/conteudos/sociologia">
        <DashboardLayout>
          <Sociologia />
        </DashboardLayout>
      </Route>
      
      {/* Rotas do Mentor */}
      <Route path="/mentor">
        {() => {
          window.location.href = "/mentor/alunos";
          return null;
        }}
      </Route>
      <Route path="/mentor/alunos">
        <DashboardLayout>
          <MentorAlunos />
        </DashboardLayout>
      </Route>
      <Route path="/mentor/alunos/:alunoId">
        <DashboardLayout>
          <MentorViewAluno />
        </DashboardLayout>
      </Route>
      <Route path="/mentor/configuracoes">
        <DashboardLayout>
          <MentorConfiguracoes />
        </DashboardLayout>
      </Route>
      
      {/* Rotas do Gestor */}
      <Route path="/gestor">
        <DashboardLayout>
          <GestorHome />
        </DashboardLayout>
      </Route>
      <Route path="/gestor/mentores">
        <DashboardLayout>
          <GestorMentores />
        </DashboardLayout>
      </Route>
      <Route path="/gestor/alunos">
        <DashboardLayout>
          <GestorAlunos />
        </DashboardLayout>
      </Route>
      <Route path="/gestor/configuracoes">
        <DashboardLayout>
          <GestorConfiguracoes />
        </DashboardLayout>
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
