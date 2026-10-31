// Vercel Serverless Function — recebe a pré-inscrição dos Cursos e Experiências
// (/preparacao-familiar/inscricao) e grava numa planilha do Google.
// O endereço da planilha (Web App do Apps Script) fica na variável de ambiente
// SHEET_ENDPOINT_INSCRICAO, configurada no painel da Vercel (nunca no código).
// Enquanto não configurada, respondemos 503 e o formulário leva o lead direto
// para o WhatsApp — assim nenhuma inscrição é perdida.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // --- proteção: bloqueia requisições de outros sites e corpos gigantes ---
  const _orig = req.headers.origin || req.headers.referer || '';
  if (_orig) {
    let _h = '';
    try { _h = new URL(_orig).hostname; } catch (e) {}
    const _ok = _h === 'preparacaofamiliar.com.br' || _h === 'www.preparacaofamiliar.com.br' || _h === 'escolaide.vercel.app' || _h === 'localhost' || (_h.indexOf('escolaide') === 0 && _h.endsWith('.vercel.app'));
    if (!_ok) return res.status(403).json({ ok: false, error: 'origem_nao_permitida' });
  }
  if (parseInt(req.headers['content-length'] || '0', 10) > 10000) return res.status(413).json({ ok: false, error: 'payload_grande' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  // honeypot anti-bot: campo oculto — se vier preenchido, descarta em silêncio
  if (String(body.website || '').trim() !== '') {
    return res.status(200).json({ ok: true, redirect: '/preparacao-familiar/confirmado' });
  }

  const clean = (v) => String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 140);
  const nome = clean(body.nome);
  const email = clean(body.email);
  const whatsapp = clean(body.whatsapp || body.telefone);
  const cidade = clean(body.cidade);
  const pessoas = clean(body.pessoas);

  // validação básica no servidor
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const foneDigits = whatsapp.replace(/\D/g, '');
  if (nome.length < 2 || !emailOk || foneDigits.length < 10 || foneDigits.length > 11) {
    return res.status(400).json({ ok: false, error: 'dados_invalidos' });
  }

  const endpoint = process.env.SHEET_ENDPOINT_INSCRICAO;
  if (!endpoint) {
    // ainda não configurado — o formulário cai para o WhatsApp (nada é perdido)
    return res.status(503).json({ ok: false, error: 'nao_configurado' });
  }

  const utm = (body.utm && typeof body.utm === 'object') ? body.utm : {};
  const payload = JSON.stringify({
    data: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    nome, whatsapp, email, cidade, pessoas,
    origem: clean(body.origem || 'preparacao-familiar'),
    etapa: 'pré-inscrição',
    utm_source: clean(utm.utm_source),
    utm_medium: clean(utm.utm_medium),
    utm_campaign: clean(utm.utm_campaign),
    utm_content: clean(utm.utm_content),
    utm_term: clean(utm.utm_term)
  });

  // O Apps Script às vezes falha de forma transitória — tentamos 2 vezes.
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
        return res.status(200).json({ ok: true, redirect: '/preparacao-familiar/confirmado' });
      }
    } catch (_) { /* falha transitória — tenta de novo */ }
  }
  return res.status(502).json({ ok: false, error: 'falha_ao_salvar' });
};
