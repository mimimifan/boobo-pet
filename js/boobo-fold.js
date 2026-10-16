/* boobo-fold.js v25 : 长列表固定高度、框内滚动。不清 maxHeight 量高度（会把滚动位置冲掉）；
   列表被重绘时恢复之前的滚动位置，小手册按标签各记各的 */
(function () {
  "use strict";
  if (window.__booboFold) return;
  window.__booboFold = 1;

  var LIST = [
    { box: "#shopGrid",             h: 318 },
    { box: "#gTabBody .ach-grid",   h: 292 },
    { box: "#gTabBody .codex-list", h: 326 }
  ];
  var POS = {}, EL = {}, mo = null, seen = {};

  function tab() { var t = document.querySelector("#gTabs .on"); return t ? t.getAttribute("data-tab") || "" : ""; }
  function key(c) { return c.box.indexOf("gTabBody") >= 0 ? c.box + "|" + tab() : c.box; }

  function apply(c) {
    var box = document.querySelector(c.box);
    if (!box) return;
    var k = key(c), on = box.classList.contains("px-scroll");
    /* 带点回差，避免在临界高度来回切换 */
    var need = on ? box.scrollHeight > c.h - 8 : box.scrollHeight > c.h + 4;
    if (need) {
      if (!on) box.classList.add("px-scroll");
      if (box.style.maxHeight !== c.h + "px") box.style.maxHeight = c.h + "px";
    } else if (on) {
      box.classList.remove("px-scroll");
      box.style.maxHeight = "";
    }
    if (EL[k] !== box) {
      EL[k] = box;
      if (need && POS[k]) box.scrollTop = POS[k];
    }
  }
  function all() { LIST.forEach(function (c) { try { apply(c); } catch (e) {} }); }

  function hook() {
    if (!window.MutationObserver) return;
    /* apply 只改 class/style，不改子节点，所以这里直接同步调用不会自激 */
    if (!mo) mo = new MutationObserver(all);
    ["shopGrid", "gTabBody"].forEach(function (id) {
      if (seen[id]) return;
      var el = document.getElementById(id);
      if (!el) return;
      seen[id] = 1;
      mo.observe(el, { childList: true });
    });
  }

  function boot() {
    var old = document.querySelectorAll("[data-fold]");
    for (var i = 0; i < old.length; i++) old[i].remove();
    document.addEventListener("scroll", function (ev) {
      LIST.forEach(function (c) {
        if (ev.target === document.querySelector(c.box)) POS[key(c)] = ev.target.scrollTop;
      });
    }, true);
    window.addEventListener("resize", all);
    hook();
    all();
    setInterval(function () { hook(); all(); }, 1200);
  }

  window.BooboFold = { refresh: all };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
