import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Calendar as CalendarIcon, Settings, CheckCircle, Clock, ChevronDown, ChevronRight, ChevronLeft, BarChart2, AlertCircle, RefreshCw, Save, Layers, LayoutGrid, List as ListIcon, CheckSquare, Square, Edit3, Repeat, X, Map, RotateCcw, FileText, Zap, CheckCircle2, AlertTriangle, Eye, CheckCheck, PenTool, CalendarOff, Loader2, Check } from 'lucide-react';
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

// --- DADOS DO CRONOGRAMA EXTENSIVO (COMPLETO) ---
const extensiveTopicsSource = [
    { subject: "Matemática", front: "Mat. Básica", name: "Sistemas de numeração e Sistema métrico" },
    { subject: "Matemática", front: "Mat. Básica", name: "As quatro operações e Expressões numéricas" },
    { subject: "Matemática", front: "Mat. Básica", name: "Múltiplos, Divisores, Critérios de divisibilidade, Números primos, MMC e MDC" },
    { subject: "Biologia", front: "Biologia 3", name: "Origem da vida: Abiogênese e biogênese" },
    { subject: "Biologia", front: "Biologia 3", name: "Origem da vida: Evolução química" },
    { subject: "Biologia", front: "Biologia 3", name: "Origem da vida: Hipótese autotrófica e heterotrófica" },
    { subject: "Biologia", front: "Biologia 3", name: "Origem da vida: Teoria da endossimbiose" },
    { subject: "Física", front: "Física 1", name: "Ordem de grandeza e sistemas de unidades" },
    { subject: "Física", front: "Física 2", name: "Temperatura, Calor e Energia térmica" },
    { subject: "História", front: "História Geral", name: "Grécia Antiga" },
    { subject: "Química", front: "Quimica 1", name: "Classificações e propriedades periódicas" },
    { subject: "Química", front: "Quimica 1", name: "Propriedades da matéria" },
    { subject: "Geografia", front: "Geografia 1", name: "Orientação e Coordenadas geográficas" },
    { subject: "Geografia", front: "Geografia 2", name: "Regiões: Norte, Sul, Nordeste, Centro-Oeste, Sudeste" },
    { subject: "Matemática", front: "Mat. Básica", name: "Frações e Dízimas periódicas" },
    { subject: "Matemática", front: "Mat. Básica", name: "Potenciação e notação científica" },
    { subject: "Matemática", front: "Mat. Básica", name: "Radiciação" },
    { subject: "Biologia", front: "Biologia 1", name: "Água e Sais Minerais" },
    { subject: "Biologia", front: "Biologia 1", name: "Carboidratos" },
    { subject: "Biologia", front: "Biologia 1", name: "Lipídios" },
    { subject: "Física", front: "Física 2", name: "Escalas termométricas" },
    { subject: "Física", front: "Física 2", name: "Mudanças de fase e diagramas de fase" },
    { subject: "História", front: "História Geral", name: "Roma Antiga" },
    { subject: "Química", front: "Quimica 1", name: "Modelos atômicos" },
    { subject: "Química", front: "Quimica 1", name: "Distribuição eletrônica" },
    { subject: "Geografia", front: "Geografia 1", name: "Cartografia: Elementos, Escalas e Convenções" },
    { subject: "Geografia", front: "Geografia 2", name: "Diferentes classificações regionais do Brasil" },
    { subject: "Matemática", front: "Mat. Básica", name: "Produtos notáveis e Fatoração" },
    { subject: "Matemática", front: "Mat. Básica", name: "Equações e Sistemas do primeiro grau" },
    { subject: "Matemática", front: "Mat. Básica", name: "Equações do segundo grau" },
    { subject: "Biologia", front: "Biologia 1", name: "Aminoácidos e Proteínas" },
    { subject: "Biologia", front: "Biologia 1", name: "Enzimas" },
    { subject: "Física", front: "Física 2", name: "Calorimetria" },
    { subject: "Física", front: "Física 2", name: "Dilatação térmica" },
    { subject: "História", front: "História Geral", name: "Alta Idade Média: Sistema Feudal e Igreja medieval" },
    { subject: "História", front: "História Geral", name: "Idade Média no Oriente, Civilização muçulmana e Cruzadas" },
    { subject: "Química", front: "Quimica 1", name: "Ligações químicas" },
    { subject: "Química", front: "Quimica 1", name: "Geometria molecular" },
    { subject: "Geografia", front: "Geografia 1", name: "Projeções cartográficas" },
    { subject: "Geografia", front: "Geografia 2", name: "Energias renováveis e não renováveis" },
    { subject: "Matemática", front: "Mat. Básica", name: "Razão e proporção" },
    { subject: "Matemática", front: "Mat. Básica", name: "Regras de 3 e Escalas" },
    { subject: "Matemática", front: "Mat. Básica", name: "Porcentagem" },
    { subject: "Biologia", front: "Biologia 1", name: "Vitaminas" },
    { subject: "Biologia", front: "Biologia 1", name: "Ácidos nucleicos: RNA e DNA" },
    { subject: "Biologia", front: "Biologia 1", name: "Estrutura do DNA" },
    { subject: "Física", front: "Física 2", name: "Propagação do calor" },
    { subject: "Física", front: "Física 2", name: "Estudo do gás ideal" },
    { subject: "História", front: "História Geral", name: "Transição feudo-capitalista" },
    { subject: "História", front: "História Geral", name: "Baixa Idade Média" },
    { subject: "Química", front: "Quimica 1", name: "Hibridização (estudar apenas sobre o carbono hibridizações sp3, sp2 e sp)" },
    { subject: "Química", front: "Quimica 1", name: "Polaridade das ligações e das moléculas" },
    { subject: "Geografia", front: "Geografia 1", name: "Fuso horário" },
    { subject: "Geografia", front: "Geografia 2", name: "Revolução Industrial" },
    { subject: "Matemática", front: "Mat. Básica", name: "Lucro, Juros simples e juros compostos" },
    { subject: "Biologia", front: "Biologia 1", name: "Replicação do DNA" },
    { subject: "Biologia", front: "Biologia 1", name: "Transcrição e splicing" },
    { subject: "Biologia", front: "Biologia 1", name: "Tradução (síntese proteica) e código genético" },
    { subject: "Física", front: "Física 2", name: "Trabalho de um gás" },
    { subject: "Física", front: "Física 2", name: "Primeira lei da termodinâmica" },
    { subject: "História", front: "História Geral", name: "Antigo Regime: Absolutismo e Mercantilismo" },
    { subject: "História", front: "História do Brasil", name: "Expansão marítima" },
    { subject: "Química", front: "Quimica 1", name: "Forças intermoleculares" },
    { subject: "Geografia", front: "Geografia 1", name: "Movimentos da Terra e da lua" },
    { subject: "Geografia", front: "Geografia 2", name: "Modelos produtivos" },
    { subject: "Linguagens", front: "Linguagens", name: "Tipos e Gêneros textuais" },
    { subject: "Biologia", front: "Biologia 1", name: "Introdução à citologia e Modelos celulares (eucarionte e procarionte)" },
    { subject: "Biologia", front: "Biologia 1", name: "Membrana plasmática: Estrutura e Fisiologia" },
    { subject: "Biologia", front: "Biologia 1", name: "Membrana plasmática: Transporte passivo e transporte ativo" },
    { subject: "Física", front: "Física 2", name: "Ciclos, Máquinas térmicas e Rendimento" },
    { subject: "Física", front: "Física 2", name: "Ciclos de Carnot e 2ª lei da Termodinâmica" },
    { subject: "História", front: "História Geral", name: "Renascimento" },
    { subject: "História", front: "História Geral", name: "Civilizações pré-colombianas e colonização espanhola na América" },
    { subject: "Química", front: "Quimica 1", name: "Radioatividade" },
    { subject: "Geografia", front: "Geografia 1", name: "Dinâmica das placas tectônicas" },
    { subject: "Geografia", front: "Geografia 2", name: "Regiões industriais do Brasil" },
    { subject: "Linguagens", front: "Linguagens", name: "Variações linguísticas e preconceito linguístico" },
    { subject: "Matemática", front: "Matemática 1", name: "Teoria dos conjuntos" },
    { subject: "Matemática", front: "Matemática 1", name: "Conjuntos numéricos e Intervalos reais" },
    { subject: "Matemática", front: "Matemática 3", name: "Estatística: Médias e demais medidas de tendência central" },
    { subject: "Matemática", front: "Matemática 3", name: "Estatística: Medidas de dispersão" },
    { subject: "Biologia", front: "Biologia 1", name: "Citoplasma: Visão geral, Citoesqueleto e Ribossomos" },
    { subject: "Biologia", front: "Biologia 1", name: "Citoplasma: Retículo endoplasmático e Complexo de Golgi" },
    { subject: "Biologia", front: "Biologia 1", name: "Citoplasma: Lisossomos, Peroxissomos, Centríolos e Mitocôndrias" },
    { subject: "Biologia", front: "Biologia 1", name: "Citoplasma: Plastos, Cloroplastos e Vacúolo" },
    { subject: "Física", front: "Física 1", name: "Vetores" },
    { subject: "Física", front: "Física 1", name: "Conceitos iniciais de cinemática" },
    { subject: "História", front: "História Geral", name: "Reformas religiosas" },
    { subject: "História", front: "História Geral", name: "Independência da América espanhola" },
    { subject: "Química", front: "Quimica 1", name: "Substâncias puras e misturas" },
    { subject: "Química", front: "Quimica 1", name: "Separação de misturas" },
    { subject: "Geografia", front: "Geografia 1", name: "Dinâmica interna e externa do relevo (agentes modeladores do relevo)" },
    { subject: "Geografia", front: "Geografia 2", name: "Transportes" },
    { subject: "Geografia", front: "Geografia 2", name: "Comércio no Brasil" },
    { subject: "Linguagens", front: "Linguagens", name: "Funções da Linguagem" },
    { subject: "Matemática", front: "Matemática 1", name: "Teoria geral de funções" },
    { subject: "Matemática", front: "Matemática 1", name: "Função constante e Função afim" },
    { subject: "Matemática", front: "Matemática 1", name: "Função do segundo grau (quadrática)" },
    { subject: "Biologia", front: "Biologia 1", name: "Fotossíntese e Quimiossíntese" },
    { subject: "Biologia", front: "Biologia 1", name: "Respiração celular" },
    { subject: "Biologia", front: "Biologia 1", name: "Fermentação" },
    { subject: "Física", front: "Física 1", name: "Movimento uniforme" },
    { subject: "História", front: "História Geral", name: "Colonização inglesa na América" },
    { subject: "História", front: "História Geral", name: "Revoluções Inglesas" },
    { subject: "Química", front: "Quimica 1", name: "Tratamento da água e do esgoto, poluição ambiental, efeito estufa e chuvas ácidas" },
    { subject: "Química", front: "Quimica 1", name: "Estudo dos ácidos" },
    { subject: "Geografia", front: "Geografia 1", name: "Rochas" },
    { subject: "Geografia", front: "Geografia 2", name: "Globalização e Regionalização" },
    { subject: "Filosofia", front: "Filosofia", name: "Origem da filosofia" },
    { subject: "Linguagens", front: "Linguagens", name: "Figuras de Linguagem" },
    { subject: "Matemática", front: "Matemática 1", name: "Função exponencial" },
    { subject: "Matemática", front: "Matemática 1", name: "Propriedades dos logaritmos" },
    { subject: "Matemática", front: "Matemática 1", name: "Função logarítmica e Função modular - Apenas saber como são os gráficos" },
    { subject: "Biologia", front: "Biologia 1", name: "Núcleo celular" },
    { subject: "Biologia", front: "Biologia 1", name: "Ciclo celular e Etapas da divisão celular" },
    { subject: "Física", front: "Física 1", name: "Movimento uniformemente variado" },
    { subject: "História", front: "História Geral", name: "Liberalismo e Iluminismo" },
    { subject: "História", front: "História do Brasil", name: "Povos indígenas do Brasil" },
    { subject: "Química", front: "Quimica 1", name: "Estudo das bases" },
    { subject: "Geografia", front: "Geografia 1", name: "Estruturas geológicas" },
    { subject: "Geografia", front: "Geografia 2", name: "Sistemas agrícolas" },
    { subject: "Filosofia", front: "Filosofia", name: "Pré-Socráticos" },
    { subject: "Linguagens", front: "Linguagens", name: "Quinhentismo" },
    { subject: "Matemática", front: "Matemática 2", name: "Ângulos" },
    { subject: "Matemática", front: "Matemática 2", name: "Triângulos" },
    { subject: "Matemática", front: "Matemática 2", name: "Triângulo retângulo: Teorema de Pitágoras e relações trigonométricas" },
    { subject: "Biologia", front: "Biologia 1", name: "Mitose" },
    { subject: "Biologia", front: "Biologia 1", name: "Meiose" },
    { subject: "Biologia", front: "Biologia 1", name: "Gametogênese" },
    { subject: "Física", front: "Física 1", name: "Lançamento vertical e Queda livre" },
    { subject: "Física", front: "Física 1", name: "Lançamento horizontal" },
    { subject: "História", front: "História Geral", name: "Independência dos EUA" },
    { subject: "História", front: "História do Brasil", name: "Período pré-colonial do Brasil" },
    { subject: "Química", front: "Quimica 1", name: "Potencial hidrogeniônico (pH) e Indicadores ácido-base" },
    { subject: "Geografia", front: "Geografia 1", name: "Relevo brasileiro" },
    { subject: "Geografia", front: "Geografia 2", name: "Revolução verde, Transgênicos e Agronegócio" },
    { subject: "Filosofia", front: "Filosofia", name: "Sofistas, Sócrates e Platão" },
    { subject: "Linguagens", front: "Linguagens", name: "Barroco" },
    { subject: "Matemática", front: "Matemática 2", name: "Semelhança de triângulos" },
    { subject: "Matemática", front: "Matemática 2", name: "Polígonos" },
    { subject: "Biologia", front: "Biologia 3", name: "Introdução à ecologia e conceitos básicos" },
    { subject: "Biologia", front: "Biologia 3", name: "Dinâmica populacional e Potencial biótico" },
    { subject: "Física", front: "Física 1", name: "Lançamento oblíquo" },
    { subject: "Física", front: "Física 1", name: "Movimento circular uniforme" },
    { subject: "História", front: "História Geral", name: "Revolução Francesa" },
    { subject: "História", front: "História do Brasil", name: "Início da colonização" },
    { subject: "Química", front: "Quimica 1", name: "Estudo dos sais" },
    { subject: "Química", front: "Quimica 1", name: "Estudo dos óxidos" },
    { subject: "Geografia", front: "Geografia 2", name: "Agricultura no Brasil" },
    { subject: "Filosofia", front: "Filosofia", name: "Aristóteles" },
    { subject: "Linguagens", front: "Linguagens", name: "Romantismo: primeira geração" },
    { subject: "Matemática", front: "Matemática 2", name: "Circunferência e Círculo" },
    { subject: "Matemática", front: "Matemática 2", name: "Geometria de posição: Posições relativas e Projeção ortogonal" },
    { subject: "Biologia", front: "Biologia 3", name: "Cadeias e teias alimentares" },
    { subject: "Biologia", front: "Biologia 3", name: "Fluxo de energia e Pirâmides ecológicas" },
    { subject: "Biologia", front: "Biologia 3", name: "Relações ecológicas" },
    { subject: "Física", front: "Física 1", name: "Conceitos iniciais de dinâmica" },
    { subject: "Física", front: "Física 1", name: "Leis de Newton" },
    { subject: "História", front: "História Geral", name: "Era Napoleônica e Congresso de Viena" },
    { subject: "História", front: "História do Brasil", name: "Economia açucareira" },
    { subject: "Química", front: "Quimica 1", name: "Ácidos, bases, sais e óxidos importantes" },
    { subject: "Química", front: "Quimica 1", name: "Reações inorgânicas" },
    { subject: "Geografia", front: "Geografia 2", name: "Guerra Fria" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Medieval" },
    { subject: "Linguagens", front: "Linguagens", name: "Romantismo: segunda geração" },
    { subject: "Matemática", front: "Matemática 2", name: "Poliedros" },
    { subject: "Matemática", front: "Matemática 2", name: "Prismas" },
    { subject: "Biologia", front: "Biologia 3", name: "Sucessão ecológica" },
    { subject: "Biologia", front: "Biologia 3", name: "Ecossistemas e Biomas" },
    { subject: "Física", front: "Física 1", name: "Força elástica" },
    { subject: "Física", front: "Física 1", name: "Força de atrito" },
    { subject: "História", front: "História Geral", name: "Revoluções liberais de 1830 e 1848" },
    { subject: "História", front: "História do Brasil", name: "Pecuária e Drogas do sertão" },
    { subject: "Química", front: "Quimica 1", name: "Grandezas químicas" },
    { subject: "Química", front: "Quimica 1", name: "Fórmulas químicas" },
    { subject: "Geografia", front: "Geografia 1", name: "Formação e tipos de solo" },
    { subject: "Geografia", front: "Geografia 2", name: "Nova ordem mundial" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Renascentista e Revolução científica" },
    { subject: "Linguagens", front: "Linguagens", name: "Romantismo: terceira geração" },
    { subject: "Matemática", front: "Matemática 2", name: "Cilindros" },
    { subject: "Matemática", front: "Matemática 2", name: "Pirâmides e Troncos de pirâmides" },
    { subject: "Biologia", front: "Biologia 3", name: "Desequilíbrios ecológicos: Eutrofização e Bioacumulação/magnificação trófica" },
    { subject: "Biologia", front: "Biologia 3", name: "Desequilíbrios ecológicos: Inversão térmica, Efeito estufa e destruição da camada de ozônio" },
    { subject: "Física", front: "Física 1", name: "Aplicação das leis de Newton (Blocos, Planos inclinados, Polias, Elevadores)" },
    { subject: "História", front: "História Geral", name: "Ideias sociais e políticas do Século XIX" },
    { subject: "História", front: "História Geral", name: "Unificações tardias" },
    { subject: "História", front: "História do Brasil", name: "Ocupação e expansão territorial no Brasil" },
    { subject: "Química", front: "Quimica 1", name: "Balanceamento de reações" },
    { subject: "Química", front: "Quimica 1", name: "Leis ponderais" },
    { subject: "Geografia", front: "Geografia 1", name: "Recursos hídricos e Bacias hidrográficas do Brasil" },
    { subject: "Geografia", front: "Geografia 2", name: "Organizações internacionais" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Introdução" },
    { subject: "Linguagens", front: "Linguagens", name: "Romantismo: Prosa" },
    { subject: "Matemática", front: "Matemática 2", name: "Cones e Troncos de cones" },
    { subject: "Matemática", front: "Matemática 2", name: "Esferas" },
    { subject: "Biologia", front: "Biologia 3", name: "Ciclos biogeoquímicos: Carbono, água, nitrogênio, oxigênio e fósforo" },
    { subject: "Física", front: "Física 1", name: "Dinâmica do Movimento Circular" },
    { subject: "Física", front: "Física 1", name: "Estática" },
    { subject: "História", front: "História Geral", name: "Imperialismo" },
    { subject: "História", front: "História do Brasil", name: "Invasões estrangeiras" },
    { subject: "Química", front: "Quimica 1", name: "Cálculo estequiométrico" },
    { subject: "Geografia", front: "Geografia 1", name: "Atmosfera e Fatores climáticos" },
    { subject: "Geografia", front: "Geografia 2", name: "Blocos econômicos" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Racionalismo" },
    { subject: "Linguagens", front: "Linguagens", name: "Realismo" },
    { subject: "Matemática", front: "Matemática 2", name: "Sólidos inscritos" },
    { subject: "Matemática", front: "Matemática 2", name: "Estudo do ponto, da reta e das cônicas" },
    { subject: "Biologia", front: "Biologia 3", name: "Teorias evolutivas" },
    { subject: "Biologia", front: "Biologia 3", name: "Evidências da evolução biológica" },
    { subject: "Física", front: "Física 1", name: "Trabalho, potência e rendimento" },
    { subject: "História", front: "História Geral", name: "Primeira Guerra Mundial" },
    { subject: "História", front: "História do Brasil", name: "Bandeirantismo, mineração e Período Pombalino" },
    { subject: "Química", front: "Quimica 1", name: "Variáveis de estado e Transformações gasosas" },
    { subject: "Química", front: "Quimica 1", name: "Densidade, Efusão e Difusão de gases" },
    { subject: "Geografia", front: "Geografia 1", name: "Dinâmica dos ventos e Zonas climáticas da Terra" },
    { subject: "Geografia", front: "Geografia 2", name: "Conflitos do século XX" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Empirismo" },
    { subject: "Linguagens", front: "Linguagens", name: "Naturalismo" },
    { subject: "Matemática", front: "Matemática 1", name: "Progressão aritmética (PA)" },
    { subject: "Matemática", front: "Matemática 1", name: "Progressão geométrica (PG)" },
    { subject: "Biologia", front: "Biologia 3", name: "Camuflagem e mimetismo" },
    { subject: "Biologia", front: "Biologia 3", name: "Especiação" },
    { subject: "Biologia", front: "Biologia 3", name: "Taxonomia, filogenia e cladogramas" },
    { subject: "Física", front: "Física 1", name: "Energia mecânica" },
    { subject: "História", front: "História Geral", name: "Revolução Russa" },
    { subject: "História", front: "História do Brasil", name: "Revoltas nativistas" },
    { subject: "Química", front: "Quimica 1", name: "Mistura dos gases" },
    { subject: "Química", front: "Quimica 3", name: "Introdução à Química Orgânica e classificação das cadeias carbônicas" },
    { subject: "Geografia", front: "Geografia 1", name: "Fenômenos e mudanças climáticas" },
    { subject: "Geografia", front: "Geografia 2", name: "Migrações e Refugiados" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Iluminismo" },
    { subject: "Linguagens", front: "Linguagens", name: "Parnasianismo" },
    { subject: "Matemática", front: "Matemática 1", name: "Matriz (introdução)" },
    { subject: "Matemática", front: "Matemática 3", name: "Análise combinatória: Princípio Fundamental da Contagem (PFC) e Fatorial" },
    { subject: "Biologia", front: "Biologia 1", name: "Introdução à genética" },
    { subject: "Biologia", front: "Biologia 1", name: "Primeira lei de Mendel e Heredogramas" },
    { subject: "Física", front: "Física 1", name: "Impulso e quantidade de movimento" },
    { subject: "Física", front: "Física 1", name: "Colisões" },
    { subject: "História", front: "História Geral", name: "Crise de 1929" },
    { subject: "História", front: "História do Brasil", name: "Movimentos emancipacionistas" },
    { subject: "Química", front: "Quimica 3", name: "Hidrocarbonetos" },
    { subject: "Química", front: "Quimica 3", name: "Petróleo" },
    { subject: "Geografia", front: "Geografia 1", name: "Clima do Brasil" },
    { subject: "Geografia", front: "Geografia 1", name: "Grandes biomas terrestres" },
    { subject: "Geografia", front: "Geografia 2", name: "Conflitos do Século XXI" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Immanuel Kant" },
    { subject: "Linguagens", front: "Linguagens", name: "Simbolismo" },
    { subject: "Matemática", front: "Matemática 3", name: "Análise combinatória: Permutações simples e com repetição" },
    { subject: "Biologia", front: "Biologia 1", name: "Alelos letais, dominância incompleta, co-dominância e alelos múltiplos" },
    { subject: "Biologia", front: "Biologia 1", name: "Sistema ABO, sistema Rh e tipagem sanguínea" },
    { subject: "Biologia", front: "Biologia 1", name: "Eritroblastose fetal ou doença hemolítica do recém-nascido" },
    { subject: "Física", front: "Física 3", name: "Carga elétrica" },
    { subject: "Física", front: "Física 3", name: "Processos de eletrização" },
    { subject: "Física", front: "Física 3", name: "Força elétrica (Lei de Coulomb)" },
    { subject: "História", front: "História Geral", name: "Período entre guerras e Totalitarismo" },
    { subject: "História", front: "História do Brasil", name: "Família Real portuguesa no Brasil" },
    { subject: "Química", front: "Quimica 3", name: "Funções oxigenadas e nitrogenadas" },
    { subject: "Química", front: "Quimica 3", name: "Outras funções orgânicas" },
    { subject: "Geografia", front: "Geografia 1", name: "Conferências Internacionais" },
    { subject: "Geografia", front: "Geografia 2", name: "Terrorismo" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia moral e ética" },
    { subject: "Linguagens", front: "Linguagens", name: "Pré-Modernismo" },
    { subject: "Matemática", front: "Matemática 3", name: "Análise combinatória: Arranjo e combinação simples" },
    { subject: "Matemática", front: "Matemática 3", name: "Probabilidade: Visão geral, união de eventos, eventos simultâneos e probabilidade condicional" },
    { subject: "Biologia", front: "Biologia 1", name: "Segunda lei de Mendel" },
    { subject: "Biologia", front: "Biologia 1", name: "Interações gênicas (polialelia, epistasia, herança complementar e herança quantitativa) e pleiotropia" },
    { subject: "Biologia", front: "Biologia 1", name: "Herança sexual" },
    { subject: "Física", front: "Física 3", name: "Campo elétrico e Linhas de força" },
    { subject: "Física", front: "Física 3", name: "Potencial elétrico, Trabalho e Energia" },
    { subject: "Física", front: "Física 3", name: "Condutores" },
    { subject: "História", front: "História Geral", name: "Segunda Guerra mundial" },
    { subject: "História", front: "História do Brasil", name: "Processo de independência do Brasil" },
    { subject: "Química", front: "Quimica 3", name: "Propriedades físicas e químicas dos compostos orgânicos" },
    { subject: "Química", front: "Quimica 3", name: "Isomeria plana" },
    { subject: "Química", front: "Quimica 3", name: "Isomeria geométrica (cis-trans)" },
    { subject: "Geografia", front: "Geografia 1", name: "Ecossistemas Brasileiros" },
    { subject: "Geografia", front: "Geografia 2", name: "União Europeia e Brexit" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Política" },
    { subject: "Linguagens", front: "Linguagens", name: "Vanguardas Europeias" },
    { subject: "Matemática", front: "Matemática 3", name: "Trigonometria: Conceitos básicos e funções trigonométricas" },
    { subject: "Biologia", front: "Biologia 1", name: "Linkage e mapeamento de genes" },
    { subject: "Biologia", front: "Biologia 1", name: "Mutações e Anomalias cromossômicas" },
    { subject: "Física", front: "Física 3", name: "Corrente e Potência elétrica" },
    { subject: "Física", front: "Física 3", name: "Leis de Ohm" },
    { subject: "História", front: "História Geral", name: "Revolução Cubana" },
    { subject: "História", front: "História do Brasil", name: "Primeiro Reinado" },
    { subject: "Química", front: "Quimica 3", name: "Isomeria óptica" },
    { subject: "Química", front: "Quimica 3", name: "Reações orgânicas de eliminação" },
    { subject: "Geografia", front: "Geografia 1", name: "Problemas ambientais" },
    { subject: "Geografia", front: "Geografia 1", name: "Uso e degradação das formações vegetais" },
    { subject: "Geografia", front: "Geografia 1", name: "Espaço geográfico, urbanização e hierarquias urbanas" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Helenística" },
    { subject: "Linguagens", front: "Linguagens", name: "Modernismo: primeira geração" },
    { subject: "Biologia", front: "Biologia 1", name: "Engenharia genética e biotecnologia: transgênicos e clonagem" },
    { subject: "Biologia", front: "Biologia 2", name: "Introdução à embriologia" },
    { subject: "Biologia", front: "Biologia 2", name: "Fecundação, segmentação ou clivagem" },
    { subject: "Biologia", front: "Biologia 2", name: "Gastrulação, Neurulação e Organogênese" },
    { subject: "Física", front: "Física 3", name: "Associação de Resistores" },
    { subject: "Física", front: "Física 3", name: "Leis de Kirchhoff e Ponte de Wheatstone" },
    { subject: "História", front: "História Geral", name: "América Latina no século XX" },
    { subject: "História", front: "História do Brasil", name: "Período Regencial" },
    { subject: "Química", front: "Quimica 3", name: "Reações orgânicas de substituição" },
    { subject: "Química", front: "Quimica 3", name: "Reações orgânicas de oxidação" },
    { subject: "Química", front: "Quimica 3", name: "Reações orgânicas de adição" },
    { subject: "Geografia", front: "Geografia 1", name: "Problemas sociais e ambientais urbanos" },
    { subject: "Geografia", front: "Geografia 1", name: "Urbanização do Brasil" },
    { subject: "Filosofia", front: "Filosofia", name: "Idealismo Alemão" },
    { subject: "Linguagens", front: "Linguagens", name: "Modernismo: segunda geração" },
    { subject: "Biologia", front: "Biologia 2", name: "Anexos embrionários" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido epitelial" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido conjuntivo propriamente dito" },
    { subject: "Física", front: "Física 3", name: "Geradores elétricos" },
    { subject: "Física", front: "Física 3", name: "Receptores elétricos" },
    { subject: "Física", front: "Física 3", name: "Capacitores" },
    { subject: "História", front: "História Geral", name: "Descolonização afro-asiática" },
    { subject: "História", front: "História do Brasil", name: "Segundo Reinado" },
    { subject: "Química", front: "Quimica 3", name: "Esterificação, Transesterificação e Hidrólise" },
    { subject: "Química", front: "Quimica 3", name: "Polímeros" },
    { subject: "Geografia", front: "Geografia 1", name: "Movimentos migratórios" },
    { subject: "Geografia", front: "Geografia 1", name: "Teorias demográficas" },
    { subject: "Geografia", front: "Geografia 1", name: "Demografia do Brasil" },
    { subject: "Filosofia", front: "Filosofia", name: "Existencialismo" },
    { subject: "Linguagens", front: "Linguagens", name: "Modernismo: terceira geração" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido adiposo" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido cartilaginoso" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido ósseo" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido sanguíneo e hematopoiético" },
    { subject: "Física", front: "Física 3", name: "Eletromagnetismo: Introdução, Imã e Regra da mão direita" },
    { subject: "Física", front: "Física 3", name: "Campo magnético" },
    { subject: "História", front: "História Geral", name: "Revolução chinesa" },
    { subject: "História", front: "História do Brasil", name: "República da Espada" },
    { subject: "Química", front: "Quimica 2", name: "Entalpia" },
    { subject: "Química", front: "Quimica 2", name: "Lei de Hess" },
    { subject: "Química", front: "Quimica 3", name: "Biomoléculas" },
    { subject: "Geografia", front: "Geografia 1", name: "Estrutura da população" },
    { subject: "Geografia", front: "Geografia 1", name: "Fatores do desenvolvimento e Indicadores sociais" },
    { subject: "Sociologia", front: "Sociologia", name: "Comte e o Positivismo" },
    { subject: "Linguagens", front: "Linguagens", name: "Arte Moderna: Impressionismo e outros movimentos" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido muscular" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido nervoso" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema digestório" },
    { subject: "Física", front: "Física 3", name: "Força Magnética e regra da mão esquerda" },
    { subject: "Física", front: "Física 3", name: "Indução Eletromagnética (Lei de Lenz)" },
    { subject: "História", front: "História Geral", name: "Guerra Fria" },
    { subject: "História", front: "História do Brasil", name: "República Oligárquica" },
    { subject: "Química", front: "Quimica 2", name: "Energia de Ligação" },
    { subject: "Química", front: "Quimica 2", name: "Soluções: classificação e solubilidade" },
    { subject: "Sociologia", front: "Sociologia", name: "Émile Durkheim" },
    { subject: "Linguagens", front: "Linguagens", name: "Arte Moderna: Vanguardas europeias" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema respiratório" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema cardiovascular" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistemas linfático e imunológico" },
    { subject: "Física", front: "Física 2", name: "Princípios da óptica geométrica" },
    { subject: "Física", front: "Física 3", name: "Lei de Faraday e Variação do fluxo magnético" },
    { subject: "História", front: "História Geral", name: "A Nova Ordem Mundial" },
    { subject: "História", front: "História do Brasil", name: "Era Vargas" },
    { subject: "Química", front: "Quimica 2", name: "Diluição e mistura de soluções" },
    { subject: "Química", front: "Quimica 2", name: "Propriedades coligativas" },
    { subject: "Sociologia", front: "Sociologia", name: "Max Weber" },
    { subject: "Linguagens", front: "Linguagens", name: "Arte moderna no Brasil" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema excretor" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema endócrino" },
    { subject: "Física", front: "Física 2", name: "Luz e Câmara de orifício" },
    { subject: "Física", front: "Física 2", name: "Espelhos planos" },
    { subject: "História", front: "História do Brasil", name: "República Liberal" },
    { subject: "Química", front: "Quimica 2", name: "Coloides" },
    { subject: "Química", front: "Quimica 2", name: "Cinética química: Visão geral" },
    { subject: "Química", front: "Quimica 2", name: "Cinética química: Velocidade média e Lei da velocidade" },
    { subject: "Sociologia", front: "Sociologia", name: "Karl Marx" },
    { subject: "Linguagens", front: "Linguagens", name: "Arte contemporânea" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema nervoso" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema sensorial" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema reprodutor" },
    { subject: "Física", front: "Física 2", name: "Espelhos esféricos" },
    { subject: "História", front: "História do Brasil", name: "Regime Militar" },
    { subject: "Química", front: "Quimica 2", name: "Noções e cálculos de equilíbrio químico" },
    { subject: "Química", front: "Quimica 2", name: "Deslocamento de equilíbrio" },
    { subject: "Sociologia", front: "Sociologia", name: "Trabalho, economia e sociedade" },
    { subject: "Linguagens", front: "Linguagens", name: "Instalações, Performances e Ready-mades" },
    { subject: "Biologia", front: "Biologia 2", name: "Ciclo menstrual" },
    { subject: "Biologia", front: "Biologia 2", name: "Métodos contraceptivos" },
    { subject: "Física", front: "Física 2", name: "Refração" },
    { subject: "Física", front: "Física 2", name: "Dioptro plano, Ângulo limite e Reflexão total" },
    { subject: "História", front: "História do Brasil", name: "Redemocratização" },
    { subject: "Química", front: "Quimica 2", name: "Equilíbrio iônico e Produto de Solubilidade (Kps)" },
    { subject: "Química", front: "Quimica 2", name: "Equilíbrio iônico da água, pH e pOH" },
    { subject: "Sociologia", front: "Sociologia", name: "Estratificação, Classe e Mobilidade social" },
    { subject: "Biologia", front: "Biologia 3", name: "Vírus: Características gerais" },
    { subject: "Biologia", front: "Biologia 3", name: "Multiplicação e ciclos virais" },
    { subject: "Física", front: "Física 2", name: "Lentes esféricas" },
    { subject: "História", front: "História do Brasil", name: "Nova República" },
    { subject: "Química", front: "Quimica 2", name: "Hidrólise de sais" },
    { subject: "Química", front: "Quimica 2", name: "Soluções tampão e Titulação" },
    { subject: "Sociologia", front: "Sociologia", name: "Revolução Industrial e Globalização" },
    { subject: "Sociologia", front: "Sociologia", name: "Cultura e Educação" },
    { subject: "Biologia", front: "Biologia 3", name: "Viroses" },
    { subject: "Biologia", front: "Biologia 3", name: "Bactérias: Características gerais" },
    { subject: "Biologia", front: "Biologia 3", name: "Reprodução e metabolismo bacterianos" },
    { subject: "Física", front: "Física 2", name: "Óptica da Visão" },
    { subject: "Física", front: "Física 2", name: "Instrumentos ópticos" },
    { subject: "Química", front: "Quimica 2", name: "Número de oxidação (NOX)" },
    { subject: "Química", front: "Quimica 2", name: "Reações e Balanceamento por oxirredução" },
    { subject: "Sociologia", front: "Sociologia", name: "Escola de Frankfurt e indústria cultural" },
    { subject: "Sociologia", front: "Sociologia", name: "Poder, Política e Estado" },
    { subject: "Sociologia", front: "Sociologia", name: "Direitos, Cidadania e Movimentos sociais" },
    { subject: "Biologia", front: "Biologia 3", name: "Cianobactérias e Archeas" },
    { subject: "Biologia", front: "Biologia 3", name: "Bacterioses" },
    { subject: "Biologia", front: "Biologia 3", name: "Algas" },
    { subject: "Física", front: "Física 2", name: "Ondulatória: Introdução e Equação fundamental" },
    { subject: "Física", front: "Física 2", name: "Fenômenos ondulatórios" },
    { subject: "Química", front: "Quimica 2", name: "Pilhas" },
    { subject: "Sociologia", front: "Sociologia", name: "Estado de bem-estar social" },
    { subject: "Sociologia", front: "Sociologia", name: "Instituições Sociais" },
    { subject: "Sociologia", front: "Sociologia", name: "Zygmunt Bauman e a Modernidade Líquida" },
    { subject: "Biologia", front: "Biologia 3", name: "Protozoários: Características gerais" },
    { subject: "Biologia", front: "Biologia 3", name: "Protozooses" },
    { subject: "Biologia", front: "Biologia 3", name: "Reino Fungi: Características gerais" },
    { subject: "Biologia", front: "Biologia 3", name: "Importância dos fungos" },
    { subject: "Biologia", front: "Biologia 3", name: "Micoses" },
    { subject: "Física", front: "Física 2", name: "Ondas estacionárias em cordas e tubos sonoros" },
    { subject: "Física", front: "Física 2", name: "Acústica, fenômenos sonoros e instrumentos musicais" },
    { subject: "Biologia", front: "Biologia 3", name: "Introdução à Botânica" },
    { subject: "Biologia", front: "Biologia 3", name: "Ciclo reprodutivo dos vegetais" },
    { subject: "Biologia", front: "Biologia 3", name: "Briófitas e Pteridófitas" },
    { subject: "Biologia", front: "Biologia 3", name: "Gimnospermas" },
    { subject: "Física", front: "Física 1", name: "Leis de Kepler e Lei da Gravitação Universal" },
    { subject: "Física", front: "Física 2", name: "Efeito doppler" },
    { subject: "Biologia", front: "Biologia 3", name: "Angiospermas" },
    { subject: "Biologia", front: "Biologia 3", name: "Morfologia vegetal: Flor, semente e fruto" },
    { subject: "Biologia", front: "Biologia 3", name: "Morfologia vegetal: Raiz, caule e folha" },
    { subject: "Biologia", front: "Biologia 3", name: "Histologia vegetal" },
    { subject: "Física", front: "Física 1", name: "Densidade, pressão e Teorema de Stevin" },
    { subject: "Física", front: "Física 1", name: "Experiência de Torricelli, Teorema de Pascal, Prensa hidráulica" },
    { subject: "Biologia", front: "Biologia 3", name: "Poríferos e cnidários" },
    { subject: "Biologia", front: "Biologia 3", name: "Platelmintos e suas verminoses" },
    { subject: "Biologia", front: "Biologia 3", name: "Fisiologia e Transpiração vegetal" },
    { subject: "Biologia", front: "Biologia 3", name: "Hormônios e Movimentos vegetais" },
    { subject: "Física", front: "Física 1", name: "Princípio de Arquimedes" },
    { subject: "Biologia", front: "Biologia 3", name: "Nematelmintos e suas verminoses" },
    { subject: "Biologia", front: "Biologia 3", name: "Anelídeos" },
    { subject: "Biologia", front: "Biologia 3", name: "Artrópodes" },
    { subject: "Biologia", front: "Biologia 3", name: "Moluscos" },
    { subject: "Biologia", front: "Biologia 3", name: "Equinodermos" },
    { subject: "Biologia", front: "Biologia 3", name: "Peixes" },
    { subject: "Biologia", front: "Biologia 3", name: "Anfíbios" },
    { subject: "Biologia", front: "Biologia 3", name: "Répteis" },
    { subject: "Biologia", front: "Biologia 3", name: "Aves" },
    { subject: "Biologia", front: "Biologia 3", name: "Mamíferos" }
];

// --- DADOS DO CRONOGRAMA INTENSIVO (Novo) ---
const intensiveTopicsSource = [
    // Ciclo 1
    { subject: "Matemática", front: "Mat. Básica", name: "Sistemas de numeração e Sistema métrico" },
    { subject: "Matemática", front: "Mat. Básica", name: "As quatro operações e Expressões numéricas" },
    { subject: "Matemática", front: "Mat. Básica", name: "Múltiplos, Divisores, Critérios de divisibilidade, Números primos, MMC e MDC" },
    { subject: "Biologia", front: "Biologia 3", name: "Origem da vida: Abiogênese e biogênese" },
    { subject: "Biologia", front: "Biologia 3", name: "Origem da vida: Evolução química" },
    { subject: "Biologia", front: "Biologia 3", name: "Origem da vida: Hipótese autotrófica e heterotrófica" },
    { subject: "Biologia", front: "Biologia 3", name: "Origem da vida: Teoria da endossimbiose" },
    { subject: "Física", front: "Física 1", name: "Ordem de grandeza e sistemas de unidades" },
    { subject: "Física", front: "Física 2", name: "Temperatura, Calor e Energia térmica" },
    { subject: "História", front: "História Geral", name: "Grécia Antiga" },
    { subject: "Química", front: "Quimica 1", name: "Classificações e propriedades periódicas" },
    { subject: "Química", front: "Quimica 1", name: "Propriedades da matéria" },
    { subject: "Geografia", front: "Geografia 1", name: "Orientação e Coordenadas geográficas" },
    { subject: "Geografia", front: "Geografia 2", name: "Regiões: Norte, Sul, Nordeste, Centro-Oeste, Sudeste" },
    // Ciclo 2
    { subject: "Matemática", front: "Mat. Básica", name: "Frações e Dízimas periódicas" },
    { subject: "Matemática", front: "Mat. Básica", name: "Potenciação e notação científica" },
    { subject: "Matemática", front: "Mat. Básica", name: "Radiciação" },
    { subject: "Biologia", front: "Biologia 1", name: "Água e Sais Minerais" },
    { subject: "Biologia", front: "Biologia 1", name: "Carboidratos" },
    { subject: "Biologia", front: "Biologia 1", name: "Lipídios" },
    { subject: "Física", front: "Física 2", name: "Escalas termométricas" },
    { subject: "Física", front: "Física 2", name: "Mudanças de fase e diagramas de fase" },
    { subject: "História", front: "História Geral", name: "Roma Antiga" },
    { subject: "Química", front: "Quimica 1", name: "Modelos atômicos" },
    { subject: "Química", front: "Quimica 1", name: "Distribuição eletrônica" },
    { subject: "Geografia", front: "Geografia 1", name: "Cartografia: Elementos, Escalas e Convenções" },
    { subject: "Geografia", front: "Geografia 2", name: "Diferentes classificações regionais do Brasil" },
    // Ciclo 3
    { subject: "Matemática", front: "Mat. Básica", name: "Produtos notáveis e Fatoração" },
    { subject: "Matemática", front: "Mat. Básica", name: "Equações e Sistemas do primeiro grau" },
    { subject: "Matemática", front: "Mat. Básica", name: "Equações do segundo grau" },
    { subject: "Biologia", front: "Biologia 1", name: "Aminoácidos e Proteínas" },
    { subject: "Biologia", front: "Biologia 1", name: "Enzimas" },
    { subject: "Física", front: "Física 2", name: "Calorimetria" },
    { subject: "Física", front: "Física 2", name: "Dilatação térmica" },
    { subject: "História", front: "História Geral", name: "Alta Idade Média: Sistema Feudal e Igreja medieval" },
    { subject: "História", front: "História Geral", name: "Idade Média no Oriente, Civilização muçulmana e Cruzadas" },
    { subject: "Química", front: "Quimica 1", name: "Ligações químicas" },
    { subject: "Química", front: "Quimica 1", name: "Geometria molecular" },
    { subject: "Geografia", front: "Geografia 1", name: "Projeções cartográficas" },
    { subject: "Geografia", front: "Geografia 2", name: "Energias renováveis e não renováveis" },
    // Ciclo 4
    { subject: "Matemática", front: "Mat. Básica", name: "Razão e proporção" },
    { subject: "Matemática", front: "Mat. Básica", name: "Regras de 3 e Escalas" },
    { subject: "Matemática", front: "Mat. Básica", name: "Porcentagem" },
    { subject: "Biologia", front: "Biologia 1", name: "Vitaminas" },
    { subject: "Biologia", front: "Biologia 1", name: "Ácidos nucleicos: RNA e DNA" },
    { subject: "Biologia", front: "Biologia 1", name: "Estrutura do DNA" },
    { subject: "Física", front: "Física 2", name: "Propagação do calor" },
    { subject: "Física", front: "Física 2", name: "Estudo do gás ideal" },
    { subject: "História", front: "História Geral", name: "Transição feudo-capitalista" },
    { subject: "História", front: "História Geral", name: "Baixa Idade Média" },
    { subject: "Química", front: "Quimica 1", name: "Hibridização (estudar apenas sobre o carbono hibridizações sp3, sp2 e sp)" },
    { subject: "Química", front: "Quimica 1", name: "Polaridade das ligações e das moléculas" },
    { subject: "Geografia", front: "Geografia 1", name: "Fuso horário" },
    { subject: "Geografia", front: "Geografia 2", name: "Revolução Industrial" },
    // Ciclo 5
    { subject: "Matemática", front: "Mat. Básica", name: "Lucro, Juros simples e juros compostos" },
    { subject: "Biologia", front: "Biologia 1", name: "Replicação do DNA" },
    { subject: "Biologia", front: "Biologia 1", name: "Transcrição e splicing" },
    { subject: "Biologia", front: "Biologia 1", name: "Tradução (síntese proteica) e código genético" },
    { subject: "Física", front: "Física 2", name: "Trabalho de um gás" },
    { subject: "Física", front: "Física 2", name: "Primeira lei da termodinâmica" },
    { subject: "História", front: "História Geral", name: "Antigo Regime: Absolutismo e Mercantilismo" },
    { subject: "História", front: "História do Brasil", name: "Expansão marítima" },
    { subject: "Química", front: "Quimica 1", name: "Forças intermoleculares" },
    { subject: "Geografia", front: "Geografia 1", name: "Movimentos da Terra e da lua" },
    { subject: "Geografia", front: "Geografia 2", name: "Modelos produtivos" },
    { subject: "Linguagens", front: "Linguagens", name: "Tipos e Gêneros textuais" },
    // Ciclo 6
    { subject: "Biologia", front: "Biologia 1", name: "Introdução à citologia e Modelos celulares (eucarionte e procarionte)" },
    { subject: "Biologia", front: "Biologia 1", name: "Membrana plasmática: Estrutura e Fisiologia" },
    { subject: "Biologia", front: "Biologia 1", name: "Membrana plasmática: Transporte passivo e transporte ativo" },
    { subject: "Física", front: "Física 2", name: "Ciclos, Máquinas térmicas e Rendimento" },
    { subject: "Física", front: "Física 2", name: "Ciclos de Carnot e 2ª lei da Termodinâmica" },
    { subject: "História", front: "História Geral", name: "Renascimento" },
    { subject: "História", front: "História Geral", name: "Civilizações pré-colombianas e colonização espanhola na América" },
    { subject: "Química", front: "Quimica 1", name: "Radioatividade" },
    { subject: "Geografia", front: "Geografia 1", name: "Dinâmica das placas tectônicas" },
    { subject: "Geografia", front: "Geografia 2", name: "Regiões industriais do Brasil" },
    { subject: "Linguagens", front: "Linguagens", name: "Variações linguísticas e preconceito linguístico" },
    // Ciclo 7
    { subject: "Matemática", front: "Matemática 1", name: "Teoria dos conjuntos" },
    { subject: "Matemática", front: "Matemática 1", name: "Conjuntos numéricos e Intervalos reais" },
    { subject: "Matemática", front: "Matemática 3", name: "Estatística: Médias e demais medidas de tendência central" },
    { subject: "Matemática", front: "Matemática 3", name: "Estatística: Medidas de dispersão" },
    { subject: "Biologia", front: "Biologia 1", name: "Citoplasma: Visão geral, Citoesqueleto e Ribossomos" },
    { subject: "Biologia", front: "Biologia 1", name: "Citoplasma: Retículo endoplasmático e Complexo de Golgi" },
    { subject: "Biologia", front: "Biologia 1", name: "Citoplasma: Lisossomos, Peroxissomos, Centríolos e Mitocôndrias" },
    { subject: "Biologia", front: "Biologia 1", name: "Citoplasma: Plastos, Cloroplastos e Vacúolo" },
    { subject: "Física", front: "Física 1", name: "Vetores" },
    { subject: "Física", front: "Física 1", name: "Conceitos iniciais de cinemática" },
    { subject: "História", front: "História Geral", name: "Reformas religiosas" },
    { subject: "História", front: "História Geral", name: "Independência da América espanhola" },
    { subject: "Química", front: "Quimica 1", name: "Substâncias puras e misturas" },
    { subject: "Química", front: "Quimica 1", name: "Separação de misturas" },
    { subject: "Geografia", front: "Geografia 1", name: "Dinâmica interna e externa do relevo (agentes modeladores do relevo)" },
    { subject: "Geografia", front: "Geografia 2", name: "Transportes" },
    { subject: "Geografia", front: "Geografia 2", name: "Comércio no Brasil" },
    { subject: "Linguagens", front: "Linguagens", name: "Funções da Linguagem" },
    // Ciclo 8
    { subject: "Matemática", front: "Matemática 1", name: "Teoria geral de funções" },
    { subject: "Matemática", front: "Matemática 1", name: "Função constante e Função afim" },
    { subject: "Matemática", front: "Matemática 1", name: "Função do segundo grau (quadrática)" },
    { subject: "Biologia", front: "Biologia 1", name: "Fotossíntese e Quimiossíntese" },
    { subject: "Biologia", front: "Biologia 1", name: "Respiração celular" },
    { subject: "Biologia", front: "Biologia 1", name: "Fermentação" },
    { subject: "Física", front: "Física 1", name: "Movimento uniforme" },
    { subject: "História", front: "História Geral", name: "Colonização inglesa na América" },
    { subject: "História", front: "História Geral", name: "Revoluções Inglesas" },
    { subject: "Química", front: "Quimica 1", name: "Tratamento da água e do esgoto, poluição ambiental, efeito estufa e chuvas ácidas" },
    { subject: "Química", front: "Quimica 1", name: "Estudo dos ácidos" },
    { subject: "Geografia", front: "Geografia 1", name: "Rochas" },
    { subject: "Geografia", front: "Geografia 2", name: "Globalização e Regionalização" },
    { subject: "Filosofia", front: "Filosofia", name: "Origem da filosofia" },
    { subject: "Linguagens", front: "Linguagens", name: "Figuras de Linguagem" },
    // Ciclo 9
    { subject: "Matemática", front: "Matemática 1", name: "Função exponencial" },
    { subject: "Matemática", front: "Matemática 1", name: "Propriedades dos logaritmos" },
    { subject: "Matemática", front: "Matemática 1", name: "Função logarítmica e Função modular - Apenas saber como são os gráficos" },
    { subject: "Biologia", front: "Biologia 1", name: "Núcleo celular" },
    { subject: "Biologia", front: "Biologia 1", name: "Ciclo celular e Etapas da divisão celular" },
    { subject: "Física", front: "Física 1", name: "Movimento uniformemente variado" },
    { subject: "História", front: "História Geral", name: "Liberalismo e Iluminismo" },
    { subject: "História", front: "História do Brasil", name: "Povos indígenas do Brasil" },
    { subject: "Química", front: "Quimica 1", name: "Estudo das bases" },
    { subject: "Geografia", front: "Geografia 1", name: "Estruturas geológicas" },
    { subject: "Geografia", front: "Geografia 2", name: "Sistemas agrícolas" },
    { subject: "Filosofia", front: "Filosofia", name: "Pré-Socráticos" },
    { subject: "Linguagens", front: "Linguagens", name: "Quinhentismo" },
    // Ciclo 10
    { subject: "Matemática", front: "Matemática 2", name: "Ângulos" },
    { subject: "Matemática", front: "Matemática 2", name: "Triângulos" },
    { subject: "Matemática", front: "Matemática 2", name: "Triângulo retângulo: Teorema de Pitágoras e relações trigonométricas" },
    { subject: "Biologia", front: "Biologia 1", name: "Mitose" },
    { subject: "Biologia", front: "Biologia 1", name: "Meiose" },
    { subject: "Física", front: "Física 1", name: "Lançamento vertical e Queda livre" },
    { subject: "Física", front: "Física 1", name: "Conceitos iniciais de dinâmica" },
    { subject: "História", front: "História Geral", name: "Independência dos EUA" },
    { subject: "História", front: "História do Brasil", name: "Período pré-colonial do Brasil" },
    { subject: "Química", front: "Quimica 1", name: "Potencial hidrogeniônico (pH) e Indicadores ácido-base" },
    { subject: "Geografia", front: "Geografia 1", name: "Relevo brasileiro" },
    { subject: "Geografia", front: "Geografia 2", name: "Revolução verde, Transgênicos e Agronegócio" },
    { subject: "Filosofia", front: "Filosofia", name: "Sofistas, Sócrates e Platão" },
    { subject: "Linguagens", front: "Linguagens", name: "Barroco" },
    // Ciclo 11
    { subject: "Matemática", front: "Matemática 2", name: "Semelhança de triângulos" },
    { subject: "Matemática", front: "Matemática 2", name: "Polígonos" },
    { subject: "Biologia", front: "Biologia 3", name: "Introdução à ecologia e conceitos básicos" },
    { subject: "Biologia", front: "Biologia 3", name: "Dinâmica populacional e Potencial biótico" },
    { subject: "Física", front: "Física 1", name: "Leis de Newton" },
    { subject: "História", front: "História Geral", name: "Revolução Francesa" },
    { subject: "História", front: "História do Brasil", name: "Início da colonização" },
    { subject: "Química", front: "Quimica 1", name: "Estudo dos sais" },
    { subject: "Química", front: "Quimica 1", name: "Estudo dos óxidos" },
    { subject: "Geografia", front: "Geografia 2", name: "Agricultura no Brasil" },
    { subject: "Filosofia", front: "Filosofia", name: "Aristóteles" },
    { subject: "Linguagens", front: "Linguagens", name: "Romantismo: primeira geração" },
    // Ciclo 12
    { subject: "Matemática", front: "Matemática 2", name: "Circunferência e Círculo" },
    { subject: "Matemática", front: "Matemática 2", name: "Geometria de posição: Posições relativas e Projeção ortogonal" },
    { subject: "Biologia", front: "Biologia 3", name: "Cadeias e teias alimentares" },
    { subject: "Biologia", front: "Biologia 3", name: "Fluxo de energia e Pirâmides ecológicas" },
    { subject: "Biologia", front: "Biologia 3", name: "Relações ecológicas" },
    { subject: "Física", front: "Física 1", name: "Força elástica" },
    { subject: "Física", front: "Física 1", name: "Força de atrito" },
    { subject: "História", front: "História Geral", name: "Era Napoleônica e Congresso de Viena" },
    { subject: "História", front: "História do Brasil", name: "Economia açucareira" },
    { subject: "Química", front: "Quimica 1", name: "Ácidos, bases, sais e óxidos importantes" },
    { subject: "Química", front: "Quimica 1", name: "Reações inorgânicas" },
    { subject: "Geografia", front: "Geografia 2", name: "Guerra Fria" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Medieval" },
    { subject: "Linguagens", front: "Linguagens", name: "Romantismo: segunda geração" },
    // Ciclo 13
    { subject: "Matemática", front: "Matemática 2", name: "Poliedros" },
    { subject: "Matemática", front: "Matemática 2", name: "Prismas" },
    { subject: "Biologia", front: "Biologia 3", name: "Sucessão ecológica" },
    { subject: "Biologia", front: "Biologia 3", name: "Ecossistemas e Biomas" },
    { subject: "Física", front: "Física 1", name: "Aplicação das leis de Newton (Blocos, Planos inclinados, Polias, Elevadores)" },
    { subject: "História", front: "História Geral", name: "Imperialismo" },
    { subject: "História", front: "História do Brasil", name: "Pecuária e Drogas do sertão" },
    { subject: "Química", front: "Quimica 1", name: "Grandezas químicas" },
    { subject: "Química", front: "Quimica 1", name: "Fórmulas químicas" },
    { subject: "Geografia", front: "Geografia 1", name: "Formação e tipos de solo" },
    { subject: "Geografia", front: "Geografia 2", name: "Nova ordem mundial" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Renascentista e Revolução científica" },
    { subject: "Linguagens", front: "Linguagens", name: "Romantismo: terceira geração" },
    // Ciclo 14
    { subject: "Matemática", front: "Matemática 2", name: "Cilindros" },
    { subject: "Matemática", front: "Matemática 2", name: "Pirâmides e Troncos de pirâmides" },
    { subject: "Biologia", front: "Biologia 3", name: "Desequilíbrios ecológicos: Eutrofização e Bioacumulação/magnificação trófica" },
    { subject: "Biologia", front: "Biologia 3", name: "Desequilíbrios ecológicos: Inversão térmica, Efeito estufa e destruição da camada de ozônio" },
    { subject: "Física", front: "Física 1", name: "Trabalho, potência e rendimento" },
    { subject: "História", front: "História Geral", name: "Primeira Guerra Mundial" },
    { subject: "História", front: "História do Brasil", name: "Ocupação e expansão territorial no Brasil" },
    { subject: "Química", front: "Quimica 1", name: "Balanceamento de reações" },
    { subject: "Química", front: "Quimica 1", name: "Leis ponderais" },
    { subject: "Geografia", front: "Geografia 2", name: "Organizações internacionais" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Introdução" },
    { subject: "Linguagens", front: "Linguagens", name: "Romantismo: Prosa" },
    // Ciclo 15
    { subject: "Matemática", front: "Matemática 2", name: "Cones e Troncos de cones" },
    { subject: "Matemática", front: "Matemática 2", name: "Esferas" },
    { subject: "Biologia", front: "Biologia 3", name: "Ciclos biogeoquímicos: Carbono, água, nitrogênio, oxigênio e fósforo" },
    { subject: "Física", front: "Física 1", name: "Energia mecânica" },
    { subject: "História", front: "História Geral", name: "Revolução Russa" },
    { subject: "História", front: "História do Brasil", name: "Invasões estrangeiras" },
    { subject: "Química", front: "Quimica 1", name: "Cálculo estequiométrico" },
    { subject: "Geografia", front: "Geografia 1", name: "Atmosfera e Fatores climáticos" },
    { subject: "Geografia", front: "Geografia 2", name: "Blocos econômicos" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Racionalismo" },
    { subject: "Linguagens", front: "Linguagens", name: "Realismo" },
    // Ciclo 16
    { subject: "Matemática", front: "Matemática 2", name: "Sólidos inscritos" },
    { subject: "Matemática", front: "Matemática 2", name: "Estudo do ponto, da reta e das cônicas" },
    { subject: "Biologia", front: "Biologia 3", name: "Teorias evolutivas" },
    { subject: "Biologia", front: "Biologia 3", name: "Evidências da evolução biológica" },
    { subject: "Física", front: "Física 3", name: "Carga elétrica" },
    { subject: "Física", front: "Física 3", name: "Processos de eletrização" },
    { subject: "Física", front: "Física 3", name: "Força elétrica (Lei de Coulomb)" },
    { subject: "História", front: "História Geral", name: "Crise de 1929" },
    { subject: "História", front: "História do Brasil", name: "Bandeirantismo, mineração e Período Pombalino" },
    { subject: "Química", front: "Quimica 1", name: "Variáveis de estado e Transformações gasosas" },
    { subject: "Química", front: "Quimica 1", name: "Densidade, Efusão e Difusão de gases" },
    { subject: "Geografia", front: "Geografia 1", name: "Dinâmica dos ventos e Zonas climáticas da Terra" },
    { subject: "Geografia", front: "Geografia 2", name: "Conflitos do século XX" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Empirismo" },
    { subject: "Linguagens", front: "Linguagens", name: "Naturalismo" },
    // Ciclo 17
    { subject: "Matemática", front: "Matemática 1", name: "Progressão aritmética (PA)" },
    { subject: "Matemática", front: "Matemática 1", name: "Progressão geométrica (PG)" },
    { subject: "Biologia", front: "Biologia 3", name: "Camuflagem e mimetismo" },
    { subject: "Biologia", front: "Biologia 3", name: "Especiação" },
    { subject: "Biologia", front: "Biologia 1", name: "Introdução à genética" },
    { subject: "Física", front: "Física 3", name: "Campo elétrico e Linhas de força" },
    { subject: "Física", front: "Física 3", name: "Potencial elétrico, Trabalho e Energia" },
    { subject: "Física", front: "Física 3", name: "Condutores" },
    { subject: "História", front: "História Geral", name: "Período entre guerras e Totalitarismo" },
    { subject: "História", front: "História do Brasil", name: "Revoltas nativistas" },
    { subject: "Química", front: "Quimica 3", name: "Introdução à Química Orgânica e classificação das cadeias carbônicas" },
    { subject: "Química", front: "Quimica 3", name: "Hidrocarbonetos" },
    { subject: "Geografia", front: "Geografia 1", name: "Fenômenos e mudanças climáticas" },
    { subject: "Geografia", front: "Geografia 2", name: "Migrações e Refugiados" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Iluminismo" },
    { subject: "Linguagens", front: "Linguagens", name: "Pré-Modernismo" },
    // Ciclo 18
    { subject: "Matemática", front: "Matemática 1", name: "Matriz (introdução)" },
    { subject: "Matemática", front: "Matemática 3", name: "Análise combinatória: Princípio Fundamental da Contagem (PFC) e Fatorial" },
    { subject: "Biologia", front: "Biologia 1", name: "Primeira lei de Mendel e Heredogramas" },
    { subject: "Biologia", front: "Biologia 1", name: "Alelos letais, dominância incompleta, co-dominância e alelos múltiplos" },
    { subject: "Física", front: "Física 3", name: "Corrente e Potência elétrica" },
    { subject: "Física", front: "Física 3", name: "Leis de Ohm" },
    { subject: "História", front: "História do Brasil", name: "Movimentos emancipacionistas" },
    { subject: "Química", front: "Quimica 3", name: "Petróleo" },
    { subject: "Química", front: "Quimica 3", name: "Funções oxigenadas e nitrogenadas" },
    { subject: "Geografia", front: "Geografia 1", name: "Clima do Brasil" },
    { subject: "Geografia", front: "Geografia 1", name: "Grandes biomas terrestres" },
    { subject: "Geografia", front: "Geografia 2", name: "Conflitos do Século XXI" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Moderna: Immanuel Kant" },
    { subject: "Linguagens", front: "Linguagens", name: "Vanguardas Europeias" },
    // Ciclo 19
    { subject: "Matemática", front: "Matemática 3", name: "Análise combinatória: Permutações simples e com repetição" },
    { subject: "Biologia", front: "Biologia 1", name: "Sistema ABO, sistema Rh e tipagem sanguínea" },
    { subject: "Biologia", front: "Biologia 1", name: "Eritroblastose fetal ou doença hemolítica do recém-nascido" },
    { subject: "Física", front: "Física 3", name: "Associação de Resistores" },
    { subject: "Física", front: "Física 3", name: "Leis de Kirchhoff" },
    { subject: "História", front: "História Geral", name: "Segunda Guerra mundial" },
    { subject: "História", front: "História do Brasil", name: "Família Real portuguesa no Brasil" },
    { subject: "Química", front: "Quimica 3", name: "Propriedades físicas e químicas dos compostos orgânicos" },
    { subject: "Geografia", front: "Geografia 1", name: "Conferências Internacionais" },
    { subject: "Geografia", front: "Geografia 2", name: "Terrorismo" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia moral e ética" },
    { subject: "Linguagens", front: "Linguagens", name: "Modernismo: primeira geração" },
    // Ciclo 20
    { subject: "Matemática", front: "Matemática 3", name: "Análise combinatória: Arranjo e combinação simples" },
    { subject: "Matemática", front: "Matemática 3", name: "Probabilidade: Visão geral, união de eventos, eventos simultâneos e probabilidade condicional" },
    { subject: "Biologia", front: "Biologia 1", name: "Segunda lei de Mendel" },
    { subject: "Física", front: "Física 3", name: "Geradores elétricos" },
    { subject: "Física", front: "Física 3", name: "Receptores elétricos" },
    { subject: "Física", front: "Física 3", name: "Capacitores" },
    { subject: "História", front: "História Geral", name: "América Latina no século XX" },
    { subject: "História", front: "História do Brasil", name: "Processo de independência do Brasil" },
    { subject: "Química", front: "Quimica 3", name: "Isomeria plana" },
    { subject: "Química", front: "Quimica 3", name: "Isomeria geométrica (cis-trans)" },
    { subject: "Geografia", front: "Geografia 1", name: "Ecossistemas Brasileiros" },
    { subject: "Geografia", front: "Geografia 1", name: "Uso e degradação das formações vegetais" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Política" },
    { subject: "Linguagens", front: "Linguagens", name: "Modernismo: segunda geração" },
    // Ciclo 21
    { subject: "Matemática", front: "Matemática 3", name: "Trigonometria: Conceitos básicos e funções trigonométricas" },
    { subject: "Biologia", front: "Biologia 1", name: "Engenharia genética e biotecnologia: transgênicos e clonagem" },
    { subject: "Física", front: "Física 2", name: "Princípios da óptica geométrica" },
    { subject: "Física", front: "Física 2", name: "Luz e Câmara de orifício" },
    { subject: "História", front: "História Geral", name: "Descolonização afro-asiática" },
    { subject: "História", front: "História do Brasil", name: "Primeiro Reinado" },
    { subject: "Química", front: "Quimica 3", name: "Reações orgânicas de eliminação" },
    { subject: "Química", front: "Quimica 3", name: "Reações orgânicas de substituição" },
    { subject: "Geografia", front: "Geografia 1", name: "Espaço geográfico, urbanização e hierarquias urbanas" },
    { subject: "Geografia", front: "Geografia 1", name: "Urbanização do Brasil" },
    { subject: "Filosofia", front: "Filosofia", name: "Filosofia Helenística" },
    { subject: "Linguagens", front: "Linguagens", name: "Modernismo: terceira geração" },
    // Ciclo 22
    { subject: "Biologia", front: "Biologia 2", name: "Anexos embrionários" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido epitelial" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido conjuntivo propriamente dito" },
    { subject: "Física", front: "Física 2", name: "Espelhos planos" },
    { subject: "História", front: "História Geral", name: "Guerra Fria" },
    { subject: "História", front: "História do Brasil", name: "Período Regencial" },
    { subject: "Química", front: "Quimica 3", name: "Reações orgânicas de oxidação" },
    { subject: "Química", front: "Quimica 3", name: "Reações orgânicas de adição" },
    { subject: "Geografia", front: "Geografia 1", name: "Problemas sociais e ambientais urbanos" },
    { subject: "Geografia", front: "Geografia 1", name: "Movimentos migratórios" },
    { subject: "Sociologia", front: "Sociologia", name: "Comte e o Positivismo" },
    { subject: "Linguagens", front: "Linguagens", name: "Arte Moderna: Impressionismo e outros movimentos" },
    // Ciclo 23
    { subject: "Biologia", front: "Biologia 2", name: "Tecidos sanguíneo e hematopoiético" },
    { subject: "Biologia", front: "Biologia 2", name: "Tecido muscular" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema digestório" },
    { subject: "Física", front: "Física 2", name: "Espelhos esféricos" },
    { subject: "História", front: "História Geral", name: "A Nova Ordem Mundial" },
    { subject: "História", front: "História do Brasil", name: "Segundo Reinado" },
    { subject: "Química", front: "Quimica 2", name: "Entalpia" },
    { subject: "Química", front: "Quimica 2", name: "Lei de Hess" },
    { subject: "Química", front: "Quimica 3", name: "Biomoléculas" },
    { subject: "Geografia", front: "Geografia 1", name: "Teorias demográficas" },
    { subject: "Geografia", front: "Geografia 1", name: "Demografia do Brasil" },
    { subject: "Sociologia", front: "Sociologia", name: "Karl Marx" },
    { subject: "Linguagens", front: "Linguagens", name: "Arte Moderna: Vanguardas europeias" },
    // Ciclo 24
    { subject: "Biologia", front: "Biologia 2", name: "Sistema respiratório" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema cardiovascular" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistemas linfático e imunológico" },
    { subject: "Física", front: "Física 2", name: "Refração" },
    { subject: "Física", front: "Física 2", name: "Dioptro plano, Ângulo limite e Reflexão total" },
    { subject: "História", front: "História do Brasil", name: "República da Espada" },
    { subject: "Química", front: "Quimica 2", name: "Energia de Ligação" },
    { subject: "Química", front: "Quimica 2", name: "Soluções: classificação e solubilidade" },
    { subject: "Geografia", front: "Geografia 1", name: "Estrutura da população" },
    { subject: "Geografia", front: "Geografia 1", name: "Fatores do desenvolvimento e Indicadores sociais" },
    { subject: "Sociologia", front: "Sociologia", name: "Trabalho, economia e sociedade" },
    { subject: "Linguagens", front: "Linguagens", name: "Arte moderna no Brasil" },
    // Ciclo 25
    { subject: "Biologia", front: "Biologia 2", name: "Sistema excretor" },
    { subject: "Biologia", front: "Biologia 2", name: "Sistema endócrino" },
    { subject: "Física", front: "Física 2", name: "Óptica da Visão" },
    { subject: "Física", front: "Física 2", name: "Instrumentos ópticos" },
    { subject: "História", front: "História do Brasil", name: "República Oligárquica" },
    { subject: "Química", front: "Quimica 2", name: "Diluição e mistura de soluções" },
    { subject: "Química", front: "Quimica 2", name: "Propriedades coligativas" },
    { subject: "Sociologia", front: "Sociologia", name: "Estratificação, Classe e Mobilidade social" },
    { subject: "Linguagens", front: "Linguagens", name: "Arte contemporânea" },
    // Ciclo 26
    { subject: "Biologia", front: "Biologia 3", name: "Vírus: Características gerais" },
    { subject: "Biologia", front: "Biologia 3", name: "Viroses" },
    { subject: "Biologia", front: "Biologia 3", name: "Bactérias: Características gerais e reprodução" },
    { subject: "Física", front: "Física 2", name: "Ondulatória: Introdução e Equação fundamental" },
    { subject: "Física", front: "Física 2", name: "Fenômenos ondulatórios" },
    { subject: "História", front: "História do Brasil", name: "Era Vargas" },
    { subject: "Química", front: "Quimica 2", name: "Noções e cálculos de equilíbrio químico" },
    { subject: "Química", front: "Quimica 2", name: "Deslocamento de equilíbrio" },
    { subject: "Sociologia", front: "Sociologia", name: "Revolução Industrial e Globalização" },
    { subject: "Sociologia", front: "Sociologia", name: "Cultura e Educação" },
    { subject: "Linguagens", front: "Linguagens", name: "Instalações, Performances e Ready-mades" },
    // Ciclo 27
    { subject: "Biologia", front: "Biologia 3", name: "Cianobactérias e Archeas" },
    { subject: "Biologia", front: "Biologia 3", name: "Bacterioses" },
    { subject: "Biologia", front: "Biologia 3", name: "Algas" },
    { subject: "Física", front: "Física 2", name: "Acústica, fenômenos sonoros e instrumentos musicais" },
    { subject: "Física", front: "Física 2", name: "Efeito doppler (parte teórica)" },
    { subject: "História", front: "História do Brasil", name: "República Liberal" },
    { subject: "Química", front: "Quimica 2", name: "Equilíbrio iônico da água, pH e POH" },
    { subject: "Química", front: "Quimica 2", name: "Soluções tampão e Titulação" },
    { subject: "Sociologia", front: "Sociologia", name: "Escola de Frankfurt e indústria cultural" },
    { subject: "Sociologia", front: "Sociologia", name: "Poder, Política e Estado" },
    { subject: "Sociologia", front: "Sociologia", name: "Direitos, Cidadania e Movimentos sociais" },
    // Ciclo 28
    { subject: "Biologia", front: "Biologia 3", name: "Protozoários: Características gerais" },
    { subject: "Biologia", front: "Biologia 3", name: "Protozooses" },
    { subject: "Biologia", front: "Biologia 3", name: "Reino Fungi: Características gerais" },
    { subject: "Biologia", front: "Biologia 3", name: "Importância dos fungos" },
    { subject: "Biologia", front: "Biologia 3", name: "Micoses" },
    { subject: "História", front: "História do Brasil", name: "Regime Militar" },
    { subject: "Química", front: "Quimica 2", name: "Número de oxidação (NOX)" },
    { subject: "Química", front: "Quimica 2", name: "Reações e Balanceamento por oxirredução" },
    { subject: "Sociologia", front: "Sociologia", name: "Estado de bem-estar social" },
    { subject: "Sociologia", front: "Sociologia", name: "Instituições Sociais" },
    // Ciclo 29
    { subject: "Biologia", front: "Biologia 3", name: "Introdução à Botânica" },
    { subject: "Biologia", front: "Biologia 3", name: "Ciclo reprodutivo dos vegetais" },
    { subject: "Biologia", front: "Biologia 3", name: "Briófitas e Pteridófitas" },
    { subject: "Biologia", front: "Biologia 3", name: "Gimnospermas" },
    { subject: "História", front: "História do Brasil", name: "Redemocratização" },
    { subject: "Química", front: "Quimica 2", name: "Pilhas" },
    // Ciclo 30
    { subject: "Biologia", front: "Biologia 3", name: "Angiospermas" },
    { subject: "Biologia", front: "Biologia 3", name: "Morfologia vegetal: Flor, semente e fruto" },
    { subject: "Biologia", front: "Biologia 3", name: "Morfologia vegetal: Raiz, caule e folha" },
    { subject: "História", front: "História do Brasil", name: "Nova República" },
    // Ciclo 31
    { subject: "Biologia", front: "Biologia 3", name: "Fisiologia e Transpiração vegetal" },
    { subject: "Biologia", front: "Biologia 3", name: "Platelmintos e suas verminoses" },
    { subject: "Biologia", front: "Biologia 3", name: "Nematelmintos e suas verminoses" },
    { subject: "Biologia", front: "Biologia 3", name: "Peixes" },
    // Ciclo 32
    { subject: "Biologia", front: "Biologia 3", name: "Anfíbios" },
    { subject: "Biologia", front: "Biologia 3", name: "Répteis" },
    { subject: "Biologia", front: "Biologia 3", name: "Aves" },
    { subject: "Biologia", front: "Biologia 3", name: "Mamíferos" }
];

// --- TIPOS ---
type Topic = {
  subject: string;
  front: string;
  name: string;
  id?: string;
  originalIndex?: number;
};

type TopicPreferences = {
  [key: string]: {
    included: boolean;
    difficulty: number;
  };
};

type WeeklyHours = {
  [key: number]: number;
};

// Configuração de intensificação de frequência
type IntensificationPeriod = {
  startDate: string; // Data de início da intensificação
  days: number[]; // Dias da semana (0-6)
  durations?: { [key: number]: number }; // Para atividades com duração (correção, lacunas)
};

type SimulationConfig = {
  enabled: boolean;
  complete: { 
    startDate: string | null; // Data de início dos simulados completos
    intensifications: IntensificationPeriod[]; // Períodos de intensificação
  };
  fragmented: { 
    startDate: string | null; // Data de início dos simulados fragmentados
    endDate: string | null; // Data de término dos simulados fragmentados
    intensifications: IntensificationPeriod[]; // Períodos de intensificação
  };
};

type FixedActivityConfig = {
    enabled: boolean;
    startDate: string | null; // Data de início
    endDate?: string | null; // DEPRECATED: Não usado mais - mantido para compatibilidade com dados antigos
    intensifications: IntensificationPeriod[]; // Períodos de intensificação (usados para mudar cenário)
};

// Configuração legada para revisão e redação (mantém compatibilidade)
type SimpleActivityConfig = {
    enabled: boolean;
    durations: { [key: number]: number }; // day index -> minutes
};

type ScheduleType = 'extensivo' | 'intensivo';

type AppState = {
  step: number;
  scheduleType: ScheduleType;
  topics: Topic[];
  topicPrefs: TopicPreferences;
  endDate: string | null;
  weeklyHours: WeeklyHours;
  simulations: SimulationConfig;
  revision: SimpleActivityConfig;
  writing: SimpleActivityConfig;
  correctionComplete: FixedActivityConfig; // Correção de simulado completo
  correctionFragmented: FixedActivityConfig; // Correção de simulado fragmentado
  gapsComplete: FixedActivityConfig; // Preenchimento de lacunas - Completo
  gapsFragmented: FixedActivityConfig; // Preenchimento de lacunas - Fragmentado
  freeDays: string[];
  schedule: any[];
  completedTopics: Set<number>;
};

type ScheduleResult = {
    schedule: any[];
    remainingTopicsCount: number;
    remainingTopicsList: Topic[];
    allTopicsFit: boolean;
};

// --- CONFIGURAÇÕES BASE ---

const HUMANAS_SUBJECTS = ["História", "Geografia", "Filosofia", "Sociologia", "Linguagens"];
const EXATAS_SUBJECTS = ["Matemática", "Física", "Química", "Biologia"];

// Dificuldade 0 a 4
const TIME_TABLE: {[type: string]: {[diff: number]: number}} = {
    humanas: { 0: 50, 1: 70, 2: 90, 3: 120, 4: 150 },
    exatas: { 0: 70, 1: 90, 2: 120, 3: 180, 4: 210 }
};

const getTopicDuration = (subject: string, difficultyIndex: number): number => {
    const diff = Math.max(0, Math.min(4, difficultyIndex));
    if (HUMANAS_SUBJECTS.includes(subject)) {
        return TIME_TABLE.humanas[diff];
    } else {
        return TIME_TABLE.exatas[diff];
    }
};

// Função auxiliar para cores
const getSubjectStyle = (subject: string) => {
    switch (subject) {
        case 'Matemática':
            return {
                bg: 'bg-yellow-50',
                border: 'border-yellow-500',
                badge: 'bg-yellow-100 text-yellow-800',
                dot: 'bg-yellow-500'
            };
        case 'Biologia':
        case 'Física':
        case 'Química':
            return {
                bg: 'bg-green-50',
                border: 'border-green-500',
                badge: 'bg-green-100 text-green-800',
                dot: 'bg-green-500'
            };
        case 'História':
        case 'Geografia':
        case 'Filosofia':
        case 'Sociologia':
            return {
                bg: 'bg-purple-50',
                border: 'border-purple-500',
                badge: 'bg-purple-100 text-purple-800',
                dot: 'bg-purple-500'
            };
        case 'Linguagens':
            return {
                bg: 'bg-orange-50',
                border: 'border-orange-500',
                badge: 'bg-orange-100 text-orange-800',
                dot: 'bg-orange-500'
            };
        case 'Simulado':
            return {
                bg: 'bg-rose-100', 
                border: 'border-rose-500',
                badge: 'bg-rose-100 text-rose-800',
                dot: 'bg-rose-500'
            };
        case 'Revisão':
            return {
                bg: 'bg-pink-50', 
                border: 'border-pink-300',
                badge: 'bg-pink-100 text-pink-700',
                dot: 'bg-pink-400'
            };
        case 'Redação':
            return {
                bg: 'bg-emerald-50', 
                border: 'border-emerald-500',
                badge: 'bg-emerald-100 text-emerald-800',
                dot: 'bg-emerald-500'
            };
        case 'Correção de Simulado':
            return {
                bg: 'bg-purple-50', 
                border: 'border-purple-600',
                badge: 'bg-purple-100 text-purple-900',
                dot: 'bg-purple-700'
            };
        case 'Preenchimento de Lacunas':
            return {
                bg: 'bg-yellow-50', 
                border: 'border-yellow-600',
                badge: 'bg-yellow-100 text-yellow-900',
                dot: 'bg-yellow-700'
            };
        case 'Dia Livre':
            return {
                bg: 'bg-gray-100',
                border: 'border-gray-300',
                badge: 'bg-gray-200 text-gray-700',
                dot: 'bg-gray-400'
            };
        default:
            return {
                bg: 'bg-gray-50',
                border: 'border-gray-500',
                badge: 'bg-gray-100 text-gray-800',
                dot: 'bg-gray-500'
            };
    }
};

const idealWeeklyTargets: { [key: string]: number } = {
  "Matemática": 480,
  "Biologia": 360,
  "Física": 360,
  "Química": 360,
  "Geografia": 120,
  "História": 120,
  "Filosofia": 120,
  "Sociologia": 120,
  "Linguagens": 120
};

// --- COMPONENTES AUXILIARES ---

const StepIndicator = ({ step }: { step: number }) => {
  const steps = [
    { num: 1, label: 'Matérias', icon: BookOpen },
    { num: 2, label: 'Ajustes', icon: Settings },
    { num: 3, label: 'Geração', icon: RefreshCw },
    { num: 4, label: 'Cronograma', icon: CalendarIcon }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-8">
      <div className="flex justify-between items-center relative">
        {/* Linha de conexão */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" style={{ left: '10%', right: '10%' }} />
        <div 
          className="absolute top-5 h-0.5 bg-emerald-600 z-0 transition-all duration-500" 
          style={{ left: '10%', width: `${Math.max(0, (step - 1) * 26.67)}%` }} 
        />
        
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = s.num === step;
          const isCompleted = s.num < step;
          
          return (
            <div key={s.num} className="flex flex-col items-center z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold mb-2 transition-all duration-300 ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow shadow-emerald-200 scale-110' 
                  : isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wide hidden sm:block transition-colors ${
                isActive ? 'text-emerald-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente para Etapa 1: Seleção de Tópicos
const TopicsStep = ({ 
    topics, 
    topicPrefs, 
    scheduleType,
    onScheduleTypeChange,
    onToggle, 
    onToggleAll,
    onDifficultyChange, 
    onBulkDifficultyChange,
    onNext 
}: { 
    topics: Topic[], 
    topicPrefs: TopicPreferences, 
    scheduleType: ScheduleType,
    onScheduleTypeChange: (type: ScheduleType) => void,
    onToggle: (idx: number) => void, 
    onToggleAll: (subject: string, indices: number[]) => void, 
    onDifficultyChange: (idx: number, val: number) => void, 
    onBulkDifficultyChange: (subject: string, val: number) => void,
    onNext: () => void 
}) => {
    
    const [bulkDiffs, setBulkDiffs] = useState<{[subject: string]: number}>({});

    const grouped = useMemo(() => {
        const g: any = {};
        topics.forEach((t, i) => {
            if (!g[t.subject]) g[t.subject] = {};
            if (!g[t.subject][t.front]) g[t.subject][t.front] = [];
            g[t.subject][t.front].push({ ...t, idx: i });
        });
        return g;
    }, [topics]);

    const diffLabels = ["Muito Baixa", "Baixa", "Média", "Alta", "Muito Alta"];

    const totalTopics = topics.length;
    const selectedTopicsCount = topics.reduce((acc, _, idx) => {
        return acc + (topicPrefs[`topic-${idx}`]?.included ? 1 : 0);
    }, 0);

    const handleBulkChange = (subject: string, val: number) => {
        setBulkDiffs(prev => ({...prev, [subject]: val}));
        onBulkDifficultyChange(subject, val);
    };

    // Calcular estatísticas por área
    const statsPerArea = useMemo(() => {
        const areas = {
            'Ciências da Natureza': ['Biologia', 'Física', 'Química'],
            'Ciências Humanas': ['História', 'Geografia', 'Filosofia', 'Sociologia'],
            'Linguagens': ['Linguagens'],
            'Matemática': ['Matemática']
        };
        
        const stats: {[key: string]: {total: number, selected: number, color: string, icon: string}} = {};
        const colors: {[key: string]: string} = {
            'Ciências da Natureza': 'green',
            'Ciências Humanas': 'amber',
            'Linguagens': 'purple',
            'Matemática': 'blue'
        };
        
        Object.entries(areas).forEach(([area, subjects]) => {
            let total = 0;
            let selected = 0;
            topics.forEach((t, idx) => {
                if (subjects.includes(t.subject)) {
                    total++;
                    if (topicPrefs[`topic-${idx}`]?.included) selected++;
                }
            });
            stats[area] = { total, selected, color: colors[area], icon: area };
        });
        
        return stats;
    }, [topics, topicPrefs]);

    return (
        <div className="space-y-6">
            {/* Header Principal - Estilo Estudos/Metas */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-lg p-4 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Seleção de Matérias</h1>
                            <p className="text-emerald-100 text-sm mt-1">Personalize seu cronograma escolhendo os conteúdos e dificuldades 📚</p>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-4 rounded-lg border border-white/20">
                        <div className="text-center">
                            <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider block">Tópicos Selecionados</span>
                            <div className="flex items-baseline justify-center gap-1 mt-1">
                                <span className="text-2xl font-bold text-white">{selectedTopicsCount}</span>
                                <span className="text-emerald-200 text-lg font-medium">/ {totalTopics}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards de Estatísticas por Área */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(statsPerArea).map(([area, data]) => {
                    const percentage = data.total > 0 ? Math.round((data.selected / data.total) * 100) : 0;
                    const colorClasses: {[key: string]: {bg: string, text: string, border: string, progress: string}} = {
                        'green': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', progress: 'bg-green-500' },
                        'amber': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', progress: 'bg-amber-500' },
                        'purple': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', progress: 'bg-purple-500' },
                        'blue': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', progress: 'bg-emerald-500' }
                    };
                    const colors = colorClasses[data.color];
                    
                    return (
                        <div key={area} className={`${colors.bg} rounded-xl p-4 border ${colors.border} transition-all hover:shadow-md`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold ${colors.text} uppercase tracking-wide`}>
                                    {area === 'Ciências da Natureza' ? 'Natureza' : 
                                     area === 'Ciências Humanas' ? 'Humanas' : area}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-bold ${colors.text}`}>{data.selected}</span>
                                <span className="text-gray-400 text-sm">/ {data.total}</span>
                            </div>
                            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${colors.progress} rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modalidade do Cronograma */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100 hover:shadow-sm transition-shadow">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Modalidade do Cronograma</h2>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Escolha a base de conteúdos que melhor se adapta ao seu tempo.
                            </p>
                        </div>
                    </div>
                    <div className="flex bg-gray-100 p-1.5 rounded-xl">
                        <button
                            onClick={() => onScheduleTypeChange('extensivo')}
                            className={`px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                                scheduleType === 'extensivo' 
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow shadow-emerald-200' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            📖 Extensivo
                        </button>
                        <button
                            onClick={() => onScheduleTypeChange('intensivo')}
                            className={`px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                scheduleType === 'intensivo' 
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow shadow-purple-200' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Zap className="w-4 h-4" /> Intensivo
                        </button>
                    </div>
                </div>
            </div>

            {/* Conteúdos e Dificuldades */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Conteúdos e Dificuldades</h2>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Personalize o que vai cair no seu plano de estudos.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {Object.keys(grouped).map(subject => (
                        <details key={subject} className="group bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 font-semibold select-none">
                                <div className="flex items-center gap-2">
                                    <span>{subject}</span>
                                    <span className="text-xs text-gray-400 font-normal ml-2">
                                        ({Object.values(grouped[subject]).flat().length} tópicos)
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            const allIndices = Object.values(grouped[subject]).flat().map((t: any) => t.idx);
                                            onToggleAll(subject, allIndices);
                                        }}
                                        className="text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                                    >
                                        Selecionar/Remover Tudo
                                    </button>
                                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                                </div>
                            </summary>
                            
                            <div className="bg-emerald-50 px-4 py-3 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-sm text-emerald-800">
                                    <Layers className="w-4 h-4" />
                                    <span className="font-semibold">Definir dificuldade geral para {subject}:</span>
                                </div>
                                <div className="flex items-center gap-2 flex-1 max-w-xs">
                                    <input 
                                        type="range" 
                                        min="0" max="4" 
                                        value={bulkDiffs[subject] ?? 2} 
                                        onChange={(e) => handleBulkChange(subject, parseInt(e.target.value))}
                                        className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                    />
                                    <span className="text-xs font-bold text-emerald-700 w-24 text-right">
                                        {diffLabels[bulkDiffs[subject] ?? 2]}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                                {Object.keys(grouped[subject]).map(front => (
                                    <div key={front} className="ml-2 pl-4 border-l-2 border-emerald-100">
                                        <h4 className="font-medium text-sm text-emerald-600 mb-3 uppercase tracking-wide">{front}</h4>
                                        <div className="space-y-3">
                                            {grouped[subject][front].map((topic: any) => {
                                                const pref = topicPrefs[`topic-${topic.idx}`];
                                                if (!pref) return null;
                                                
                                                const duration = getTopicDuration(subject, pref.difficulty);

                                                return (
                                                    <div key={topic.idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 hover:bg-gray-50 rounded">
                                                        <label className="flex items-start gap-3 flex-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={pref.included}
                                                                onChange={() => onToggle(topic.idx)}
                                                                className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className={`text-sm ${!pref.included ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                                    {topic.name}
                                                                </span>
                                                                {pref.included && (
                                                                    <span className="text-xs text-gray-400">Tempo estimado: {duration} min</span>
                                                                )}
                                                            </div>
                                                        </label>
                                                        {pref.included && (
                                                            <div className="flex items-center gap-2 min-w-[160px]">
                                                                <input 
                                                                    type="range" 
                                                                    min="0" max="4" 
                                                                    value={pref.difficulty}
                                                                    onChange={(e) => onDifficultyChange(topic.idx, parseInt(e.target.value))}
                                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                                                />
                                                                <span className="text-xs text-gray-500 w-20 text-right">{diffLabels[pref.difficulty]}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
            {/* Botão Próximo */}
            <div className="flex justify-end">
                <button 
                    onClick={onNext}
                    className="group text-gray-900 dark:text-white hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-4 rounded-lg font-bold text-lg flex items-center gap-3 transition-all shadow-sm shadow-emerald-300/50 hover:shadow-sm hover:shadow-emerald-400/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                    Próximo: Ajustes 
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </button>
            </div>
        </div>
    );
};

// Componente de Configuração de Simulados com datas e intensificação
const SimulationConfigSection = ({ 
    state, 
    onUpdateSimulations, 
    dayNames, 
    shortDays 
}: { 
    state: AppState, 
    onUpdateSimulations: (config: SimulationConfig) => void,
    dayNames: string[],
    shortDays: string[]
}) => {
    // Funções auxiliares para Simulados Completos
    const addCompleteIntensification = () => {
        const newIntensifications = [...state.simulations.complete.intensifications, { startDate: '', days: [] }];
        onUpdateSimulations({
            ...state.simulations, 
            complete: { ...state.simulations.complete, intensifications: newIntensifications }
        });
    };

    const removeCompleteIntensification = (index: number) => {
        if (state.simulations.complete.intensifications.length > 1) {
            const newIntensifications = state.simulations.complete.intensifications.filter((_, i) => i !== index);
            onUpdateSimulations({
                ...state.simulations, 
                complete: { ...state.simulations.complete, intensifications: newIntensifications }
            });
        }
    };

    const updateCompleteIntensification = (index: number, field: string, value: any) => {
        const newIntensifications = [...state.simulations.complete.intensifications];
        newIntensifications[index] = { ...newIntensifications[index], [field]: value };
        onUpdateSimulations({
            ...state.simulations, 
            complete: { ...state.simulations.complete, intensifications: newIntensifications }
        });
    };

    const toggleCompleteDay = (intensIdx: number, dayIdx: number) => {
        const intens = state.simulations.complete.intensifications[intensIdx];
        const days = intens.days.includes(dayIdx)
            ? intens.days.filter(x => x !== dayIdx)
            : [...intens.days, dayIdx];
        updateCompleteIntensification(intensIdx, 'days', days);
    };

    // Funções auxiliares para Simulados Fragmentados
    const addFragmentedIntensification = () => {
        const newIntensifications = [...state.simulations.fragmented.intensifications, { startDate: '', days: [] }];
        onUpdateSimulations({
            ...state.simulations, 
            fragmented: { ...state.simulations.fragmented, intensifications: newIntensifications }
        });
    };

    const removeFragmentedIntensification = (index: number) => {
        if (state.simulations.fragmented.intensifications.length > 1) {
            const newIntensifications = state.simulations.fragmented.intensifications.filter((_, i) => i !== index);
            onUpdateSimulations({
                ...state.simulations, 
                fragmented: { ...state.simulations.fragmented, intensifications: newIntensifications }
            });
        }
    };

    const updateFragmentedIntensification = (index: number, field: string, value: any) => {
        const newIntensifications = [...state.simulations.fragmented.intensifications];
        newIntensifications[index] = { ...newIntensifications[index], [field]: value };
        onUpdateSimulations({
            ...state.simulations, 
            fragmented: { ...state.simulations.fragmented, intensifications: newIntensifications }
        });
    };

    const toggleFragmentedDay = (intensIdx: number, dayIdx: number) => {
        const intens = state.simulations.fragmented.intensifications[intensIdx];
        const days = intens.days.includes(dayIdx)
            ? intens.days.filter(x => x !== dayIdx)
            : [...intens.days, dayIdx];
        updateFragmentedIntensification(intensIdx, 'days', days);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Settings className="text-gray-700" />
                    Configuração de Simulados
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={state.simulations.enabled}
                        onChange={(e) => onUpdateSimulations({...state.simulations, enabled: e.target.checked})}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="font-medium text-gray-700">Ativar Simulados</span>
                </label>
            </div>

            {state.simulations.enabled && (
                <div className="space-y-8 pt-4 border-t border-gray-100">
                    {/* Simulados Completos */}
                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Simulados Completos (5h30)
                        </h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm text-gray-600 mb-1">Data de Início:</label>
                            <input 
                                type="date"
                                value={state.simulations.complete.startDate || ''}
                                onChange={(e) => onUpdateSimulations({
                                    ...state.simulations, 
                                    complete: { ...state.simulations.complete, startDate: e.target.value || null }
                                })}
                                className="border border-gray-300 rounded px-3 py-2 w-full sm:w-auto text-sm"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">Períodos de Frequência:</label>
                                <button
                                    onClick={addCompleteIntensification}
                                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full font-medium"
                                >
                                    + Adicionar Intensificação
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 italic">Obs: Cada novo período substitui o anterior (não acumula).</p>

                            {state.simulations.complete.intensifications.map((intens, intensIdx) => (
                                <div key={intensIdx} className="border border-purple-200 rounded-lg p-3 bg-white">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-purple-700">
                                            {intensIdx === 0 ? 'Frequência Inicial' : `Intensificação ${intensIdx}`}
                                        </span>
                                        {intensIdx > 0 && (
                                            <button
                                                onClick={() => removeCompleteIntensification(intensIdx)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {intensIdx > 0 && (
                                        <div className="mb-3">
                                            <label className="block text-xs text-gray-600 mb-1">A partir de:</label>
                                            <input 
                                                type="date"
                                                value={intens.startDate || ''}
                                                onChange={(e) => updateCompleteIntensification(intensIdx, 'startDate', e.target.value)}
                                                className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Dias da semana:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {shortDays.map((d, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => toggleCompleteDay(intensIdx, i)}
                                                    className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${intens.days.includes(i) ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                        {intens.days.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                {intens.days.length} dia(s) selecionado(s): {intens.days.sort((a,b) => a-b).map(d => dayNames[d]).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Simulados Fragmentados */}
                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/50">
                        <h3 className="font-semibold text-purple-600 mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5" />
                            Simulados Fragmentados (2h30)
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Data de Início:</label>
                                <input 
                                    type="date"
                                    value={state.simulations.fragmented.startDate || ''}
                                    onChange={(e) => onUpdateSimulations({
                                        ...state.simulations, 
                                        fragmented: { ...state.simulations.fragmented, startDate: e.target.value || null }
                                    })}
                                    className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Data de Término:</label>
                                <input 
                                    type="date"
                                    value={state.simulations.fragmented.endDate || ''}
                                    onChange={(e) => onUpdateSimulations({
                                        ...state.simulations, 
                                        fragmented: { ...state.simulations.fragmented, endDate: e.target.value || null }
                                    })}
                                    className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">Períodos de Frequência:</label>
                                <button
                                    onClick={addFragmentedIntensification}
                                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-600 px-3 py-1 rounded-full font-medium"
                                >
                                    + Adicionar Intensificação
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 italic">Obs: Cada novo período substitui o anterior (não acumula).</p>

                            {state.simulations.fragmented.intensifications.map((intens, intensIdx) => (
                                <div key={intensIdx} className="border border-purple-200 rounded-lg p-3 bg-white">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-purple-600">
                                            {intensIdx === 0 ? 'Frequência Inicial' : `Intensificação ${intensIdx}`}
                                        </span>
                                        {intensIdx > 0 && (
                                            <button
                                                onClick={() => removeFragmentedIntensification(intensIdx)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {intensIdx > 0 && (
                                        <div className="mb-3">
                                            <label className="block text-xs text-gray-600 mb-1">A partir de:</label>
                                            <input 
                                                type="date"
                                                value={intens.startDate || ''}
                                                onChange={(e) => updateFragmentedIntensification(intensIdx, 'startDate', e.target.value)}
                                                className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Dias da semana:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {shortDays.map((d, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => toggleFragmentedDay(intensIdx, i)}
                                                    className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${intens.days.includes(i) ? 'bg-purple-400 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                        {intens.days.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                {intens.days.length} dia(s) selecionado(s): {intens.days.sort((a,b) => a-b).map(d => dayNames[d]).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente para Etapa 2: Configurações
const SettingsStep = ({ 
    state, 
    onUpdateHours, 
    onUpdateSimulations, 
    onUpdateEndDate, 
    onUpdateRevision,
    onUpdateWriting,
    onUpdateCorrectionComplete,
    onUpdateCorrectionFragmented,
    onUpdateGapsComplete,
    onUpdateGapsFragmented,
    onUpdateFreeDays,
    onBack, 
    onGenerate 
}: { 
    state: AppState, 
    onUpdateHours: (idx: number, val: number) => void,
    onUpdateSimulations: (config: SimulationConfig) => void,
    onUpdateEndDate: (val: string) => void,
    onUpdateRevision: (config: SimpleActivityConfig) => void,
    onUpdateWriting: (config: SimpleActivityConfig) => void,
    onUpdateCorrectionComplete: (config: FixedActivityConfig) => void,
    onUpdateCorrectionFragmented: (config: FixedActivityConfig) => void,
    onUpdateGapsComplete: (config: FixedActivityConfig) => void,
    onUpdateGapsFragmented: (config: FixedActivityConfig) => void,
    onUpdateFreeDays: (days: string[]) => void,
    onBack: () => void,
    onGenerate: () => void
}) => {
    
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const shortDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    // Componente simples para Revisão e Redação (sem datas e intensificação)
    const renderSimpleActivityConfig = (title: string, icon: any, colorClass: string, config: SimpleActivityConfig, updateFn: (c: SimpleActivityConfig) => void) => {
        const colorName = colorClass.split('-')[1];
        const gradientColors: {[key: string]: string} = {
            'pink': 'from-pink-500 to-rose-600',
            'blue': 'from-emerald-500 to-indigo-600'
        };
        
        return (
            <div className={`bg-white p-4 rounded-lg shadow border-2 transition-all ${
                config.enabled ? `border-${colorName}-200` : 'border-gray-100'
            }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${gradientColors[colorName] || 'from-gray-500 to-gray-600'} rounded-xl flex items-center justify-center shadow-md`}>
                            {React.cloneElement(icon, { className: 'w-5 h-5 text-white' })}
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={config.enabled}
                            onChange={(e) => updateFn({...config, enabled: e.target.checked})}
                            className="sr-only peer"
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${colorName}-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${colorName}-500`}></div>
                    </label>
                </div>
            {config.enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Dias:</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {shortDays.map((d, i) => {
                                const isSelected = config.durations[i] !== undefined && config.durations[i] > 0;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            const newDurations = { ...config.durations };
                                            if (isSelected) delete newDurations[i];
                                            else newDurations[i] = 60;
                                            updateFn({...config, durations: newDurations});
                                        }}
                                        className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${isSelected ? `bg-${colorClass.split('-')[1]}-500 text-white` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="space-y-3 pl-1">
                            {Object.entries(config.durations).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([dayIdxStr, duration]) => {
                                const dayIdx = parseInt(dayIdxStr);
                                return (
                                    <div key={dayIdx} className={`p-2 rounded-md border bg-${colorClass.split('-')[1]}-50 border-${colorClass.split('-')[1]}-100`}>
                                        <div className={`flex justify-between text-xs font-semibold mb-1 text-${colorClass.split('-')[1]}-700`}>
                                            <span>{dayNames[dayIdx]}</span>
                                            <span>{duration} min</span>
                                        </div>
                                        <input 
                                            type="range" min="15" max="240" step="15"
                                            value={duration}
                                            onChange={(e) => {
                                                const newDurations = { ...config.durations, [dayIdx]: parseInt(e.target.value) };
                                                updateFn({...config, durations: newDurations});
                                            }}
                                            className={`w-full h-1.5 accent-${colorClass.split('-')[1]}-500`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            </div>
        );
    };

    // Componente avançado para Correção e Lacunas (com datas e intensificação)
    // showEndDate: true para versões Fragmentado (que têm data de término)
    const renderAdvancedActivityConfig = (title: string, icon: any, colorClass: string, config: FixedActivityConfig, updateFn: (c: FixedActivityConfig) => void, showEndDate: boolean = false) => {
        const addIntensification = () => {
            const newIntensifications = [...config.intensifications, { startDate: '', days: [], durations: {} }];
            updateFn({...config, intensifications: newIntensifications});
        };

        const removeIntensification = (index: number) => {
            if (config.intensifications.length > 1) {
                const newIntensifications = config.intensifications.filter((_, i) => i !== index);
                updateFn({...config, intensifications: newIntensifications});
            }
        };

        const updateIntensification = (index: number, field: string, value: any) => {
            const newIntensifications = [...config.intensifications];
            newIntensifications[index] = { ...newIntensifications[index], [field]: value };
            updateFn({...config, intensifications: newIntensifications});
        };

        const toggleDay = (intensIdx: number, dayIdx: number) => {
            const intens = config.intensifications[intensIdx];
            const isSelected = intens.days.includes(dayIdx);
            const newDays = isSelected
                ? intens.days.filter(x => x !== dayIdx)
                : [...intens.days, dayIdx];
            
            // Atualizar durações junto com os dias em uma única chamada
            const newDurations = { ...(intens.durations || {}) };
            if (!isSelected) {
                // Adicionando dia - definir duração padrão de 60 min
                newDurations[dayIdx] = 60;
            } else {
                // Removendo dia - remover duração
                delete newDurations[dayIdx];
            }
            
            // Atualizar tudo de uma vez
            const newIntensifications = [...config.intensifications];
            newIntensifications[intensIdx] = { 
                ...newIntensifications[intensIdx], 
                days: newDays, 
                durations: newDurations 
            };
            updateFn({...config, intensifications: newIntensifications});
        };

        const updateDuration = (intensIdx: number, dayIdx: number, duration: number) => {
            const intens = config.intensifications[intensIdx];
            const newDurations = { ...(intens.durations || {}), [dayIdx]: duration };
            updateIntensification(intensIdx, 'durations', newDurations);
        };

        const colorName = colorClass.split('-')[1];
        const gradientColors: {[key: string]: string} = {
            'purple': 'from-purple-500 to-violet-600',
            'yellow': 'from-yellow-500 to-amber-600'
        };

        return (
            <div className={`bg-white p-4 rounded-lg shadow border-2 transition-all ${
                config.enabled ? `border-${colorName}-200` : 'border-gray-100'
            }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${gradientColors[colorName] || 'from-gray-500 to-gray-600'} rounded-xl flex items-center justify-center shadow-md`}>
                            {React.cloneElement(icon, { className: 'w-5 h-5 text-white' })}
                        </div>
                        <h2 className="text-base font-bold text-gray-800">{title}</h2>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={config.enabled}
                            onChange={(e) => updateFn({...config, enabled: e.target.checked})}
                            className="sr-only peer"
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${colorName}-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${colorName}-500`}></div>
                    </label>
                </div>
                {config.enabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        {/* Datas de início e término (término apenas para versões Fragmentado) */}
                        <div className={showEndDate ? "grid grid-cols-2 gap-4" : ""}>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Data de Início:</label>
                                <input 
                                    type="date"
                                    value={config.startDate || ''}
                                    onChange={(e) => updateFn({...config, startDate: e.target.value || null})}
                                    className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
                                />
                            </div>
                            {showEndDate && (
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Data de Término:</label>
                                    <input 
                                        type="date"
                                        value={config.endDate || ''}
                                        onChange={(e) => updateFn({...config, endDate: e.target.value || null})}
                                        className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Períodos de intensificação */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">Períodos de Frequência:</label>
                                <button
                                    onClick={addIntensification}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-medium flex items-center gap-1"
                                >
                                    + Adicionar Período
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 italic">Obs: Cada novo período substitui o anterior (não acumula).</p>

                            {config.intensifications.map((intens, intensIdx) => (
                                <div key={intensIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-gray-700">
                                            {intensIdx === 0 ? 'Frequência Inicial' : `Intensificação ${intensIdx}`}
                                        </span>
                                        {intensIdx > 0 && (
                                            <button
                                                onClick={() => removeIntensification(intensIdx)}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {intensIdx > 0 && (
                                        <div className="mb-3">
                                            <label className="block text-xs text-gray-600 mb-1">A partir de:</label>
                                            <input 
                                                type="date"
                                                value={intens.startDate || ''}
                                                onChange={(e) => updateIntensification(intensIdx, 'startDate', e.target.value)}
                                                className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="block text-xs text-gray-600 mb-1">Dias da semana:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {shortDays.map((d, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => toggleDay(intensIdx, i)}
                                                    className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${intens.days.includes(i) ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Durações por dia */}
                                    {intens.days.length > 0 && (
                                        <div className="space-y-2">
                                            {intens.days.sort((a, b) => a - b).map(dayIdx => (
                                                <div key={dayIdx} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                                                    <span className="text-xs font-medium text-gray-600 w-16">{dayNames[dayIdx]}</span>
                                                    <input 
                                                        type="range" min="15" max="240" step="15"
                                                        value={intens.durations?.[dayIdx] || 60}
                                                        onChange={(e) => updateDuration(intensIdx, dayIdx, parseInt(e.target.value))}
                                                        className="flex-1 h-1.5"
                                                    />
                                                    <span className="text-xs font-bold text-gray-700 w-12 text-right">{intens.durations?.[dayIdx] || 60} min</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Componente de seleção de datas livres
    const FreeDaysSelector = () => {
        const [tempDate, setTempDate] = useState("");
        const addDate = () => {
            if (tempDate && !state.freeDays.includes(tempDate)) {
                onUpdateFreeDays([...state.freeDays, tempDate]);
                setTempDate("");
            }
        };
        const removeDate = (dateToRemove: string) => {
            onUpdateFreeDays(state.freeDays.filter(d => d !== dateToRemove));
        };

        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <CalendarOff className="text-gray-600 w-5 h-5" />
                        Dias Livres
                    </h2>
                </div>
                <p className="text-sm text-gray-600 mb-3">Selecione datas em que você não poderá estudar (feriados, viagens, etc).</p>
                
                <div className="flex gap-2 mb-4">
                    <input 
                        type="date" 
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm flex-1"
                    />
                    <button 
                        onClick={addDate}
                        className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-900"
                    >
                        Adicionar
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {state.freeDays.map(date => (
                        <div key={date} className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-2 border border-gray-200">
                            {new Date(date).toLocaleDateString('pt-BR')}
                            <button onClick={() => removeDate(date)} className="text-gray-400 hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {state.freeDays.length === 0 && <span className="text-xs text-gray-400 italic">Nenhum dia livre adicionado.</span>}
                </div>
            </div>
        );
    };

    // Calcular total de horas semanais (com verificação de segurança)
    const weeklyHoursArray = Array.isArray(state.weeklyHours) ? state.weeklyHours : [0, 2, 2, 2, 2, 6, 0];
    const totalWeeklyHours = weeklyHoursArray.reduce((acc, h) => acc + h, 0);
    const activitiesCount = [
        state.revision.enabled,
        state.writing.enabled,
        state.simulations.enabled,
        state.correctionComplete.enabled,
        state.correctionFragmented.enabled,
        state.gapsComplete.enabled,
        state.gapsFragmented.enabled
    ].filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header Principal - Estilo Estudos/Metas */}
            <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-lg p-4 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow">
                            <Settings className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Configurações</h1>
                            <p className="text-green-100 text-sm mt-1">Defina sua disponibilidade e atividades extras ⚙️</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                            <span className="text-xs font-medium text-green-100 uppercase tracking-wider block">Horas/Semana</span>
                            <span className="text-2xl font-bold text-white">{totalWeeklyHours}h</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                            <span className="text-xs font-medium text-green-100 uppercase tracking-wider block">Atividades</span>
                            <span className="text-2xl font-bold text-white">{activitiesCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Disponibilidade Semanal */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Disponibilidade Semanal</h2>
                        <p className="text-gray-500 text-sm">Quantas horas você pode estudar em cada dia da semana?</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {dayNames.map((day, idx) => {
                        const hours = state.weeklyHours[idx];
                        const isActive = hours > 0;
                        return (
                            <div key={day} className={`p-4 rounded-xl border-2 transition-all ${
                                isActive 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-gray-50 border-gray-100'
                            }`}>
                                <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${
                                    isActive ? 'text-emerald-600' : 'text-gray-400'
                                }`}>{day.slice(0, 3)}</label>
                                <div className="text-center mb-2">
                                    <span className={`text-2xl font-bold ${
                                        isActive ? 'text-emerald-600' : 'text-gray-300'
                                    }`}>{hours}</span>
                                    <span className={`text-sm ${
                                        isActive ? 'text-emerald-400' : 'text-gray-300'
                                    }`}>h</span>
                                </div>
                                <input 
                                    type="range" min="0" max="15" step="0.5"
                                    value={hours}
                                    onChange={(e) => onUpdateHours(idx, parseFloat(e.target.value))}
                                    className="w-full h-2 accent-emerald-600 cursor-pointer"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <FreeDaysSelector />

            {/* Revisão e Redação - configuração simples */}
            <div className="grid md:grid-cols-2 gap-4">
                {renderSimpleActivityConfig("Revisão", <Repeat className="text-pink-500 w-5 h-5" />, "text-pink-500", state.revision, onUpdateRevision)}
                {renderSimpleActivityConfig("Redação", <Edit3 className="text-emerald-500 w-5 h-5" />, "text-emerald-500", state.writing, onUpdateWriting)}
            </div>

            {/* Configuração de Simulados - movido para cima */}
            <SimulationConfigSection 
                state={state} 
                onUpdateSimulations={onUpdateSimulations} 
                dayNames={dayNames}
                shortDays={shortDays}
            />

            {/* Correção de Simulado Completo | Preenchimento de Lacunas - Completo */}
            <div className="grid md:grid-cols-2 gap-4">
                {renderAdvancedActivityConfig("Correção de Simulado Completo", <CheckCheck className="text-purple-600 w-5 h-5" />, "text-purple-600", state.correctionComplete, onUpdateCorrectionComplete)}
                {renderAdvancedActivityConfig("Preenchimento de Lacunas - Completo", <PenTool className="text-yellow-600 w-5 h-5" />, "text-yellow-600", state.gapsComplete, onUpdateGapsComplete)}
            </div>

            {/* Correção de Simulado Fragmentado | Preenchimento de Lacunas - Fragmentado */}
            <div className="grid md:grid-cols-2 gap-4">
                {renderAdvancedActivityConfig("Correção de Simulado Fragmentado", <CheckCheck className="text-purple-400 w-5 h-5" />, "text-purple-400", state.correctionFragmented, onUpdateCorrectionFragmented, true)}
                {renderAdvancedActivityConfig("Preenchimento de Lacunas - Fragmentado", <PenTool className="text-yellow-400 w-5 h-5" />, "text-yellow-400", state.gapsFragmented, onUpdateGapsFragmented, true)}
            </div>

            {/* Data Limite */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow">
                        <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Data Limite (Opcional)</h2>
                        <p className="text-gray-500 text-sm">Defina uma data final para seu cronograma</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-gray-50 p-4 rounded-xl">
                    <input 
                        type="date"
                        className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full sm:w-auto focus:border-emerald-500 focus:outline-none transition-colors"
                        onChange={(e) => onUpdateEndDate(e.target.value)}
                        value={state.endDate || ''}
                    />
                    <span className="text-sm text-gray-500">
                        💡 Se deixado em branco, o sistema gerará o cronograma até concluir todos os tópicos.
                    </span>
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-between pt-4">
                <button 
                    onClick={onBack} 
                    className="group text-gray-600 hover:text-gray-800 px-4 py-3 font-semibold flex items-center gap-2 rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
                >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                        <ChevronLeft className="w-5 h-5" />
                    </div>
                    Voltar
                </button>
                <button 
                    onClick={onGenerate} 
                    className="group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-10 py-4 rounded-lg font-bold text-lg flex items-center gap-3 transition-all shadow-sm shadow-green-300/50 hover:shadow-sm hover:shadow-green-400/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <RefreshCw className="w-6 h-6" /> 
                    Gerar Cronograma
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        ✨
                    </div>
                </button>
            </div>
        </div>
    );
};

// --- COMPONENTE DE CALENDÁRIO ---
const CalendarView = ({ schedule, onToggleCheck, checkedItems }: { schedule: any[], onToggleCheck: (id: string, originalIndex?: number) => void, checkedItems: Set<string> }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<any | null>(null);
    const [calendarType, setCalendarType] = useState<'month' | 'week'>('month');

    const selectedDayData = useMemo(() => {
        if (!selectedDate) return null;
        return schedule.find(d => 
            d.date.getDate() === selectedDate.getDate() &&
            d.date.getMonth() === selectedDate.getMonth() &&
            d.date.getFullYear() === selectedDate.getFullYear()
        );
    }, [selectedDate, schedule]);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const handlePrev = () => {
        if (calendarType === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
        }
        setSelectedDate(null);
    };

    const handleNext = () => {
        if (calendarType === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
        }
        setSelectedDate(null);
    };

    const renderMonthGrid = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100 rounded-lg"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayData = schedule.find(d => 
                d.date.getDate() === day &&
                d.date.getMonth() === date.getMonth() &&
                d.date.getFullYear() === date.getFullYear()
            );
            const uniqueSubjects = dayData ? Array.from(new Set(dayData.tasks.map((t: any) => t.subject))) : [];
            const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth();

            days.push(
                <div key={day} onClick={() => setSelectedDate(date)} className={`h-24 border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${isSelected ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>{day}</span>
                        {dayData && <span className="text-[10px] text-gray-400">{dayData.tasks.reduce((acc:number,t:any)=>acc+t.duration,0)}m</span>}
                    </div>
                    <div className="flex gap-1 flex-wrap content-end">
                        {uniqueSubjects.slice(0, 5).map((subj: any, idx) => {
                            const style = getSubjectStyle(subj);
                            return <div key={idx} className={`w-2 h-2 rounded-full ${style.dot}`} title={subj}></div>;
                        })}
                        {uniqueSubjects.length > 5 && <span className="text-[9px] text-gray-400 leading-none">+</span>}
                    </div>
                </div>
            );
        }
        return days;
    };

    const renderWeekGrid = () => {
        const curr = new Date(currentDate);
        const first = curr.getDate() - curr.getDay(); 
        const weekStart = new Date(curr.setDate(first));
        const weekDays = [];
        for(let i=0; i<7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const dayData = schedule.find(d => d.date.getDate() === dayDate.getDate() && d.date.getMonth() === dayDate.getMonth() && d.date.getFullYear() === dayDate.getFullYear());

            weekDays.push(
                <div key={i} className="flex flex-col gap-2 min-w-[200px] md:min-w-0">
                    <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">{dayDate.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                        <div className="text-lg font-bold text-gray-800">{dayDate.getDate()}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {dayData ? (
                            dayData.tasks.map((task: any, idx: number) => {
                                const style = getSubjectStyle(task.subject);
                                // IMPORTANTE: Usar dayData.date (a mesma referência do schedule) para gerar o taskId
                                // Isso garante consistência com as outras visualizações (lista e mensal)
                                const taskId = `${dayData.date.toISOString()}-${idx}`;
                                const isChecked = checkedItems.has(taskId);
                                return (
                                    <div key={idx} onClick={() => onToggleCheck(taskId, task.originalIndex)} className={`p-2 rounded-lg border-l-4 shadow-sm cursor-pointer transition-all ${style.bg} ${style.border} ${isChecked ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${style.badge}`}>{task.subject}</span>
                                            {isChecked ? <CheckSquare className="w-4 h-4 text-green-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                                        </div>
                                        <p className={`text-xs font-medium text-gray-800 line-clamp-3 mb-1 ${isChecked ? 'line-through' : ''}`}>{task.name}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500"><Clock className="w-3 h-3" />{task.duration} min</div>
                                    </div>
                                );
                            })
                        ) : <div className="p-4 text-center text-xs text-gray-400 italic border border-dashed border-gray-200 rounded-lg">Dia livre</div>}
                    </div>
                </div>
            );
        }
        return <div className="grid grid-cols-1 md:grid-cols-7 gap-4">{weekDays}</div>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                    <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                    <h3 className="text-lg font-bold text-gray-800 whitespace-nowrap min-w-[140px] text-center">
                        {calendarType === 'month' ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : `Semana de ${currentDate.getDate()} ${monthNames[currentDate.getMonth()].slice(0,3)}`}
                    </h3>
                    <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                    <button onClick={() => { setCalendarType('month'); setSelectedDate(null); }} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${calendarType === 'month' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mensal</button>
                    <button onClick={() => { setCalendarType('week'); setSelectedDate(null); }} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${calendarType === 'week' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Semanal</button>
                </div>
            </div>
            {calendarType === 'month' ? (
                <>
                    <div className="grid grid-cols-7 gap-2">
                        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase py-2">{d}</div>)}
                        {renderMonthGrid()}
                    </div>
                    {selectedDate && (
                        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 animate-in slide-in-from-top-4 fade-in duration-300">
                            <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-emerald-600" /> Detalhes do dia {selectedDate.toLocaleDateString('pt-BR')}</h4>
                            {!selectedDayData ? <p className="text-gray-500 text-sm">Nenhuma atividade planejada para este dia.</p> : (
                                <div className="space-y-3">
                                    <div className="text-sm text-gray-500 mb-2">Tempo total: {selectedDayData.tasks.reduce((acc: number, t: any) => acc + t.duration, 0)} minutos</div>
                                    {selectedDayData.tasks.map((task: any, idx: number) => {
                                        const style = getSubjectStyle(task.subject);
                                        const taskId = `${selectedDayData.date.toISOString()}-${idx}`;
                                        const isChecked = checkedItems.has(taskId);
                                        return (
                                            <div key={idx} onClick={() => onToggleCheck(taskId, task.originalIndex)} className={`flex items-center justify-between p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 ${style.bg} ${style.border} ${isChecked ? 'opacity-50 grayscale' : ''}`}>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${style.badge}`}>{task.subject}</span>
                                                        {task.front && <span className="text-xs text-gray-500">• {task.front}</span>}
                                                    </div>
                                                    <div className={`font-medium text-gray-800 text-sm mt-1 ${isChecked ? 'line-through' : ''}`}>{task.name}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-medium bg-white/50 px-2 py-1 rounded text-gray-600">{task.duration} min</span>
                                                    {isChecked ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : <div className="overflow-x-auto pb-4">{renderWeekGrid()}</div>}
        </div>
    );
};

// Componente para Etapa 4: Resultado
const ScheduleView = ({ 
    schedule, 
    onReconfigure, 
    onRecalculate, 
    onSave,
    isSaving,
    userEndDate, 
    allTopicsFit,
    remainingTopicsCount,
    remainingTopicsList,
    checkedItems,
    onToggleCheck
}: { 
    schedule: any[], 
    onReconfigure: () => void, 
    onRecalculate: (checked: Set<string>) => void, 
    onSave: () => void,
    isSaving: boolean,
    userEndDate: string | null, 
    allTopicsFit: boolean,
    remainingTopicsCount: number,
    remainingTopicsList: Topic[],
    checkedItems: Set<string>,
    onToggleCheck: (taskId: string) => void
}) => {
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [showMissingModal, setShowMissingModal] = useState(false);

    // Formatando a data final real do cronograma
    const finalDateFormatted = schedule.length > 0 
        ? schedule[schedule.length - 1].date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'N/A';

    const toggleCheck = (taskId: string) => {
        onToggleCheck(taskId);
    };

    const handleRecalculate = () => {
        if(window.confirm("Isso irá remover os itens concluídos e reorganizar os atrasados a partir de hoje. Continuar?")) {
            onRecalculate(checkedItems);
        }
    };
    
    // Group remaining topics by subject for the modal
    const groupedMissing = useMemo(() => {
        const g: {[key: string]: Topic[]} = {};
        remainingTopicsList.forEach(t => {
            if (!g[t.subject]) g[t.subject] = [];
            g[t.subject].push(t);
        });
        return g;
    }, [remainingTopicsList]);

    return (
        <div className="space-y-6">
            
            {/* Aviso de Prazo Insuficiente */}
            {!allTopicsFit && userEndDate && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold text-yellow-800">Atenção: Tempo insuficiente</h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    O tempo disponível até a data limite ({new Date(userEndDate).toLocaleDateString('pt-BR')}) não é suficiente para cobrir todos os tópicos selecionados com a carga horária atual.
                                </p>
                                <p className="text-sm font-bold text-red-600 mt-2">
                                    {remainingTopicsCount} tópicos ficaram de fora do cronograma.
                                </p>
                                <p className="text-sm font-semibold text-yellow-800 mt-2">Recomendamos:</p>
                                <ul className="list-disc list-inside text-sm text-yellow-700 ml-1">
                                    <li>Aumentar as horas de estudo diárias nos ajustes.</li>
                                    <li>Desmarcar tópicos menos prioritários na seleção.</li>
                                    <li>Estender a data de término do cronograma.</li>
                                </ul>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowMissingModal(true)}
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold py-2 px-4 rounded border border-yellow-300 flex items-center gap-2 transition-colors whitespace-nowrap self-start sm:self-center"
                        >
                            <Eye className="w-4 h-4" />
                            Ver tópicos não agendados
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Tópicos Faltantes */}
            {showMissingModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-sm w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Tópicos Não Agendados ({remainingTopicsCount})
                            </h3>
                            <button onClick={() => setShowMissingModal(false)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <p className="text-sm text-gray-600 mb-4">
                                Os seguintes conteúdos não couberam no cronograma até a data limite de {new Date(userEndDate!).toLocaleDateString('pt-BR')}:
                            </p>
                            <div className="space-y-4">
                                {Object.keys(groupedMissing).map(subject => (
                                    <div key={subject} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2 font-semibold text-sm text-gray-700 border-b border-gray-200 flex justify-between">
                                            <span>{subject}</span>
                                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">{groupedMissing[subject].length} itens</span>
                                        </div>
                                        <div className="p-3 text-sm text-gray-600 space-y-1">
                                            {groupedMissing[subject].map((t, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <span className="text-red-400 mt-1">•</span>
                                                    <span>{t.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-lg">
                            <button 
                                onClick={() => setShowMissingModal(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-medium text-sm transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header com gradiente - padrão da plataforma */}
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-lg p-4 shadow-sm border border-purple-100/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow shadow-purple-200">
                            <CalendarIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Seu Cronograma</h1>
                            <p className="text-gray-600 text-sm">
                                {schedule.length} dias de estudo • <span className="font-semibold text-purple-600">Até {finalDateFormatted}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de ações */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-start">
                    <button onClick={handleRecalculate} className="bg-orange-100 text-orange-700 px-4 py-2.5 rounded-xl font-medium hover:bg-orange-200 transition-all flex items-center gap-2 justify-center">
                        <RotateCcw className="w-4 h-4" /> Recalcular Rota
                    </button>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}><ListIcon className="w-4 h-4" /> Lista</button>
                        <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white text-purple-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}><LayoutGrid className="w-4 h-4" /> Calendário</button>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
                    <button onClick={onReconfigure} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-all">Reconfigurar</button>
                    <button 
                        onClick={onSave} 
                        disabled={isSaving}
                        className="bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow shadow-purple-200"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="grid gap-4">
                    {schedule.length === 0 ? <div className="text-center p-12 bg-white rounded-lg border border-gray-200"><AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" /><h3 className="text-lg font-semibold">Nenhum dia gerado</h3></div> : (
                        schedule.map((day, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
                                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded text-sm uppercase">{day.date.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                                        <span className="font-semibold text-gray-900">{day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{day.tasks.reduce((acc: number, t: any) => acc + t.duration, 0)} min totais</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    {day.tasks.map((task: any, j: number) => {
                                        const style = getSubjectStyle(task.subject);
                                        const taskId = `${day.date.toISOString()}-${j}`;
                                        const isChecked = checkedItems.has(taskId);
                                        return (
                                            <div key={j} onClick={() => toggleCheck(taskId)} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 ${style.bg} ${style.border} ${isChecked ? 'opacity-50 grayscale' : ''}`}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${style.badge}`}>{task.subject}</span>
                                                        {task.front && <span className="text-xs text-gray-500">• {task.front}</span>}
                                                    </div>
                                                    <h4 className={`font-medium text-gray-800 leading-tight ${isChecked ? 'line-through' : ''}`}>{task.name}</h4>
                                                </div>
                                                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                                    <div className="flex items-center gap-1 text-sm text-gray-600 font-medium whitespace-nowrap bg-white/50 px-2 py-1 rounded"><Clock className="w-4 h-4" />{task.duration} min</div>
                                                    {isChecked ? <CheckSquare className="w-6 h-6 text-green-600" /> : <Square className="w-6 h-6 text-gray-400" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <CalendarView schedule={schedule} onToggleCheck={(id, originalIndex) => toggleCheck(id)} checkedItems={checkedItems} />
            )}
        </div>
    );
};

// --- ALGORITMO DE GERAÇÃO ---
const generateSchedule = (state: AppState): ScheduleResult => {
    // 1. Preparar Tópicos (Filtrar Completos)
    const topicsToStudy = state.topics
        .map((topic, index) => ({
            ...topic,
            originalIndex: index,
            pref: state.topicPrefs[`topic-${index}`]
        }))
        .filter(t => t.pref && t.pref.included && !state.completedTopics.has(t.originalIndex)) 
        .map(t => {
            const duration = getTopicDuration(t.subject, t.pref.difficulty);
            return {
                ...t,
                timeNeeded: duration
            };
        });
    
    // Agrupar por matéria
    const topicsBySubject: {[key: string]: typeof topicsToStudy} = {};
    topicsToStudy.forEach(t => {
        if (!topicsBySubject[t.subject]) topicsBySubject[t.subject] = [];
        topicsBySubject[t.subject].push(t);
    });

    const getWeeklyBudget = () => {
        const totalWeeklyMinutes = Object.values(state.weeklyHours).reduce((sum, h) => sum + (h * 60), 0);
        const scaleFactor = totalWeeklyMinutes > 0 ? totalWeeklyMinutes / 2160 : 0;
        const budget: {[key: string]: number} = {};
        for (const [sub, min] of Object.entries(idealWeeklyTargets)) {
            budget[sub] = Math.floor(min * scaleFactor);
        }
        return budget;
    };

    const currentDate = new Date(); 
    currentDate.setHours(0,0,0,0);
    const endDate = state.endDate ? new Date(state.endDate + 'T23:59:59') : null;
    const totalDurationDays = endDate ? (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24) : 365;

    // Datas relativas
    const linguagensStartDate = new Date(currentDate.getTime() + totalDurationDays * 0.1 * 86400000);
    const filosofiaStartDate = new Date(currentDate.getTime() + totalDurationDays * 0.2 * 86400000);
    const sociologiaStartDate = new Date(filosofiaStartDate.getTime() + (30 * 86400000)); 

    const schedule = [];
    let dayIndex = 0;
    // O array topicsToStudy é mutado (shift), mas vamos controlar pela soma total
    let topicsRemaining = true;
    let allTopicsFit = true;
    const lastStudiedDay: {[key: string]: number} = {};
    let weeklyBudget = getWeeklyBudget();

    // Verificação de segurança para loop infinito
    const MAX_DAYS = 2000;

    // Array para guardar os que não couberam
    const remainingTopicsList: Topic[] = [];

    while (topicsRemaining) {
        // Verificar se ainda há tópicos em alguma matéria
        const hasTopics = Object.values(topicsBySubject).some(arr => arr.length > 0);
        if (!hasTopics) {
            topicsRemaining = false;
            break;
        }

        const studyDate = new Date(currentDate);
        studyDate.setDate(studyDate.getDate() + dayIndex);
        
        if (studyDate.getDay() === 0) {
            weeklyBudget = getWeeklyBudget();
        }

        // --- Lógica de Dias Livres ---
        // Verifica se a data atual está na lista de dias livres
        const dateString = studyDate.toISOString().split('T')[0];
        if (state.freeDays.includes(dateString)) {
            schedule.push({ 
                date: studyDate, 
                tasks: [{ 
                    name: "Dia Livre", 
                    duration: 0, 
                    subject: "Dia Livre", 
                    type: "free" 
                }] 
            });
            dayIndex++;
            continue; // Pula para o próximo dia
        }

        // STOP condition: Se temos uma data final E passamos dela
        if (endDate && studyDate > endDate) {
            allTopicsFit = false; 
            // Coletar todos os tópicos que sobraram
            Object.values(topicsBySubject).forEach(arr => remainingTopicsList.push(...arr));
            break;
        }
        
        if (dayIndex > MAX_DAYS) {
            // Safety break 
            break;
        }

        let dailyMinutes = (state.weeklyHours[studyDate.getDay()] || 0) * 60;
        const dayTasks = [];
        const dayOfWeek = studyDate.getDay();

        // 1. Prioridade: Simulados (com datas e intensificação)
        let isSimuladoCompleto = false;
        if (state.simulations.enabled) {
            // Função auxiliar para verificar se um dia está ativo considerando intensificações
            const getActiveSimDays = (config: { startDate: string | null, endDate?: string | null, intensifications: Array<{ startDate: string, days: number[] }> }) => {
                // Verificar data de início geral
                if (config.startDate && studyDate < new Date(config.startDate + 'T00:00:00')) return [];
                // Verificar data de término (se existir)
                if (config.endDate && studyDate > new Date(config.endDate + 'T23:59:59')) return [];
                
                // Encontrar o período de intensificação ativo
                let activeDays: number[] = [];
                for (let i = config.intensifications.length - 1; i >= 0; i--) {
                    const intens = config.intensifications[i];
                    if (i === 0 || (intens.startDate && studyDate >= new Date(intens.startDate + 'T00:00:00'))) {
                        activeDays = intens.days;
                        break;
                    }
                }
                return activeDays;
            };

            // Simulado Completo
            const completeDays = getActiveSimDays(state.simulations.complete);
            if (completeDays.includes(dayOfWeek)) {
                const duration = 330; 
                if (dailyMinutes >= duration) {
                    dailyMinutes -= duration;
                    dayTasks.push({ name: "Simulado Completo ENEM", duration, subject: "Simulado", type: "simulado_completo" });
                    isSimuladoCompleto = true;
                }
            } 
            // Simulado Fragmentado (apenas se não for dia de simulado completo)
            if (!isSimuladoCompleto) {
                const fragmentedDays = getActiveSimDays(state.simulations.fragmented);
                if (fragmentedDays.includes(dayOfWeek)) {
                    const duration = 150; 
                    if (dailyMinutes >= duration) {
                        dailyMinutes -= duration;
                        dayTasks.push({ name: "Simulado Fragmentado", duration, subject: "Simulado", type: "simulado_fragmentado" });
                    }
                }
            }
        }

        // Função auxiliar para obter duração de atividades com intensificação
        // A intensificação SUBSTITUI a frequência anterior (não adiciona)
        // Para versões "Completo": não usa endDate - as intensificações controlam as mudanças de cenário
        // Para versões "Fragmentado": usa endDate para definir quando a atividade termina
        const getActivityDuration = (config: FixedActivityConfig, dayOfWeek: number, checkEndDate: boolean = false): number => {
            // Verificar data de início
            if (config.startDate && studyDate < new Date(config.startDate + 'T00:00:00')) return 0;
            // Verificar data de término (apenas para versões Fragmentado)
            if (checkEndDate && config.endDate && studyDate > new Date(config.endDate + 'T23:59:59')) return 0;
            
            // Encontrar o período de intensificação mais recente que está ativo
            // A intensificação substitui completamente a frequência anterior
            for (let i = config.intensifications.length - 1; i >= 0; i--) {
                const intens = config.intensifications[i];
                // Verificar se este período está ativo (startDate passou ou é o período inicial)
                const isPeriodActive = i === 0 || (intens.startDate && studyDate >= new Date(intens.startDate + 'T00:00:00'));
                
                if (isPeriodActive) {
                    // Este é o período ativo mais recente - usar apenas ele
                    if (intens.days.includes(dayOfWeek)) {
                        return intens.durations?.[dayOfWeek] || 60;
                    }
                    return 0; // Dia não está no período ativo
                }
            }
            return 0;
        };

        // 2. Correção de Simulado Completo
        // CORREÇÃO: Atividades fixas são adicionadas INDEPENDENTEMENTE da disponibilidade semanal
        // Elas representam compromissos que o usuário configurou especificamente para esses dias
        if (state.correctionComplete.enabled) {
            const correctionDuration = getActivityDuration(state.correctionComplete, dayOfWeek);
            if (correctionDuration > 0) {
                // Adicionar a atividade mesmo se dailyMinutes for 0 ou insuficiente
                // O tempo será "extra" nesse dia, dedicado especificamente para esta atividade
                dayTasks.push({ name: "Correção de Simulado Completo", duration: correctionDuration, subject: "Correção de Simulado", type: "correction_complete" });
                // Subtrair do dailyMinutes apenas se houver tempo disponível
                dailyMinutes = Math.max(0, dailyMinutes - correctionDuration);
            }
        }

        // 2b. Correção de Simulado Fragmentado (usa endDate)
        if (state.correctionFragmented.enabled) {
            const correctionDuration = getActivityDuration(state.correctionFragmented, dayOfWeek, true);
            if (correctionDuration > 0) {
                dayTasks.push({ name: "Correção de Simulado Fragmentado", duration: correctionDuration, subject: "Correção de Simulado", type: "correction_fragmented" });
                dailyMinutes = Math.max(0, dailyMinutes - correctionDuration);
            }
        }

        // 3. Redação - NÃO adicionar em dias de Simulado Completo (ocupa quase todo o dia)
        if (state.writing.enabled && !isSimuladoCompleto) {
            const writingDuration = state.writing.durations[dayOfWeek] || 0;
            if (writingDuration > 0) {
                dayTasks.push({ name: "Prática de Redação", duration: writingDuration, subject: "Redação", type: "writing" });
                dailyMinutes = Math.max(0, dailyMinutes - writingDuration);
            }
        }

        // 4. Revisão - NÃO adicionar em dias de Simulado Completo (ocupa quase todo o dia)
        if (state.revision.enabled && !isSimuladoCompleto) {
            const revisionDuration = state.revision.durations[dayOfWeek] || 0;
            if (revisionDuration > 0) {
                dayTasks.push({ name: "Sessão de Revisão", duration: revisionDuration, subject: "Revisão", type: "revision" });
                dailyMinutes = Math.max(0, dailyMinutes - revisionDuration);
            }
        }

        // 5. Preenchimento de Lacunas - Completo
        if (state.gapsComplete.enabled) {
            const gapsDuration = getActivityDuration(state.gapsComplete, dayOfWeek);
            if (gapsDuration > 0) {
                dayTasks.push({ name: "Preenchimento de Lacunas - Completo", duration: gapsDuration, subject: "Preenchimento de Lacunas", type: "gaps_complete" });
                dailyMinutes = Math.max(0, dailyMinutes - gapsDuration);
            }
        }

        // 5b. Preenchimento de Lacunas - Fragmentado (usa endDate)
        if (state.gapsFragmented.enabled) {
            const gapsDuration = getActivityDuration(state.gapsFragmented, dayOfWeek, true);
            if (gapsDuration > 0) {
                dayTasks.push({ name: "Preenchimento de Lacunas - Fragmentado", duration: gapsDuration, subject: "Preenchimento de Lacunas", type: "gaps_fragmented" });
                dailyMinutes = Math.max(0, dailyMinutes - gapsDuration);
            }
        }

        // 6. Preencher com Estudo Regular
        const subjectsUsedToday = new Set();
        const limitSubjects = (studyDate.getDay() === 0 || studyDate.getDay() === 6) ? 3 : 5;

        while (dailyMinutes > 0 && subjectsUsedToday.size < limitSubjects) {
            let bestSubject = null;
            let bestScore = -Infinity;

            const availableSubjects = Object.keys(topicsBySubject).filter(s => topicsBySubject[s].length > 0);

            if (availableSubjects.length === 0) break; // Sem mais tópicos

            for (const subject of availableSubjects) {
                const nextTopic = topicsBySubject[subject][0];

                if (nextTopic.timeNeeded > dailyMinutes) continue;
                if (subjectsUsedToday.has(subject)) continue;
                if ((weeklyBudget[subject] || 0) <= 0) continue;

                const isWeekend = studyDate.getDay() === 0 || studyDate.getDay() === 6;
                
                // Regra: Bloqueia Mat/Fis se Fim de Semana OU Simulado Completo
                if ((isWeekend || isSimuladoCompleto) && (subject === "Matemática" || subject === "Física")) continue;

                if (subject === "Linguagens" && studyDate < linguagensStartDate) continue;
                if (subject === "Filosofia" && studyDate < filosofiaStartDate) continue;
                if (subject === "Sociologia" && studyDate < sociologiaStartDate) continue;

                const daysSince = dayIndex - (lastStudiedDay[subject] || -100);
                const budgetRatio = (weeklyBudget[subject] || 0) / (idealWeeklyTargets[subject] || 1);
                const score = (daysSince * 10) + (budgetRatio * 5);

                if (score > bestScore) {
                    bestScore = score;
                    bestSubject = subject;
                }
            }

            if (!bestSubject) break;

            const topicToAdd = topicsBySubject[bestSubject].shift();
            if (topicToAdd) {
                dayTasks.push({
                    name: topicToAdd.name,
                    duration: topicToAdd.timeNeeded,
                    subject: topicToAdd.subject,
                    front: topicToAdd.front,
                    type: "estudo",
                    originalIndex: topicToAdd.originalIndex 
                });

                dailyMinutes -= topicToAdd.timeNeeded;
                weeklyBudget[bestSubject] -= topicToAdd.timeNeeded;
                lastStudiedDay[bestSubject] = dayIndex;
                subjectsUsedToday.add(bestSubject);
            }
        }

        if (dayTasks.length > 0) {
            schedule.push({ date: studyDate, tasks: dayTasks });
        }

        dayIndex++;
    }
    
    return { schedule, remainingTopicsCount: remainingTopicsList.length, remainingTopicsList, allTopicsFit };
};

// --- COMPONENTE PRINCIPAL ---
export default function CronogramaDinamico() {
  const [state, setState] = useState<AppState>({
    step: 1,
    scheduleType: 'extensivo',
    topics: extensiveTopicsSource,
    topicPrefs: {},
    endDate: null,
    weeklyHours: { 0: 0, 1: 2, 2: 2, 3: 2, 4: 2, 5: 6, 6: 0 },
    simulations: { 
      enabled: false, 
      complete: { 
        startDate: null, 
        intensifications: [{ startDate: '', days: [] }] 
      }, 
      fragmented: { 
        startDate: null, 
        endDate: null, 
        intensifications: [{ startDate: '', days: [] }] 
      } 
    },
    revision: { enabled: false, durations: {} },
    writing: { enabled: false, durations: {} },
    correctionComplete: { enabled: false, startDate: null, endDate: null, intensifications: [{ startDate: '', days: [], durations: {} }] },
    correctionFragmented: { enabled: false, startDate: null, endDate: null, intensifications: [{ startDate: '', days: [], durations: {} }] },
    gapsComplete: { enabled: false, startDate: null, endDate: null, intensifications: [{ startDate: '', days: [], durations: {} }] },
    gapsFragmented: { enabled: false, startDate: null, endDate: null, intensifications: [{ startDate: '', days: [], durations: {} }] },
    freeDays: [],
    schedule: [],
    completedTopics: new Set()
  });
  
  // Novo estado para o alerta de prazo e lista de faltantes
  const [scheduleStatus, setScheduleStatus] = useState<{ allTopicsFit: boolean; remainingTopicsCount: number; remainingTopicsList: Topic[] }>({ allTopicsFit: true, remainingTopicsCount: 0, remainingTopicsList: [] });
  
  // Estados para salvamento e progresso
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [hasSavedSchedule, setHasSavedSchedule] = useState(false);

  // Função para obter o ID do aluno
  const getAlunoId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const alunoIdFromUrl = urlParams.get('alunoId');
    if (alunoIdFromUrl) return alunoIdFromUrl;
    return auth.currentUser?.uid || "";
  };

  // Carregar cronograma salvo ao montar o componente
  useEffect(() => {
    const loadSavedSchedule = async () => {
      try {
        const alunoId = getAlunoId();
        if (!alunoId) {
          setIsLoading(false);
          return;
        }

        const scheduleRef = doc(db, "alunos", alunoId, "cronograma", "dinamico");
        const scheduleDoc = await getDoc(scheduleRef);
        
        if (scheduleDoc.exists()) {
          const data = scheduleDoc.data();
          
          // Restaurar o schedule com as datas convertidas
          const restoredSchedule = data.schedule.map((day: any) => ({
            ...day,
            date: new Date(day.date)
          }));
          
          // Restaurar checkedItems
          const restoredCheckedItems = new Set<string>(data.checkedItems || []);
          
          // Restaurar completedTopics
          const restoredCompletedTopics = new Set<number>(data.completedTopics || []);
          
          // Restaurar topicPrefs
          const restoredTopicPrefs = data.topicPrefs || {};
          
          setState(prev => ({
            ...prev,
            schedule: restoredSchedule,
            topicPrefs: restoredTopicPrefs,
            completedTopics: restoredCompletedTopics,
            scheduleType: data.scheduleType || 'extensivo',
            endDate: data.endDate || null,
            weeklyHours: data.weeklyHours || prev.weeklyHours,
            simulations: data.simulations || prev.simulations,
            revision: data.revision || prev.revision,
            writing: data.writing || prev.writing,
            correctionComplete: data.correctionComplete || prev.correctionComplete,
            correctionFragmented: data.correctionFragmented || prev.correctionFragmented,
            gapsComplete: data.gapsComplete || prev.gapsComplete,
            gapsFragmented: data.gapsFragmented || prev.gapsFragmented,
            freeDays: data.freeDays || [],
            step: 4 // Ir direto para a visualização do cronograma
          }));
          
          setCheckedItems(restoredCheckedItems);
          setScheduleStatus({
            allTopicsFit: data.allTopicsFit ?? true,
            remainingTopicsCount: data.remainingTopicsCount ?? 0,
            remainingTopicsList: data.remainingTopicsList ?? []
          });
          setHasSavedSchedule(true);
        }
      } catch (error) {
        console.error('Erro ao carregar cronograma salvo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Aguardar autenticação antes de carregar
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadSavedSchedule();
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Função para salvar o cronograma no Firebase
  const handleSaveSchedule = async () => {
    try {
      setIsSaving(true);
      const alunoId = getAlunoId();
      
      if (!alunoId) {
        toast.error("Usuário não identificado");
        return;
      }

      // Converter schedule para formato salvável (datas como strings ISO)
      const scheduleToSave = state.schedule.map(day => ({
        ...day,
        date: day.date.toISOString()
      }));

      // Converter Sets para arrays para salvar no Firestore
      const dataToSave = {
        schedule: scheduleToSave,
        checkedItems: Array.from(checkedItems),
        completedTopics: Array.from(state.completedTopics),
        topicPrefs: state.topicPrefs,
        scheduleType: state.scheduleType,
        endDate: state.endDate,
        weeklyHours: state.weeklyHours,
        simulations: state.simulations,
        revision: state.revision,
        writing: state.writing,
        correctionComplete: state.correctionComplete,
        correctionFragmented: state.correctionFragmented,
        gapsComplete: state.gapsComplete,
        gapsFragmented: state.gapsFragmented,
        freeDays: state.freeDays,
        allTopicsFit: scheduleStatus.allTopicsFit,
        remainingTopicsCount: scheduleStatus.remainingTopicsCount,
        remainingTopicsList: scheduleStatus.remainingTopicsList,
        updatedAt: new Date().toISOString()
      };

      const scheduleRef = doc(db, "alunos", alunoId, "cronograma", "dinamico");
      await setDoc(scheduleRef, dataToSave, { merge: true });
      
      setHasSavedSchedule(true);
      toast.success("Cronograma salvo com sucesso!");
    } catch (error) {
      console.error('Erro ao salvar cronograma:', error);
      toast.error("Erro ao salvar cronograma");
    } finally {
      setIsSaving(false);
    }
  };

  // Função para alternar check de uma tarefa
  const handleToggleCheck = (taskId: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const initialPrefs: TopicPreferences = {};
    state.topics.forEach((t, i) => {
      initialPrefs[`topic-${i}`] = { included: true, difficulty: 2 };
    });
    setState(s => ({ ...s, topicPrefs: initialPrefs, completedTopics: new Set() }));
  }, [state.topics]); 

  const handleScheduleTypeChange = (type: ScheduleType) => {
      setState(s => ({
          ...s,
          scheduleType: type,
          topics: type === 'intensivo' ? intensiveTopicsSource : extensiveTopicsSource
      }));
  };

  const handleTopicToggle = (index: number) => {
    setState(prev => ({
      ...prev,
      topicPrefs: {
        ...prev.topicPrefs,
        [`topic-${index}`]: {
          ...prev.topicPrefs[`topic-${index}`],
          included: !prev.topicPrefs[`topic-${index}`].included
        }
      }
    }));
  };

  const handleToggleAll = (subject: string, indices: number[]) => {
      setState(prev => {
          const newPrefs = { ...prev.topicPrefs };
          const allSelected = indices.every(idx => newPrefs[`topic-${idx}`]?.included);
          const newState = !allSelected;
          indices.forEach(idx => {
              if (newPrefs[`topic-${idx}`]) {
                  newPrefs[`topic-${idx}`] = { ...newPrefs[`topic-${idx}`], included: newState };
              }
          });
          return { ...prev, topicPrefs: newPrefs };
      });
  };

  const handleDifficultyChange = (index: number, val: number) => {
    setState(prev => ({
      ...prev,
      topicPrefs: {
        ...prev.topicPrefs,
        [`topic-${index}`]: {
          ...prev.topicPrefs[`topic-${index}`],
          difficulty: val
        }
      }
    }));
  };

  const handleBulkDifficultyChange = (subject: string, val: number) => {
    setState(prev => {
        const newPrefs = { ...prev.topicPrefs };
        prev.topics.forEach((t, index) => {
            if (t.subject === subject) {
                if (newPrefs[`topic-${index}`]) {
                    newPrefs[`topic-${index}`] = {
                        ...newPrefs[`topic-${index}`],
                        difficulty: val
                    };
                }
            }
        });
        return { ...prev, topicPrefs: newPrefs };
    });
  };

  const runGeneration = () => {
    const { schedule, allTopicsFit, remainingTopicsCount, remainingTopicsList } = generateSchedule(state);
    setState(prev => ({ ...prev, schedule, step: 4 }));
    setScheduleStatus({ allTopicsFit, remainingTopicsCount, remainingTopicsList });
  };

  const handleRecalculate = (checkedIds: Set<string>) => {
      const newCompletedSet = new Set(state.completedTopics);
      
      state.schedule.forEach((day) => {
          day.tasks.forEach((task: any, idx: number) => {
              const taskId = `${day.date.toISOString()}-${idx}`;
              if (checkedIds.has(taskId)) {
                  if (task.originalIndex !== undefined) {
                      newCompletedSet.add(task.originalIndex);
                  }
              }
          });
      });

      setState(prev => {
          const newState = { ...prev, completedTopics: newCompletedSet };
          const { schedule, allTopicsFit, remainingTopicsCount, remainingTopicsList } = generateSchedule(newState);
          setScheduleStatus({ allTopicsFit, remainingTopicsCount, remainingTopicsList });
          return { ...newState, schedule };
      });
  };

  // Mostrar loading enquanto carrega o cronograma salvo
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando cronograma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-800 font-sans pb-12 print:bg-white">
      <div className="py-4">
        <StepIndicator step={state.step} />
        
        {state.step === 1 && (
            <TopicsStep 
                topics={state.topics}
                topicPrefs={state.topicPrefs}
                scheduleType={state.scheduleType}
                onScheduleTypeChange={handleScheduleTypeChange}
                onToggle={handleTopicToggle}
                onToggleAll={handleToggleAll}
                onDifficultyChange={handleDifficultyChange}
                onBulkDifficultyChange={handleBulkDifficultyChange}
                onNext={() => setState(s => ({...s, step: 2}))}
            />
        )}
        
        {state.step === 2 && (
            <SettingsStep 
                state={state}
                onUpdateHours={(idx, val) => setState(s => ({...s, weeklyHours: {...s.weeklyHours, [idx]: val}}))}
                onUpdateSimulations={(config) => setState(s => ({...s, simulations: config}))}
                onUpdateRevision={(config) => setState(s => ({...s, revision: config}))}
                onUpdateWriting={(config) => setState(s => ({...s, writing: config}))}
                onUpdateCorrectionComplete={(config) => setState(s => ({...s, correctionComplete: config}))}
                onUpdateCorrectionFragmented={(config) => setState(s => ({...s, correctionFragmented: config}))}
                onUpdateGapsComplete={(config) => setState(s => ({...s, gapsComplete: config}))}
                onUpdateGapsFragmented={(config) => setState(s => ({...s, gapsFragmented: config}))}
                onUpdateFreeDays={(days) => setState(s => ({...s, freeDays: days}))}
                onUpdateEndDate={(val) => setState(s => ({...s, endDate: val}))}
                onBack={() => setState(s => ({...s, step: 1}))}
                onGenerate={runGeneration}
            />
        )}
        
        {state.step === 4 && (
            <ScheduleView 
                schedule={state.schedule}
                userEndDate={state.endDate}
                allTopicsFit={scheduleStatus.allTopicsFit}
                remainingTopicsCount={scheduleStatus.remainingTopicsCount}
                remainingTopicsList={scheduleStatus.remainingTopicsList}
                onReconfigure={() => setState(s => ({...s, step: 2}))}
                onRecalculate={handleRecalculate}
                onSave={handleSaveSchedule}
                isSaving={isSaving}
                checkedItems={checkedItems}
                onToggleCheck={handleToggleCheck}
            />
        )}
      </div>
    </div>
  );
}