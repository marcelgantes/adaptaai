// ═══════════════════════════════════════════
// APP.JS — State global e inicialização
// ═══════════════════════════════════════════

const SUPABASE_URL = 'https://ttyxcayltmgdtshohxzk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uPQpcbgyBu9X0xJmfd9bdA_yOr53tnI';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado global da aplicação
const App = {
  usuario: null,
  perfil: null,
  turmas: [],
  alunos: [],
  turmaAtual: null,    // id da turma aberta
  alunoAtual: null,    // id do aluno sendo adaptado
  adaptacaoAtual: null, // resultado da adaptação

  // Inicializa a aplicação
  async init() {
    const { data: { session } } = await sb.auth.getSession();

    if (session?.user) {
      App.usuario = session.user;
      await App.carregarPerfil();
    } else {
      UI.mostrarTela('auth');
    }

    // Escuta mudanças de autenticação
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        App.usuario = session.user;
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

  // Carrega perfil do professor
  async carregarPerfil() {
    const { data, error } = await sb
      .from('perfis')
      .select('*')
      .eq('id', App.usuario.id)
      .single();

    if (error || !data) {
      // Primeiro acesso — preenche com dados do Google se disponível
      const meta = App.usuario.user_metadata || {};
      document.getElementById('cad-nome')?.setAttribute('value', meta.full_name || meta.name || '');
      UI.mostrarTela('perfil');
      return;
    }

    App.perfil = data;
    UI.atualizarSidebar();
    await App.carregarDados();
    UI.mostrarTela('app');
    UI.navegar('turmas');
  },

  // Carrega turmas e alunos do professor
  async carregarDados() {
    const [turmasRes, alunosRes] = await Promise.all([
      sb.from('turmas').select('*').eq('user_id', App.usuario.id).order('created_at', { ascending: false }),
      sb.from('alunos').select('*').eq('user_id', App.usuario.id).order('created_at', { ascending: true })
    ]);

    App.turmas = turmasRes.data || [];
    App.alunos = alunosRes.data || [];
  }
};

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => App.init());
