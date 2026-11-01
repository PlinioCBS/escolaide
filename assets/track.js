/* ============================================================
   IDE / Cardume — camada de tracking
   ------------------------------------------------------------
   Preencha os IDs abaixo para ATIVAR cada ferramenta. Enquanto
   vazios, os eventos só são empilhados no dataLayer (nada sai).

   • GTM_ID        → GTM-XXXXXXX  (painel de controle; opcional)
   • META_PIXEL_ID → ex.: 123456789012345  (Meta/Facebook Pixel)
   • GA4_ID        → ex.: G-XXXXXXXXXX  (Google Analytics 4)

   Regra: se usar GTM, configure GA4/Meta DENTRO do GTM e deixe
   GA4_ID/META_PIXEL_ID vazios aqui (evita contagem dobrada).
   Se NÃO usar GTM, preencha META_PIXEL_ID e/ou GA4_ID aqui.

   Funil: page_view, view_item, inscricao_click, generate_lead,
   begin_checkout, contact, select_item, donate_*, video_play.
   NÃO enviamos dados pessoais (nome/e-mail/telefone) ao tracking.
   ============================================================ */
(function () {
  "use strict";
  var GTM_ID = "";          // <<< GTM-XXXXXXX
  var META_PIXEL_ID = "";   // <<< ID do Pixel da Meta
  var GA4_ID = "G-EWFL8CP9L4"; // <<< G-XXXXXXXXXX
  var CLARITY_ID = "z6yvyewr1m"; // <<< ID do Microsoft Clarity (heatmap + gravações)

  window.dataLayer = window.dataLayer || [];
  function dl(o) { try { window.dataLayer.push(o); } catch (e) {} }

  // --- Google Tag Manager ---
  if (GTM_ID) {
    dl({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var s0 = document.getElementsByTagName("script")[0];
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
    s0.parentNode.insertBefore(g, s0);
  }

  // --- Meta (Facebook) Pixel ---
  if (META_PIXEL_ID) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    try { fbq("init", META_PIXEL_ID); fbq("track", "PageView"); } catch (e) {}
  }

  // --- Google Analytics 4 (gtag) — só direto quando NÃO há GTM ---
  if (GA4_ID && !GTM_ID) {
    var ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(ga);
    window.gtag = window.gtag || function () { (window.dataLayer = window.dataLayer || []).push(arguments); };
    gtag("js", new Date());
    gtag("config", GA4_ID);
  }

  // --- Microsoft Clarity (mapa de calor de clique/toque, rolagem e gravações) ---
  if (CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  // --- UTMs: captura da URL e persiste na sessão ---
  function readUTMs() {
    var o = {}, found = false;
    try {
      var p = new URLSearchParams(location.search);
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
        var v = p.get(k);
        if (v) { o[k] = v; found = true; }
      });
      if (found) sessionStorage.setItem("cardume_utm", JSON.stringify(o));
      else {
        var st = sessionStorage.getItem("cardume_utm");
        if (st) o = JSON.parse(st);
      }
    } catch (e) {}
    return o;
  }
  var UTM = readUTMs();
  window.cardumeUTM = UTM; // disponível para os formulários

  // --- mapa dos nossos eventos -> eventos padrão da Meta ---
  var FB_STD = {
    view_item: "ViewContent",
    generate_lead: "Lead",
    lead: "Lead",
    begin_checkout: "InitiateCheckout",
    contact: "Contact",
    purchase: "Purchase"
  };

  // --- helper global ---
  function track(event, params) {
    var payload = { event: event };
    for (var k in UTM) payload[k] = UTM[k];
    if (params) for (var j in params) payload[j] = params[j];
    dl(payload);
    if (event !== "page_view") {
      // Meta Pixel direto (se ativo)
      try {
        if (window.fbq && META_PIXEL_ID) {
          if (FB_STD[event]) fbq("track", FB_STD[event], params || {});
          else fbq("trackCustom", event, params || {});
        }
      } catch (e) {}
      // GA4 direto (se ativo e sem GTM)
      try { if (window.gtag && GA4_ID && !GTM_ID) gtag("event", event, params || {}); } catch (e) {}
    }
  }
  window.cardumeTrack = track;

  // --- page_view ---
  track("page_view", { page_path: location.pathname + location.search, page_title: document.title });

  // --- cliques (delegação em todo o site) ---
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("a,button") : null;
    if (!el) return;
    var href = el.getAttribute("href") || "";
    var cta = el.getAttribute("data-cta") || "";
    var txt = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (href.indexOf("hub.la") > -1) {
      track("begin_checkout", { link_url: href, cta_text: txt });
    } else if (/wa\.me|api\.whatsapp\.com/.test(href)) {
      track("contact", { method: "whatsapp", cta_text: txt });
    } else if (href.indexOf("/preparacao-familiar/inscricao") > -1 || cta.indexOf("inscricao") === 0) {
      track("inscricao_click", { cta: cta, cta_text: txt });
    } else if (el.hasAttribute("data-produto")) {
      track("select_item", { item_id: el.getAttribute("data-produto") });
    } else if (href.indexOf("/doar") > -1) {
      track("donate_click", { location: "nav" });
    } else if (el.id === "copyBtn") {
      track("donate_pix_copy", {});
    }
  }, true);

  // --- vídeo do YouTube (primeiro play) — só na landing ---
  try {
    var vsl = document.getElementById("vsl");
    if (vsl && /youtube\.com\/embed/.test(vsl.src || "")) {
      var yt = document.createElement("script");
      yt.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(yt);
      var played = false;
      window.onYouTubeIframeAPIReady = function () {
        try {
          new YT.Player("vsl", { events: { onStateChange: function (ev) {
            if (ev.data === 1 && !played) { played = true; track("video_play", { video: "moraes" }); }
          }}});
        } catch (e) {}
      };
    }
  } catch (e) {}
})();
