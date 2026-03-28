// ═══════════════════════════════════════════
// DOWNLOADS.JS — DOCX e PDF
// ═══════════════════════════════════════════

const Downloads = {

  _nomeArquivo() {
    const aluno = App.alunos.find(a => a.id === App.alunoAtual);
    return (aluno?.nome || 'adaptacao').replace(/\s+/g, '_');
  },

  // Baixa DOCX
  async baixarDocx() {
    const adapt = App.adaptacaoAtual;
    if (!adapt) { UI.toast('Nenhuma adaptação gerada.', 'erro'); return; }

    UI.toast('⏳ Gerando DOCX...');

    try {
      const linhas = Downloads._adaptacaoParaTexto(adapt);
      await Downloads._gerarDocx(`Adaptacao_${Downloads._nomeArquivo()}.docx`, linhas);
      UI.toast('📥 DOCX baixado!', 'sucesso');
    } catch(e) {
      console.error('Erro DOCX:', e);
      UI.toast('Erro ao gerar DOCX.', 'erro');
    }
  },

  // Baixa PDF
  async baixarPdf() {
    const adapt = App.adaptacaoAtual;
    if (!adapt) { UI.toast('Nenhuma adaptação gerada.', 'erro'); return; }

    UI.toast('⏳ Gerando PDF...');

    try {
      await Downloads._gerarPdf(adapt);
      UI.toast('📄 PDF baixado!', 'sucesso');
    } catch(e) {
      console.error('Erro PDF:', e);
      UI.toast('Erro ao gerar PDF.', 'erro');
    }
  },

  // Converte adaptação para texto estruturado
  _adaptacaoParaTexto(adapt) {
    const linhas = [];
    if (adapt.tipo === 'texto') {
      linhas.push(adapt.data);
      return linhas;
    }

    const d = adapt.data;
    const aluno = App.alunos.find(a => a.id === App.alunoAtual);
    const perfil = App.perfil || {};

    linhas.push(`--- ${d.titulo || 'Material Adaptado'} ---`);
    linhas.push('');
    if (aluno) linhas.push(`Aluno: ${aluno.nome} | Diagnóstico: ${aluno.diagnostico}`);
    if (perfil.disciplina) linhas.push(`Disciplina: ${perfil.disciplina}`);
    linhas.push('');

    if (d.passos?.length) {
      linhas.push('--- Aprenda passo a passo ---');
      linhas.push('');
      d.passos.forEach(p => linhas.push(`${p.numero}. ${p.texto}`));
      linhas.push('');
    }

    if (d.resumo?.length) {
      linhas.push('--- Resumo Rápido ---');
      linhas.push('');
      d.resumo.forEach(r => linhas.push(`**${r.titulo}:** ${r.conteudo}`));
      linhas.push('');
    }

    if (d.questoes?.length) {
      linhas.push('--- Atividade ---');
      linhas.push('');
      d.questoes.forEach((q, i) => {
        linhas.push(`${i + 1}. ${q.enunciado}`);
        if (q.tipo === 'multipla') {
          (q.opcoes || []).forEach(op => linhas.push(`   ${op}`));
        }
        if (q.tipo === 'vf') {
          linhas.push('   ( ) Verdadeiro   ( ) Falso');
        }
        linhas.push('');
      });

      linhas.push('--- Gabarito ---');
      linhas.push('');
      d.questoes.forEach((q, i) => linhas.push(`Questão ${i + 1}: ${q.gabarito}`));
    }

    return linhas;
  },

  // Gera arquivo DOCX
  async _gerarDocx(nomeArquivo, linhas) {
    const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = docx;

    const paragrafos = linhas.map(linha => {
      if (!linha) return new Paragraph({ children: [new TextRun('')] });

      if (linha.startsWith('---') && linha.endsWith('---')) {
        const titulo = linha.replace(/---/g, '').trim();
        return new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: titulo, bold: true, size: 26 })]
        });
      }

      // Negrito inline com **texto**
      const partes = linha.split(/\*\*(.*?)\*\*/g);
      const runs = partes.map((parte, idx) =>
        new TextRun({ text: parte, bold: idx % 2 === 1, size: 24 })
      );

      return new Paragraph({ children: runs });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragrafos
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Gera PDF usando html2canvas + jsPDF, seção por seção (sem cortar texto)
  async _gerarPdf(adapt) {
    const aluno = App.alunos.find(a => a.id === App.alunoAtual);
    const perfil = App.perfil || {};
    const nome = aluno?.nome || 'aluno';

    // Container oculto
    const container = document.createElement('div');
    container.style.cssText = [
      'position:fixed', 'left:-9999px', 'top:0',
      'width:740px', 'background:white',
      'font-family:"Plus Jakarta Sans",Arial,sans-serif',
      'font-size:13px', 'line-height:1.7', 'color:#111827'
    ].join(';');
    container.innerHTML = `<style>
      :root{--brand:#2563EB;--text:#111827;--muted:#6B7280;--border:#E5E7EB;}
      *{box-sizing:border-box;}
    </style>`;
    document.body.appendChild(container);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const usableW = pageW - margin * 2;
    let curY = margin;

    const adicionarSecao = async (htmlStr, padding = '0') => {
      const div = document.createElement('div');
      div.style.cssText = `width:740px;padding:${padding};background:white;`;
      div.innerHTML = htmlStr;
      container.appendChild(div);

      const canvas = await html2canvas(div, {
        scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false
      });
      container.removeChild(div);

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgH = (canvas.height * usableW) / canvas.width;

      if (curY + imgH > pageH - margin && curY > margin + 10) {
        pdf.addPage();
        curY = margin;
      }

      pdf.addImage(imgData, 'JPEG', margin, curY, usableW, imgH);
      curY += imgH + 4;
    };

    try {
      if (adapt.tipo !== 'json' || !adapt.data) {
        // Fallback para texto simples
        await adicionarSecao(`<div style="white-space:pre-wrap;font-size:13px">${_esc(adapt.data || '')}</div>`);
      } else {
        const d = adapt.data;

        // Cabeçalho
        await adicionarSecao(`
          <div style="text-align:center;padding-bottom:14px;border-bottom:2px solid #2563EB">
            <div style="font-size:11px;color:#6B7280;margin-bottom:4px">
              ${[perfil.disciplina, nome, new Date().toLocaleDateString('pt-BR')].filter(Boolean).join(' · ')}
            </div>
            <h1 style="font-size:20px;font-weight:800;color:#2563EB;margin:0">${_esc(d.titulo || 'Adaptação')}</h1>
          </div>`);

        // Passos — um por vez para nunca cortar
        if (d.passos?.length) {
          await adicionarSecao(`<div style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin:8px 0 4px">📖 Aprenda passo a passo</div>`, '4px 0');
          for (const p of d.passos) {
            await adicionarSecao(`
              <div style="display:flex;gap:10px;padding:10px 14px;background:#F8FAFC;border-radius:8px;border-left:4px solid #2563EB">
                <span style="flex-shrink:0;width:22px;height:22px;background:#2563EB;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${p.numero}</span>
                <p style="margin:0;font-size:13px;line-height:1.6">${_esc(p.texto)}</p>
              </div>`, '3px 0');
          }
        }

        // Resumo — card por card
        if (d.resumo?.length) {
          await adicionarSecao(`<div style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin:8px 0 4px">⚡ Resumo rápido</div>`, '4px 0');
          for (const r of d.resumo) {
            await adicionarSecao(`
              <div style="background:#EFF6FF;border-radius:8px;padding:12px 14px">
                <div style="font-weight:700;font-size:12px;color:#2563EB;margin-bottom:4px">${_esc(r.titulo)}</div>
                <div style="font-size:13px;line-height:1.6">${_esc(r.conteudo)}</div>
              </div>`, '3px 0');
          }
        }

        // Questões — uma por vez
        if (d.questoes?.length) {
          await adicionarSecao(`<div style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin:8px 0 4px">✏️ Atividade</div>`, '4px 0');
          for (let i = 0; i < d.questoes.length; i++) {
            const q = d.questoes[i];
            let qHtml = `<div style="border:1.5px solid #E5E7EB;border-radius:10px;padding:14px">
              <p style="font-weight:700;font-size:13px;margin:0 0 10px">Q${i + 1}. ${_esc(q.enunciado)}</p>`;
            if (q.tipo === 'multipla') {
              (q.opcoes || []).forEach(op => {
                qHtml += `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #E5E7EB;border-radius:7px;margin-bottom:6px;font-size:13px">
                  <span style="width:14px;height:14px;border:2px solid #9CA3AF;border-radius:50%;flex-shrink:0"></span>
                  ${_esc(op)}</div>`;
              });
            }
            if (q.tipo === 'vf') {
              qHtml += `<div style="font-size:13px">( ) Verdadeiro &nbsp;&nbsp; ( ) Falso</div>`;
            }
            qHtml += '</div>';
            await adicionarSecao(qHtml, '3px 0');
          }

          // Gabarito
          const gabHtml = `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px 14px">
            <div style="font-weight:700;font-size:12px;color:#065F46;margin-bottom:6px">📝 Gabarito</div>
            ${d.questoes.map((q, i) => `<p style="font-size:12px;margin:0 0 3px"><strong style="color:#059669">Q${i + 1}:</strong> ${_esc(q.gabarito)}</p>`).join('')}
          </div>`;
          await adicionarSecao(gabHtml, '3px 0');
        }
      }

      pdf.save(`Adaptacao_${Downloads._nomeArquivo()}.pdf`);
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  }
};
