// Vou criar um arquivo temporário com o novo design para revisar antes de substituir
// Este arquivo contém apenas as alterações de design, mantendo toda a lógica funcional

// ALTERAÇÕES NO DESIGN:

// 1. Header com gradiente e animação
const newHeader = `
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 mb-6 border-2 border-primary/20 animate-slide-up">
  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
  <div className="relative flex justify-between items-center">
    <div>
      <h1 className="text-4xl font-bold flex items-center gap-3">
        <Target className="h-10 w-10 text-primary" />
        Minhas Metas
      </h1>
      <p className="text-muted-foreground mt-2 text-lg">
        Defina e acompanhe seus objetivos de estudo
      </p>
    </div>
    <Button 
      onClick={() => handleOpenDialog()} 
      className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      size="lg"
    >
      <Plus className="h-5 w-5" />
      Nova Meta
    </Button>
  </div>
</div>
`;

// 2. Cards de Resumo com hover effects e gradientes
const newSummaryCards = `
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
  {/* Card Metas Ativas */}
  <Card className="relative overflow-hidden border-2 hover:border-blue-500 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 group">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold flex items-center gap-2">
        <Target className="h-5 w-5 text-blue-500" />
        Metas Ativas
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metasAtivas.length}</div>
      <p className="text-xs text-muted-foreground mt-1">em andamento</p>
    </CardContent>
  </Card>

  {/* Card Metas Concluídas */}
  <Card className="relative overflow-hidden border-2 hover:border-green-500 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 group">
    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        Metas Concluídas
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-green-600 dark:text-green-400">{metasConcluidas.length}</div>
      <p className="text-xs text-muted-foreground mt-1">alcançadas</p>
    </CardContent>
  </Card>

  {/* Card Taxa de Conclusão */}
  <Card className="relative overflow-hidden border-2 hover:border-purple-500 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 group">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-purple-500" />
        Taxa de Conclusão
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{taxaConclusao}%</div>
      <p className="text-xs text-muted-foreground mt-1">de sucesso</p>
    </CardContent>
  </Card>
</div>
`;

// 3. Cards de Metas Ativas com design moderno
const newMetaCard = `
<Card 
  key={meta.id}
  className="relative overflow-hidden border-2 hover:border-primary transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 group animate-slide-up"
  style={{ animationDelay: \`\${index * 0.1}s\` }}
>
  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
  
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <div className={\`p-2 rounded-lg bg-gradient-to-br \${TIPOS_META[meta.tipo].bgGradient}\`}>
          <Icon className={\`h-6 w-6 \${TIPOS_META[meta.tipo].color}\`} />
        </div>
        <div>
          <CardTitle className="text-lg">{meta.nome}</CardTitle>
          <CardDescription className="mt-1">
            {meta.descricao || TIPOS_META[meta.tipo].descricao}
          </CardDescription>
        </div>
      </div>
      {getStatusBadge(meta)}
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Progresso com animação */}
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground font-medium">Progresso</span>
        <span className="font-semibold">
          {textoProgresso}
        </span>
      </div>
      {meta.repetirDiariamente && (
        <p className="text-xs text-muted-foreground">
          Total: {meta.valorAtual} {meta.unidade}
        </p>
      )}
      <div className="relative">
        <Progress 
          value={progresso} 
          className={\`h-3 \${getProgressColor(progresso)} transition-all duration-1000\`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
      <p className="text-xs text-muted-foreground text-right font-semibold">{progresso}%</p>
    </div>

    {/* Informações com badges modernos */}
    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full">
        <Calendar className="h-4 w-4" />
        <span>Até {toDate(meta.dataFim).toLocaleDateString('pt-BR')}</span>
      </div>
      {meta.repetirDiariamente && (
        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
          <Flame className="h-3 w-3 mr-1" />
          Meta diária
        </Badge>
      )}
      {meta.materia && (
        <Badge variant="outline" className="border-primary/50">{meta.materia}</Badge>
      )}
    </div>

    {/* Ações com hover effects */}
    <div className="flex gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenDialog(meta)}
        className="flex-1 hover:bg-primary/10 hover:border-primary transition-all duration-300"
      >
        <Edit className="h-4 w-4 mr-2" />
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleCancelarMeta(meta.id)}
        className="flex-1 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-600 transition-all duration-300"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Cancelar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDeleteMeta(meta.id)}
        className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-300"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </CardContent>
</Card>
`;

// 4. Adicionar gradientes aos tipos de meta
const TIPOS_META_UPDATED = {
  horas: {
    icon: Clock,
    unidade: "horas",
    descricao: "Estudar X horas em um período",
    color: "text-blue-500",
    bgGradient: "from-blue-500/20 to-blue-600/10",
  },
  questoes: {
    icon: FileText,
    unidade: "questões",
    descricao: "Resolver X questões",
    color: "text-green-500",
    bgGradient: "from-green-500/20 to-green-600/10",
  },
  simulados: {
    icon: BarChart3,
    unidade: "simulados",
    descricao: "Fazer X simulados completos",
    color: "text-purple-500",
    bgGradient: "from-purple-500/20 to-purple-600/10",
  },
  topicos: {
    icon: BookOpen,
    unidade: "tópicos",
    descricao: "Concluir X tópicos do cronograma",
    color: "text-orange-500",
    bgGradient: "from-orange-500/20 to-orange-600/10",
  },
  sequencia: {
    icon: Flame,
    unidade: "dias",
    descricao: "Estudar X dias consecutivos",
    color: "text-red-500",
    bgGradient: "from-red-500/20 to-red-600/10",
  },
  desempenho: {
    icon: Trophy,
    unidade: "acertos",
    descricao: "Acertar X questões em simulados",
    color: "text-yellow-500",
    bgGradient: "from-yellow-500/20 to-yellow-600/10",
  },
};

// 5. Adicionar animações CSS (adicionar ao arquivo de estilos global ou inline)
const animations = `
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-slide-up {
  animation: slide-up 0.5s ease-out forwards;
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;

export default "Design patterns documented - ready to apply";
