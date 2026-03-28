// ═══════════════════════════════════════════
// HISTORICO.JS — Salvar e renderizar histórico
// ═══════════════════════════════════════════

const Historico = {

  _lista: [],

  // Salva adaptação no banco
  async salvar(aluno, adaptacao) {
    const turma = App.turmas.find(t => t.id === aluno.turma_id);
    const perfil = App.perfil || {};

    // Salva versão compacta — só passos e resumo, sem habilidades extras
    let conteudoCompacto = adaptacao;
    if (adaptacao?.tipo === 'json' && adaptacao?.data) {
      conteudoCompacto = {
        tipo: 'json',
        data: {
          titulo: adaptacao.data.titulo,
          disciplina: adaptacao.data.disciplina,
          passos: adaptacao.data.passos || [],
          resumo: adaptacao.data.resumo || [],
          questoes: adaptacao.data.questoes || []
        }
      };
    }

    const { data, error } = await sb.from('historico').insert({
      user_id: App.usuario.id,
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      turma_id: aluno.turma_id,
      turma_nome: turma?.nome || '',
      disciplina: perfil.disciplina || '',
      titulo: adaptacao?.data?.titulo || perfil.disciplina || 'Adaptação',
      conteudo: conteudoCompacto
    }).select().single();

    if (error) {
      console.error('Erro ao salvar histórico:', error);
      return; // Não interrompe o fluxo principal
    }

    Historico._lista.unshift(data);
  },

  // Carrega histórico do banco
  async carregar() {
    const { data, error } = await sb
      .from('historico')
      .select('*')
      .eq('user_id', App.usuario.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      Historico._lista = data;
    }
  },

  // Renderiza lista de histórico
  async renderizar() {
    await Historico.carregar();
    const container = document.getElementById('historico-lista');

    if (!Historico._lista.length) {
      container.innerHTML = `
        <div class="historico-vazio">
          <div style="font-size:48px;margin-bottom:16px">📂</div>
          <p>Nenhuma adaptação gerada ainda.</p>
        </div>`;
      return;
    }

    // Agrupa por turma
    const porTurma = {};
    Historico._lista.forEach(h => {
      const k = h.turma_nome || 'Sem turma';
      if (!porTurma[k]) porTurma[k] = [];
      porTurma[k].push(h);
    });

    let html = '';
    Object.entries(porTurma).forEach(([turma, items]) => {
      html += `<div style="font-size:13px;font-weight:700;color:#6B7280;margin:20px 0 10px;text-transform:uppercase;letter-spacing:0.05em">🏫 ${_esc(turma)}</div>`;
      items.forEach(h => {
        const data = h.created_at ? new Date(h.created_at).toLocaleDateString('pt-BR') : '';
        html += `
          <div class="historico-item">
            <div style="font-size:28px">📄</div>
            <div class="historico-info">
              <div class="historico-titulo">${_esc(h.titulo || 'Adaptação')}</div>
              <div class="historico-meta">${_esc(h.aluno_nome || '')} · ${data}</div>
              ${h.disciplina ? `<div style="margin-top:4px"><span style="display:inline-block;padding:2px 8px;background:#EFF6FF;color:#2563EB;border-radius:20px;font-size:11px;font-weight:600">${_esc(h.disciplina)}</span></div>` : ''}
            </div>
            ${h.conteudo ? `
            <div class="historico-acoes">
              <button class="btn-secundario btn-sm" onclick="Historico.reabrir('${h.id}')">📂 Ver</button>
              <button class="btn-secundario btn-sm" onclick="Historico.baixar('${h.id}')">📥 DOCX</button>
            </div>` : ''}
          </div>`;
      });
    });

    container.innerHTML = html;
  },

  // Reabre adaptação do histórico
  reabrir(id) {
    const h = Historico._lista.find(x => x.id === id);
    if (!h || !h.conteudo) {
      UI.toast('Conteúdo não disponível.', 'erro');
      return;
    }

    // Encontra o aluno
    const aluno = App.alunos.find(a => a.id === h.aluno_id);
    if (aluno) {
      App.alunoAtual = aluno.id;
    }

    App.adaptacaoAtual = h.conteudo;

    // Navega para adaptação
    document.querySelectorAll('.pagina').forEach(p => {
      p.style.display = 'none';
      p.classList.remove('ativa');
    });

    const el = document.getElementById('pagina-adaptacao');
    el.style.display = 'block';
    el.classList.add('ativa');

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('ativo'));

    // Mostra info
    const diagLabels = {
      tea: '🔵 TEA', tdah: '⚡ TDAH', dislexia: '📖 Dislexia',
      discalculia: '🔢 Discalculia', altas_habilidades: '⭐ Altas Habilidades'
    };

    const infoEl = document.getElementById('adaptacao-aluno-info');
    if (aluno) {
      infoEl.innerHTML = `Adaptação de <strong>${_esc(aluno.nome)}</strong> — ${diagLabels[aluno.diagnostico] || aluno.diagnostico}`;
    } else {
      infoEl.innerHTML = `Adaptação de <strong>${_esc(h.aluno_nome || 'aluno')}</strong>`;
    }

    // Limpa upload e mostra resultado
    Adaptacao.limpar();
    Adaptacao._renderizar(h.conteudo);
    document.getElementById('resultado-area').style.display = 'block';
    document.getElementById('resultado-area').scrollIntoView({ behavior: 'smooth', block: 'start' });

    UI.toast('📂 Adaptação reaberta.');
  },

  // Baixa DOCX de uma adaptação do histórico
  baixar(id) {
    const h = Historico._lista.find(x => x.id === id);
    if (!h || !h.conteudo) {
      UI.toast('Conteúdo não disponível.', 'erro');
      return;
    }

    // Salva no state temporariamente para usar Downloads
    const alunoAtualAntes = App.alunoAtual;
    App.alunoAtual = h.aluno_id;
    App.adaptacaoAtual = h.conteudo;

    Downloads.baixarDocx().then(() => {
      App.alunoAtual = alunoAtualAntes;
    });
  }
};
