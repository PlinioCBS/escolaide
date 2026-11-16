#!/usr/bin/env node
/* Gera as páginas de venda dos ebooks (uma por material), no mesmo desenho da
   página do curso (/preparacao-familiar):
     /mochila-de-emergencia  → ebook-mochila-emergencia
     /comida-que-dura        → comida-que-dura
     /mochila-pet            → mochila-emergencia-pet
   Preço, link da Hubla, nome e imagem vêm de data/produtos.json; o texto de venda
   fica aqui embaixo, em PAGINAS.

   Uso, depois de editar este arquivo ou data/produtos.json:
     node scripts/gerar-paginas-ebooks.js && node scripts/gerar-paginas-loja.js */
"use strict";
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const SITE = "https://preparacaofamiliar.com.br";
const MARCA = "IDE Preparação Familiar";
const dados = JSON.parse(fs.readFileSync(path.join(RAIZ, "data/produtos.json"), "utf8"));
const produto = (slug) => {
  const p = dados.produtos.find((x) => x.slug === slug);
  if (!p) throw new Error("produto não encontrado em data/produtos.json: " + slug);
  return p;
};
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const preco = (p) => (p.preco_promo != null && p.preco_promo < p.preco ? p.preco_promo : p.preco);
const brl = (v) => v.toFixed(2).replace(".", ",");

/* ------------------------------------------------------------------ textos */
const PAGINAS = [
  {
    rota: "mochila-de-emergencia",
    slug: "ebook-mochila-emergencia",
    titulo: "Ebook Mochila de Emergência — o que levar e o que não levar | IDE",
    descricao: "Manual Operacional da Academia IDE, Volume 001: como montar, organizar e manter pronta a mochila de emergência da sua família. PDF por R$ 19,90.",
    kicker: "Manual Operacional Academia IDE · Volume 001",
    h1: "Se vocês tivessem que sair de casa em 10 minutos, o que iria na mochila?",
    sub: "O primeiro volume do Manual Operacional da Academia IDE mostra como montar a mochila de emergência da sua família: o que levar, o que deixar de fora, como organizar e como manter tudo pronto para sair rápido se for preciso.",
    stats: [["Vol. 001", "Manual operacional"], ["PDF", "Celular ou impresso"], ["Na hora", "Liberado na Hubla"]],
    problemaKicker: "O problema",
    problemaH2: "Na hora da pressa, ninguém pensa direito",
    problema: [
      "Enchente, incêndio, falta de energia prolongada, uma evacuação de última hora: quando é preciso sair de casa, não dá tempo de decidir o que levar. Quem não decidiu antes pega o que vê pela frente — e esquece o que faz falta.",
      "A mochila de emergência resolve isso com antecedência. Mas mochila cheia demais pesa, atrasa e cansa; mochila montada sem critério deixa de fora o essencial. O manual existe para você montar a sua uma vez, do jeito certo.",
    ],
    aprendeH2: "O que o manual ensina",
    aprende: [
      ["O que levar", "os itens que fazem diferença nas primeiras horas fora de casa."],
      ["O que não levar", "o que só ocupa espaço e peso e atrapalha na hora de sair."],
      ["Como organizar", "para achar cada coisa rápido, sem precisar despejar a mochila."],
      ["Como manter pronta", "para a mochila continuar útil meses depois de montada."],
    ],
    paraQuem: [
      "Famílias que querem estar prontas para sair de casa rápido, se for preciso.",
      "Quem já pensou em montar uma mochila de emergência e não sabia por onde começar.",
      "Quem já tem uma mochila e quer conferir se ela está completa e leve.",
    ],
    autoria: "Material da Academia IDE Bushcraft & Sobrevivência, de Alex e Andreia Moraes.",
    cta: "Quero o manual",
    faqExtra: [
      ["Preciso comprar equipamento caro?", "Não. O manual ajuda você a decidir o que é essencial — boa parte do que entra na mochila você já tem em casa."],
    ],
  },
  {
    rota: "comida-que-dura",
    slug: "comida-que-dura",
    titulo: "Comida que Dura — como armazenar alimentos sem desperdício | Andreia Moraes",
    descricao: "Ebook da Andreia Moraes: como montar e manter em casa um estoque de alimentos que dura meses e anos, sem desperdício. PDF por R$ 19,90.",
    kicker: "Ebook · por Andreia Moraes",
    h1: "Comida guardada não é armário cheio. É estoque que dura.",
    sub: "No Comida que Dura, Andreia Moraes ensina a montar e manter em casa um estoque de alimentos para meses e até anos: o que guardar, como armazenar e como fazer o rodízio para nada estragar.",
    stats: [["Meses e anos", "De estoque em casa"], ["Zero", "Desperdício"], ["Na hora", "Liberado na Hubla"]],
    problemaKicker: "O problema",
    problemaH2: "Comprar a mais é fácil. Difícil é não perder.",
    problema: [
      "Muita gente começa um estoque de alimentos e desiste na primeira leva de produtos vencidos no fundo do armário. Dinheiro jogado fora e a sensação de que \"isso não é para mim\".",
      "O segredo não é comprar mais: é saber o que vale a pena guardar, como armazenar cada coisa e como girar o estoque no dia a dia da casa. É isso que este ebook ensina.",
    ],
    aprendeH2: "O que você aprende",
    aprende: [
      ["O que guardar", "os alimentos que valem a pena ter em estoque e os que não valem."],
      ["Como armazenar", "para cada alimento durar o máximo possível."],
      ["Como fazer o rodízio", "usando o estoque no dia a dia, sem deixar nada vencer."],
      ["Como manter", "um estoque para meses — e até anos — sem desperdício."],
    ],
    paraQuem: [
      "Quem quer ter comida em casa para uma emergência, uma crise ou um mês difícil.",
      "Quem já tentou fazer estoque e perdeu alimentos vencidos.",
      "Quem cuida das compras e da cozinha da casa e quer mais segurança para a família.",
    ],
    autoria: "Escrito por Andreia Moraes, instrutora da IDE e responsável pelos módulos de rotina doméstica, estoque e organização familiar.",
    cta: "Quero o ebook",
    faqExtra: [
      ["Serve para quem mora em apartamento?", "Serve. O estoque é montado de acordo com o espaço que você tem em casa."],
    ],
  },
  {
    rota: "mochila-pet",
    slug: "mochila-emergencia-pet",
    titulo: "Ebook Mochila de Emergência do PET — 72 horas de autonomia | IDE",
    descricao: "Guia da Academia IDE para montar a mochila de emergência do seu cão ou gato: água, alimentação, primeiros socorros, transporte e bem-estar por 72 horas. PDF por R$ 19,90.",
    kicker: "Ebook · Academia IDE",
    h1: "Numa evacuação, quem cuida do seu pet?",
    sub: "Este guia mostra como montar a mochila de emergência do seu animal para 72 horas de autonomia — água e alimentação, primeiros socorros, transporte seguro, higiene e bem-estar. Porque eles também fazem parte da família.",
    stats: [["72 h", "De autonomia"], ["Cão e gato", "Família completa"], ["Na hora", "Liberado na Hubla"]],
    problemaKicker: "O problema",
    problemaH2: "O plano da família quase sempre esquece o pet",
    problema: [
      "Na hora de sair de casa às pressas, o animal precisa de água, comida, remédio, guia, caixa de transporte — e alguém que já tenha pensado nisso antes. Sem preparo, ele vira mais uma preocupação no pior momento.",
      "Com uma mochila própria, montada com antecedência, o seu pet sai junto, com o que precisa para os três primeiros dias. Planeje, treine, evacue e proteja.",
    ],
    aprendeH2: "O que o guia cobre",
    aprende: [
      ["Água e alimentação", "quanto levar e como guardar para 72 horas."],
      ["Primeiros socorros", "o que ter à mão para cuidar do animal fora de casa."],
      ["Transporte seguro", "como levar o pet com segurança numa saída rápida."],
      ["Higiene e bem-estar", "para o animal passar os primeiros dias com menos estresse."],
    ],
    paraQuem: [
      "Tutores de cães e gatos que querem incluir o pet no plano de emergência da família.",
      "Quem mora em área sujeita a enchente, incêndio ou falta de energia.",
      "Quem já tem a mochila da família e falta a do animal.",
    ],
    autoria: "Material da Academia IDE Bushcraft & Sobrevivência, de Alex e Andreia Moraes.",
    cta: "Quero o guia do meu pet",
    faqExtra: [
      ["Serve para gato e para cachorro?", "Serve. A preparação vale para os animais da casa — a mochila é ajustada ao porte e às necessidades de cada um."],
    ],
  },
];

/* ------------------------------------------------------------------ página */
function pagina(cfg) {
  const p = produto(cfg.slug);
  const valor = preco(p);
  const url = `${SITE}/${cfg.rota}`;
  const img = p.imagens[0]; // .webp 1200x750
  const ogImg = SITE + img.replace(/\.webp$/, ".jpg");
  const link = p.link;
  const outros = PAGINAS.filter((x) => x !== cfg).map((x) => ({ ...x, p: produto(x.slug) }));
  const pasta = produto("pasta-emergencia-familia");

  const ld = [
    {
      "@context": "https://schema.org", "@type": "Product", name: p.nome, description: cfg.descricao,
      sku: p.slug, category: p.categoria, brand: { "@type": "Brand", name: MARCA }, image: [ogImg],
      offers: { "@type": "Offer", url, priceCurrency: "BRL", price: valor.toFixed(2), availability: "https://schema.org/InStock", seller: { "@type": "Organization", name: MARCA } },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Loja", item: SITE + "/loja" },
        { "@type": "ListItem", position: 3, name: p.nome },
      ],
    },
  ].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n");

  const faq = [
    ["Como eu recebo o material?", "Assim que o pagamento é aprovado, o material fica liberado na hora na sua área de compras da Hubla, a plataforma onde você faz o pagamento."],
    ["Em que formato é?", "É um PDF. Você lê no celular, no tablet ou no computador — e pode imprimir se preferir."],
    ["Como posso pagar?", "Pix ou cartão de crédito, no checkout seguro da Hubla."],
    ["É assinatura?", `Não. É um pagamento único de R$ ${brl(valor)}.`],
    ...cfg.faqExtra,
    ["Tenho uma dúvida que não está aqui.", 'Fale com a gente no WhatsApp: <a href="https://wa.me/5561993461237" target="_blank" rel="noopener">(61) 99346-1237</a>.'],
  ];

  return `<!DOCTYPE html>
<!-- Gerado por scripts/gerar-paginas-ebooks.js. Edite o texto lá e rode o script. -->
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(cfg.titulo)}</title>
<meta name="description" content="${esc(cfg.descricao)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="product">
<meta property="og:site_name" content="${MARCA}">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.nome)}">
<meta property="og:description" content="${esc(cfg.descricao)}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="750">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.nome)}">
<meta name="twitter:description" content="${esc(cfg.descricao)}">
<meta name="twitter:image" content="${ogImg}">
${ld}
<link rel="icon" href="/assets/favicon-ide.png">
<link rel="stylesheet" href="/assets/store.css">
<link rel="stylesheet" href="/assets/ebook.css">
<script src="/assets/track.js"></script>
</head>
<body>

<header class="pf-hero">
  <div class="wrap">
    <a class="brand" href="/loja"><img src="/assets/logo-ide-192.webp" alt="IDE" width="52" height="52"><span>IDE Preparação Familiar</span></a>
    <div class="hero-media">
      <img src="${img}" width="1200" height="750" alt="${esc(p.imagem_alt || "Capa do " + p.nome)}" fetchpriority="high">
    </div>
    <div class="hero-copy">
      <div class="kicker" style="color:#e9a24a">${esc(cfg.kicker)}</div>
      <h1>${esc(cfg.h1)}</h1>
      <p class="sub">${esc(cfg.sub)}</p>
      <div class="ctas">
        <a class="btn btn-accent" href="${link}" data-cta="ebook-hero">${esc(cfg.cta)} — R$ ${brl(valor)}</a>
      </div>
      <p class="hero-note">Pagamento único · Pix ou cartão · liberado na hora na Hubla</p>
      <div class="pf-stats">
${cfg.stats.map(([b, s]) => `        <div class="st"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("\n")}
      </div>
    </div>
  </div>
</header>

<main>

  <section class="section-light">
    <div class="wrap narrow">
      <div class="kicker">${esc(cfg.problemaKicker)}</div>
      <h2 class="h2">${esc(cfg.problemaH2)}</h2>
${cfg.problema.map((t) => `      <p class="lead">${esc(t)}</p>`).join("\n")}
    </div>
  </section>

  <section class="section-soft">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Conteúdo</div><h2>${esc(cfg.aprendeH2)}</h2></div>
      <div class="learn">
${cfg.aprende.map(([b, t], i) => `        <div class="item"><div class="n">${String(i + 1).padStart(2, "0")}</div><div><b>${esc(b)}</b><p>${esc(t)}</p></div></div>`).join("\n")}
      </div>
    </div>
  </section>

  <section class="section-light">
    <div class="wrap narrow">
      <div class="sec-head"><div class="kicker">Para quem é</div><h2>Feito para você se…</h2></div>
      <ul class="recv">
${cfg.paraQuem.map((t) => `        <li>${esc(t)}</li>`).join("\n")}
      </ul>
    </div>
  </section>

  <section class="section-soft">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Como funciona</div><h2>Três passos</h2></div>
      <div class="steps3">
        <div class="step"><div class="n">1 · Compra</div><p>Você paga uma vez, com Pix ou cartão, no checkout seguro da Hubla.</p></div>
        <div class="step"><div class="n">2 · Acesso</div><p>O PDF fica liberado na hora na sua área de compras da Hubla.</p></div>
        <div class="step"><div class="n">3 · Prática</div><p>Lê no celular ou imprime, e coloca em prática com a sua família.</p></div>
      </div>
    </div>
  </section>

  <section class="section-light">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Quem fez</div><h2>De quem ensina preparação em campo</h2><p>${esc(cfg.autoria)}</p></div>
      <div class="team">
        <div class="person">
          <img src="/assets/escolas/moraes.webp" alt="Alex Moraes" loading="lazy">
          <div class="pb"><div class="nome">Alex Moraes</div><div class="role">Instrutor-chefe da IDE</div>
            <p>Fuzileiro Naval com mais de 30 anos de carreira militar. Instrutor de sobrevivência, navegação terrestre, abrigos, fogo e primeiros socorros.</p></div>
        </div>
        <div class="person">
          <img src="/assets/escolas/andreia.webp" alt="Andreia Moraes" loading="lazy">
          <div class="pb"><div class="nome">Andreia Moraes</div><div class="role">Instrutora da IDE</div>
            <p>Responsável pelos módulos de rotina doméstica, estoque e organização familiar — a parte que faz o plano funcionar no dia a dia da casa.</p></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section-soft oferta" id="comprar">
    <div class="wrap">
      <div class="sec-head center"><div class="kicker">${esc(p.nome)}</div><h2>Comece hoje</h2></div>
      <div class="box">
        <img class="cover" src="${img}" width="1200" height="750" alt="" loading="lazy">
        <div class="price"><span class="cur">R$</span><span class="val">${brl(valor)}</span></div>
        <p class="price-note"><strong>pagamento único</strong> · Pix ou cartão</p>
        <ul class="incl">
${p.caracteristicas.map((c) => `          <li>${esc(c)}</li>`).join("\n")}
        </ul>
        <a class="btn btn-accent btn-block" href="${link}" data-cta="ebook-oferta">${esc(cfg.cta)}</a>
        <p class="fine">O pagamento é feito na plataforma segura da Hubla. Assim que é aprovado, o material fica liberado na sua área de compras.</p>
      </div>
    </div>
  </section>

  <section class="section-light faq">
    <div class="wrap narrow">
      <div class="sec-head"><div class="kicker">Dúvidas</div><h2>Perguntas frequentes</h2></div>
${faq.map(([q, a]) => `      <details><summary>${esc(q)}</summary><div class="answer">${a}</div></details>`).join("\n")}
    </div>
  </section>

  <section class="section-soft">
    <div class="wrap mid">
      <div class="sec-head"><div class="kicker">Continue se preparando</div><h2>Outros materiais da IDE</h2></div>
      <div class="more">
${outros.map((o) => `        <a class="card" href="/${o.rota}"><img src="${o.p.imagens[0]}" width="1200" height="750" alt="" loading="lazy"><span class="t">${esc(o.p.nome)}</span><span class="pr">R$ ${brl(preco(o.p))}</span></a>`).join("\n")}
        <a class="card" href="/pasta"><img src="${pasta.imagens[0]}" width="1200" height="750" alt="" loading="lazy"><span class="t">${esc(pasta.nome)}</span><span class="pr">Ver na loja</span></a>
      </div>
      <p class="all"><a href="/loja">Ver a loja completa →</a></p>
    </div>
  </section>

</main>

<section class="contato">
  <div class="wrap">
    <p class="aviso"><strong>Este material ajuda a sua família a se preparar. Ele não substitui o serviço público de emergência.</strong><br>Em qualquer ocorrência real, ligue: 193 Bombeiros · 192 SAMU · 190 Polícia · 199 Defesa Civil</p>
    <div class="social">@moraes.preparacao · @andreia.preparacao</div>
    <div class="social" style="margin-top:6px">Academia IDE Bushcraft &amp; Sobrevivência · Brasília, DF</div>
    <p class="slogan">Preparar não é medo. É cuidado.</p>
  </div>
</section>

<footer class="foot">
  <div class="wrap">
    <span>© IDE Preparação Familiar</span>
    <a href="/loja">Loja</a>
    <a href="/privacidade">Privacidade</a>
    <span>WhatsApp: <a href="https://wa.me/5561993461237" target="_blank" rel="noopener">(61) 99346-1237</a></span>
  </div>
</footer>

<div class="sticky-cta">
  <a class="btn btn-accent" href="${link}" data-cta="ebook-sticky">${esc(cfg.cta)} — R$ ${brl(valor)}</a>
</div>

<script>
  if (window.cardumeTrack) window.cardumeTrack('view_item', { item_id: ${JSON.stringify(p.slug)}, item_name: ${JSON.stringify(p.nome)}, content_name: ${JSON.stringify(p.nome)}, value: ${valor}, currency: 'BRL' });
</script>
<script src="/assets/checkout.js"></script>
</body>
</html>
`;
}

for (const cfg of PAGINAS) {
  fs.mkdirSync(path.join(RAIZ, cfg.rota), { recursive: true });
  fs.writeFileSync(path.join(RAIZ, cfg.rota, "index.html"), pagina(cfg));
}

// o sitemap ganha as páginas novas (o gerar-paginas-loja.js tira as /produto/ antigas)
const hoje = new Date().toISOString().slice(0, 10);
let mapa = fs.readFileSync(path.join(RAIZ, "sitemap.xml"), "utf8");
for (const cfg of PAGINAS) {
  const loc = `<loc>${SITE}/${cfg.rota}</loc>`;
  if (mapa.includes(loc)) {
    mapa = mapa.replace(new RegExp(`(${loc.replace(/[.]/g, "\\.")}<lastmod>)[^<]*`), `$1${hoje}`);
  } else {
    mapa = mapa.replace("</urlset>", `  <url>${loc}<lastmod>${hoje}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n</urlset>`);
  }
}
fs.writeFileSync(path.join(RAIZ, "sitemap.xml"), mapa);
console.log("ok: " + PAGINAS.map((c) => "/" + c.rota).join(", "));
module.exports = { PAGINAS };
