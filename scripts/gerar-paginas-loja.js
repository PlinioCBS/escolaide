#!/usr/bin/env node
/* Gera as páginas da loja em HTML pronto, a partir de data/produtos.json:
     • produto/<slug>/index.html — título, descrição, imagem de compartilhamento
       e dados estruturados próprios de cada produto (Google e WhatsApp leem
       sem precisar rodar JavaScript);
     • o catálogo dentro de loja/index.html (entre os marcadores gerado:catalogo);
     • a data (lastmod) da loja e dos produtos no sitemap.xml.
   O desenho vem das mesmas funções do assets/loja.js, que continua cuidando do
   carrinho e das interações no navegador.

   Uso, depois de editar data/produtos.json:   node scripts/gerar-paginas-loja.js */
"use strict";
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const SITE = "https://preparacaofamiliar.com.br";
const MARCA = "IDE Preparação Familiar";
const OG_PADRAO = "/assets/escolas/capa.jpg"; // produtos sem foto
const { catalogHTML, productHTML, precoFinal, esc } = require(path.join(RAIZ, "assets/loja.js"));

const ler = (f) => fs.readFileSync(path.join(RAIZ, f), "utf8");
const gravar = (f, s) => fs.writeFileSync(path.join(RAIZ, f), s);
const dados = JSON.parse(ler("data/produtos.json"));
const modelo = ler("produto/index.html");
const hoje = new Date().toISOString().slice(0, 10);

// a descrição do Google mostra ~155 caracteres
function resumir(t, max) {
  t = String(t || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

// WhatsApp/Facebook preferem JPG/PNG: usa o original quando a foto é .webp
function imagemCompartilhamento(p) {
  const img = (p.imagens && p.imagens[0]) || OG_PADRAO;
  if (/\.webp$/i.test(img)) {
    for (const ext of [".jpg", ".png"]) {
      const alt = img.replace(/\.webp$/i, ext);
      if (fs.existsSync(path.join(RAIZ, alt))) return SITE + alt;
    }
  }
  return SITE + img;
}

function dadosEstruturados(p, url) {
  const produto = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nome,
    description: p.descricao || p.resumo,
    sku: p.slug,
    category: p.categoria,
    brand: { "@type": "Brand", name: MARCA },
    image: (p.imagens && p.imagens.length ? p.imagens : [OG_PADRAO]).map((i) => SITE + i),
  };
  const valor = precoFinal(p);
  if (valor != null) {
    produto.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price: valor.toFixed(2),
      availability: !p.disponivel
        ? "https://schema.org/OutOfStock"
        : p.sob_encomenda ? "https://schema.org/MadeToOrder" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: MARCA },
    };
  }
  const trilha = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Loja", item: SITE + "/loja" },
      { "@type": "ListItem", position: 3, name: p.nome },
    ],
  };
  return [produto, trilha].map((o) => '<script type="application/ld+json">' + JSON.stringify(o) + "</script>").join("\n");
}

function paginaProduto(p) {
  const url = `${SITE}/produto/${p.slug}`;
  const titulo = `${p.nome} | ${MARCA}`;
  const descricao = resumir(p.resumo || p.descricao, 155);
  const img = imagemCompartilhamento(p);
  const cabecalho = [
    `<title>${esc(titulo)}</title>`,
    `<meta name="description" content="${esc(descricao)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<meta property="og:type" content="product">`,
    `<meta property="og:site_name" content="${MARCA}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(p.nome)}">`,
    `<meta property="og:description" content="${esc(descricao)}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(p.nome)}">`,
    `<meta name="twitter:description" content="${esc(descricao)}">`,
    `<meta name="twitter:image" content="${img}">`,
    dadosEstruturados(p, url),
  ].join("\n");

  let html = modelo
    .replace(/<title>[\s\S]*?<\/title>\n<meta name="description"[^>]*>/, cabecalho)
    .replace(/<div id="produto">[\s\S]*?<\/div>\n  <\/div>\n<\/main>/, `<div id="produto">${productHTML(p)}</div>\n  </div>\n</main>`);
  if (html === modelo || !html.includes(`<link rel="canonical" href="${url}">`) || !html.includes("<h1>")) {
    throw new Error(`modelo produto/index.html mudou — não consegui montar /produto/${p.slug}`);
  }
  html = html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n<!-- Gerado por scripts/gerar-paginas-loja.js a partir de data/produtos.json. Não edite à mão. -->\n");
  fs.mkdirSync(path.join(RAIZ, "produto", p.slug), { recursive: true });
  gravar(`produto/${p.slug}/index.html`, html);
  return p.slug;
}

// 1) páginas de produto (itens com `pagina` — curso, comunidade — já têm página própria;
//    itens `oculto` ficam fora: a página gerada é apagada e o endereço cai no "não encontrado")
const gerados = dados.produtos.filter((p) => !p.pagina && !p.oculto).map(paginaProduto);
const ocultos = dados.produtos.filter((p) => !p.pagina && p.oculto).map((p) => p.slug);
for (const slug of ocultos) {
  const arq = path.join(RAIZ, "produto", slug, "index.html");
  if (fs.existsSync(arq) && fs.readFileSync(arq, "utf8").includes("Gerado por scripts/gerar-paginas-loja.js")) {
    fs.rmSync(path.join(RAIZ, "produto", slug), { recursive: true });
  }
}

// 2) catálogo da /loja
const loja = ler("loja/index.html");
const novaLoja = loja.replace(
  /<!-- gerado:catalogo -->[\s\S]*?<!-- \/gerado:catalogo -->/,
  `<!-- gerado:catalogo -->${catalogHTML(dados)}<!-- /gerado:catalogo -->`
);
if (novaLoja === loja && !loja.includes(catalogHTML(dados))) throw new Error("marcadores gerado:catalogo não encontrados em loja/index.html");
gravar("loja/index.html", novaLoja);

// 3) sitemap: tira os ocultos, inclui produtos novos e atualiza o lastmod
let mapa = ler("sitemap.xml");
for (const slug of ocultos) {
  mapa = mapa.replace(new RegExp(`\\s*<url>\\s*<loc>${SITE.replace(/\./g, "\\.")}/produto/${slug}</loc>[\\s\\S]*?</url>`), "");
}
for (const slug of gerados) {
  if (!mapa.includes(`<loc>${SITE}/produto/${slug}</loc>`)) {
    mapa = mapa.replace("</urlset>", `  <url><loc>${SITE}/produto/${slug}</loc><lastmod>${hoje}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n</urlset>`);
  }
}
for (const rota of ["/loja", ...gerados.map((s) => "/produto/" + s)]) {
  const re = new RegExp(`(<loc>${SITE.replace(/\./g, "\\.")}${rota}</loc>\\s*<lastmod>)[^<]*(</lastmod>)`);
  mapa = mapa.replace(re, `$1${hoje}$2`);
}
gravar("sitemap.xml", mapa);

console.log(`ok: ${gerados.length} páginas de produto, catálogo da loja e sitemap atualizados (${hoje})` + (ocultos.length ? ` — ocultos: ${ocultos.join(", ")}` : ""));
