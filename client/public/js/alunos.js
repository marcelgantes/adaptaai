// ═══════════════════════════════════════════
// ALUNOS.JS — CRUD de alunos
// ═══════════════════════════════════════════

const Alunos = {

  // Renderiza lista de alunos de uma turma
  renderizar(turmaId) {
    const id = turmaId || App.turmaAtual;
    const container = document.getElementById('alunos-lista');
    const alunos = App.alunos.filter(a => a.turma_id === id);

    if (!alunos.length) {
      container.innerHTML = `
        <div class="alunos-vazia">
          <div class="vazia-icon">👤</div>
          <h3>Crie seu primeiro aluno</h3>
          <p>Cadastre os alunos com necessidades especiais desta turma.</p>
          <button class="btn-primario btn-sm" onclick="Alunos.abrirModalNovo()">+ Cadastrar aluno</button>
        </div>`;
      return;
    }

    const diagInfo = {
      tea:              { emoji: '🔵', label: 'TEA', cls: 'diag-tea' },
      tdah:             { emoji: '⚡', label: 'TDAH', cls: 'diag-tdah' },
      dislexia:         { emoji: '📖', label: 'Dislexia', cls: 'diag-dislexia' },
      discalculia:      { emoji: '🔢', label: 'Discalculia', cls: 'diag-discalculia' },
      altas_habilidades:{ emoji: '⭐', label: 'Altas Habilidades', cls: 'diag-altas_habilidades' }
    };

    container.innerHTML = alunos.map(aluno => {
      const diag = diagInfo[aluno.diagnostico] || { emoji: '👤', label: aluno.diagnostico, cls: '' };
      return `
        <div class="aluno-card">
          <div class="aluno-avatar" style="background:var(--brand-light)">${diag.emoji}</div>
          <div class="aluno-info">
            <div class="aluno-nome">${_esc(aluno.nome)}</div>
            <span class="aluno-diag ${diag.cls}">${diag.label}</span>
          </div>
          <div class="aluno-acoes">
            <button class="btn-adaptar" onclick="UI.abrirAdaptacao('${aluno.id}')">
              ✨ Adaptar
            </button>
            <button class="btn-apagar-aluno" onclick="Alunos.confirmarApagar('${aluno.id}')" title="Apagar aluno">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>`;
    }).join('');
  },

  // Abre modal de novo aluno
  abrirModalNovo() {
    document.getElementById('aluno-nome').value = '';
    document.getElementById('aluno-obs').value = '';
    // Desmarca todos os diagnósticos
    document.querySelectorAll('input[name="diagnostico"]').forEach(r => r.checked = false);
    UI.limparErro('modal-aluno-erro');
    UI.abrirModal('modal-novo-aluno');
    setTimeout(() => document.getElementById('aluno-nome').focus(), 100);
  },

  // Salva novo aluno
  async salvar() {
    const nome = document.getElementById('aluno-nome').value.trim();
    const diagnostico = document.querySelector('input[name="diagnostico"]:checked')?.value;
    const obs = document.getElementById('aluno-obs').value.trim();

    UI.limparErro('modal-aluno-erro');

    if (!nome) {
      UI.mostrarErro('modal-aluno-erro', 'Digite o nome ou apelido do aluno.');
      return;
    }

    if (!diagnostico) {
      UI.mostrarErro('modal-aluno-erro', 'Selecione o diagnóstico do aluno.');
      return;
    }

    // Desabilita botão para evitar duplo clique
    const btn = document.getElementById('btn-salvar-aluno');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const { data, error } = await sb.from('alunos').insert({
      turma_id: App.turmaAtual,
      user_id: App.usuario.id,
      nome,
      diagnostico,
      observacoes: obs || null
    }).select().single();

    // Sempre reabilita o botão
    btn.disabled = false;
    btn.textContent = 'Salvar aluno';

    if (error) {
      UI.mostrarErro('modal-aluno-erro', 'Erro ao salvar aluno. Tente novamente.');
      console.error('Erro ao salvar aluno:', error);
      return;
    }

    App.alunos.push(data);
    UI.fecharModalId('modal-novo-aluno');
    UI.toast('✅ Aluno cadastrado!', 'sucesso');
    Alunos.renderizar(App.turmaAtual);
  },

  // Confirma e apaga aluno
  confirmarApagar(alunoId) {
    const aluno = App.alunos.find(a => a.id === alunoId);
    if (!aluno) return;

    if (!confirm(`Apagar o aluno "${aluno.nome}"?`)) return;
    Alunos.apagar(alunoId);
  },

  async apagar(alunoId) {
    const { error } = await sb.from('alunos').delete().eq('id', alunoId);

    if (error) {
      UI.toast('Erro ao apagar aluno.', 'erro');
      return;
    }

    App.alunos = App.alunos.filter(a => a.id !== alunoId);
    Alunos.renderizar(App.turmaAtual);
    UI.toast('Aluno removido.', 'sucesso');
  }
};
