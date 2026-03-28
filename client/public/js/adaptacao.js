// ═══════════════════════════════════════════
// ADAPTACAO.JS — Geração de adaptações com IA
// ═══════════════════════════════════════════

const Adaptacao = {

  _arquivo: null,
  _textoArquivo: null,

  // Limpa tela de adaptação
  limpar() {
    Adaptacao._arquivo = null;
    Adaptacao._textoArquivo = null;

    document.getElementById('upload-idle').style.display = '';
    document.getElementById('upload-ok').style.display = 'none';
    document.getElementById('upload-input').value = '';
    document.getElementById('material-texto').value = '';
    document.getElementById('resultado-area').style.display = 'none';
    document.getElementById('resultado-conteudo').innerHTML = '';
    document.getElementById('progresso').style.display = 'none';
    document.getElementById('btn-gerar').disabled = false;
    document.getElementById('btn-gerar').textContent = '✨ Gerar adaptação';

    // Desmarca personalizações
    document.querySelectorAll('.param-check input').forEach(cb => cb.checked = false);
  },

  // Handle drop de arquivo
  handleDrop(event) {
    event.preventDefault();
    document.getElementById('upload-area').classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    if (file) Adaptacao.handleFile(file);
  },

  // Processa arquivo selecionado
  async handleFile(file) {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      UI.toast('Formato não suportado. Use PDF, DOCX ou TXT.', 'erro');
      return;
    }

    Adaptacao._arquivo = file;

    // Mostra nome do arquivo
    document.getElementById('upload-idle').style.display = 'none';
    document.getElementById('upload-ok').style.display = '';
    document.getElementById('upload-nome-arquivo').textContent = file.name;

    // Extrai texto em background
    try {
      Adaptacao._textoArquivo = await Adaptacao._extrairTexto(file);
    } catch(e) {
      UI.toast('Erro ao ler o arquivo.', 'erro');
      Adaptacao.limparArquivo();
    }
  },

  // Remove arquivo selecionado
  limparArquivo() {
    Adaptacao._arquivo = null;
    Adaptacao._textoArquivo = null;
    document.getElementById('upload-input').value = '';
    document.getElementById('upload-idle').style.display = '';
    document.getElementById('upload-ok').style.display = 'none';
  },

  // Extrai texto do arquivo
  async _extrairTexto(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'txt') {
      return await file.text();
    }

    if (ext === 'docx' || ext === 'doc') {
      const ab = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: ab });
      return result.value?.trim() || '';
    }

    if (ext === 'pdf') {
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      let texto = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        texto += content.items.map(x => x.str).join(' ') + '\n';
      }
      return texto.trim();
    }

    return '';
  },

  // Gera adaptação
  async gerar() {
    const textoDigitado = document.getElementById('material-texto').value.trim();
    const texto = Adaptacao._textoArquivo || textoDigitado;

    if (!texto) {
      UI.toast('Envie um arquivo ou cole o texto do material.', 'erro');
      return;
    }

    if (!App.alunoAtual) {
      UI.toast('Nenhum aluno selecionado.', 'erro');
      return;
    }

    const aluno = App.alunos.find(a => a.id === App.alunoAtual);
    if (!aluno) return;

    const btn = document.getElementById('btn-gerar');
    btn.disabled = true;
    btn.textContent = 'Gerando...';

    Adaptacao._mostrarProgresso('Preparando material...');

    try {
      // Texto longo: resume primeiro
      let textoFinal = texto;
      if (texto.length > 6000) {
        Adaptacao._setProgresso(20, 'Resumindo texto longo...');
        textoFinal = await Adaptacao._resumir(texto);
      }

      Adaptacao._setProgresso(40, 'Adaptando para o perfil do aluno...');

      // Pega personalizações selecionadas
      const params = Array.from(
        document.querySelectorAll('.param-check input:checked')
      ).map(cb => cb.value);

      const prompt = Adaptacao._buildPrompt(aluno, textoFinal, params);
      const resultado = await Adaptacao._chamarAPI(prompt);

      Adaptacao._setProgresso(90, 'Finalizando...');

      const adaptacao = Adaptacao._parsear(resultado);
      App.adaptacaoAtual = adaptacao;

      Adaptacao._renderizar(adaptacao);

      Adaptacao._setProgresso(100, 'Pronto!');
      setTimeout(() => {
        document.getElementById('progresso').style.display = 'none';
        document.getElementById('resultado-area').style.display = 'block';
        document.getElementById('resultado-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);

      // Salva no histórico
      await Historico.salvar(aluno, adaptacao);

    } catch(e) {
      document.getElementById('progresso').style.display = 'none';
      const msg = e.message === 'rate_limit'
        ? '⚠️ Limite atingido. Aguarde 30 segundos e tente novamente.'
        : '❌ Erro ao gerar. Verifique sua conexão.';
      UI.toast(msg, 'erro');
    }

    btn.disabled = false;
    btn.textContent = '✨ Gerar adaptação';
  },

  // Regera com personalizações
  async regerarComPersonalizacao() {
    await Adaptacao.gerar();
  },

  // Exibe progresso
  _mostrarProgresso(msg) {
    document.getElementById('progresso').style.display = 'block';
    document.getElementById('resultado-area').style.display = 'none';
    Adaptacao._setProgresso(10, msg);
  },

  _setProgresso(pct, msg) {
    document.getElementById('progresso-fill').style.width = pct + '%';
    document.getElementById('progresso-msg').textContent = msg;
  },

  // Chama a API
  async _chamarAPI(prompt, tentativas = 3) {
    for (let t = 0; t < tentativas; t++) {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });

      if (r.ok) {
        const d = await r.json();
        return d.content?.[0]?.text || '';
      }

      const txt = await r.text().catch(() => '');
      const isRate = r.status === 429 || txt.includes('rate');

      if (isRate && t < tentativas - 1) {
        Adaptacao._setProgresso(40, `Limite atingido — aguardando 35s (tentativa ${t + 2})...`);
        await new Promise(res => setTimeout(res, 35000));
      } else {
        throw new Error(isRate ? 'rate_limit' : 'server_error');
      }
    }
  },

  // Resume texto longo
  async _resumir(texto) {
    const prompt = `Leia o texto abaixo e produza um resumo estruturado com os conceitos principais. Preserve TODOS os dados concretos (nomes, datas, números, lugares). O resumo deve ter entre 1500 e 3000 caracteres, organizado em tópicos claros.

TEXTO:
${texto}

Responda apenas com o resumo, sem explicações adicionais.`;

    try {
      const resultado = await Adaptacao._chamarAPI(prompt);
      return resultado && resultado.length > 200 ? resultado : texto.substring(0, 6000);
    } catch(e) {
      return texto.substring(0, 6000);
    }
  },

  // Constrói o prompt de adaptação
  _buildPrompt(aluno, texto, params = []) {
    const perfil = App.perfil || {};

    // Instruções por diagnóstico
    const instrucoes = {
      tea: `TEA — TRANSTORNO DO ESPECTRO AUTISTA:
- Linguagem 100% literal. ZERO metáforas, expressões idiomáticas ou duplo sentido.
- Previsibilidade: indique o que vem a seguir ("Agora você vai ler sobre...", "Depois...").
- Técnica Dizer-Mostrar-Fazer: (1) explique o conceito, (2) dê exemplo concreto, (3) proponha aplicação.
- Um comando por vez. Nunca junte dois comandos na mesma frase.
- Frases curtas. Espaçamento generoso entre blocos.`,

      tdah: `TDAH — DÉFICIT DE ATENÇÃO E HIPERATIVIDADE:
- Blocos curtos, máximo 3-4 linhas por bloco.
- Um conceito por parágrafo. Use marcadores visuais (números, símbolos).
- Verbos de ação no início das frases ("Leia...", "Responda...", "Identifique...").
- Pausas explícitas: "Pare aqui. Releia a frase acima."
- Máximo 15 palavras por frase.`,

      dislexia: `DISLEXIA:
- Frases curtas e simples (máximo 12-15 palavras).
- Voz ativa. Nunca voz passiva.
- Sem negações duplas ou estruturas complexas.
- Um conceito por linha. Espaçamento amplo entre linhas.
- Evite palavras com letras simétricas (b/d, p/q) quando houver sinônimos.`,

      discalculia: `DISCALCULIA:
- Explique conceitos numéricos com exemplos do cotidiano antes de apresentar os números.
- Use representações visuais e concretas ("imagine 3 maçãs").
- Nunca apresente cálculo sem contexto.
- Divida operações em etapas numeradas, uma por linha.
- Reforce sempre o significado do número, não só o símbolo.`,

      altas_habilidades: `ALTAS HABILIDADES / SUPERDOTAÇÃO:
- Enriqueça o conteúdo com conexões interdisciplinares e perguntas desafiadoras.
- Ofereça camadas de profundidade: conceito básico + aprofundamento + aplicação avançada.
- Use linguagem sofisticada e precisa.
- Inclua questões abertas que estimulem pensamento crítico e criativo.
- Apresente o aluno como produtor de conhecimento, não apenas receptor.`
    };

    // Instruções de personalização
    const paramInstrucoes = {
      fonte_ampliada: 'Use fontes maiores (indique com marcação **texto** para destacar).',
      espacamento: 'Adicione linha em branco entre cada frase ou item.',
      frases_curtas: 'Máximo 10 palavras por frase, sem exceção.',
      vocabulario: 'Substitua termos técnicos por equivalentes do cotidiano entre parênteses.',
      sem_metaforas: 'Zero metáforas ou linguagem figurada em qualquer forma.',
      destacar_chave: 'Use **negrito** nas palavras-chave de cada parágrafo.',
      caixa_alta: 'ESCREVA TODO O TEXTO EM CAIXA ALTA.',
      uma_coluna: 'Use estrutura linear, uma informação por linha, sem colunas ou tabelas.'
    };

    const instrucaoAluno = instrucoes[aluno.diagnostico] || '';
    const instrucaoParams = params.length > 0
      ? '\nPERSONALIZAÇÕES ADICIONAIS:\n' + params.map(p => '- ' + (paramInstrucoes[p] || p)).join('\n')
      : '';

    const disciplina = perfil.disciplina || 'Geral';

    return `Você é especialista em educação inclusiva. Adapte o material abaixo para um aluno com as características descritas. Responda APENAS com JSON válido, sem markdown.

DIAGNÓSTICO DO ALUNO: ${aluno.diagnostico.toUpperCase()}
${instrucaoAluno}
${aluno.observacoes ? '\nOBSERVAÇÕES DO PROFESSOR: ' + aluno.observacoes : ''}
${instrucaoParams}

CONTEXTO:
- Disciplina: ${disciplina}
- Professor: ${perfil.nome || 'Professor'}
- Escola: ${perfil.cidade || ''} / ${perfil.estado || ''}

MATERIAL ORIGINAL:
${texto}

Responda APENAS com este JSON (sem markdown, sem \`\`\`):
{
  "titulo": "título curto da atividade",
  "disciplina": "${disciplina}",
  "passos": [
    {"numero": 1, "texto": "conteúdo adaptado", "destaque": "palavra-chave"}
  ],
  "resumo": [
    {"titulo": "Conceito", "conteudo": "definição curta"}
  ],
  "questoes": [
    {"tipo": "multipla", "enunciado": "pergunta", "opcoes": ["A) opção", "B) opção"], "gabarito": "A"},
    {"tipo": "vf", "enunciado": "afirmação", "gabarito": "V"}
  ]
}

REGRAS:
1. Preservar TODOS os fatos, nomes, datas e dados concretos do original.
2. Reescrever completamente — nunca copiar frases do original.
3. passos: 4 a 8 itens. Um conceito por passo.
4. resumo: exatamente 4 cards com conceitos-chave.
5. questoes: 2 de múltipla escolha (2 opções) + 1 V/F. Gabarito sempre correto.`;
  },

  // Parseia resposta da IA
  _parsear(texto) {
    try {
      const clean = texto.replace(/```json|```/g, '').trim();
      return { tipo: 'json', data: JSON.parse(clean) };
    } catch(e) {
      // Tenta extrair JSON do meio do texto
      const match = texto.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return { tipo: 'json', data: JSON.parse(match[0]) };
        } catch(e2) {}
      }
      return { tipo: 'texto', data: texto };
    }
  },

  // Renderiza resultado na tela
  _renderizar(adaptacao) {
    const container = document.getElementById('resultado-conteudo');

    if (adaptacao.tipo === 'texto') {
      container.innerHTML = `<div style="white-space:pre-wrap;font-size:14px;line-height:1.8">${_esc(adaptacao.data)}</div>`;
      return;
    }

    const d = adaptacao.data;
    let html = '';

    // Título
    if (d.titulo) {
      html += `<div style="text-align:center;margin-bottom:20px">
        <span style="display:inline-block;padding:3px 12px;background:#EFF6FF;color:#2563EB;border-radius:20px;font-size:11px;font-weight:700;margin-bottom:8px">${_esc(d.disciplina || '')}</span>
        <h3 style="font-size:18px;font-weight:800">${_esc(d.titulo)}</h3>
      </div>`;
    }

    // Passos
    if (d.passos?.length) {
      html += `<div style="margin-bottom:20px">
        <div style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin-bottom:12px">📖 Aprenda passo a passo</div>`;
      d.passos.forEach(p => {
        html += `<div style="display:flex;gap:12px;margin-bottom:10px;align-items:flex-start">
          <span style="flex-shrink:0;width:24px;height:24px;background:#2563EB;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${p.numero}</span>
          <p style="margin:0;font-size:14px;line-height:1.7">${_esc(p.texto)}</p>
        </div>`;
      });
      html += '</div>';
    }

    // Resumo
    if (d.resumo?.length) {
      html += `<div style="margin-bottom:20px">
        <div style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin-bottom:12px">⚡ Resumo rápido</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">`;
      d.resumo.forEach(r => {
        html += `<div style="background:#EFF6FF;border-radius:10px;padding:14px">
          <div style="font-weight:700;font-size:13px;color:#2563EB;margin-bottom:6px">${_esc(r.titulo)}</div>
          <div style="font-size:13px;line-height:1.6">${_esc(r.conteudo)}</div>
        </div>`;
      });
      html += '</div></div>';
    }

    // Questões
    if (d.questoes?.length) {
      html += `<div style="margin-bottom:20px">
        <div style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin-bottom:12px">✏️ Atividade</div>`;
      d.questoes.forEach((q, i) => {
        html += `<div style="border:1.5px solid #E5E7EB;border-radius:10px;padding:16px;margin-bottom:10px">
          <p style="font-weight:700;font-size:14px;margin-bottom:10px">Questão ${i + 1}. ${_esc(q.enunciado)}</p>`;
        if (q.tipo === 'multipla') {
          (q.opcoes || []).forEach(op => {
            html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:6px;font-size:14px">
              <span style="width:16px;height:16px;border:2px solid #9CA3AF;border-radius:50%;flex-shrink:0"></span>
              ${_esc(op)}
            </div>`;
          });
        }
        if (q.tipo === 'vf') {
          html += `<div style="display:flex;gap:12px;font-size:14px">
            <label style="display:flex;align-items:center;gap:6px"><input type="radio" name="vf_${i}" disabled> Verdadeiro</label>
            <label style="display:flex;align-items:center;gap:6px"><input type="radio" name="vf_${i}" disabled> Falso</label>
          </div>`;
        }
        html += '</div>';
      });

      // Gabarito
      html += `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px">
        <div style="font-weight:700;font-size:12px;color:#065F46;margin-bottom:8px">📝 Gabarito</div>`;
      d.questoes.forEach((q, i) => {
        html += `<p style="font-size:13px;margin-bottom:4px"><strong style="color:#059669">Q${i + 1}:</strong> ${_esc(q.gabarito)}</p>`;
      });
      html += '</div></div>';
    }

    container.innerHTML = html;
  },

  // Nova adaptação (limpa tudo)
  novaAdaptacao() {
    Adaptacao.limpar();
  }
};

// Função auxiliar global de escape HTML
function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
