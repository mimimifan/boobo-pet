/* boobo-kitchen.js v20 : 做饭小游戏（选菜谱 + 火候判定）/ 厨房互动 / 冰箱面板 / 餐桌出菜
   存档 key: boobo_kitchen_v1  made 做菜数 / perfect 完美数 / dishes 冰箱存菜 / snackDay+snack 每日零食 */
(function () {
  "use strict";
  if (window.__booboKitchen) return;
  window.__booboKitchen = 1;

  var KEY = "boobo_kitchen_v1", CAP = 8;
  /* 坐姿与桌上菜的位置，按餐桌 46x32 的格子比例换算 */
  var SIT_DROP = 32, DISH_X = -1 / 34, DISH_TOP = 25 / 32, DISH_W = 0.46;
  var API, S, D, timer = 0, sitT = 0, dishT = 0, handT = 0, G = null;

  function $id(x) { return document.getElementById(x); }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(Number(v) || 0))); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function lv() { var p = window.BooboPlus && window.BooboPlus.get(); return p ? p.lv : 1; }
  function plus() { var P = window.BooboPlus; if (P) { P.checkAch(); P.refresh(); } }
  function has(id) { return (S.placed || []).indexOf(id) >= 0; }
  function load() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
    var list = Array.isArray(d.dishes) ? d.dishes : [];
    return {
      pending: d.pending && RECIPES.some(function(r){return r.id===d.pending.id;}) ? {id:d.pending.id,q:Math.max(0,Math.min(3,parseInt(d.pending.q,10)||0))} : null,
      made: Math.max(0, parseInt(d.made, 10) || 0),
      perfect: Math.max(0, parseInt(d.perfect, 10) || 0),
      dishes: list.filter(function (x) { return x && RECIPES.some(function(r){return r.id===x.id;}); }).slice(0, CAP).map(function(x){return {id:x.id,q:qi(x.q)};}),
      snackDay: typeof d.snackDay === "string" ? d.snackDay : "",
      snack: Math.max(0, parseInt(d.snack, 10) || 0),
      diff: [0, 1, 2].indexOf(parseInt(d.diff, 10)) >= 0 ? parseInt(d.diff, 10) : 1
    };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }

  /* ===== 像素画：字符网格 -> 内联 SVG ===== */
  var PAL = { o: "#5a3d2b", w: "#b98256", W: "#d9a571", d: "#8c5e3d", D: "#6e4a30",
    g: "#6fae5c", G: "#9ad07a", k: "#4a8a48", p: "#f2a7b5", P: "#fbd3da",
    r: "#e2788c", R: "#c25f72", y: "#f3cf5f", Y: "#fff0a8", b: "#8fc0e0",
    q: "#a9d1ea", n: "#5f93bb", N: "#4a7aa0", c: "#fbf3dc", C: "#e8d9b5",
    x: "#c9744a", X: "#e39a6a", z: "#9a5232", s: "#ffffff", e: "#6b5a4a", E: "#d6e6ee" };
  function grid(W, H, f) {
    var g = [];
    for (var y = 0; y < H; y++) { var row = ""; for (var x = 0; x < W; x++) row += f(x, y) || "."; g.push(row); }
    return g;
  }
  function outline(g) {
    return g.map(function (row, y) {
      var out = "";
      for (var x = 0; x < row.length; x++) {
        var ch = row.charAt(x);
        if (ch !== "." && ch !== "o") {
          var edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (v) {
            var r2 = g[y + v[1]], c2 = r2 ? r2.charAt(x + v[0]) : "";
            return !c2 || c2 === ".";
          });
          if (edge) ch = "o";
        }
        out += ch;
      }
      return out;
    });
  }
  function toSvg(g) {
    var w = 0, out = "";
    g.forEach(function (r) { w = Math.max(w, r.length); });
    g.forEach(function (row, y) {
      for (var x = 0; x < row.length;) {
        var ch = row.charAt(x), n = 1;
        while (row.charAt(x + n) === ch) n++;
        if (PAL[ch]) out += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + PAL[ch] + '"/>';
        x += n;
      }
    });
    return '<svg viewBox="0 0 ' + w + ' ' + g.length + '" shape-rendering="crispEdges" aria-hidden="true">' + out + '</svg>';
  }
  var memo = {};
  function art(id, fn) { return memo[id] || (memo[id] = toSvg(fn())); }

  /* 公用部件：白瓷盘 / 瓷碗 / 热气 / 方块食材 */
  function plateAt(x, y) {
    if (y < 13 || y > 17) return "";
    var inset = [1, 0, 1, 3, 6][y - 13];
    if (x < inset || x > 27 - inset) return "";
    if (y <= 14) return x >= 21 ? "C" : "s";
    if (y === 15) return x >= 20 ? "C" : "c";
    return "C";
  }
  function bowlAt(x, y, rim) {
    if (y < 7 || y > 17) return "";
    if (y <= 15) {
      var t = (y - 7) / 8, hw = 11 - t * 6;
      if (Math.abs(x - 13.5) > hw) return "";
      var dark = x >= 13.5 + hw - 3;
      if (rim && y <= 8) return dark ? "n" : "q";
      return dark ? "C" : "s";
    }
    if (y === 16) return x >= 9 && x <= 18 ? "C" : "";
    return x >= 7 && x <= 20 ? "s" : "";
  }
  function steam(x, y, l, r) {
    var pts = [[l, 0], [r, 0], [l - 1, 1], [r + 1, 1], [l, 2], [r, 2], [l + 1, 3], [r - 1, 3]];
    for (var i = 0; i < pts.length; i++) if (x === pts[i][0] && y === pts[i][1]) return "s";
    return "";
  }
  function cube(x, y, bx, by, w, c, dk) {
    if (x < bx || x >= bx + w || y < by || y >= by + w) return "";
    return (x === bx + w - 1 || y === by + w - 1) ? dk : c;
  }

  /* 番茄炒蛋：红番茄块 + 金黄蛋块 + 葱花 */
  function tomatoArt() {
    return outline(grid(28, 18, function (x, y) {
      return cube(x, y, 4, 8, 5, "r", "R") || cube(x, y, 10, 5, 5, "y", "Y") ||
        cube(x, y, 15, 8, 5, "r", "R") || cube(x, y, 20, 6, 4, "y", "Y") ||
        cube(x, y, 8, 3, 4, "r", "R") ||
        (((y === 7 || y === 12) && (x === 14 || x === 25)) || (y === 11 && x === 9) ? "k" : "") ||
        plateAt(x, y) || ".";
    }));
  }
  /* 蛋包饭：饱满蛋皮 + 番茄酱波浪 + 一撮青菜 */
  function riceArt() {
    return outline(grid(28, 18, function (x, y) {
      var dx = (x - 13) / 10, dy = (y - 12.5) / 8;
      if (y >= 4 && y <= 12 && dx * dx + dy * dy <= 1) {
        if ((y === 6 && x >= 9 && x <= 16) || (y === 7 && (x === 9 || x === 16)) ||
          (y === 8 && x >= 10 && x <= 17) || (y === 9 && (x === 11 || x === 17))) return "r";
        return (y <= 5 || (x <= 10 && y <= 8)) ? "Y" : "y";
      }
      if (y >= 9 && y <= 12 && x >= 22 && x <= 25) return y === 9 ? "G" : ((x + y) % 2 ? "g" : "k");
      return plateAt(x, y) || ".";
    }));
  }
  /* 奶油蘑菇汤：奶白汤面 + 蘑菇片 + 欧芹 + 热气 */
  function soupArt() {
    return outline(grid(28, 18, function (x, y) {
      if (y < 4) return steam(x, y, 11, 17) || ".";
      if (y === 5 || y === 6) {
        if (x < 3 || x > 24) return ".";
        if (y === 6 && ((x >= 6 && x <= 10) || (x >= 14 && x <= 18))) return "w";
        if (y === 6 && (x === 12 || x === 21)) return "k";
        return y === 5 ? "C" : "c";
      }
      return bowlAt(x, y, 0) || ".";
    }));
  }
  /* 草莓松饼：三层饼 + 糖浆 + 黄油 + 顶上草莓 */
  function pancakeArt() {
    return outline(grid(28, 18, function (x, y) {
      if (y <= 3) {
        if (y === 0) return x === 15 ? "k" : ".";
        if (y === 1) return x >= 13 && x <= 16 ? "k" : ".";
        if (x >= 12 && x <= 17) return y === 3 ? ((x >= 14 && x <= 15) ? "R" : ".") : (x <= 14 ? "r" : "R");
        return ".";
      }
      if (y === 4) return x >= 10 && x <= 17 ? (x <= 13 ? "Y" : "y") : ".";
      if (y <= 12) {
        if (x < 5 || x > 22) return ".";
        if (y === 5) return x <= 12 ? "Y" : "y";
        if ((y - 5) % 3 === 0) return "z";
        return x >= 19 ? "X" : "x";
      }
      return plateAt(x, y) || ".";
    }));
  }
  /* 小馄饨：蓝边碗 + 清汤 + 三只馄饨 + 葱花 */
  function wontonArt() {
    return outline(grid(28, 18, function (x, y) {
      if (y < 4) return steam(x, y, 12, 16) || ".";
      if (y === 5 || y === 6) {
        if (x < 3 || x > 24) return ".";
        if (y === 6) {
          if ((x >= 6 && x <= 10) || (x >= 13 && x <= 17) || (x >= 19 && x <= 22)) return "c";
          if (x === 12 || x === 18) return "k";
        }
        return y === 5 ? "X" : "x";
      }
      return bowlAt(x, y, 1) || ".";
    }));
  }
  /* 焦糖布丁：布丁山 + 焦糖淋面 + 樱桃 */
  function puddingArt() {
    return outline(grid(28, 18, function (x, y) {
      if (y === 1) return x === 15 ? "k" : ".";
      if (y === 2 || y === 3) return (x >= 13 && x <= 15) ? (y === 2 ? "R" : "r") : ".";
      if (y >= 4 && y <= 12) {
        var t = (y - 4) / 8, hw = 5 + t * 6.5;
        if (Math.abs(x - 13.5) > hw) return ".";
        if (y <= 5) return "z";
        if (y === 6) return (x <= 9 || x >= 18) ? "z" : "x";
        return x >= 13.5 + hw - 3 ? "y" : "Y";
      }
      return plateAt(x, y) || ".";
    }));
  }

  /* 游戏里的大平底锅 */
  function panArt() {
    return outline(grid(52, 22, function (x, y) {
      if (y < 3) {
        if (x >= 2 && x <= 37) return y === 0 ? "E" : "q";
        if (y >= 1 && x >= 38 && x <= 51) return y === 1 ? "e" : "o";
        return ".";
      }
      if (y < 18) {
        var t = (y - 3) / 15, hw = 18 - t * 4;
        if (Math.abs(x - 19.5) > hw) return ".";
        if (y >= 15) return "N";
        return x >= 19.5 + hw - 3 ? "N" : "n";
      }
      if (y < 20) return x >= 7 && x <= 32 ? "N" : ".";
      return ".";
    }));
  }
  /* 小游戏屋入口的汤锅图标 */
  function potIconArt() {
    return outline(grid(16, 14, function (x, y) {
      if (y < 2) return ((y === 0 && (x === 5 || x === 9)) || (y === 1 && (x === 4 || x === 10))) ? "s" : ".";
      if (y === 2) return x >= 6 && x <= 8 ? "E" : ".";
      if (y === 3) return x >= 2 && x <= 12 ? "E" : ".";
      if (y === 4) return x >= 1 && x <= 13 ? "q" : ".";
      if (y <= 11) {
        if (x >= 2 && x <= 12) return y === 11 ? "N" : x >= 11 ? "N" : "n";
        if ((x <= 1 || x >= 13) && y <= 7) return "N";
      }
      return ".";
    }));
  }

  /* ===== 菜谱：每道菜的恢复数值不同（这里写的是"很好吃"档，品质会按倍率缩放） ===== */
  var RECIPES = [
    { id: "tomato",  name: "番茄炒蛋",   lv: 17, tag: "正餐", h: 34, m: 10, e: 6,  b: 1,
      note: "酸甜下饭，啵啵的头号最爱",   fn: tomatoArt,  bits: ["#e2788c", "#f3cf5f", "#6fae5c"] },
    { id: "rice",    name: "蛋包饭",     lv: 18, tag: "正餐", h: 38, m: 8,  e: 8,  b: 1,
      note: "软蛋皮裹住热米饭，淋番茄酱", fn: riceArt,    bits: ["#fff0a8", "#e2788c", "#fbf3dc"] },
    { id: "soup",    name: "奶油蘑菇汤", lv: 19, tag: "汤品", h: 22, m: 14, e: 14, b: 1,
      note: "热乎乎下肚，身上就有劲了",   fn: soupArt,    bits: ["#fbf3dc", "#b98256", "#e8d9b5"] },
    { id: "pancake", name: "草莓松饼",   lv: 20, tag: "甜点", h: 20, m: 22, e: 6,  b: 2,
      note: "叠得高高的，再放一块黄油",   fn: pancakeArt, bits: ["#e39a6a", "#e2788c", "#f3cf5f"] },
    { id: "wonton",  name: "小馄饨",     lv: 21, tag: "汤品", h: 30, m: 12, e: 12, b: 1,
      note: "一只只下锅，汤要热乎",       fn: wontonArt,  bits: ["#fbf3dc", "#e39a6a", "#6fae5c"] },
    { id: "pudding", name: "焦糖布丁",   lv: 22, tag: "甜点", h: 14, m: 26, e: 4,  b: 2,
      note: "烤好冰一下，吃的时候会晃",   fn: puddingArt, bits: ["#f3cf5f", "#9a5232", "#e2788c"] }
  ];
  /* k 是数值倍率；焦了的那档心情固定掉 5 */
  var QUAL = [
    { n: "有点焦了", tip: "下次手快一点点就好！", k: 0.4, mood: -5, bond: 0, star: 1 },
    { n: "普普通通", tip: "能吃，啵啵也不挑。",   k: 0.7, bond: 0, star: 2 },
    { n: "很好吃",   tip: "火候抓得不错！",       k: 1,   bond: 1, star: 4 },
    { n: "完美出锅", tip: "香味飘到门外去啦！",   k: 1.3, bond: 2, star: 7 }
  ];
  /* 做饭难度：区间越宽、游标越慢就越好打 */
  var DIFF = [
    { n: "简单", w0: 40, dw: 2.2, s0: 1.7, ds: 0.26, core: 0.46 },
    { n: "普通", w0: 33, dw: 2.9, s0: 2,   ds: 0.4,  core: 0.4 },
    { n: "困难", w0: 30, dw: 3.6, s0: 2.2, ds: 0.55, core: 0.34 }
  ];
  function diffOf() { return DIFF[D && D.diff != null ? D.diff : 1] || DIFF[1]; }
  function qi(q) { return Math.max(0, Math.min(3, parseInt(q, 10) || 0)); }
  function gain(id, q) {
    var r = recOf(id), Q = QUAL[qi(q)];
    return { h: Math.round(r.h * Q.k), e: Math.round(r.e * Q.k),
      m: Q.mood !== undefined ? Q.mood : Math.round(r.m * Q.k),
      b: Q.bond ? r.b + Q.bond - 1 : 0, star: Q.star, n: Q.n, tip: Q.tip };
  }
  function gtxt(g) {
    return "饱腹+" + g.h + "　心情" + (g.m >= 0 ? "+" + g.m : g.m) + "　体力+" + g.e + (g.b ? "　亲密+" + g.b : "");
  }
  function recOf(id) {
    for (var i = 0; i < RECIPES.length; i++) if (RECIPES[i].id === id) return RECIPES[i];
    return RECIPES[0];
  }
  function dishSvg(id) { var r = recOf(id); return art("dish_" + r.id, r.fn); }
  function unlocked() { var L = lv(); return RECIPES.filter(function (r) { return L >= r.lv; }); }

  /* ===== 借用小游戏弹窗 ===== */
  function panel(html, title) {
    var ov = $id("gameOverlay");
    if (!ov) return;
    ov.hidden = false;
    ov.classList.add("show");
    var t = ov.querySelector(".modal-head strong");
    if (t) t.textContent = title || "啵啵小厨房";
    var box = $id("gameContent");
    if (box) box.innerHTML = html;
  }
  var roundDelay = 0;
  function stop() { if (timer) clearInterval(timer); clearTimeout(roundDelay); roundDelay = 0; timer = 0; G = null; }
  function closePanel() { var b = $id("closeGame"); stop(); if (b) b.click(); }

  /* ===== 餐桌：啵啵坐椅子 + 菜摆到餐垫上 ===== */
  function spot(id) {
    var st = $id("petStage"), R = window.BooboRoom;
    if (!st || !R || !R.spotOf || st.dataset.scene !== "kitchen") return null;
    var sp = R.spotOf(id);
    return sp ? { st: st, sp: sp, W: st.clientWidth || 330 } : null;
  }
  function sitAt() {
    var o = spot("dchair");
    if (!o) return;
    o.st.style.setProperty("--pet-x", o.sp.x + "%");
    o.st.style.setProperty("--pet-b", Math.max(0, Math.round(o.sp.b + o.sp.h * 0.44 - SIT_DROP)) + "px");
    o.st.classList.add("pet-sit");
    clearTimeout(sitT);
    sitT = setTimeout(getUp, 9000);
  }
  function getUp() {
    var st = $id("petStage");
    if (sitT && st && st.dataset.scene === "kitchen") st.classList.remove("pet-sit");
    clearTimeout(sitT); sitT = 0; hideDish(); hideHand();
  }
  function hideHand() {
    clearTimeout(handT); handT = 0;
    var e = $id("petHandDish"), st = $id("petStage");
    if (e) e.remove(); if (st) st.classList.remove("pet-eating");
  }
  function showHand(id) {
    hideHand(); var pc = $id("petCharacter"), st = $id("petStage");
    if (!pc || !st) return;
    st.classList.add("pet-eating");
    pc.insertAdjacentHTML("beforeend", '<span class="pet-hand-dish" id="petHandDish">' + dishSvg(id) + '</span>');
    handT = setTimeout(hideHand, 2800);
  }
  function showDish(id, ms) {
    var o = spot("dtable");
    if (!o) return;
    var el = $id("tableDish");
    if (!el) {
      o.st.insertAdjacentHTML("beforeend", '<span id="tableDish"></span>');
      el = $id("tableDish");
    }
    el.style.left = (o.sp.x + DISH_X * o.sp.w / o.W * 100).toFixed(1) + "%";
    el.style.bottom = Math.round(o.sp.b + o.sp.h * DISH_TOP) + "px";
    el.style.width = Math.round(o.sp.w * DISH_W) + "px";
    el.innerHTML = dishSvg(id);
    el.hidden = false;
    clearTimeout(dishT);
    dishT = setTimeout(hideDish, ms || 4000);
  }
  function hideDish() {
    clearTimeout(dishT); dishT = 0;
    var el = $id("tableDish");
    if (el) el.hidden = true;
  }

  /* ===== 选菜谱 ===== */
  function openPick() {
    if(D.pending){
      var meal=D.pending;
      window.BooboRoom.setScene("kitchen");
      panel('<div class="cook-res"><span class="big">'+dishSvg(meal.id)+'</span><strong class="cook-now-tip">'+esc(recOf(meal.id).name)+'还没吃，先吃完这一道吧。</strong><button type="button" class="primary-btn" id="pendingEat">现在吃</button></div>',"开饭啦");
      $id("pendingEat").addEventListener("click",function(){if(D.pending!==meal)return;D.pending=null;save();eatNow(meal.id,meal.q);closePanel();});return;
    }

    stop();
    if (!has("stove")) { API.say("厨房还没有灶台，Lv17 解锁后就能开火做饭啦。"); return; }
    if (S.sleeping) { API.say("啵啵睡着啦，等它醒了再开火。"); return; }
    if (S.energy < 12) { API.say("啵啵站都站不稳了，先休息一下再下厨吧。"); API.setFace("sleepy"); return; }
    if (has("fridge") && D.dishes.length >= CAP) {
      API.say("冰箱塞得满满的（" + CAP + " 道），先点冰箱让啵啵吃掉几道再来做吧。");
      API.pose("bounce");
      return;
    }
    window.BooboRoom.setScene("kitchen");
    var L = lv();
    var cards = RECIPES.map(function (r) {
      var ok = L >= r.lv, g = gain(r.id, 2);
      return '<button type="button" class="cook-pick' + (ok ? "" : " lock") + '"' +
        (ok ? ' data-rec="' + r.id + '"' : " disabled") + '><span class="ic">' + dishSvg(r.id) + "</span>" +
        "<span><b>" + esc(r.name) + '</b><em class="tg">' + r.tag + "</em>" +
        "<small>" + esc(ok ? r.note : "等啵啵再长大一点") + "</small>" +
        (ok ? '<em class="gn">' + gtxt(g) + "</em>" : '<em>Lv' + r.lv + " 学会</em>") + "</span></button>";
    }).join("");
    panel('<div class="cook-wrap"><p class="cook-head">今天做哪一道？<span>会做 ' +
      unlocked().length + " / " + RECIPES.length + " 道　" + (has("fridge") ? "冰箱 " + D.dishes.length + " / " + CAP : "无冰箱：现做现吃") +
      "　难度 " + diffOf().n + "</span></p>" +
      (D.dishes.length ? '<button type="button" class="secondary-btn" id="recoverMeals">取出已存餐点（' + D.dishes.length + '）</button>' : '') +
      '<div class="cook-menu" id="cookMenu">' + cards + "</div>" +
      '<p class="game-tip">数值是「很好吃」档的，做得越好恢复越多。做一道菜消耗 5 点体力。</p></div>', "翻翻菜谱");
    /* 监听挂在每次重建的菜单上，挂在 #gameContent 上会越积越多，一点就重复开工 */
    var recover = $id("recoverMeals");
    if (recover) recover.addEventListener("click", openFridge);
    var menu = $id("cookMenu");
    if (menu) menu.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-rec]");
      if (b && !G) startCook(recOf(b.dataset.rec));
    });
  }

  /* ===== 做饭：五次翻炒 ===== */
  function startCook(rec) {
    stop();
    S.energy = clamp(S.energy - 5);
    API.save(); API.render();
    G = { rec: rec, step: 0, score: 0, pos: 0, dir: 1, speed: 2.2, lo: 0, hi: 0, mid: 0, busy: 0, pips: [] };
    panel('<div class="cook-wrap">' +
      '<div class="cook-dish"><span class="ic">' + dishSvg(rec.id) + '</span>' +
      '<div><b>正在做：' + esc(rec.name) + '</b><small>' + esc(rec.note) + '</small></div></div>' +
      '<div class="cook-pan" id="cookPan"><span class="flame"></span>' +
      '<span class="pan">' + art("pan", panArt) + '</span><span class="bits" id="cookBits"></span></div>' +
      '<div class="cook-meter" id="cookMeter"></div>' +
      '<div class="cook-pips" id="cookPips"></div>' +
      '<p class="game-tip" id="cookTip">游标进黄区就按下翻炒，正中绿心更香。一共五次。</p>' +
      '<button type="button" class="primary-btn cook-go" id="cookGo">翻炒！</button></div>', "开火！");
    var go = $id("cookGo");
    if (go) go.addEventListener("click", toss);
    paintPips();
    nextRound();
  }
  function nextRound() {
    if (!G) return;
    var n = G.step, d = diffOf(), w = Math.max(11, d.w0 - n * d.dw);
    G.speed = d.s0 + n * d.ds;
    G.core = d.core;
    G.lo = 8 + Math.random() * (84 - w);
    G.hi = G.lo + w;
    G.mid = G.lo + w / 2;
    G.pos = 0; G.dir = 1;
    var m = $id("cookMeter");
    if (!m) { stop(); return; }
    var inner = w * d.core;
    m.classList.remove("stop");
    m.innerHTML = '<i class="zone ok" style="left:' + G.lo + '%;width:' + w + '%"></i>' +
      '<i class="zone good" style="left:' + (G.mid - inner) + '%;width:' + (inner * 2) + '%"></i>' +
      '<i class="pin" id="cookPin" style="left:0%"></i>';
    if (timer) clearInterval(timer);
    timer = setInterval(tickPin, 28);
  }
  function tickPin() {
    if (!G) { clearInterval(timer); timer = 0; return; }
    var p = $id("cookPin");
    if (!p) { clearInterval(timer); timer = 0; return; }
    G.pos += G.dir * G.speed;
    if (G.pos >= 100) { G.pos = 100; G.dir = -1; }
    if (G.pos <= 0) { G.pos = 0; G.dir = 1; }
    p.style.left = G.pos + "%";
  }

  function paintPips() {
    var box = $id("cookPips");
    if (!box || !G) return;
    var h = "";
    for (var i = 0; i < 5; i++) {
      var v = G.pips[i];
      h += '<i class="' + (v === undefined ? "" : v === 2 ? "perf" : v === 1 ? "hit" : "miss") + '"></i>';
    }
    box.innerHTML = h;
  }
  function paintBits() {
    var box = $id("cookBits");
    if (!box || !G) return;
    var cols = G.rec.bits, h = "";
    for (var i = 0; i < G.step; i++) {
      var c = G.pips[i] === 0 ? "#6b4a30" : cols[i % cols.length];
      h += '<i style="left:' + (6 + i * 21) + '%;bottom:' + (i % 2 ? 6 : 0) + 'px;background:' + c + '"></i>';
    }
    box.innerHTML = h;
  }
  function toss() {
    if (!G || G.busy) return;
    G.busy = 1;
    if (timer) clearInterval(timer);
    timer = 0;
    var half = (G.hi - G.lo) / 2, d = Math.abs(G.pos - G.mid);
    var got = d <= half * (G.core || 0.4) ? 2 : d <= half ? 1 : 0;
    G.score += got;
    G.pips.push(got);
    G.step++;
    var m = $id("cookMeter"), pan = $id("cookPan"), tip = $id("cookTip");
    if (m) m.classList.add("stop");
    if (pan) { pan.classList.remove("toss"); void pan.offsetWidth; pan.classList.add("toss"); }
    if (tip) tip.textContent = got === 2 ? "正中火心！香气一下子冒出来。"
      : got === 1 ? "不错，火候刚好。" : "哎呀，这一下有点过头了……";
    paintPips(); paintBits();
    var last = G.step >= 5;
    var session = G;
    roundDelay = setTimeout(function () {
      roundDelay = 0;
      if (!G || G !== session) return;
      if (pan) pan.classList.remove("toss");
      if (last) { finish(); return; }
      G.busy = 0;
      nextRound();
    }, 680);
  }

  function finish() {
    var sc=G.score,rec=G.rec,q=sc>=9?3:sc>=6?2:sc>=3?1:0;
    stop();D.made++;S.games++;if(q===3)D.perfect++;
    var Q=QUAL[q],g=gain(rec.id,q),cold=has("fridge"),stored=cold&&D.dishes.length<CAP;
    var meal={id:rec.id,q:q};if(stored)D.dishes.unshift(meal);
    else D.pending=meal;
    save();S.stars=Math.max(0,Math.floor(Number(S.stars)||0))+g.star;
    API.save();API.render();API.emit("game",{game:"cook",score:sc,reward:g.star});
    panel('<div class="cook-res"><span class="big">'+dishSvg(rec.id)+'</span><b class="cook-q'+q+'">'+esc(rec.name)+'　'+esc(Q.n)+
      '</b><span class="rec-badge" id="recBadge" hidden></span><p>'+esc(Q.tip)+'　火候得分 '+sc+' / 10，获得 '+g.star+' 颗星星。<br>喂给啵啵：'+gtxt(g)+'</p>'+
      (stored?'<p>已经放进冰箱（'+D.dishes.length+' / '+CAP+'）。</p>':'<strong class="cook-now-tip">'+(cold?'冰箱满啦，这道菜请现在吃。':'还没有冰箱，这道菜请现在吃。')+'</strong>')+
      '<div class="result-buttons"><button type="button" class="primary-btn" id="cookFeed">'+(stored?'马上喂它':'现在吃')+'</button>'+
      (stored?'<button type="button" class="secondary-btn" id="cookKeep">先留在冰箱</button>':'')+'</div></div>',"出锅啦！");
    $id('cookFeed').addEventListener('click',function(){
      if(stored){var i=D.dishes.indexOf(meal);if(i<0)return;feedDish(i);}
      else {if(D.pending!==meal)return;D.pending=null;save();eatNow(rec.id,q);}
      API.say('啵啵吃光了'+rec.name+'。（'+gtxt(g)+'）');closePanel();
    });
    var kp=$id('cookKeep');if(kp)kp.addEventListener('click',function(){closePanel();API.say(rec.name+'留在冰箱啦。');});
    plus();
  }

  /* ===== 吃菜：数值按菜谱和品质算 ===== */
  function applyQual(id, q) {
    var g = gain(id, q);
    S.hunger = clamp(S.hunger + g.h);
    S.mood = clamp(S.mood + g.m);
    S.energy = clamp(S.energy + g.e);
    if (g.b) S.bond = clamp(S.bond + g.b);
    API.pose("eat");
    API.spawnFx(g.m >= 12 ? "\u2665" : "\u2726", 3);
    API.save(); API.render();
    API.emit("action", { action: "feed", food: "dish" });
    plus();
    return g;
  }
  function eatNow(id, q) {
    if (window.BooboAct) window.BooboAct.stand();
    if (window.BooboCourt) window.BooboCourt.stand();
    getUp(); var g = applyQual(id, q);
    if (spot("dtable")) { showDish(id, 2600); sitAt(); }
    else showHand(id);
    return g;
  }
  function feedDish(idx) {
    var d = D.dishes[idx];
    if (!d) return null;
    D.dishes.splice(idx, 1);
    save();
    d.gain = eatNow(d.id, d.q);
    return d;
  }

  /* ===== 冰箱面板 ===== */
  function openFridge() {
    stop();
    var rows = D.dishes.map(function (d, i) {
      var r = recOf(d.id), g = gain(d.id, d.q);
      return '<div class="cook-row"><span class="ic">' + dishSvg(d.id) + "</span>" +
        "<div><b>" + esc(r.name) + '　<em class="cook-q' + qi(d.q) + '">' + esc(g.n) + "</em></b>" +
        '<em class="gn">' + gtxt(g) + "</em></div>" +
        '<button type="button" class="shop-btn" data-eat="' + i + '">喂它</button></div>';
    }).join("") || '<p class="deco-tip">冰箱空空的，去灶台做一道吧</p>';
    var locked = RECIPES.filter(function (r) { return lv() < r.lv; }).map(function (r) {
      return '<div class="cook-row lock"><span class="ic">' + dishSvg(r.id) + "</span>" +
        "<div><b>" + esc(r.name) + "</b><em>Lv" + r.lv + " 学会</em></div></div>";
    }).join("");
    panel('<div class="cook-wrap"><p class="cook-head">' + (has("fridge") ? "冰箱里的菜" : "之前存下的餐点") + '<span>' + D.dishes.length + " / " + CAP + "</span></p>" +
      '<div class="cook-box" id="fridgeList">' + rows + "</div>" +
      (locked ? '<p class="cook-head">还没学会的菜谱</p><div class="cook-box">' + locked + "</div>" : "") +
      '<div class="result-buttons" style="margin-top:6px">' +
      '<button type="button" class="primary-btn" id="fridgeCook">去做菜</button>' +
      '<button type="button" class="secondary-btn" id="fridgeClose">返回</button></div></div>', has("fridge") ? "打开冰箱" : "取出已存餐点");
    var list = $id("fridgeList");
    if (list) list.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-eat]");
      if (!b) return;
      var d = feedDish(parseInt(b.dataset.eat, 10) || 0);
      if (d) { API.say("端出" + recOf(d.id).name + "，啵啵吃光了。（" + gtxt(d.gain) + "）"); openFridge(); }
    });
    var ck = $id("fridgeCook"), cl = $id("fridgeClose");
    if (ck) ck.addEventListener("click", openPick);
    if (cl) cl.addEventListener("click", closePanel);
  }

  /* ===== 厨房家具互动 ===== */
  var USE = {
    stove: openPick,
    fridge: openFridge,
    dtable: function () {
      if (!D.dishes.length) { API.say("餐桌擦得干干净净，可惜还没有菜。去灶台做一道吧。"); return; }
      var rec = recOf(D.dishes[0].id), d = feedDish(0);
      API.say("啵啵爬上餐椅，把" + rec.name + "吃得一点不剩。" + d.gain.tip + "（" + gtxt(d.gain) + "）" +
        (D.dishes.length ? "（冰箱里还有 " + D.dishes.length + " 道）" : ""));
    },
    cupboard: function () {
      if (D.snackDay !== today()) { D.snackDay = today(); D.snack = 0; save(); }
      if (D.snack >= 2) { API.say("今天的零食已经拿完啦，剩下的留到明天。"); return; }
      D.snack++; save();
      S.hunger = clamp(S.hunger + 15);
      S.mood = clamp(S.mood + 4);
      API.say("从零食柜摸出一块小饼干，啵啵咔嚓咔嚓就吃掉了。（今天还能拿 " + (2 - D.snack) + " 次）");
      API.pose("eat"); API.spawnFx("\u2726", 2);
      API.save(); API.render();
      API.emit("action", { action: "feed", food: "snack" });
      plus();
    },
    ceiling: function () {
      var a = window.BooboAct;
      if (!a || !a.flip) { API.say("灯好像有点接触不良……"); return; }
      a.flip("ceiling", "吸顶灯亮了，台面照得清清楚楚。", "吸顶灯关掉，厨房暗下来。");
    },
    potrack: function () {
      S.mood = clamp(S.mood + 3);
      API.say(["啵啵把锅子一个个擦亮，叮叮当当响。",
        "挂锅架上的平底锅照出一个圆圆的啵啵。",
        "锅铲被啵啵举起来当指挥棒挥了两下。"][Math.floor(Math.random() * 3)]);
      API.pose("happy");
      API.save(); API.render();
    }
  };

  USE.dchair = USE.dtable;

  /* 待机：厨房里闲着时自己爬上餐椅发呆，或者绕着冰箱打转 */
  var touched = Date.now();
  function kidle() {
    if (!API || S.sleeping) return;
    var st = $id("petStage"), ov = $id("gameOverlay");
    if (!st || st.dataset.scene !== "kitchen" || st.classList.contains("pet-sit")) return;
    if (ov && !ov.hidden) return;
    if (Date.now() - touched < 45000 || Math.random() > 0.45) return;
    if (has("dtable")) {
      sitAt();
      API.say(D.dishes.length ? "啵啵自己坐上餐椅，眼巴巴地等开饭。" : "啵啵坐在餐椅上晃小脚，等着谁来做饭。");
    } else if (has("fridge")) {
      API.say("啵啵绕着冰箱转了一圈，好像在想吃点什么。");
    }
  }

  /* 小游戏屋追加入口，同时把前三个游戏的像素图标补画上（app.js 漏了这一步） */
  function addEntry() {
    var box = document.querySelector("#gameContent .game-choice-grid");
    if (!box) return;
    if (!$id("chooseCook")) {
      var need = RECIPES[0].lv, ok = lv() >= need && has("stove");
      box.insertAdjacentHTML("beforeend",
        '<button class="game-choice' + (ok ? "" : " locked") + '" id="chooseCook"' + (ok ? "" : " disabled") +
        '><span class="ck-ic">' + art("pot", potIconArt) + "</span><b>啵啵小厨房</b><small>" +
        (lv() < need ? "Lv" + need + " 解锁厨房后开放"
          : ok ? "选菜谱 · 翻炒五次 · 做好喂给啵啵" : "要先在厨房摆上小灶台") +
        "</small></button>");
      if (ok) $id("chooseCook").addEventListener("click", openPick);
    }
    if (window.BooboPaintIcons) window.BooboPaintIcons();
  }

  function boot() {
    API = window.BooboAPI;
    S = API.state;
    D = load();
    if (window.BooboAct && window.BooboAct.add) {
      Object.keys(USE).forEach(function (id) { window.BooboAct.add(id, USE[id]); });
    }
    document.addEventListener("click", function (ev) {
      if (!ev.target || !ev.target.closest) return;
      if (ev.target.id === "gameOverlay" || ev.target.closest("#closeGame")) { stop(); return; }
      if (ev.target.closest("#openGame,#playAgain,#noticeBack,#playRpsAgain")) setTimeout(addEntry, 0);
    });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") stop(); });
    document.addEventListener("boobo:scene", function () { stop(); getUp(); });
    var pb = $id("petButton");
    if (pb) pb.addEventListener("click", getUp, true);
    API.on("action", function (ev) {
      var a = (ev.detail || {}).action;
      if (a === "sleep" || a === "play") getUp();
    });
    window.addEventListener("resize", hideDish);
    document.addEventListener("pointerdown", function () { touched = Date.now(); }, true);
    setInterval(kidle, 12000);
  }

  window.BooboKitchen = {
    open: openPick, fridge: openFridge,
    state: function () { return D; },
    dishes: function () { return D.dishes.slice(); },
    feed: function (i) { return feedDish(parseInt(i, 10) || 0); },
    RECIPES: RECIPES, CAP: CAP, DIFF: DIFF,
    diff: function (v) {
      var i = [0, 1, 2].indexOf(parseInt(v, 10));
      if (i >= 0) { D.diff = parseInt(v, 10); save(); }
      return diffOf().n;
    }
  };

  var tries = 0;
  (function wait() {
    if (window.BooboAPI && window.BooboRoom && window.BooboAct) { boot(); return; }
    if (tries++ > 60) return;
    setTimeout(wait, 60);
  })();
})();
