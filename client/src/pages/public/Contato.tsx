import { useState } from 'react';
import { Link } from 'wouter';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle2,
  HelpCircle,
  Bug,
  Lightbulb,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

type AssuntoType = 'duvida' | 'bug' | 'sugestao' | 'comercial' | 'outro';

export default function Contato() {
  const { appTitle, appLogo } = useBranding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: 'duvida' as AssuntoType,
    mensagem: '',
  });

  const assuntos = [
    { value: 'duvida', label: 'Dúvida', icon: HelpCircle },
    { value: 'bug', label: 'Reportar Bug', icon: Bug },
    { value: 'sugestao', label: 'Sugestão', icon: Lightbulb },
    { value: 'comercial', label: 'Comercial', icon: Building2 },
    { value: 'outro', label: 'Outro', icon: MessageSquare },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envio (em produção, integrar com backend)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Mensagem enviada com sucesso!');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Header */}
        <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src={appLogo} alt={appTitle} className="h-10 w-10 rounded-lg" />
              <span className="font-bold text-xl text-emerald-600">{appTitle}</span>
            </Link>
            <Link href="/login/aluno">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Entrar
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Mensagem Enviada!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Obrigado por entrar em contato. Responderemos sua mensagem em até 48 horas úteis.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">
                  Voltar ao Início
                </Button>
              </Link>
              <Button 
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ nome: '', email: '', assunto: 'duvida', mensagem: '' });
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Enviar Nova Mensagem
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            <Link href="/privacidade" className="text-sm font-medium text-gray-600 hover:text-emerald-600">Privacidade</Link>
            <Link href="/contato" className="text-sm font-medium text-emerald-600">Contato</Link>
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fale Conosco
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Tem alguma dúvida, sugestão ou precisa de ajuda? Estamos aqui para você!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Informações de Contato */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">E-mail</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        contato@plataformaorbita.com.br
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Tempo de Resposta</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Respondemos em até 48 horas úteis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Parceria Comercial</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Interessado em levar a {appTitle} para sua escola ou cursinho?
                  </p>
                  <p className="text-sm text-emerald-600 font-medium">
                    comercial@plataformaorbita.com.br
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Formulário */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Envie sua mensagem</CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo e entraremos em contato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome completo</Label>
                        <Input
                          id="nome"
                          placeholder="Seu nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Assunto</Label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {assuntos.map((assunto) => (
                          <button
                            key={assunto.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, assunto: assunto.value as AssuntoType })}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                              formData.assunto === assunto.value
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                            }`}
                          >
                            <assunto.icon className={`h-5 w-5 ${
                              formData.assunto === assunto.value
                                ? 'text-emerald-600'
                                : 'text-gray-500'
                            }`} />
                            <span className={`text-xs font-medium ${
                              formData.assunto === assunto.value
                                ? 'text-emerald-600'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {assunto.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mensagem">Mensagem</Label>
                      <Textarea
                        id="mensagem"
                        placeholder="Descreva sua dúvida, sugestão ou problema..."
                        rows={6}
                        value={formData.mensagem}
                        onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
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
