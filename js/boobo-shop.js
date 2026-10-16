/* boobo-shop.js : 家具小店打折日。每周四全场 8 折，原价存在 item.base。
   日期按 BooboDay.now() 判断，调试面板「模拟日期」可以改日子来测 */
(function () {
  "use strict";
  if (window.__booboShop) return;
  window.__booboShop = 1;

  var RATE = 0.8, SALE_DAY = 4, API = null, last = null;
  function now() { return window.BooboDay ? window.BooboDay.now() : new Date(); }
  function isSale() { return now().getDay() === SALE_DAY; }

  /* 商店标题旁的小字换成打折提示 */
  function tip(on) {
    var g = document.getElementById("shopGrid"), sec = g && g.closest(".section");
    var p = sec && sec.querySelector(".section-heading p");
    if (!p) return;
    if (!p.dataset.orig) p.dataset.orig = p.textContent;
    p.textContent = on ? "今天周四 · 家具全场 8 折" : p.dataset.orig;
    p.classList.toggle("sale-tip", on);
  }

  function apply() {
    if (!API) return;
    var on = isSale(), changed = false;
    API.items.forEach(function (it) {
      if (it.base == null) it.base = it.cost;
      var c = on ? Math.max(1, Math.round(it.base * RATE)) : it.base;
      if (it.cost !== c) { it.cost = c; changed = true; }
    });
    if (on !== last) {
      if (on && window.BooboPlus) setTimeout(function () { window.BooboPlus.toast("今天是小店打折日，家具全场 8 折", true); }, 1200);
      last = on; tip(on); changed = true;
    }
    /* app.js 的商店按 signature 防闪烁，价格变了要清掉它才会重画 */
    if (changed) { API.render.shopSig = ""; API.render(); }
  }

  function boot() {
    API = window.BooboAPI;
    /* 升级解锁的新家具一进商店就按今天的价格算 */
    var add = API.addItems;
    API.addItems = function (list) { add(list); apply(); };
    apply();
    document.addEventListener("boobo:day", apply);
    setInterval(apply, 60000);
  }

  window.BooboShop = { sale: isSale, refresh: function () { apply(); } };
  var tries = 0;
  (function wait() {
    if (window.BooboAPI) { boot(); return; }
    if (tries++ > 60) return;
    setTimeout(wait, 60);
  })();
})();
