import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { BarChart3, BookOpen, ChevronDown, FileText, GraduationCap, Heart, Home, LayoutDashboard, LogOut, Moon, PanelLeft, Settings, Sun, Users } from "lucide-react";
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
    // Aplicar tema ao documento
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

  // Mostrar skeleton até userData.role estar disponível
  if (loading || !userData?.role) {
    return <DashboardLayoutSkeleton />
  }

  if (!user || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
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
  
  // Recalcular menuItems sempre que userData.role mudar
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
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-md object-cover ring-1 ring-border"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-8 rounded-md object-cover ring-1 ring-border shrink-0"
                      alt="Logo"
                    />
                    <span className="font-semibold tracking-tight truncate">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const hasSubmenu = 'submenu' in item && item.submenu;
                const isActive = location === item.path || (hasSubmenu && item.submenu?.some((sub: any) => location === sub.path));
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
                        className={`h-10 transition-all font-normal`}
                      >
                        <item.icon
                          className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
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
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu?.map((subItem: any) => {
                          const isSubActive = location === subItem.path;
                          return (
                            <SidebarMenuItem key={subItem.path}>
                              <SidebarMenuButton
                                isActive={isSubActive}
                                onClick={() => setLocation(subItem.path)}
                                tooltip={subItem.label}
                                className="h-9 text-sm font-normal"
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

          <SidebarFooter className="p-3 space-y-2">
            {/* Toggle de Tema */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start gap-3 h-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" />
              )}
              <span className="group-data-[collapsible=icon]:hidden">
                {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:justify-center"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </Button>
            
            <div className="flex items-center gap-3 rounded-lg px-1 py-1 w-full group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-9 w-9 border shrink-0">
                <AvatarFallback className="text-xs font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium truncate leading-none">
                  {user?.name || "-"}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1.5">
                  {user?.email || "-"}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
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
