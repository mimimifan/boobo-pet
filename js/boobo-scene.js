/* boobo-scene.js : 场景切换标签、等级奖励预览与旧家具迁移。 */
(function () {
  "use strict";
  if (window.__booboScene) return;
  window.__booboScene = 1;

  var SOON = {};
  var API = null, S = null, tabs = null, mapBox = null, sig = "";
  function $id(x) { return document.getElementById(x); }
  function R() { return window.BooboRoom; }
  function lv() { var p = window.BooboPlus && window.BooboPlus.get(); return p ? p.lv : 1; }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderTabs() {
    var r = R(), L = lv();
    if (!r || !r.SCENES || !tabs) return;
    var cur = r.scene();
    /* 等级不够的场景（比如调试面板把等级降回 1）自动退回卧室 */
    r.SCENES.forEach(function (sc) { if (sc.id === cur && L < sc.lv) { r.setScene("bed"); cur = "bed"; } });
    var now = cur + "|" + L;
    if (now === sig) return;
    sig = now;
    tabs.innerHTML = r.SCENES.map(function (sc) {
      var lock = L < sc.lv, on = sc.id === cur;
      return '<button type="button" class="scene-tab' + (on ? " on" : "") + '" data-scene="' + sc.id + '"' +
        (lock ? " disabled" : "") + ' aria-pressed="' + on + '">' + esc(sc.name) +
        (lock ? "<small>Lv" + sc.lv + "</small>" : "") + "</button>";
    }).join("");
  }

  function rewards(n) {
    var P = window.BooboPlus, r = R(), out = [];
    (P.TITLES || []).forEach(function (t) { if (t[0] === n) out.push('<span class="lv-get title">称号「' + esc(t[1]) + "」</span>"); });
    (r && r.SCENES || []).forEach(function (sc) { if (sc.lv === n && n > 1) out.push('<span class="lv-get scene">新场景 ' + esc(sc.name) + "</span>"); });
    P.EXTRA.forEach(function (e) { if (e.lv === n) out.push('<span class="lv-get">' + (r ? r.icon(e.id) : "") + esc(e.name) + "</span>"); });
    var fg={31:"小雏菊 · 4包花种",32:"郁金香 · 4包花种",33:"向日葵 · 4包花种",34:"波斯菊 · 4包花种",35:"三色堇 · 4包花种",36:"勿忘草 · 4包花种"};
    if(window.BooboFlower)window.BooboFlower.FLOWERS.forEach(function(f){fg[f.lv]=f.name+" · 4包花种";});
    if(fg[n])out.push('<span class="lv-get">'+fg[n]+'</span>');
    if (SOON[n]) out.push('<span class="lv-get soon">' + SOON[n] + "</span>");
    out.push('<span class="lv-get star">+' + (3 + Math.floor(n / 2) + (n % 5 === 0 ? 10 : 0)) + "\u2605</span>");
    return out.join("");
  }
  function renderMap() {
    if (!mapBox || mapBox.hidden) return;
    var P = window.BooboPlus, L = lv(), h = "";
    for (var n = 2; n <= P.MAX_LV; n++) {
      h += '<div class="lv-row' + (n <= L ? " done" : n === L + 1 ? " next" : "") + '"><b>Lv.' + n + "</b>" +
        '<div class="lv-gets">' + rewards(n) + "</div></div>";
    }
    mapBox.innerHTML = '<div class="lv-map" id="lvMapList">' + h + "</div>" +
      '<p class="game-tip">经验来源：每日任务 每天 72 · 互动 每天最多 120 · 小游戏 不限次数，每局 12–36</p>';
    var list = $id("lvMapList"), nx = list.querySelector(".next");
    if (nx) list.scrollTop = Math.max(0, nx.offsetTop - 40);
  }

  function boot() {
    API = window.BooboAPI;
    S = API.state;
    dropOld();
    var stage = $id("petStage");
    if (stage && !$id("sceneTabs")) stage.insertAdjacentHTML("beforebegin", '<div class="scene-tabs" id="sceneTabs"></div>');
    tabs = $id("sceneTabs");
    tabs.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-scene]");
      if (!b || b.disabled) return;
      R().setScene(b.dataset.scene);
      sig = ""; renderTabs();
    });
    document.addEventListener("boobo:scene", function () { sig = ""; renderTabs(); });
    /* 哄睡时如果有床，自动回卧室上床 */
    API.on("action", function (ev) {
      var d = ev.detail || {};
      if (d.action === "sleep" && d.sleeping && R().scene() !== "bed" && (S.placed || []).indexOf("bed") >= 0) R().setScene("bed");
    });

    var head = document.querySelector("#growthSection .task-head");
    if (head && !$id("lvMapBtn")) {
      head.insertAdjacentHTML("beforebegin",
        '<button type="button" class="lv-map-btn" id="lvMapBtn" aria-expanded="false" aria-controls="lvMapBox">查看每一级的奖励 \u25be</button>' +
        '<div id="lvMapBox" hidden></div>');
    }
    mapBox = $id("lvMapBox");
    var mb = $id("lvMapBtn");
    if (mb) mb.addEventListener("click", function () {
      mapBox.hidden = !mapBox.hidden;
      mb.setAttribute("aria-expanded", String(!mapBox.hidden));
      mb.textContent = mapBox.hidden ? "查看每一级的奖励 \u25be" : "收起等级奖励 \u25b4";
      renderMap();
    });

    var lastLv = lv();
    renderTabs();
    tickClock();
    setInterval(tickClock, 10000);
    setInterval(function () {
      renderTabs();
      var L = lv();
      if (L !== lastLv) { lastLv = L; renderMap(); }
    }, 800);
  }

  /* 挂钟指针跟着真实时间走 */
  function tickClock() {
    var ck = document.querySelector(".rm-clock .ck");
    if (!ck) return;
    var d = new Date(), m = d.getMinutes(), h = d.getHours() % 12;
    var hh = ck.querySelector(".hh"), mm = ck.querySelector(".mm");
    if (hh) hh.style.transform = "rotate(" + (h * 30 + m * 0.5) + "deg)";
    if (mm) mm.style.transform = "rotate(" + (m * 6) + "deg)";
  }

  /* 已下架的家具从存档里清掉，免得图鉴收藏数多算 */
  function dropOld() {
    /* 台阶改成房子自带，买过的退还星星 */
    var gone = ["phono", "doormat", "steps", "stonetab", "sapling", "yfence", "hammock"];
    var REFUND = { steps: 50, stonetab: 32, sapling: 26, yfence: 24, hammock: 32 }, hit = false, back = 0;
    gone.forEach(function (id) {
      if (REFUND[id] && (S.owned || []).indexOf(id) >= 0) back += REFUND[id];
      ["owned", "placed"].forEach(function (k) {
        var arr = S[k] || [], i = arr.indexOf(id);
        if (i >= 0) { arr.splice(i, 1); hit = true; }
      });
    });
    if (back) {
      S.stars = (Number(S.stars) || 0) + back;
      setTimeout(function () { if (window.BooboPlus) window.BooboPlus.toast("下架了几件旧家具，退还 " + back + "★", true); }, 1500);
    }
    if (hit) { API.save(); API.render(); }
  }

  var tries = 0;
  (function wait() {
    if (window.BooboAPI && window.BooboPlus && window.BooboRoom) { boot(); return; }
    if (tries++ > 60) return;
    setTimeout(wait, 60);
  })();
})();
