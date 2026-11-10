/* ============================================================
   IDE — links de compra da Hubla ligados ao site
   ------------------------------------------------------------
   Todo link para o checkout da Hubla (pay.hub.la) passa por aqui:
   • leva junto as UTMs da visita (a Hubla grava na venda → webhook →
     aba "Pagamentos" da planilha), sem sobrescrever as que já existem;
     visita sem UTM vai como site / botao / <página>;
   • preenche nome, e-mail e WhatsApp quando a pessoa já os informou no
     site (pré-inscrição) — guardados só nesta aba (sessionStorage).
   O pagamento acontece no checkout da Hubla (o campo de cartão dela só
   funciona dentro de páginas *.hub.la, por segurança — não dá para
   embutir no site). Depois do pagamento, a Hubla manda de volta para as
   nossas páginas de obrigado.
   ============================================================ */
(function () {
  "use strict";
  var DADOS_KEY = "ide_comprador";

  function urlCheckout(href) {
    var u;
    try { u = new URL(href, location.href); } catch (e) { return href; }
    var utm = window.cardumeUTM || {};
    for (var k in utm) if (utm[k] && !u.searchParams.has(k)) u.searchParams.set(k, utm[k]);
    if (!u.searchParams.has("utm_source")) {
      u.searchParams.set("utm_source", "site");
      u.searchParams.set("utm_medium", "botao");
      u.searchParams.set("utm_content", location.pathname.replace(/^\/|\/$/g, "") || "home");
    }
    try {
      var c = JSON.parse(sessionStorage.getItem(DADOS_KEY) || "null");
      if (c) {
        if (c.nome && !u.searchParams.has("name")) u.searchParams.set("name", c.nome);
        if (c.email && !u.searchParams.has("email")) u.searchParams.set("email", c.email);
        if (c.whatsapp && !u.searchParams.has("phone")) u.searchParams.set("phone", c.whatsapp.replace(/\D/g, ""));
      }
    } catch (e) {}
    return u.toString();
  }

  // delegação: vale para links já na página e para os que o loja.js desenha depois
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="pay.hub.la"]') : null;
    if (a) a.href = urlCheckout(a.href); // o clique segue normalmente, já com UTMs e dados
  });

  window.ideCheckout = { url: urlCheckout };
})();
