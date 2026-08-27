/* ============================================================
   Cardume — camada de tracking (Google Tag Manager + dataLayer)
   ------------------------------------------------------------
   Para ATIVAR o GTM: preencha GTM_ID abaixo com o seu container
   (formato GTM-XXXXXXX). Enquanto vazio, os eventos são apenas
   empilhados no dataLayer (nada é enviado para fora).
   Eventos disparados: page_view, video_play, lead, begin_checkout,
   select_item, donate_click, donate_pix_copy — todos com as UTMs.
   Importante: NÃO enviamos dados pessoais (nome/e-mail/telefone).
   ============================================================ */
(function () {
  "use strict";
  var GTM_ID = ""; // <<< coloque aqui o ID GTM-XXXXXXX para ativar o GTM

  window.dataLayer = window.dataLayer || [];
  function dl(o) { try { window.dataLayer.push(o); } catch (e) {} }

  // --- carrega o GTM (somente quando GTM_ID estiver preenchido) ---
  if (GTM_ID) {
    dl({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var s0 = document.getElementsByTagName("script")[0];
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
    s0.parentNode.insertBefore(g, s0);
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

  // --- helper global ---
  function track(event, params) {
    var payload = { event: event };
    for (var k in UTM) payload[k] = UTM[k];
    if (params) for (var j in params) payload[j] = params[j];
    dl(payload);
  }
  window.cardumeTrack = track;

  // --- page_view ---
  track("page_view", { page_path: location.pathname + location.search, page_title: document.title });

  // --- cliques (delegação em todo o site) ---
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("a,button") : null;
    if (!el) return;
    var href = el.getAttribute("href") || "";
    var txt = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (href.indexOf("pay.hub.la") > -1) {
      track("begin_checkout", { link_url: href, cta_text: txt });
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
