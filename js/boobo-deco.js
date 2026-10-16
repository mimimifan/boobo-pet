/* boobo-deco.js : 舞台下方的「摆家具」栏，边看房间边摆，不用翻到商店 */
(function () {
  "use strict";
  if (window.__booboDeco) return;
  window.__booboDeco = 1;

  var API = null, S = null, bar = null, list = null, btn = null, sig = "";
  function $id(x) { return document.getElementById(x); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render(force) {
    if (!bar || bar.hidden) return;
    var owned = S.owned || [], placed = S.placed || [];
    var R = window.BooboRoom, cur = R && R.scene ? R.scene() : "";
    var now = owned.join() + "|" + placed.join() + "|" + S.stars + "|" + API.items.length + "|" + cur +
      "|" + API.items.map(function (i) { return i.cost; }).join();
    if (!force && now === sig) return;
    sig = now;
    list.innerHTML = API.items.filter(function (it) { return !cur || R.sceneOf(it.id) === cur; }).map(function (it) {
      var has = owned.indexOf(it.id) >= 0, on = placed.indexOf(it.id) >= 0;
      var cls = "deco-item" + (on ? " on" : has ? "" : " buy" + (S.stars < it.cost ? " poor" : ""));
      var tag = on ? "已摆上" : has ? "收着" : (it.base > it.cost ? "特价" : "") + it.cost + "\u2605";
      var icon = window.BooboRoom ? window.BooboRoom.icon(it.id) : "";
      return '<button type="button" class="' + cls + '" data-deco="' + esc(it.id) + '" aria-pressed="' + on + '">' +
        '<span class="ic">' + icon + '</span><b>' + esc(it.name) + '</b><em>' + tag + '</em></button>';
    }).join("") || '<p class="deco-tip">这个场景还没有家具，升级后会解锁</p>';
  }

  function toggle() {
    bar.hidden = !bar.hidden;
    btn.classList.toggle("on", !bar.hidden);
    btn.setAttribute("aria-expanded", String(!bar.hidden));
    render(true);
  }

  function boot() {
    API = window.BooboAPI;
    S = API.state;
    var stage = $id("petStage"), top = document.querySelector(".hero-top");
    if (!stage || !top || $id("decoBar")) return;
    top.insertAdjacentHTML("beforeend",
      '<button type="button" class="deco-toggle" id="decoToggle" aria-expanded="false" aria-controls="decoBar">摆家具</button>');
    stage.insertAdjacentHTML("afterend",
      '<div class="deco-bar" id="decoBar" hidden><div class="deco-list" id="decoList"></div>' +
      '<p class="deco-tip">点一下摆上或收起，没有的直接用星星兑换</p></div>');
    bar = $id("decoBar"); list = $id("decoList"); btn = $id("decoToggle");
    btn.addEventListener("click", toggle);
    list.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-deco]");
      if (!b) return;
      /* 直接借用商店按钮，购买/摆放/收起的规则和商店完全一致 */
      var real = document.querySelector('#shopGrid [data-item="' + b.dataset.deco + '"]');
      if (real) real.click();
      setTimeout(function () { render(true); }, 30);
    });
    setInterval(render, 400);
  }

  var tries = 0;
  (function wait() {
    if (window.BooboAPI) { boot(); return; }
    if (tries++ > 40) return;
    setTimeout(wait, 60);
  })();
})();
