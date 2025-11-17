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
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, BookOpen, ChevronDown, FileText, GraduationCap, Heart, Home, LayoutDashboard, LogOut, Moon, PanelLeft, Settings, Sun, Users, Sparkles } from "lucide-react";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const getMenuItems = (role?: string) => {
  if (!role) return [];
  
  switch (role) {
    case "aluno":
      return [
        { icon: Home, label: "Início", path: "/aluno" },
        { icon: BookOpen, label: "Estudos", path: "/aluno/estudos" },
        { icon: LayoutDashboard, label: "Cronograma", path: "/aluno/cronograma" },
        { icon: BarChart3, label: "Métricas", path: "/aluno/metricas" },
        { icon: FileText, label: "Simulados", path: "/aluno/simulados" },
        { icon: Heart, label: "Diário de Bordo", path: "/aluno/diario" },
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
      ];
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

  if (loading || !userData?.role) {
    return <DashboardLayoutSkeleton />
  }

  if (!user || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-24 w-24 rounded-2xl object-cover shadow-2xl border-4 border-white dark:border-gray-800"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{APP_TITLE}</h1>
              <p className="text-sm font-semibold text-muted-foreground">
                Faça login para continuar
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-2xl transition-all font-bold border-0"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
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
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const menuItems = useMemo(() => {
    const items = getMenuItems(userData?.role);
    console.log('[DashboardLayoutContent] menuItems recalculado:', {
      role: userData?.role,
      itemCount: items.length,
      items: items.map(i => i.label)
    });
    return items;
  }, [userData?.role]);
  
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
          className="border-r-2 border-blue-100 dark:border-blue-900/30 bg-gradient-to-b from-white via-blue-50/30 to-cyan-50/30 dark:from-gray-950 dark:via-blue-950/10 dark:to-cyan-950/10"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b-2 border-blue-100 dark:border-blue-900/30 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-10 w-10 shrink-0 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <img
                    src={APP_LOGO}
                    className="relative h-10 w-10 rounded-xl object-contain ring-2 ring-blue-200 dark:ring-blue-800 shadow-lg"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-blue-500/90 backdrop-blur-sm rounded-xl ring-2 ring-blue-200 dark:ring-blue-800 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-5 w-5 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-md opacity-50"></div>
                      <img
                        src={APP_LOGO}
                        className="relative h-10 w-10 rounded-xl object-contain ring-2 ring-blue-200 dark:ring-blue-800 shrink-0 shadow-lg"
                        alt="Logo"
                      />
                    </div>
                    <span className="font-black text-lg tracking-tight truncate bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-9 w-9 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 shadow-sm"
                  >
                    <PanelLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                        className={`h-11 transition-all font-semibold rounded-xl mb-1 ${
                          isActive 
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:from-blue-600 hover:to-cyan-600" 
                            : "hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:shadow-md"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 ${isActive ? "text-white" : "text-blue-600 dark:text-blue-400"}`}
                        />
                        <span>{item.label}</span>
                        {hasSubmenu && (
                          <ChevronDown
                            className={`ml-auto h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
                                tooltip={subItem.label}
                                className={`h-10 text-sm font-semibold rounded-lg ${
                                  isSubActive 
                                    ? "bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-md" 
                                    : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                }`}
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

          <SidebarFooter className="p-3 space-y-2 border-t-2 border-blue-100 dark:border-blue-900/30 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start gap-3 h-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl font-semibold transition-all hover:shadow-md"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              ) : (
                <Moon className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
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
            
            <div className="flex items-center gap-3 rounded-xl px-2 py-2 w-full group-data-[collapsible=icon]:justify-center bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-md opacity-50"></div>
                <Avatar className="relative h-11 w-11 border-2 border-white dark:border-gray-800 shadow-lg">
                  {userData?.photoURL ? (
                    <>
                      {console.log('[DashboardLayout] Renderizando Avatar com photoURL:', userData.photoURL)}
                      <AvatarImage src={userData.photoURL} alt={user?.name || "Foto de perfil"} />
                    </>
                  ) : (
                    console.log('[DashboardLayout] Sem photoURL, mostrando fallback')
                  )}
                  <AvatarFallback className="text-sm font-black bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-bold truncate leading-none text-blue-900 dark:text-blue-100">
                  {user?.name || "-"}
                </p>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate mt-1.5">
                  {user?.email || "-"}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b-2 border-blue-100 dark:border-blue-900/30 h-16 items-center justify-between bg-gradient-to-r from-white via-blue-50/30 to-cyan-50/30 dark:from-gray-950 dark:via-blue-950/10 dark:to-cyan-950/10 backdrop-blur supports-[backdrop-filter]:backdrop-blur px-3 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight font-bold text-blue-900 dark:text-blue-100">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
