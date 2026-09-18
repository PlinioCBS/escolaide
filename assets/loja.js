/* ============================================================
   IDE Preparação Familiar — motor da loja (catálogo, produto, carrinho)
   Lê /data/produtos.json e renderiza. Carrinho no localStorage.
   Uma mesma função roteia pela presença de #catalogo / #produto / #carrinho-app.
   ============================================================ */
(function () {
  "use strict";
  var WA = "5561993461237";                 // WhatsApp de contato/suporte
  var DATA_URL = "/data/produtos.json";
  var CART_KEY = "ide_cart";
  var _cache = null;

  // ---------- utilidades ----------
  function brl(n) { return (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function waLink(nome) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent("Olá! Tenho interesse no produto: " + nome + ". Pode me passar valores e prazo de entrega?"); }

  // ---------- carrinho (localStorage) ----------
  function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } }
  function saveCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} updateBadge(); }
  function cartCount() { return getCart().reduce(function (s, i) { return s + (i.qty || 0); }, 0); }
  function addToCart(slug, qty) {
    qty = qty || 1; var c = getCart(); var f = null;
    for (var i = 0; i < c.length; i++) if (c[i].slug === slug) f = c[i];
    if (f) f.qty += qty; else c.push({ slug: slug, qty: qty });
    saveCart(c);
  }
  function setQty(slug, qty) {
    var c = getCart(); var out = [];
    for (var i = 0; i < c.length; i++) { if (c[i].slug === slug) { if (qty > 0) out.push({ slug: slug, qty: qty }); } else out.push(c[i]); }
    saveCart(out);
  }
  function removeFromCart(slug) { saveCart(getCart().filter(function (i) { return i.slug !== slug; })); }
  function updateBadge() {
    var n = cartCount();
    document.querySelectorAll(".cart-count").forEach(function (el) { el.textContent = n; el.hidden = n <= 0; });
  }

  // ---------- dados ----------
  function load() {
    if (_cache) return Promise.resolve(_cache);
    return fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (d) { _cache = d; return d; });
  }
  function bySlug(data, slug) {
    var ps = (data && data.produtos) || [];
    for (var i = 0; i < ps.length; i++) if (ps[i].slug === slug) return ps[i];
    return null;
  }
  function currentSlug() {
    var q = new URLSearchParams(location.search).get("p");
    if (q) return q;
    var parts = location.pathname.replace(/\/+$/, "").split("/");
    var last = parts[parts.length - 1];
    return (last && last !== "produto") ? last : null;
  }

  // ícone genérico para produtos sem foto
  function placeholderIcon() {
    return '<div class="ph-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
  }
  function precoHTML(p) {
    if (p.preco == null) return '<span class="price-consulta">Sob consulta</span>';
    var cents = (p.preco % 1 === 0) ? ",00" : ("," + p.preco.toFixed(2).split(".")[1]);
    var reais = Math.floor(p.preco);
    return '<span class="price" style="font-size:1.7rem"><span class="cur">R$</span>' + reais + '<span style="font-size:.6em;vertical-align:top">' + cents + "</span></span>";
  }

  // ---------- CATÁLOGO (/loja) ----------
  function renderCatalog() {
    var host = document.getElementById("catalogo");
    load().then(function (data) {
      var cats = data.categorias || [];
      var ps = (data.produtos || []).slice();
      // destaque primeiro dentro de cada categoria
      var html = "";
      cats.forEach(function (cat) {
        var items = ps.filter(function (p) { return p.categoria === cat; });
        if (!items.length) return;
        items.sort(function (a, b) { return (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0); });
        html += '<section class="cat"><h2 class="cat-title">' + esc(cat) + "</h2><div class=\"prod-grid\">";
        items.forEach(function (p) { html += cardHTML(p); });
        html += "</div></section>";
      });
      host.innerHTML = html || "<p>Catálogo em breve.</p>";
    }).catch(function () { host.innerHTML = "<p>Não foi possível carregar o catálogo agora.</p>"; });
  }
  function cardHTML(p) {
    var href = "/produto/" + p.slug;
    var media = (p.imagens && p.imagens[0])
      ? '<img loading="lazy" src="' + esc(p.imagens[0]) + '" alt="' + esc(p.nome) + '">'
      : placeholderIcon();
    var badges = "";
    if (p.destaque) badges += '<span class="badge badge-orange card-badge">Carro-chefe</span>';
    else if (!p.disponivel) badges += '<span class="badge badge-soon card-badge">Em breve</span>';
    else if (p.sob_encomenda) badges += '<span class="badge badge-encomenda card-badge">Sob encomenda</span>';
    var cta = p.disponivel ? '<span class="card-cta">Ver produto →</span>' : '<span class="card-cta muted">Em breve</span>';
    return '<a class="prod-card" href="' + href + '">' +
      '<div class="prod-media">' + media + badges + "</div>" +
      '<div class="prod-info"><h3>' + esc(p.nome) + "</h3>" +
      '<p class="prod-resumo">' + esc(p.resumo || "") + "</p>" +
      '<div class="prod-foot">' + precoHTML(p) + cta + "</div></div></a>";
  }

  // ---------- PRODUTO (/produto/:slug) ----------
  function renderProduct() {
    var host = document.getElementById("produto");
    var slug = currentSlug();
    load().then(function (data) {
      var p = bySlug(data, slug);
      if (!p) { host.innerHTML = '<div class="wrap" style="padding:60px 24px;text-align:center"><h1>Produto não encontrado</h1><p style="margin-top:12px"><a href="/loja">← Voltar ao catálogo</a></p></div>'; return; }
      document.title = p.nome + " · IDE Preparação Familiar";

      // galeria
      var gallery;
      if (p.imagens && p.imagens.length) {
        var main = '<img id="pmain" src="' + esc(p.imagens[0]) + '" alt="' + esc(p.nome) + '">';
        var thumbs = "";
        if (p.imagens.length > 1) {
          thumbs = '<div class="thumbs">' + p.imagens.map(function (src, i) {
            return '<button class="thumb' + (i === 0 ? " active" : "") + '" data-src="' + esc(src) + '" aria-label="Foto ' + (i + 1) + '"><img src="' + esc(src) + '" alt=""></button>';
          }).join("") + "</div>";
        }
        gallery = '<div class="p-gallery"><div class="p-main">' + main + "</div>" + thumbs + "</div>";
      } else {
        gallery = '<div class="p-gallery"><div class="p-main ph">' + placeholderIcon() + "</div></div>";
      }

      // selos
      var selos = "";
      if (p.destaque) selos += '<span class="badge badge-orange">Carro-chefe da IDE</span> ';
      if (p.sob_encomenda) selos += '<span class="badge badge-encomenda">Sob encomenda</span> ';
      if (p.tipo === "digital") selos += '<span class="badge badge-blue">Material digital</span> ';

      // aviso de produção
      var aviso = p.sob_encomenda
        ? '<div class="aviso"><strong>Feito sob encomenda.</strong> Cada peça é confeccionada à mão e enviada em até ' + (p.prazo_producao_dias || 10) + ' dias após a confirmação do pagamento.</div>'
        : (p.tipo === "digital" ? '<div class="aviso ok"><strong>Acesso imediato.</strong> Material digital enviado por e-mail após a compra.</div>' : "");

      // características
      var carac = (p.caracteristicas && p.caracteristicas.length)
        ? '<ul class="carac">' + p.caracteristicas.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" : "";

      // preço
      var precoBloco = p.preco != null
        ? '<div class="p-price">' + precoHTML(p) + (p.sob_encomenda ? '<span class="p-price-note">+ frete a combinar</span>' : "") + "</div>"
        : '<div class="p-price"><span class="price-consulta">Valor sob consulta</span></div>';

      // CTA conforme tipo de checkout
      var cta = "";
      if (!p.disponivel || p.checkout === "soon") {
        cta = '<span class="btn btn-disabled btn-block">Em breve</span>';
      } else if (p.checkout === "mercadopago") {
        cta = '<div class="qty"><button class="qbtn" id="qminus" aria-label="Menos">−</button><span id="qval">1</span><button class="qbtn" id="qplus" aria-label="Mais">+</button></div>' +
          '<button class="btn btn-accent btn-block" id="addcart">Adicionar ao carrinho</button>' +
          '<a class="btn btn-ghost btn-block" href="' + waLink(p.nome) + '" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>';
      } else if (p.checkout === "hubla") {
        cta = '<a class="btn btn-accent btn-block" href="' + esc(p.link || "#") + '">Comprar agora</a>';
      } else { // whatsapp
        cta = '<a class="btn btn-wa btn-block" href="' + waLink(p.nome) + '" target="_blank" rel="noopener">Comprar pelo WhatsApp</a>' +
          '<p class="p-price-note" style="margin-top:8px">Peça feita sob encomenda — combinamos valor, frete e prazo no WhatsApp.</p>';
      }

      host.innerHTML =
        '<nav class="crumbs"><a href="/loja">Loja</a> <span>/</span> <span>' + esc(p.categoria) + "</span></nav>" +
        '<div class="p-layout">' +
          gallery +
          '<div class="p-buy">' +
            '<div class="p-selos">' + selos + "</div>" +
            "<h1>" + esc(p.nome) + "</h1>" +
            '<p class="p-resumo">' + esc(p.resumo || "") + "</p>" +
            precoBloco +
            '<div class="p-cta">' + cta + "</div>" +
            aviso +
          "</div>" +
        "</div>" +
        '<div class="p-detail"><h2>Descrição</h2><p>' + esc(p.descricao || "") + "</p>" + (carac ? "<h2>Características</h2>" + carac : "") + "</div>";

      // interações
      var thumbBtns = host.querySelectorAll(".thumb");
      thumbBtns.forEach(function (b) {
        b.addEventListener("click", function () {
          document.getElementById("pmain").src = b.getAttribute("data-src");
          thumbBtns.forEach(function (t) { t.classList.remove("active"); });
          b.classList.add("active");
        });
      });
      if (p.checkout === "mercadopago" && p.disponivel) {
        var q = 1, qval = document.getElementById("qval");
        document.getElementById("qminus").addEventListener("click", function () { if (q > 1) { q--; qval.textContent = q; } });
        document.getElementById("qplus").addEventListener("click", function () { q++; qval.textContent = q; });
        document.getElementById("addcart").addEventListener("click", function () {
          addToCart(p.slug, q);
          this.textContent = "Adicionado ✓";
          var self = this; setTimeout(function () { self.textContent = "Adicionar ao carrinho"; }, 1400);
        });
      }
    }).catch(function () { host.innerHTML = '<div class="wrap" style="padding:60px 24px"><p>Não foi possível carregar o produto.</p></div>'; });
  }

  // ---------- CARRINHO (/carrinho) ----------
  function renderCart() {
    var host = document.getElementById("carrinho-app");
    load().then(function (data) {
      var cart = getCart();
      var items = cart.map(function (i) { var p = bySlug(data, i.slug); return p ? { p: p, qty: i.qty } : null; }).filter(Boolean);
      if (!items.length) {
        host.innerHTML = '<div class="cart-empty"><h1>Seu carrinho está vazio</h1><p>Explore o catálogo e adicione os itens que quiser.</p><a class="btn btn-accent" href="/loja">Ver produtos</a></div>';
        return;
      }
      var subtotal = 0, temEncomenda = false;
      var rows = items.map(function (it) {
        var line = (it.p.preco || 0) * it.qty; subtotal += line;
        if (it.p.sob_encomenda) temEncomenda = true;
        var media = (it.p.imagens && it.p.imagens[0]) ? '<img src="' + esc(it.p.imagens[0]) + '" alt="">' : placeholderIcon();
        return '<div class="cart-row" data-slug="' + esc(it.p.slug) + '">' +
          '<a class="cart-thumb" href="/produto/' + esc(it.p.slug) + '">' + media + "</a>" +
          '<div class="cart-mid"><a class="cart-name" href="/produto/' + esc(it.p.slug) + '">' + esc(it.p.nome) + "</a>" +
            '<div class="cart-unit">' + brl(it.p.preco) + " cada</div>" +
            '<button class="cart-remove" data-slug="' + esc(it.p.slug) + '">Remover</button></div>' +
          '<div class="cart-right"><div class="qty"><button class="qbtn" data-act="minus" data-slug="' + esc(it.p.slug) + '">−</button>' +
            '<span>' + it.qty + '</span><button class="qbtn" data-act="plus" data-slug="' + esc(it.p.slug) + '">+</button></div>' +
            '<div class="cart-line">' + brl(line) + "</div></div></div>";
      }).join("");

      host.innerHTML =
        '<div class="cart-grid"><div class="cart-list"><h1>Seu carrinho</h1>' + rows + "</div>" +
        '<aside class="cart-summary"><h2>Resumo</h2>' +
          '<div class="sum-row"><span>Subtotal</span><span>' + brl(subtotal) + "</span></div>" +
          '<div class="sum-row"><span>Frete</span><span class="muted">a combinar</span></div>' +
          '<div class="sum-total"><span>Total</span><span>' + brl(subtotal) + "</span></div>" +
          (temEncomenda ? '<div class="aviso">Há itens <strong>feitos sob encomenda</strong> — produção e envio em até 10 dias após o pagamento.</div>' : "") +
          '<button class="btn btn-accent btn-block" id="checkout">Finalizar compra</button>' +
          '<div id="checkout-msg" class="checkout-msg" hidden></div>' +
          '<a class="btn btn-ghost btn-block" href="/loja">Continuar comprando</a>' +
        "</aside></div>";

      host.querySelectorAll(".qbtn").forEach(function (b) {
        b.addEventListener("click", function () {
          var slug = b.getAttribute("data-slug"), act = b.getAttribute("data-act");
          var cur = 0; getCart().forEach(function (i) { if (i.slug === slug) cur = i.qty; });
          setQty(slug, act === "plus" ? cur + 1 : cur - 1);
          renderCart();
        });
      });
      host.querySelectorAll(".cart-remove").forEach(function (b) {
        b.addEventListener("click", function () { removeFromCart(b.getAttribute("data-slug")); renderCart(); });
      });
      document.getElementById("checkout").addEventListener("click", startCheckout);
    }).catch(function () { host.innerHTML = "<p>Não foi possível carregar o carrinho.</p>"; });
  }

  function startCheckout() {
    var btn = document.getElementById("checkout");
    var msg = document.getElementById("checkout-msg");
    btn.disabled = true; btn.textContent = "Preparando pagamento...";
    fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens: getCart() })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res && res.init_point) { location.href = res.init_point; return; }
      msg.hidden = false;
      msg.innerHTML = res && res.error === "nao_configurado"
        ? "O pagamento online ainda está sendo configurado. Por enquanto, finalize pelo WhatsApp: <a href=\"https://wa.me/" + WA + "\" target=\"_blank\" rel=\"noopener\">falar agora</a>."
        : "Não foi possível iniciar o pagamento agora. Tente novamente ou fale no <a href=\"https://wa.me/" + WA + "\" target=\"_blank\" rel=\"noopener\">WhatsApp</a>.";
      btn.disabled = false; btn.textContent = "Finalizar compra";
    }).catch(function () {
      msg.hidden = false;
      msg.innerHTML = "Falha de conexão. Fale no <a href=\"https://wa.me/" + WA + "\" target=\"_blank\" rel=\"noopener\">WhatsApp</a>.";
      btn.disabled = false; btn.textContent = "Finalizar compra";
    });
  }

  // ---------- roteador ----------
  document.addEventListener("DOMContentLoaded", function () {
    updateBadge();
    if (document.getElementById("catalogo")) renderCatalog();
    if (document.getElementById("produto")) renderProduct();
    if (document.getElementById("carrinho-app")) renderCart();
  });
})();
