// Vercel Serverless Function — registra uma COMPRA (páginas de obrigado) numa planilha do Google.
// Armazenamento OPCIONAL: só grava se a variável de ambiente ORDERS_ENDPOINT (Web App do Apps Script,
// de preferência uma planilha SEPARADA da de leads) estiver configurada na Vercel.
// Enquanto não estiver configurado, responde 200 {skipped:true} — a página de obrigado funciona normalmente,
// e o rastreamento da conversão (evento purchase -> GTM/GA4) continua acontecendo no navegador.
//
// ⚠️ Importante: a página de obrigado é pública. Este registro é baseado no acesso à página,
// NÃO é uma confirmação de pagamento verificada. Para contagem 100% confiável, o ideal é
// configurar um webhook/postback da hub.la para um endpoint próprio no futuro.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const endpoint = process.env.ORDERS_ENDPOINT;
  if (!endpoint) {
    // armazenamento não configurado — no-op silencioso (não é erro)
    return res.status(200).json({ ok: false, skipped: true });
  }

  const payload = JSON.stringify({
    transaction_id: String(body.transaction_id || '').trim(),
    item_id: String(body.item_id || '').trim(),
    item_name: String(body.item_name || '').trim(),
    value: Number(body.value || 0),
    currency: String(body.currency || 'BRL').trim(),
    origem: String(body.origem || 'obrigado').trim(),
    data: new Date().toISOString()
  });

  // mesmo padrão do /api/subscribe: até 2 tentativas contra hiccups transitórios do Google.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (attempt > 1) await new Promise((resolve) => setTimeout(resolve, 500));
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
    } catch (_) { /* falha transitória — tenta de novo */ }
  }
  return res.status(502).json({ ok: false, error: 'falha_ao_salvar' });
};
