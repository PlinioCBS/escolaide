// Vercel Serverless Function — recebe o cadastro do /form e grava na planilha do Google.
// O endereço da planilha (Web App do Apps Script) fica na variável de ambiente
// SHEET_ENDPOINT, configurada no painel da Vercel (nunca no código público).

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // corpo pode vir já parseado (objeto) ou como string
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const nome = String(body.nome || '').trim();
  const email = String(body.email || '').trim();
  const telefone = String(body.telefone || '').trim();
  const origem = String(body.origem || 'form').trim();
  const destino = String(body.destino || 'telegram').trim().toLowerCase();

  // validação básica no servidor
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const foneDigits = telefone.replace(/\D/g, '');
  if (nome.length < 2 || !emailOk || foneDigits.length < 10 || foneDigits.length > 11) {
    return res.status(400).json({ ok: false, error: 'dados_invalidos' });
  }

  const endpoint = process.env.SHEET_ENDPOINT;
  if (!endpoint) {
    // ainda não configurado — evita "perder" leads em silêncio
    return res.status(503).json({ ok: false, error: 'nao_configurado' });
  }

  const payload = JSON.stringify({
    nome, email, telefone, origem,
    data: new Date().toISOString()
  });

  // O Apps Script às vezes falha de forma transitória (hiccup/redirect do Google).
  // Tentamos até 2 vezes antes de reportar erro, para não perder o lead num blip.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (attempt > 1) await new Promise((resolve) => setTimeout(resolve, 500));
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      // o Apps Script sempre responde 200; o sucesso real está no corpo ({ok:true}).
      const text = await r.text();
      let upstream = {};
      try { upstream = JSON.parse(text); } catch (_) {}
      if (r.ok && upstream.ok === true) {
        // devolve o link do canal certo (Telegram ou WhatsApp) só após salvar;
        // os links ficam em env vars, fora do repo público.
        const redirect = destino === 'whatsapp'
          ? (process.env.REDIRECT_URL_WHATSAPP || '')
          : (process.env.REDIRECT_URL || '');
        return res.status(200).json({ ok: true, redirect });
      }
    } catch (_) { /* falha transitória — tenta de novo */ }
  }
  return res.status(502).json({ ok: false, error: 'falha_ao_salvar' });
};
