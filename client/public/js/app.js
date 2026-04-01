const SUPABASE_URL = 'https://ttyxcayltmgdtshohxzk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eXhjYXlsdG1nZHRzaG9oeHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MjU2ODUsImV4cCI6MjA4OTEwMTY4NX0.h1kmF6TqKPph69x3mxsZRVtOfGqXZYbhB9Zr8Kj-rgs';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const App = {
  usuario: null,
  perfil: null,
  turmas: [],
  alunos: [],
  turmaAtual: null,
  alunoAtual: null,
  adaptacaoAtual: null,

  async init() {
    // Começa com loading para evitar flash da tela de login
    UI.mostrarTela('loading');

    // Processa token do hash ANTES do DOMContentLoaded
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          const { data, error } = await sb.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          // Limpa o hash imediatamente
          window.history.replaceState(null, '', window.location.pathname);

          if (!error && data?.session?.user) {
            App.usuario = data.session.user;
            App._escutarAuth();
            await App.carregarPerfil();
            return;
          }
          console.error('Erro setSession:', error);
        } catch(e) {
          console.error('Exceção setSession:', e);
        }
      }
      // Se chegou aqui, token falhou — mostra login
      window.history.replaceState(null, '', window.location.pathname);
      UI.mostrarTela('auth');
      App._escutarAuth();
      return;
    }

    // Sem token — verifica sessão existente
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      App.usuario = session.user;
      App._escutarAuth();
      await App.carregarPerfil();
    } else {
      UI.mostrarTela('auth');
      App._escutarAuth();
    }
  },

  _escutarAuth() {
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        App.usuario = null;
        App.perfil = null;
        App.turmas = [];
        App.alunos = [];
        UI.mostrarTela('auth');
      }
    });
  },

  async carregarPerfil() {
    const { data, error } = await sb
      .from('perfis')
      .select('*')
      .eq('id', App.usuario.id)
      .single();

    if (error || !data) {
      UI.mostrarTela('perfil');
      return;
    }

    App.perfil = data;
    UI.atualizarSidebar();
    await App.carregarDados();
    UI.mostrarTela('app');
    UI.navegar('turmas');
  },

  async carregarDados() {
    const [turmasRes, alunosRes] = await Promise.all([
      sb.from('turmas').select('*').eq('user_id', App.usuario.id).order('created_at', { ascending: false }),
      sb.from('alunos').select('*').eq('user_id', App.usuario.id).order('created_at', { ascending: true })
    ]);
    App.turmas = turmasRes.data || [];
    App.alunos = alunosRes.data || [];
  }
};

// Inicia IMEDIATAMENTE — não espera DOMContentLoaded
// O Supabase precisa processar o token antes da página renderizar
(async () => {
  // Aguarda o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    await App.init();
  }
})();
