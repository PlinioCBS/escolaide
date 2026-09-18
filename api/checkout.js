// Vercel Serverless Function — inicia o checkout do carrinho no Mercado Pago (Checkout Pro).
// O comprador paga na página segura do Mercado Pago; NÓS nunca recebemos dados de cartão.
//
// Ativação: configure a variável de ambiente MP_ACCESS_TOKEN (Access Token de PRODUÇÃO do
// Mercado Pago) no painel da Vercel. Enquanto não estiver configurada, responde
// { ok:false, error:'nao_configurado' } e o site oferece o fechamento pelo WhatsApp.
//
// Segurança: os PREÇOS vêm sempre do servidor (data/produtos.json), nunca do cliente —
// o navegador só envia slug + quantidade.

const fs = require('fs');
const path = require('path');

function carregarProdutos() {
  try {
    const p = path.join(process.cwd(), 'data', 'produtos.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) { return { produtos: [] }; }
}

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
  const itens = Array.isArray(body.itens) ? body.itens : [];
  if (!itens.length) return res.status(400).json({ ok: false, error: 'carrinho_vazio' });

  const catalogo = carregarProdutos();
  const mapa = {};
  (catalogo.produtos || []).forEach(function (p) { mapa[p.slug] = p; });

  // monta os itens do Mercado Pago com preços do servidor (só produtos válidos p/ MP)
  const mpItems = [];
  itens.forEach(function (i) {
    const p = mapa[i.slug];
    const qty = Math.max(1, Math.min(99, parseInt(i.qty, 10) || 1));
    if (p && p.disponivel && p.checkout === 'mercadopago' && p.preco != null) {
      mpItems.push({
        id: p.slug,
        title: p.nome,
        quantity: qty,
        currency_id: 'BRL',
        unit_price: Number(p.preco)
      });
    }
  });
  if (!mpItems.length) return res.status(400).json({ ok: false, error: 'sem_itens_validos' });

  // frete recalculado no servidor (a partir do CEP + config), nunca do cliente
  const subtotal = mpItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const cep = String(body.cep || '').replace(/\D/g, '');
  const fconf = catalogo.frete || {};
  let frete = 0;
  if (cep.length === 8) {
    if (fconf.gratis_acima_de != null && subtotal >= fconf.gratis_acima_de) frete = 0;
    else { const d = parseInt(cep.charAt(0), 10); (fconf.tabela || []).forEach((t) => { if (t.digitos && t.digitos.indexOf(d) > -1) frete = Number(t.valor); }); }
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    // ainda não configurado — o site oferece fechar pelo WhatsApp
    return res.status(200).json({ ok: false, error: 'nao_configurado' });
  }

  // base do site (para as URLs de retorno e webhook)
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = process.env.SITE_URL || (proto + '://' + host);

  const preference = {
    items: mpItems,
    shipments: { cost: frete, mode: 'not_specified' },
    back_urls: {
      success: base + '/obrigado-pedido',
      pending: base + '/obrigado-pedido',
      failure: base + '/carrinho'
    },
    auto_return: 'approved',
    statement_descriptor: 'IDE PREPARACAO',
    notification_url: base + '/api/mp-webhook'
  };

  try {
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(preference)
    });
    const data = await r.json();
    if (r.ok && (data.init_point || data.sandbox_init_point)) {
      return res.status(200).json({ ok: true, init_point: data.init_point || data.sandbox_init_point });
    }
    return res.status(502).json({ ok: false, error: 'falha_mercadopago' });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'falha_conexao' });
  }
};
