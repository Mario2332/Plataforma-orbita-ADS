import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useTenant } from "@/contexts/TenantContext";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, BookOpen, ChevronDown, FileText, GraduationCap, Heart, Home, LayoutDashboard, LogOut, Moon, PanelLeft, PenTool, Settings, Sun, Users, Sparkles, Target, MessageSquare, Palette, Building2 } from "lucide-react";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import Notificacoes from './Notificacoes';

import { TenantFeatures } from "@/types/tenant";

type FeatureKey = keyof TenantFeatures;

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  feature?: FeatureKey; // Feature requerida para mostrar este item
  submenu?: { label: string; path: string }[];
  subItems?: { label: string; path: string }[];
}

const getMenuItems = (role?: string, features?: TenantFeatures): MenuItem[] => {
  if (!role) return [];
  
  const filterByFeature = (items: MenuItem[]): MenuItem[] => {
    if (!features) return items; // Se não tem features, mostra tudo
    return items.filter(item => {
      if (!item.feature) return true; // Sem feature requerida, sempre mostra
      return features[item.feature] === true;
    });
  };
  
  switch (role) {
    case "aluno":
      return filterByFeature([
        { icon: Home, label: "Início", path: "/aluno" },
        { icon: BookOpen, label: "Estudos", path: "/aluno/estudos", feature: "estudos" },
        { icon: LayoutDashboard, label: "Cronograma", path: "/aluno/cronograma", feature: "cronograma" },
        { icon: BarChart3, label: "Métricas", path: "/aluno/metricas", feature: "metricas" },
        { icon: Target, label: "Metas", path: "/aluno/metas", feature: "metas" },
        { icon: FileText, label: "Simulados", path: "/aluno/simulados", feature: "simulados" },
        { icon: PenTool, label: "Redações", path: "/aluno/redacoes", feature: "redacoes" },
        { icon: Heart, label: "Diário de Bordo", path: "/aluno/diario", feature: "diarioBordo" },
        { 
          icon: GraduationCap, 
          label: "Conteúdos", 
          path: "/aluno/conteudos",
          submenu: [
            { label: "Painel Geral", path: "/aluno/conteudos" },
            { label: "Matemática", path: "/aluno/conteudos/matematica" },
            { label: "Biologia", path: "/aluno/conteudos/biologia" },
            { label: "Física", path: "/aluno/conteudos/fisica" },
            { label: "Química", path: "/aluno/conteudos/quimica" },
            { label: "História", path: "/aluno/conteudos/historia" },
            { label: "Geografia", path: "/aluno/conteudos/geografia" },
            { label: "Linguagens", path: "/aluno/conteudos/linguagens" },
            { label: "Filosofia", path: "/aluno/conteudos/filosofia" },
            { label: "Sociologia", path: "/aluno/conteudos/sociologia" },
          ]
        },
        { icon: Settings, label: "Configurações", path: "/aluno/configuracoes" },
      ]);
    case "mentor":
      return [
        { icon: Users, label: "Alunos", path: "/mentor/alunos" },
        { 
          icon: BookOpen, 
          label: "Conteúdos", 
          path: "/mentor/conteudos",
          subItems: [
            { label: "Painel Geral", path: "/mentor/conteudos" },
            { label: "Matemática", path: "/mentor/conteudos/matematica" },
            { label: "Biologia", path: "/mentor/conteudos/biologia" },
            { label: "Física", path: "/mentor/conteudos/fisica" },
            { label: "Química", path: "/mentor/conteudos/quimica" },
            { label: "História", path: "/mentor/conteudos/historia" },
            { label: "Geografia", path: "/mentor/conteudos/geografia" },
            { label: "Linguagens", path: "/mentor/conteudos/linguagens" },
            { label: "Filosofia", path: "/mentor/conteudos/filosofia" },
            { label: "Sociologia", path: "/mentor/conteudos/sociologia" },
          ]
        },
        { icon: Settings, label: "Configurações", path: "/mentor/configuracoes" },
      ];
    case "gestor":
      return [
        { icon: Home, label: "Início", path: "/gestor" },
        { icon: Users, label: "Mentores", path: "/gestor/mentores" },
        { icon: GraduationCap, label: "Alunos", path: "/gestor/alunos" },
        { icon: MessageSquare, label: "Mensagens", path: "/gestor/mensagens" },
        { icon: Building2, label: "Clientes", path: "/gestor/clientes" },
        { icon: Palette, label: "Personalização", path: "/gestor/branding" },
        { icon: Settings, label: "Configurações", path: "/gestor/configuracoes" },
      ];
    default:
      return [];
  }
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved || "light";
  });
  const { loading, user, userData } = useAuthContext();
  const { tenant, isFreePlan } = useTenant();
  
  // Usar branding do tenant ou fallback para constantes
  const logoUrl = tenant?.branding?.logo || APP_LOGO;
  const appTitle = tenant?.branding?.nomeExibicao || APP_TITLE;
  
  console.log('[DashboardLayout] Estado atual:', {
    loading,
    hasUser: !!user,
    hasUserData: !!userData,
    role: userData?.role,
    willShowSkeleton: loading || !userData?.role
  });
  
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  // Lógica de Redirecionamento:
  // 1. Se não estiver logado E NÃO for o plano Free, redireciona para o login.
  // 2. Se for o plano Free, permite o acesso para visualização (o bloqueio de escrita será feito nos componentes).
  // 3. Se estiver logado, prossegue.
  const shouldRedirectToLogin = !user && !isFreePlan;

  if (shouldRedirectToLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500 rounded-lg blur-none opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative">
                <img
                  src={logoUrl}
                  alt={appTitle}
                  className="h-24 w-24 rounded-lg object-cover shadow-sm border-4 border-white dark:border-gray-800"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white bg-clip-text text-transparent">{appTitle}</h1>
              <p className="text-sm font-semibold text-muted-foreground">
                Faça login para continuar
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              navigate(getLoginUrl(userData?.role));
            }}
            className="w-full"
          >
            Fazer Login
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              navigate("/cadastro");
            }}
            className="w-full"
          >
            Criar Conta
          </Button>
        </div>
      </div>
    );
  }

  // Se estiver logado, mas sem dados de usuário (role), mostra o skeleton ou redireciona para o onboarding/configuração
  if (user && !userData?.role) {
    return <DashboardLayoutSkeleton />
  }

  // Se não estiver logado E for Free Plan, o userData será null, então o role também.
  // Para o Free Plan, precisamos de um role default para que o menu seja renderizado.
  const userRole = userData?.role || (isFreePlan ? 'aluno' : undefined);

  if (!userRole) {
    // Caso de fallback, não deve acontecer se a lógica acima estiver correta
    return <DashboardLayoutSkeleton />
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent 
        setSidebarWidth={setSidebarWidth}
        theme={theme}
        toggleTheme={toggleTheme}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  theme: string;
  toggleTheme: () => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  theme,
  toggleTheme,
}: DashboardLayoutContentProps) {
  const { user, userData, signOut } = useAuthContext();
  const { tenant } = useTenant();
  
  // Usar branding do tenant ou fallback para constantes
  const logoUrl = tenant?.branding?.logo || APP_LOGO;
  const appTitle = tenant?.branding?.nomeExibicao || APP_TITLE;
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const menuItems = useMemo(() => {
    const items = getMenuItems(userData?.role, tenant?.features);
    console.log('[DashboardLayoutContent] menuItems recalculado:', {
      role: userData?.role,
      itemCount: items.length,
      items: items.map(i => i.label)
    });
    return items;
  }, [userData?.role, tenant?.features]);
  
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-2 border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-b from-white via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-emerald-950/10 dark:to-teal-950/10"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b-2 border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-10 w-10 shrink-0 group">
                  <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <img
                    src={logoUrl}
                    className="relative h-10 w-10 rounded-xl object-contain ring-2 ring-emerald-200 dark:ring-emerald-800 shadow"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-emerald-500/90 backdrop-blur-sm rounded-xl ring-2 ring-emerald-200 dark:ring-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-5 w-5 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-md opacity-50"></div>
                      <img
                        src={logoUrl}
                        className="relative h-10 w-10 rounded-xl object-contain ring-2 ring-emerald-200 dark:ring-emerald-800 shrink-0 shadow"
                        alt="Logo"
                      />
                    </div>
                    <span className="font-semibold text-lg tracking-tight truncate text-emerald-600 dark:text-emerald-400">
                      {appTitle}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-9 w-9 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 shadow-sm"
                  >
                    <PanelLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const hasSubmenu = ('submenu' in item && item.submenu) || ('subItems' in item && item.subItems);
                const submenuItems = (item as any).submenu || (item as any).subItems;
                const isActive = location === item.path || (hasSubmenu && submenuItems?.some((sub: any) => location === sub.path));
                const isExpanded = expandedMenus[item.path] || false;
                
                return (
                  <div key={item.path}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => {
                          if (hasSubmenu) {
                            setExpandedMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }));
                          } else {
                            setLocation(item.path);
                          }
                        }}
                        tooltip={item.label}
                        className={"h-11 transition-all font-semibold rounded-xl mb-1 " + (isActive ? "bg-emerald-500 text-white shadow hover:from-emerald-600 hover:to-teal-600" : "hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:shadow-md")}
                      >
                        <item.icon
                          className={"h-5 w-5 " + (isActive ? "text-white" : "text-emerald-600 dark:text-emerald-400")}
                        />
                        <span>{item.label}</span>
                        {hasSubmenu && (
                            <ChevronDown
                              className={"ml-auto h-4 w-4 transition-transform " + (isExpanded ? "rotate-180" : "")}
                            />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {hasSubmenu && isExpanded && (
                      <div className="ml-6 mt-1 space-y-1 mb-2">
                        {submenuItems?.map((subItem: any) => {
                          const isSubActive = location === subItem.path;
                          return (
                            <SidebarMenuItem key={subItem.path}>
                              <SidebarMenuButton
                                isActive={isSubActive}
                                onClick={() => setLocation(subItem.path)}
                                tooltip={subItem.label}                                  className={"h-10 text-sm font-semibold rounded-lg " + (isSubActive ? "bg-emerald-400 text-white shadow-md" : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20")}
                              >
                                <span>{subItem.label}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2 border-t-2 border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
            {userData?.role === 'aluno' && !isMobile && (
              <div className="flex justify-center group-data-[collapsible=icon]:justify-center">
                <Notificacoes />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start gap-3 h-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl font-semibold transition-all hover:shadow-md"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Moon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="group-data-[collapsible=icon]:hidden">
                {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start gap-3 h-10 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 group-data-[collapsible=icon]:justify-center rounded-xl font-semibold transition-all hover:shadow-md"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </Button>
            
            {/* 🎄 Card de usuário com tema natalino */}
            <div className="flex items-center gap-3 rounded-xl px-2 py-2 w-full group-data-[collapsible=icon]:justify-center bg-gradient-to-r from-red-50 to-green-50 dark:from-red-950/20 dark:to-green-950/20 border border-gray-200 dark:border-gray-700 dark:border-red-800 shadow-sm">
              <div className="relative shrink-0">
                {/* 🎅 Gorro de Papai Noel - centralizado com a foto */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 animate-santa-hat" style={{ transform: 'translateX(-50%) rotate(-12deg)' }}>
                  <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Gorro vermelho */}
                    <path d="M4 20C4 20 6 8 14 6C22 8 24 20 24 20" fill="#DC2626" />
                    {/* Ponta do gorro */}
                    <path d="M14 6C14 6 16 2 20 2" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
                    {/* Pompom */}
                    <circle cx="21" cy="2" r="3" fill="white" />
                    {/* Borda de pelo branco */}
                    <path d="M2 20C2 20 4 18 14 18C24 18 26 20 26 20" stroke="white" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>
                <Avatar className="relative h-11 w-11 border-2 border-white dark:border-gray-800 shadow">
                  {userData?.photoURL && (
                    <AvatarImage src={userData.photoURL} alt={userData?.name || "Foto de perfil"} />
                  )}
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-red-500 to-green-500 text-white">
                    {userData?.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-bold truncate leading-none text-red-900 dark:text-red-100">
                  {userData?.name?.split(' ')[0] || "Aluno"}
                </p>
                {(userData?.curso || userData?.faculdade) && (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 truncate mt-0.5">
                    {userData?.curso && userData?.faculdade 
                      ? userData.curso + ' - ' + userData.faculdade
                      : userData?.curso || userData?.faculdade}
                  </p>
                )}
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 truncate mt-0.5">
                  {userData?.email || ""}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={"absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-emerald-500/50 transition-colors " + (isCollapsed ? "hidden" : "")}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b-2 border-emerald-100 dark:border-emerald-900/30 h-16 items-center justify-between bg-gradient-to-r from-white via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-emerald-950/10 dark:to-teal-950/10 backdrop-blur supports-[backdrop-filter]:backdrop-blur px-3 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 shadow-sm" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight font-bold text-emerald-900 dark:text-emerald-100">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
            {userData?.role === 'aluno' && (
              <div className="flex items-center gap-2">
                <Notificacoes />
              </div>
            )}
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
