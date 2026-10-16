/* boobo-life.js : 布局调整 / 点心菜单 / 数值消耗与恢复 / 数值飘字
   独立存档 key: boobo_life_v1 */
(function () {
  "use strict";
  if (window.__booboLife) return;
  window.__booboLife = 1;

  var KEY = "boobo_life_v1";
  var API, S, L, lastAct = Date.now(), wasHidden = document.hidden, passFeed = false, prev = null;

  function $id(x) { return document.getElementById(x); }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(Number(v) || 0))); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function load() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { d = {}; }
    return {
      t: Number(d.t) || Date.now(),
      acc: d.acc && typeof d.acc === "object" ? d.acc : {},
      milkDay: typeof d.milkDay === "string" ? d.milkDay : "",
      milk: Math.max(0, parseInt(d.milk, 10) || 0)
    };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) {} }
  function markAct() { tick(); lastAct = Date.now(); }
  function hasBed() { return (S.placed || []).indexOf("bed") >= 0; }
  function resetMilk() { if (L.milkDay !== today()) { L.milkDay = today(); L.milk = 0; save(); } }

  /* 累积器：按"每 N 秒 1 点"把时间换成整数点数，小数部分留到下次 */
  function drip(key, sec, every) {
    var a = (Number(L.acc[key]) || 0) + sec / every;
    var n = Math.floor(a + 1e-9);
    L.acc[key] = Math.max(0, a - n);
    return n;
  }

  /* 时间流逝：offline=true 表示离开页面期间，消耗有保底 */
  function applyTime(sec, offline) {
    if (sec <= 0) return;
    sec = Math.min(sec, 3 * 86400);
    var hFloor = offline ? 35 : 0, mFloor = offline ? 45 : 5;
    var h = drip("h", sec, S.sleeping ? 240 : 120);
    if (h && S.hunger > hFloor) S.hunger = Math.max(hFloor, S.hunger - h);
    var sad = S.hunger < 25 || S.energy < 15;
    var m = drip("m", sec, sad ? 90 : 240);
    if (m && S.mood > mFloor) S.mood = Math.max(mFloor, S.mood - m);
    if (S.sleeping) {
      /* 睡眠恢复统一按经过的时间结算，避免刷新或后台限速漏算。 */
      var every = offline ? (hasBed() ? 7 : 10) : (hasBed() ? 20 : 0);
      var e = (every ? drip("e", sec, every) : 0) + (offline ? 0 : drip("sleep", sec, 10));
      if (e) S.energy = clamp(S.energy + e);
    } else if (S.energy < 60 && (offline || Date.now() - lastAct > 60000)) {
      var r = drip("i", sec, 45);
      if (r) S.energy = Math.min(60, S.energy + r);
    }
  }

  function tick(forceOffline) {
    if (window.__booboStorageReload) return 0;
    var now = Date.now(), dt = (now - L.t) / 1000;
    L.t = now;
    if (dt <= 0) { save(); return 0; }
    var before = [S.hunger, S.mood, S.energy].join();
    applyTime(dt, forceOffline === true || wasHidden || document.hidden || dt > 90);
    wasHidden = document.hidden;
    save();
    if ([S.hunger, S.mood, S.energy].join() !== before) { API.save(); API.render(); }
    return dt;
  }

  /* 数值飘字 + 低值闪烁 */
  var KEYS = ["hunger", "mood", "energy", "bond"];
  function statBox(k) { var v = $id(k + "Val"); return v ? v.closest(".stat") : null; }
  function floatDelta(k, d) {
    var st = statBox(k);
    if (!st) return;
    var old = st.querySelector(".stat-delta");
    if (old) old.remove();
    var sp = document.createElement("span");
    sp.className = "stat-delta " + (d > 0 ? "up" : "down");
    sp.textContent = (d > 0 ? "+" : "") + d;
    st.appendChild(sp);
    setTimeout(function () { sp.remove(); }, 950);
  }
  function watch() {
    var cur = KEYS.map(function (k) { return Number(S[k]) || 0; });
    if (prev) for (var i = 0; i < 4; i++) { if (cur[i] !== prev[i]) floatDelta(KEYS[i], cur[i] - prev[i]); }
    prev = cur;
    for (var j = 0; j < 3; j++) { var st = statBox(KEYS[j]); if (st) st.classList.toggle("low", cur[j] < 25); }
  }

  /* 布局：状态条放到舞台上方，互动键贴在对话气泡下面 */
  function relayout() {
    var hero = document.querySelector(".hero");
    var stage = $id("petStage"), speech = $id("speech");
    var actions = document.querySelector(".actions");
    if (!hero || !stage || !speech || !actions) return;
    var stats = hero.querySelector(".stats");
    if (stats && stats.nextElementSibling !== stage) stage.parentNode.insertBefore(stats, stage);
    if (actions.parentNode !== hero) {
      var sec = actions.closest(".section");
      speech.insertAdjacentElement("afterend", actions);
      if (sec) sec.hidden = true;
    }
  }

  /* 点心菜单 */
  function r(x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>'; }
  function svg(inner) { return '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' + inner + '</svg>'; }
  var ART = {
    cookie: '<span class="px-icon" data-icon="cookie"></span>',
    milk: svg(r(5,2,6,2,"#9fb6a0") + r(4,4,8,10,"#e9efe6") + r(5,6,6,7,"#ffffff") + r(4,14,8,1,"#9fb6a0") + r(12,6,2,5,"#cfd8cc")),
    cake: svg(r(2,8,12,6,"#f3d7a8") + r(2,6,12,3,"#f7b6c2") + r(3,10,10,1,"#e48aa0") + r(7,2,2,4,"#e4788c") + r(6,3,1,1,"#7cb46a")),
    fruit: svg(r(7,1,2,3,"#8c6a4c") + r(9,2,3,2,"#7cc46e") + r(5,4,6,2,"#7cc46e") + r(3,6,10,7,"#5fae5a") + r(5,13,6,1,"#3f8a50") + r(5,7,2,2,"#c8f0b8"))
  };
  var FOODS = [
    { id: "cookie", name: "小饼干", note: "饱腹+", cost: 0 },
    { id: "milk", name: "温牛奶", note: "体力+6", cost: 0, daily: 3 },
    { id: "cake", name: "草莓蛋糕", note: "饱腹+35", cost: 8 },
    { id: "fruit", name: "能量果", note: "体力+25", cost: 6 }
  ];

  function closeMenu() { var m = $id("foodPop"); if (m) m.remove(); }
  function toggleMenu() {
    if ($id("foodPop")) { closeMenu(); return; }
    if (S.sleeping) { API.say("啵啵睡着啦，醒来再吃吧。"); return; }
    resetMilk();
    var html = FOODS.map(function (f) {
      var left = f.daily ? f.daily - L.milk : null;
      var off = (f.cost && S.stars < f.cost) || (left !== null && left <= 0);
      var tag = f.cost ? f.cost + "\u2605" : left !== null ? "今日剩 " + left : "免费";
      return '<button type="button" class="food-btn' + (off ? " off" : "") + '" data-food="' + f.id + '">' +
        ART[f.id] + '<b>' + f.name + '</b><small>' + f.note + '</small><em>' + tag + '</em></button>';
    }).join("");
    document.querySelector(".actions").insertAdjacentHTML("afterend", '<div class="food-pop" id="foodPop">' + html + '</div>');
    if (window.BooboPaintIcons) window.BooboPaintIcons();
  }

  function eat(id) {
    var f = FOODS.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    closeMenu();
    markAct();
    if (id === "cookie") {
      passFeed = true;
      var b = document.querySelector('[data-action="feed"]');
      if (b) b.click();
      passFeed = false;
      return;
    }
    if (f.cost && S.stars < f.cost) { API.say("星星还差 " + (f.cost - S.stars) + " 颗，先去小游戏赚一点吧。"); API.pose("bounce"); return; }
    if (f.daily) {
      resetMilk();
      if (L.milk >= f.daily) { API.say("今天的温牛奶喝完啦，明天再来。"); return; }
      L.milk++; save();
    }
    if (f.cost) S.stars -= f.cost;
    var full = S.hunger >= 95;
    if (id === "milk") {
      S.energy = clamp(S.energy + 6); S.hunger = clamp(S.hunger + 5); S.mood = clamp(S.mood + 3);
      API.say("啵啵捧着温牛奶小口小口地喝，眼睛慢慢亮起来。");
    } else if (id === "cake") {
      S.hunger = clamp(S.hunger + 35); S.mood = clamp(S.mood + (full ? -6 : 12)); S.bond = clamp(S.bond + 2);
      API.say(full ? "吃太撑了……啵啵抱着圆肚子，有点难受。" : "草莓蛋糕！啵啵吃得满嘴奶油，开心得直晃。");
    } else if (id === "fruit") {
      S.energy = clamp(S.energy + 25); S.hunger = clamp(S.hunger + 8);
      API.say("能量果咔嚓一口，啵啵一下子精神了！");
    }
    API.pose("eat");
    if (full && id === "cake") API.setFace("sad");
    API.spawnFx(id === "cake" ? "\u2665" : "\u2726", 3);
    API.save(); API.render();
    API.emit("action", { action: "feed", food: id });
  }

  function boot() {
    API = window.BooboAPI;
    S = API.state;
    L = load();
    relayout();
    var gap = tick(true);
    if (gap > 600) {
      API.say(S.sleeping
        ? "你回来啦！啵啵睡了好一觉，体力恢复到 " + S.energy + "%。"
        : "你回来啦！啵啵有点想你，肚子也有点饿了。");
    }
    watch();
    setInterval(tick, 10000);
    setInterval(watch, 300);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("pagehide", tick);
    document.addEventListener("pointerdown", markAct, true);

    /* 在 app.js 处理之前拦截：喂食改为弹菜单，饿了不能陪玩 */
    window.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-action]");
      if (!b) return;
      var a = b.dataset.action;
      if (a === "feed" && !passFeed) { ev.stopPropagation(); toggleMenu(); return; }
      closeMenu();
      if (a === "play" && !S.sleeping && S.hunger < 10) {
        ev.stopPropagation();
        API.say("啵啵饿得没力气跑了，先喂点东西吧。");
        API.setFace("hungry");
      }
    }, true);

    document.addEventListener("click", function (ev) {
      var f = ev.target.closest && ev.target.closest("[data-food]");
      if (f) eat(f.dataset.food);
    });

    API.on("action", function (ev) {
      var d = ev.detail || {};
      markAct();
      if (d.action === "play") { S.hunger = clamp(S.hunger - 4); API.save(); API.render(); }
      if (d.action === "sleep" && d.sleeping && hasBed()) API.say("啵啵钻进软软小床，睡得比平时更香，体力恢复更快。");
    });
  }

  window.BooboLife = {
    state: function () { return L; },
    flush: tick,
    advance: function (sec, off) {
      L.t = Date.now();
      applyTime(Math.max(0, Number(sec) || 0), off !== false);
      save(); API.save(); API.render();
    },
    resetMilk: function () { L.milkDay = today(); L.milk = 0; save(); }
  };

  var tries = 0;
  (function wait() {
    if (window.BooboAPI) { boot(); return; }
    if (tries++ > 40) return;
    setTimeout(wait, 60);
  })();
})();
