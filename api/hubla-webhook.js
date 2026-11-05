// Vercel Serverless Function — recebe os webhooks da Hubla.
// Quando uma fatura é PAGA (invoice.payment_succeeded), registra o pagamento
// numa aba "Pagamentos" da planilha e marca a pré-inscrição como PAGA.
//
// Segurança: a Hubla assina cada disparo com o header `x-hubla-token`
// (gerado no painel em Integrações → Automações → Webhook → Autenticação).
// Guardamos esse valor na variável de ambiente HUBLA_WEBHOOK_TOKEN (Vercel).
// O header `x-hubla-idempotency` identifica o evento; o Apps Script ignora
// faturas repetidas pelo id, então um reenvio da Hubla não duplica a linha.
//
// Os dados vão para o MESMO Apps Script da pré-inscrição (SHEET_ENDPOINT_INSCRICAO),
// com `tipo: 'pagamento'` — o script roteia para a aba certa.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // --- autenticação: o disparo precisa trazer o token da Hubla ---
  const expected = process.env.HUBLA_WEBHOOK_TOKEN;
  if (!expected) {
    // ainda não configurado — rejeita para não processar nada sem validar
    return res.status(503).json({ ok: false, error: 'webhook_nao_configurado' });
  }
  const token = req.headers['x-hubla-token'] || '';
  if (token !== expected) {
    return res.status(401).json({ ok: false, error: 'token_invalido' });
  }

  // tamanho sensato para o corpo
  if (parseInt(req.headers['content-length'] || '0', 10) > 60000) {
    return res.status(413).json({ ok: false, error: 'payload_grande' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const type = String(body.type || '');
  const ev = body.event || {};
  const inv = ev.invoice || {};

  // Só agimos quando a fatura foi efetivamente paga. Qualquer outro evento
  // responde 200 (para a Hubla não ficar reenviando), mas não grava nada.
  const pago = type === 'invoice.payment_succeeded' || (inv && String(inv.status) === 'paid');
  if (!pago) {
    return res.status(200).json({ ok: true, ignored: type || 'desconhecido' });
  }

  const endpoint = process.env.SHEET_ENDPOINT_INSCRICAO;
  if (!endpoint) {
    // sem planilha configurada ainda — avisa a Hubla para reenviar depois
    return res.status(503).json({ ok: false, error: 'planilha_nao_configurada' });
  }

  const clean = (v) => String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 180);
  const payer = inv.payer || ev.user || {};
  const amount = inv.amount || {};
  const utm = (inv.firstPaymentSession && inv.firstPaymentSession.utm) ||
              (inv.paymentSession && inv.paymentSession.utm) || {};
  // Numa venda com order bump a Hubla manda todos os produtos em `products`;
  // registramos todos ("Produto A + Produto B") para a linha bater com o valor.
  const lista = Array.isArray(ev.products) ? ev.products : [];
  const nomes = lista.map((p) => p && (p.name || (p.product && p.product.name))).filter(Boolean);
  const produto = nomes.length ? nomes.join(' + ') : ((ev.product && ev.product.name) || '');
  const oferta = lista
    .map((p) => p && Array.isArray(p.offers) && p.offers[0] && p.offers[0].name)
    .filter(Boolean)
    .join(' + ');
  const nome = clean(((payer.firstName || '') + ' ' + (payer.lastName || '')).trim() || payer.name);
  const valor = (amount.total != null) ? amount.total
              : (amount.totalCents != null ? amount.totalCents / 100 : '');

  const payload = JSON.stringify({
    tipo: 'pagamento',
    data: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    nome,
    email: clean(payer.email),
    telefone: clean(payer.phone),
    produto: clean(produto),
    oferta: clean(oferta),
    valor: clean(valor),
    metodo: clean(inv.paymentMethod),
    status: clean(inv.status || 'paid'),
    invoice_id: clean(inv.id),
    idempotency: clean(req.headers['x-hubla-idempotency']),
    utm_source: clean(utm.source),
    utm_medium: clean(utm.medium),
    utm_campaign: clean(utm.campaign),
    utm_content: clean(utm.content),
    utm_term: clean(utm.term)
  });

  // repassa para o Apps Script (2 tentativas em caso de falha transitória)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (attempt > 1) await new Promise((r) => setTimeout(r, 500));
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      const text = await r.text();
      let upstream = {};
      try { upstream = JSON.parse(text); } catch (_) {}
      if (r.ok && upstream.ok === true) {
        return res.status(200).json({ ok: true });
      }
    } catch (_) { /* tenta de novo */ }
  }
  // 502 faz a Hubla reenviar mais tarde — não perdemos o pagamento
  return res.status(502).json({ ok: false, error: 'falha_ao_registrar' });
};
