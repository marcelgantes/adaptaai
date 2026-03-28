// ═══════════════════════════════════════════
// AUTH.JS — Login, cadastro, perfil, logout
// ═══════════════════════════════════════════

const Auth = {

  // Login com Google
  async loginGoogle() {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) UI.toast('Erro ao entrar com Google: ' + error.message, 'erro');
  },

  // Login com email e senha
  async loginEmail() {
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    UI.limparErro('login-erro');

    if (!email || !senha) {
      UI.mostrarErro('login-erro', 'Preencha e-mail e senha.');
      return;
    }

    const btn = document.querySelector('#form-login .btn-primario');
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    const { error } = await sb.auth.signInWithPassword({ email, password: senha });

    btn.disabled = false;
    btn.textContent = 'Entrar';

    if (error) {
      const msg = error.message.includes('Invalid login') 
        ? 'E-mail ou senha incorretos.' 
        : error.message;
      UI.mostrarErro('login-erro', msg);
    }
    // Sucesso: onAuthStateChange cuida do redirecionamento
  },

  // Cadastro com email e senha
  async cadastrarEmail() {
    const nome = document.getElementById('cad-nome').value.trim();
    const email = document.getElementById('cad-email').value.trim();
    const senha = document.getElementById('cad-senha').value;

    UI.limparErro('cadastro-erro');

    if (!nome || !email || !senha) {
      UI.mostrarErro('cadastro-erro', 'Preencha todos os campos.');
      return;
    }

    if (senha.length < 6) {
      UI.mostrarErro('cadastro-erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const btn = document.querySelector('#form-cadastro .btn-primario');
    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    const { error } = await sb.auth.signUp({
      email,
      password: senha,
      options: { data: { full_name: nome } }
    });

    btn.disabled = false;
    btn.textContent = 'Criar conta';

    if (error) {
      const msg = error.message.includes('already registered')
        ? 'Este e-mail já está cadastrado.'
        : error.message;
      UI.mostrarErro('cadastro-erro', msg);
    }
    // Sucesso: onAuthStateChange cuida do redirecionamento
  },

  // Salva perfil do professor (após primeiro login)
  async salvarPerfil() {
    const disciplina = document.getElementById('perfil-disciplina').value;
    const estado = document.getElementById('perfil-estado').value;
    const cidade = document.getElementById('perfil-cidade').value.trim();

    const niveis = Array.from(
      document.querySelectorAll('.check-nivel input:checked')
    ).map(cb => cb.value);

    UI.limparErro('perfil-erro');

    if (!disciplina) {
      UI.mostrarErro('perfil-erro', 'Selecione a disciplina que você leciona.');
      return;
    }

    if (niveis.length === 0) {
      UI.mostrarErro('perfil-erro', 'Selecione pelo menos um nível de ensino.');
      return;
    }

    if (!estado) {
      UI.mostrarErro('perfil-erro', 'Selecione seu estado.');
      return;
    }

    const btn = document.querySelector('#tela-perfil .btn-primario');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const meta = App.usuario.user_metadata || {};
    const nome = meta.full_name || meta.name || '';

    const { error } = await sb.from('perfis').upsert({
      id: App.usuario.id,
      nome,
      disciplina,
      niveis,
      estado,
      cidade
    });

    btn.disabled = false;
    btn.textContent = 'Salvar e continuar →';

    if (error) {
      UI.mostrarErro('perfil-erro', 'Erro ao salvar perfil. Tente novamente.');
      console.error('Erro perfil:', error);
      return;
    }

    App.perfil = { id: App.usuario.id, nome, disciplina, niveis, estado, cidade };
    UI.atualizarSidebar();
    await App.carregarDados();
    UI.mostrarTela('app');
    UI.navegar('turmas');
    UI.toast('✅ Perfil salvo! Bem-vindo ao Adapta Aí.');
  },

  // Logout
  async sair() {
    await sb.auth.signOut();
    // onAuthStateChange cuida do redirecionamento
  }
};
