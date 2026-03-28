// ═══════════════════════════════════════════
// TURMAS.JS — CRUD de turmas
// ═══════════════════════════════════════════

const Turmas = {

  _editandoId: null,

  // Renderiza lista de turmas
  renderizar() {
    const container = document.getElementById('turmas-lista');

    if (!App.turmas.length) {
      container.innerHTML = `
        <div class="turmas-vazia">
          <div class="vazia-icon">🏫</div>
          <h3>Nenhuma turma ainda</h3>
          <p>Crie sua primeira turma para começar a adaptar materiais.</p>
          <button class="btn-primario btn-sm" onclick="Turmas.abrirModalNova()">+ Criar primeira turma</button>
        </div>`;
      return;
    }

    container.innerHTML = App.turmas.map(turma => {
      const qtdAlunos = App.alunos.filter(a => a.turma_id === turma.id).length;
      return `
        <div class="turma-card" onclick="UI.abrirTurma('${turma.id}')">
          <div class="turma-card-nome">${_esc(turma.nome)}</div>
          <div class="turma-card-meta">
            ${turma.ano ? turma.ano + ' · ' : ''}
            ${qtdAlunos} aluno${qtdAlunos !== 1 ? 's' : ''} incluso${qtdAlunos !== 1 ? 's' : ''}
          </div>
          <div class="turma-card-acoes" onclick="event.stopPropagation()">
            <button class="btn-turma-acao btn-turma-editar" onclick="Turmas.abrirModalEditar('${turma.id}')">
              ✏️ Editar
            </button>
            <button class="btn-turma-acao btn-turma-apagar" onclick="Turmas.confirmarApagar('${turma.id}')">
              🗑️ Apagar
            </button>
          </div>
        </div>`;
    }).join('');
  },

  // Abre modal de nova turma
  abrirModalNova() {
    document.getElementById('turma-nome').value = '';
    document.getElementById('turma-ano').value = new Date().getFullYear();
    UI.limparErro('modal-turma-erro');
    UI.abrirModal('modal-nova-turma');
    setTimeout(() => document.getElementById('turma-nome').focus(), 100);
  },

  // Salva nova turma
  async salvar() {
    const nome = document.getElementById('turma-nome').value.trim();
    const ano = document.getElementById('turma-ano').value.trim();

    UI.limparErro('modal-turma-erro');

    if (!nome) {
      UI.mostrarErro('modal-turma-erro', 'Digite o nome da turma.');
      return;
    }

    const btn = document.querySelector('#modal-nova-turma .btn-primario');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const { data, error } = await sb.from('turmas').insert({
      user_id: App.usuario.id,
      nome,
      ano: ano || null
    }).select().single();

    btn.disabled = false;
    btn.textContent = 'Criar turma';

    if (error) {
      UI.mostrarErro('modal-turma-erro', 'Erro ao salvar. Tente novamente.');
      console.error('Erro ao criar turma:', error);
      return;
    }

    App.turmas.unshift(data);
    UI.fecharModalId('modal-nova-turma');
    UI.toast('✅ Turma criada!', 'sucesso');
    UI.abrirTurma(data.id);
  },

  // Abre modal de edição
  abrirModalEditar(turmaId) {
    const turma = App.turmas.find(t => t.id === turmaId);
    if (!turma) return;

    Turmas._editandoId = turmaId;
    document.getElementById('turma-edit-nome').value = turma.nome;
    document.getElementById('turma-edit-ano').value = turma.ano || '';
    UI.limparErro('modal-turma-edit-erro');
    UI.abrirModal('modal-editar-turma');
    setTimeout(() => document.getElementById('turma-edit-nome').focus(), 100);
  },

  // Salva edição da turma
  async salvarEdicao() {
    const nome = document.getElementById('turma-edit-nome').value.trim();
    const ano = document.getElementById('turma-edit-ano').value.trim();

    UI.limparErro('modal-turma-edit-erro');

    if (!nome) {
      UI.mostrarErro('modal-turma-edit-erro', 'Digite o nome da turma.');
      return;
    }

    const btn = document.querySelector('#modal-editar-turma .btn-primario');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const { data, error } = await sb.from('turmas')
      .update({ nome, ano: ano || null })
      .eq('id', Turmas._editandoId)
      .select().single();

    btn.disabled = false;
    btn.textContent = 'Salvar';

    if (error) {
      UI.mostrarErro('modal-turma-edit-erro', 'Erro ao salvar. Tente novamente.');
      return;
    }

    // Atualiza no state
    const idx = App.turmas.findIndex(t => t.id === Turmas._editandoId);
    if (idx >= 0) App.turmas[idx] = data;

    UI.fecharModalId('modal-editar-turma');
    UI.toast('✅ Turma atualizada!', 'sucesso');

    // Atualiza header se estiver no detalhe desta turma
    if (App.turmaAtual === Turmas._editandoId) {
      document.getElementById('detalhe-turma-nome').textContent = data.nome;
      document.getElementById('detalhe-turma-meta').textContent = data.ano || '';
    }

    Turmas.renderizar();
    Turmas._editandoId = null;
  },

  // Confirma e apaga turma
  confirmarApagar(turmaId) {
    const turma = App.turmas.find(t => t.id === turmaId);
    if (!turma) return;

    const qtdAlunos = App.alunos.filter(a => a.turma_id === turmaId).length;
    const msg = qtdAlunos > 0
      ? `Apagar "${turma.nome}"? Isso também vai remover os ${qtdAlunos} aluno(s) desta turma.`
      : `Apagar a turma "${turma.nome}"?`;

    if (!confirm(msg)) return;
    Turmas.apagar(turmaId);
  },

  async apagar(turmaId) {
    const { error } = await sb.from('turmas').delete().eq('id', turmaId);

    if (error) {
      UI.toast('Erro ao apagar turma.', 'erro');
      return;
    }

    // Remove do state
    App.turmas = App.turmas.filter(t => t.id !== turmaId);
    App.alunos = App.alunos.filter(a => a.turma_id !== turmaId);

    // Se estava no detalhe desta turma, volta para lista
    if (App.turmaAtual === turmaId) {
      App.turmaAtual = null;
      UI.navegar('turmas');
    } else {
      Turmas.renderizar();
    }

    UI.toast('Turma apagada.', 'sucesso');
  }
};
