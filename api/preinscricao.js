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
  if (parseInt(req.headers['content-length'] || '0', 10) > 40000) return res.status(413).json({ ok: false, error: 'payload_grande' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  // honeypot anti-bot: campo oculto — se vier preenchido, descarta em silêncio
  if (String(body.website || '').trim() !== '') {
    return res.status(200).json({ ok: true, redirect: '/preparacao-familiar/confirmado' });
  }

  const clean = (v) => String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 140);
  const cleanLong = (v) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, 600);
  const MAX_PESSOAS = 5;
  const nome = clean(body.nome);
  const email = clean(body.email);
  const whatsapp = clean(body.whatsapp || body.telefone);
  const cidade = clean(body.cidade);
  const consentimento = clean(body.consentimento);

  // participantes: o formulário manda a lista (participante 1 = responsável);
  // versões antigas mandam só os campos soltos de uma pessoa
  const lista = Array.isArray(body.participantes) && body.participantes.length ? body.participantes : [body];
  if (lista.length > MAX_PESSOAS) return res.status(400).json({ ok: false, error: 'pessoas_demais' });
  const participantes = lista.map((p) => ({
    nome: clean(p && p.nome),
    idade: clean(p && p.idade),
    sabe_nadar: clean(p && p.sabe_nadar),
    alergias: cleanLong(p && p.alergias),
    saude: cleanLong(p && p.saude),
    emerg_nome: clean(p && p.emerg_nome),
    emerg_tel: clean(p && p.emerg_tel),
  }));
  const n = participantes.length;

  // validação no servidor: contato do responsável + nome e contato de emergência de cada um
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const foneOk = (v) => { const d = v.replace(/\D/g, ''); return d.length >= 10 && d.length <= 11; };
  if (nome.length < 2 || !emailOk || !foneOk(whatsapp) ||
      participantes.some((p) => p.nome.length < 2 || p.emerg_nome.length < 2 || !foneOk(p.emerg_tel))) {
    return res.status(400).json({ ok: false, error: 'dados_invalidos' });
  }
  // identifica o grupo na coluna PESSOAS: "3 · grupo G-AB12 · 2/3" (o Apps Script usa
  // a marca do grupo para dar baixa em todas as fichas quando o pagamento chega)
  const grupo = 'G-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const pessoasTxt = (k) => (n === 1 ? '1' : `${n} · grupo ${grupo} · ${k}/${n}`);

  const endpoint = process.env.SHEET_ENDPOINT_INSCRICAO;
  if (!endpoint) {
    // ainda não configurado — o formulário cai para o WhatsApp (nada é perdido)
    return res.status(503).json({ ok: false, error: 'nao_configurado' });
  }

  const utm = (body.utm && typeof body.utm === 'object') ? body.utm : {};
  const data = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // O Apps Script às vezes falha de forma transitória — tentamos 2 vezes por ficha.
  async function gravar(payload) {
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
        if (r.ok && upstream.ok === true) return true;
      } catch (_) { /* falha transitória — tenta de novo */ }
    }
    return false;
  }

  // uma linha por participante na aba "Pré-inscrições" (WhatsApp/e-mail/cidade do responsável)
  for (let k = 0; k < n; k++) {
    const p = participantes[k];
    const ok = await gravar(JSON.stringify({
      data,
      nome: p.nome, whatsapp, email, cidade, pessoas: pessoasTxt(k + 1),
      idade: p.idade, sabe_nadar: p.sabe_nadar, alergias: p.alergias, saude: p.saude,
      emerg_nome: p.emerg_nome, emerg_tel: p.emerg_tel, consentimento,
      origem: clean(body.origem || 'preparacao-familiar') + (k > 0 ? ' (resp.: ' + nome + ')' : ''),
      etapa: 'pré-inscrição',
      utm_source: clean(utm.utm_source),
      utm_medium: clean(utm.utm_medium),
      utm_campaign: clean(utm.utm_campaign),
      utm_content: clean(utm.utm_content),
      utm_term: clean(utm.utm_term)
    }));
    if (!ok) return res.status(502).json({ ok: false, error: 'falha_ao_salvar', gravadas: k });
  }
  return res.status(200).json({ ok: true, pessoas: n, redirect: '/preparacao-familiar/confirmado' });
};
