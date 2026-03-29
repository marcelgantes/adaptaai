// ═══════════════════════════════════════════
// APP.JS — State global e inicialização
// ═══════════════════════════════════════════

const SUPABASE_URL = 'https://ttyxcayltmgdtshohxzk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eXhjYXlsdG1nZHRzaG9oeHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3NTI5NzAsImV4cCI6MjAyNTMyODk3MH0.NnFKRWWGqGxFJJgFPNMzMWsLp2V_tLHBATuDm7_WKHE';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  }
});

const App = {
  usuario: null,
  perfil: null,
  turmas: [],
  alunos: [],
  turmaAtual: null,
  alunoAtual: null,
  adaptacaoAtual: null,

  async init() {
    const hash = window.location.hash;
    const temToken = hash.includes('access_token');

    if (temToken) {
      // Tem token no hash — espera o Supabase processar via listener
      UI.mostrarTela('loading');
      await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(), 5000);
        sb.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            clearTimeout(timeout);
            App.usuario = session.user;
            window.history.replaceState(null, '', window.location.pathname);
            await App.carregarPerfil();
            resolve();
          }
        });
      });
      return;
    }

    // Sem token — verifica sessão existente normalmente
    const { data: { session } } = await sb.auth.getSession();

    if (session?.user) {
      App.usuario = session.user;
      await App.carregarPerfil();
    } else {
      UI.mostrarTela('auth');
    }

    // Escuta mudanças futuras
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        App.usuario = session.user;
        window.history.replaceState(null, '', window.location.pathname);
        await App.carregarPerfil();
      } else if (event === 'SIGNED_OUT') {
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

document.addEventListener('DOMContentLoaded', () => App.init());
