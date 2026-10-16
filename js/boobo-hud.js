/* boobo-hud.js : 滚动离开舞台时吸顶显示迷你状态条，数值实时更新，点一下跳回啵啵 */
(function () {
  "use strict";
  if (window.__booboHud) return;
  window.__booboHud = 1;

  var KEYS = [["hunger", "饱腹"], ["mood", "心情"], ["energy", "体力"], ["bond", "亲密"]];
  var API = null, S = null, bar = null, away = false, lastSig = "";

  function $id(x) { return document.getElementById(x); }
  function build() {
    var cells = KEYS.map(function (k, i) {
      return '<div class="hud-cell hud-c' + i + '" id="hudCell' + i + '">' +
        '<em>' + k[1] + '<b id="hudVal' + i + '">0</b></em><i><s id="hudFill' + i + '"></s></i></div>';
    }).join("");
    document.body.insertAdjacentHTML("afterbegin",
      '<div class="hud-bar" id="hudBar" hidden>' +
      '<button class="hud-back" id="hudBack" type="button">\u2191 啵啵</button>' +
      '<div class="hud-stats">' + cells + '</div>' +
      '<div class="hud-star"><span>\u2605</span><b id="hudStar">0</b></div></div>');
    bar = $id("hudBar");
    $id("hudBack").addEventListener("click", function () {
      var st = $id("petStage");
      if (st && st.scrollIntoView) st.scrollIntoView({ block: "center", behavior: "smooth" });
      else window.scrollTo(0, 0);
    });
  }

  function modalOpen() {
    var a = $id("gameOverlay"), b = $id("cheatOverlay");
    return !!((a && !a.hidden) || (b && !b.hidden));
  }

  function update() {
    if (!bar) return;
    var show = away && !modalOpen();
    if (bar.hidden !== !show) bar.hidden = !show;
    if (!show) return;
    var sig = KEYS.map(function (k) { return S[k[0]]; }).join(",") + "|" + S.stars;
    if (sig === lastSig) return;
    lastSig = sig;
    KEYS.forEach(function (k, i) {
      var v = Math.max(0, Math.min(100, Number(S[k[0]]) || 0));
      $id("hudVal" + i).textContent = v;
      $id("hudFill" + i).style.width = v + "%";
      $id("hudCell" + i).classList.toggle("low", i < 3 && v < 25);
    });
    $id("hudStar").textContent = Math.max(0, Math.floor(Number(S.stars) || 0));
  }

  function watchStage() {
    var st = $id("petStage");
    if (!st) return;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        away = !es[0].isIntersecting;
        update();
      }, { threshold: 0.12 }).observe(st);
      return;
    }
    window.addEventListener("scroll", function () {
      var r = st.getBoundingClientRect();
      away = r.bottom < 40;
      update();
    }, { passive: true });
  }

  function boot() {
    API = window.BooboAPI;
    S = API.state;
    build();
    watchStage();
    update();
    setInterval(update, 500);
    ["action", "buy", "game"].forEach(function (n) { API.on(n, function () { setTimeout(update, 30); }); });
  }

  var tries = 0;
  (function wait() {
    if (window.BooboAPI) { boot(); return; }
    if (tries++ > 40) return;
    setTimeout(wait, 60);
  })();
})();
