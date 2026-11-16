/**
 * IDE — Pré-inscrições + Pagamentos (Cursos e Experiências)
 *
 * Um único Web App recebe DUAS coisas, roteadas pelo campo "tipo":
 *   • pré-inscrição  (do formulário /preparacao-familiar/inscricao)  → aba "Pré-inscrições"
 *   • pagamento      (do webhook da Hubla, via /api/hubla-webhook)    → aba "Pagamentos"
 * Ao registrar um pagamento, tentamos marcar a pré-inscrição correspondente
 * (mesmo e-mail) como PAGA.
 *
 * COMO ATUALIZAR (mantendo a MESMA URL /exec):
 *  1. Extensões → Apps Script. Apague tudo e cole este código. Salve.
 *  2. Implantar → Gerenciar implantações → (a implantação atual) → ✏️ Editar
 *     → Versão: "Nova versão" → Implantar.  (A URL /exec continua a mesma.)
 */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (String(d.tipo) === 'pagamento') return handlePagamento(d);
    return handlePreinscricao(d);
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- PRÉ-INSCRIÇÃO (formulário do site) ---------- */
function handlePreinscricao(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Pré-inscrições') || ss.insertSheet('Pré-inscrições');

  var cols = ['data', 'nome', 'whatsapp', 'email', 'cidade', 'pessoas',
              'idade', 'sabe_nadar', 'alergias', 'saude', 'emerg_nome', 'emerg_tel', 'consentimento',
              'origem', 'etapa',
              'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  if (sh.getLastRow() === 0) {
    sh.appendRow(['DATA', 'NOME', 'WHATSAPP', 'E-MAIL', 'CIDADE', 'PESSOAS',
                  'IDADE(S)', 'SABE NADAR', 'ALERGIAS', 'SAÚDE / MEDICAMENTOS', 'EMERGÊNCIA — NOME', 'EMERGÊNCIA — TELEFONE', 'DECLARAÇÃO',
                  'ORIGEM', 'ETAPA',
                  'UTM_SOURCE', 'UTM_MEDIUM', 'UTM_CAMPAIGN', 'UTM_CONTENT', 'UTM_TERM']);
    sh.setFrozenRows(1);
  }

  sh.appendRow(cols.map(function (c) { return d[c] != null ? d[c] : ''; }));
  return out({ ok: true });
}

/* ---------- PAGAMENTO (webhook da Hubla) ---------- */
function handlePagamento(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Pagamentos') || ss.insertSheet('Pagamentos');

  var cols = ['data', 'nome', 'email', 'telefone', 'produto', 'oferta',
              'valor', 'metodo', 'status', 'invoice_id',
              'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  if (sh.getLastRow() === 0) {
    sh.appendRow(['DATA', 'NOME', 'E-MAIL', 'TELEFONE', 'PRODUTO', 'OFERTA',
                  'VALOR (R$)', 'MÉTODO', 'STATUS', 'ID DA FATURA',
                  'UTM_SOURCE', 'UTM_MEDIUM', 'UTM_CAMPAIGN', 'UTM_CONTENT', 'UTM_TERM']);
    sh.setFrozenRows(1);
  }

  // dedupe: se já registramos esta fatura, não grava de novo
  var invId = String(d.invoice_id || '').trim();
  if (invId && sh.getLastRow() > 1) {
    var ids = sh.getRange(2, 10, sh.getLastRow() - 1, 1).getValues(); // coluna J = invoice_id
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === invId) return out({ ok: true, dup: true });
    }
  }

  sh.appendRow(cols.map(function (c) { return d[c] != null ? d[c] : ''; }));

  // marca a pré-inscrição correspondente como PAGA (melhor esforço) — só
  // quando a compra é do curso presencial; ebooks/comunidade não contam
  if (/curso presencial/i.test(String(d.produto || ''))) {
    try { marcarPreinscricaoPaga(ss, d); } catch (err) { /* não bloqueia o registro */ }
  }

  return out({ ok: true });
}

function marcarPreinscricaoPaga(ss, d) {
  var email = String(d.email || '').trim().toLowerCase();
  if (!email) return;
  var sh = ss.getSheetByName('Pré-inscrições');
  if (!sh || sh.getLastRow() < 2) return;

  // garante a coluna "PAGAMENTO" no cabeçalho (coluna 21)
  var pagCol = 21;
  if (sh.getLastColumn() < pagCol || String(sh.getRange(1, pagCol).getValue()).trim() === '') {
    sh.getRange(1, pagCol).setValue('PAGAMENTO');
  }

  // procura o e-mail (coluna D = 4), de baixo para cima (pega a inscrição mais recente).
  // Se ela for de um grupo (coluna F = PESSOAS, ex.: "3 · grupo G-AB12 · 1/3"),
  // marca todas as fichas desse grupo — o pagamento cobre o grupo inteiro.
  var n = sh.getLastRow() - 1;
  var emails = sh.getRange(2, 4, n, 1).getValues();
  var pessoas = sh.getRange(2, 6, n, 1).getValues();
  var marca = 'PAGO ✅ ' + (d.data || '') + (d.valor ? ' (R$ ' + d.valor + ')' : '');
  for (var i = n - 1; i >= 0; i--) {
    if (String(emails[i][0]).trim().toLowerCase() !== email) continue;
    var g = String(pessoas[i][0]).match(/grupo (G-[A-Z0-9]+)/);
    if (!g) { sh.getRange(i + 2, pagCol).setValue(marca); return; }
    for (var j = 0; j < n; j++) {
      if (String(pessoas[j][0]).indexOf('grupo ' + g[1]) !== -1) sh.getRange(j + 2, pagCol).setValue(marca);
    }
    return;
  }
}
