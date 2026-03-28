// ═══════════════════════════════════════════
// UI.JS — Navegação, modais, toasts
// ═══════════════════════════════════════════

const UI = {

  // Mostra uma tela principal (auth, perfil, app)
  mostrarTela(tela) {
    document.getElementById('tela-auth').style.display = tela === 'auth' ? '' : 'none';
    document.getElementById('tela-perfil').style.display = tela === 'perfil' ? '' : 'none';
    document.getElementById('tela-app').style.display = tela === 'app' ? '' : 'none';
  },

  // Navega entre páginas dentro do app
  navegar(pagina) {
    // Esconde todas as páginas
    document.querySelectorAll('.pagina').forEach(p => {
      p.style.display = 'none';
      p.classList.remove('ativa');
    });

    // Mostra a página destino
    const el = document.getElementById(`pagina-${pagina}`);
    if (el) {
      el.style.display = 'block';
      el.classList.add('ativa');
    }

    // Atualiza nav da sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('ativo', item.dataset.tela === pagina);
    });

    // Fecha menu mobile
    UI.fecharMenu();

    // Renderiza conteúdo da página
    if (pagina === 'turmas') Turmas.renderizar();
    if (pagina === 'historico') Historico.renderizar();
  },

  // Volta da adaptação para o detalhe da turma
  voltarDaAdaptacao() {
    if (App.turmaAtual) {
      UI.abrirTurma(App.turmaAtual);
    } else {
      UI.navegar('turmas');
    }
  },

  // Abre detalhe de uma turma
  abrirTurma(turmaId) {
    App.turmaAtual = turmaId;
    const turma = App.turmas.find(t => t.id === turmaId);
    if (!turma) return;

    document.getElementById('detalhe-turma-nome').textContent = turma.nome;
    document.getElementById('detalhe-turma-meta').textContent = turma.ano || '';

    // Esconde todas as páginas e mostra detalhe
    document.querySelectorAll('.pagina').forEach(p => {
      p.style.display = 'none';
      p.classList.remove('ativa');
    });

    const el = document.getElementById('pagina-turma-detalhe');
    el.style.display = 'block';
    el.classList.add('ativa');

    // Remove ativo da sidebar
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('ativo'));

    UI.fecharMenu();
    Alunos.renderizar(turmaId);
  },

  // Abre página de adaptação para um aluno
  abrirAdaptacao(alunoId) {
    const aluno = App.alunos.find(a => a.id === alunoId);
    if (!aluno) return;

    App.alunoAtual = alunoId;
    App.adaptacaoAtual = null;

    // Mostra info do aluno
    const diagLabels = {
      tea: '🔵 TEA',
      tdah: '⚡ TDAH',
      dislexia: '📖 Dislexia',
      discalculia: '🔢 Discalculia',
      altas_habilidades: '⭐ Altas Habilidades'
    };

    document.getElementById('adaptacao-aluno-info').innerHTML =
      `Adaptando para <strong>${aluno.nome}</strong> — ${diagLabels[aluno.diagnostico] || aluno.diagnostico}`;

    // Limpa tela de adaptação
    Adaptacao.limpar();

    // Navega
    document.querySelectorAll('.pagina').forEach(p => {
      p.style.display = 'none';
      p.classList.remove('ativa');
    });

    const el = document.getElementById('pagina-adaptacao');
    el.style.display = 'block';
    el.classList.add('ativa');

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('ativo'));
    UI.fecharMenu();
  },

  // Atualiza sidebar com dados do professor
  atualizarSidebar() {
    const perfil = App.perfil;
    const meta = App.usuario?.user_metadata || {};
    const nome = perfil?.nome || meta.full_name || meta.name || 'Professor';

    document.getElementById('user-nome').textContent = nome.split(' ')[0];
    document.getElementById('user-disciplina').textContent = perfil?.disciplina || '';
    document.getElementById('user-avatar').textContent = nome.charAt(0).toUpperCase();
  },

  // Troca aba login/cadastro
  trocarAba(aba) {
    document.querySelectorAll('.auth-tab').forEach(t => {
      t.classList.toggle('ativa', t.dataset.tab === aba);
    });
    document.getElementById('form-login').style.display = aba === 'login' ? '' : 'none';
    document.getElementById('form-cadastro').style.display = aba === 'cadastro' ? '' : 'none';
  },

  // Menu mobile
  toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('aberta');
    overlay.classList.toggle('visivel');
  },

  fecharMenu() {
    document.getElementById('sidebar').classList.remove('aberta');
    document.getElementById('sidebar-overlay').classList.remove('visivel');
  },

  // Modais
  abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  },

  fecharModalId(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
  },

  // Fecha modal ao clicar fora
  fecharModal(event) {
    if (event.target === event.currentTarget) {
      event.currentTarget.style.display = 'none';
    }
  },

  // Toast
  _toastTimer: null,

  toast(msg, tipo = 'normal') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${tipo}`;
    el.style.display = 'block';

    clearTimeout(UI._toastTimer);
    UI._toastTimer = setTimeout(() => {
      el.style.display = 'none';
    }, 3500);
  },

  // Mostra erro em um campo
  mostrarErro(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  },

  limparErro(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
  }
};
