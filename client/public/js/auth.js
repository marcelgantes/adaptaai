// ═══════════════════════════════════════════
// AUTH.JS — Login, cadastro, perfil, logout
// ═══════════════════════════════════════════

const Auth = {

  async loginGoogle() {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) UI.toast('Erro ao entrar com Google: ' + error.message, 'erro');
  },

  async loginEmail() {
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    UI.limparErro('login-erro');
    if (!email || !senha) { UI.mostrarErro('login-erro', 'Preencha e-mail e senha.'); return; }
    const btn = document.querySelector('#form-login .btn-primario');
    btn.disabled = true; btn.textContent = 'Entrando...';
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    btn.disabled = false; btn.textContent = 'Entrar';
    if (error) {
      let msg = 'E-mail ou senha incorretos.';
      if (error.message.includes('Email not confirmed'))
        msg = 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
      UI.mostrarErro('login-erro', msg);
    }
  },

  async cadastrarEmail() {
    const nome = document.getElementById('cad-nome').value.trim();
    const email = document.getElementById('cad-email').value.trim();
    const senha = document.getElementById('cad-senha').value;
    const senhaConf = document.getElementById('cad-senha-conf').value;
    UI.limparErro('cadastro-erro');
    if (!nome || !email || !senha || !senhaConf) { UI.mostrarErro('cadastro-erro', 'Preencha todos os campos.'); return; }
    if (senha.length < 6) { UI.mostrarErro('cadastro-erro', 'A senha deve ter pelo menos 6 caracteres.'); return; }
    if (senha !== senhaConf) { UI.mostrarErro('cadastro-erro', 'As senhas não coincidem.'); return; }
    const btn = document.querySelector('#form-cadastro .btn-primario');
    btn.disabled = true; btn.textContent = 'Criando conta...';
    const { error } = await sb.auth.signUp({ email, password: senha, options: { data: { full_name: nome } } });
    btn.disabled = false; btn.textContent = 'Criar conta';
    if (error) {
      UI.mostrarErro('cadastro-erro', error.message.includes('already registered') ? 'Este e-mail já está cadastrado.' : error.message);
      return;
    }
    UI.mostrarTelaConfirmacao(email);
  },

  async esqueceuSenha() {
    const email = document.getElementById('login-email').value.trim();
    if (!email) { UI.mostrarErro('login-erro', 'Digite seu e-mail acima para recuperar a senha.'); return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) { UI.mostrarErro('login-erro', 'Erro ao enviar e-mail. Tente novamente.'); return; }
    UI.toast('📧 E-mail de recuperação enviado! Verifique sua caixa de entrada.', 'sucesso');
  },

  async salvarPerfil() {
    const disciplina = document.getElementById('perfil-disciplina').value;
    const estado = document.getElementById('perfil-estado').value;
    const cidade = document.getElementById('perfil-cidade').value.trim();
    const niveis = Array.from(document.querySelectorAll('.check-nivel input:checked')).map(cb => cb.value);
    UI.limparErro('perfil-erro');
    if (!disciplina) { UI.mostrarErro('perfil-erro', 'Selecione a disciplina que você leciona.'); return; }
    if (niveis.length === 0) { UI.mostrarErro('perfil-erro', 'Selecione pelo menos um nível de ensino.'); return; }
    if (!estado) { UI.mostrarErro('perfil-erro', 'Selecione seu estado.'); return; }
    const btn = document.querySelector('#tela-perfil .btn-primario');
    btn.disabled = true; btn.textContent = 'Salvando...';
    const meta = App.usuario.user_metadata || {};
    const nome = meta.full_name || meta.name || '';
    const { error } = await sb.from('perfis').upsert({ id: App.usuario.id, nome, disciplina, niveis, estado, cidade });
    btn.disabled = false; btn.textContent = 'Salvar e continuar →';
    if (error) { UI.mostrarErro('perfil-erro', 'Erro ao salvar perfil. Tente novamente.'); return; }
    App.perfil = { id: App.usuario.id, nome, disciplina, niveis, estado, cidade };
    UI.atualizarSidebar();
    await App.carregarDados();
    UI.mostrarTela('app');
    UI.navegar('turmas');
    UI.toast('✅ Perfil salvo! Bem-vindo ao Adapta Aí.');
  },

  async reenviarConfirmacao() {
    const email = document.getElementById('confirmacao-email').textContent;
    if (!email) return;
    const { error } = await sb.auth.resend({ type: 'signup', email });
    if (error) { UI.toast('Erro ao reenviar. Tente novamente.', 'erro'); return; }
    UI.toast('📧 E-mail reenviado!', 'sucesso');
  },

  async sair() {
    await sb.auth.signOut();
  }
};
