/* boobo-act.js v16 : 家具互动。点家具就用；啵啵待机会自己去坐沙发、看鱼缸
   独立存档 key: boobo_act_v1（含互动次数 cnt，供成就使用） */
(function () {
  "use strict";
  if (window.__booboAct) return;
  window.__booboAct = 1;

  var KEY = "boobo_act_v1";
  var TOYS = [["car", "小汽车"], ["ball", "小皮球"], ["block", "积木"]];
  var LAMPS = ["lamp", "floorlamp", "ceiling", "streetlamp"];
  var WAKEFREE = { clock: 1, lamp: 1, floorlamp: 1, ceiling: 1, streetlamp: 1, bed: 1 };
  /* 看书时手上那本小画册 */
  var BOOK = '<svg viewBox="0 0 24 14" shape-rendering="crispEdges" aria-hidden="true">' +
    '<rect x="0" y="2" width="24" height="12" fill="#5a3d2b"/>' +
    '<rect x="1" y="3" width="10" height="10" fill="#c9744a"/><rect x="13" y="3" width="10" height="10" fill="#c9744a"/>' +
    '<rect x="2" y="4" width="8" height="8" fill="#fbf3dc"/><rect x="14" y="4" width="8" height="8" fill="#fbf3dc"/>' +
    '<rect x="3" y="6" width="6" height="1" fill="#a9c0a4"/><rect x="3" y="8" width="5" height="1" fill="#a9c0a4"/>' +
    '<rect x="15" y="6" width="4" height="4" fill="#8fc0e0"/><rect x="15" y="6" width="2" height="2" fill="#cfe9f5"/>' +
    '<rect x="11" y="1" width="2" height="13" fill="#5a3d2b"/></svg>';
  var API, S, D, busy = 0, idleAt = Date.now(), tvTimer = 0, sofaTimer = 0, backTimer = 0;
  var mode = "", toyId = "";

  function $id(x) { return document.getElementById(x); }
  function st() { return $id("petStage"); }
  function R() { return window.BooboRoom; }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(Number(v) || 0))); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function load() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
    var old = d.lamp === 1 ? 1 : d.lamp === 0 ? 0 : null;
    var src = (d.lamps && typeof d.lamps === "object") ? d.lamps : {}, lm = {};
    LAMPS.forEach(function (k) { lm[k] = src[k] === 1 ? 1 : src[k] === 0 ? 0 : old; });
    return { tv: !!d.tv, lamps: lm,
      fishDay: typeof d.fishDay === "string" ? d.fishDay : "", fish: Math.max(0, parseInt(d.fish, 10) || 0),
      toy: Math.max(0, parseInt(d.toy, 10) || 0),
      cnt: d.cnt && typeof d.cnt === "object" ? d.cnt : {} };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  function has(id) { return (S.placed || []).indexOf(id) >= 0; }
  function bump(k) {
    D.cnt[k] = (parseInt(D.cnt[k], 10) || 0) + 1; save();
    var P = window.BooboPlus;
    if (P) { P.checkAch(); P.refresh(); }
  }

  /* ===== 玩具像素图 ===== */
  var TPAL = { o:"#5a3d2b", r:"#e2788c", R:"#c25f72", b:"#8fc0e0", B:"#cfe9f5", N:"#5f93bb",
    k:"#3a3a48", K:"#8a8a99", s:"#ffffff", y:"#f3cf5f", Y:"#d2a23c", g:"#9ad07a", G:"#6fae5c" };
  function gridOf(W, H, f) {
    var g = [];
    for (var y = 0; y < H; y++) { var row = ""; for (var x = 0; x < W; x++) row += f(x, y) || "."; g.push(row); }
    return g;
  }
  function cube(x, y, cx, cy, c, d) {
    if (x < cx || x > cx + 6 || y < cy || y > cy + 6) return "";
    var ix = x - cx, iy = y - cy;
    if (ix === 0 || ix === 6 || iy === 0 || iy === 6) return "o";
    if (ix === 5 || iy === 5) return d;
    if (ix >= 2 && ix <= 3 && iy >= 2 && iy <= 3) return "s";
    return c;
  }
  var TOY_ART = {
    car: ["....oooooooo....", "...oBBboBBbo....", "..oBBbboBBbbo...", ".oorrrrrrrrrrroo",
          "oyrrrrsrrrrrrrro", "orrrrrorrrrrrrro", "oRRRRRRRRRRRRRRo", ".oookKoooookKoo.",
          "...okKko..okKko.", "....ooo....ooo.."],
    ball: gridOf(12, 12, function (x, y) {
      var dx = x - 5.5, dy = y - 5.5, r = Math.sqrt(dx * dx + dy * dy);
      if (r > 5.9) return ".";
      if (r > 4.9) return "o";
      if ((x === 3 && y === 3) || (x === 4 && y === 3) || (x === 3 && y === 4)) return "s";
      return x < 4 ? "r" : x < 8 ? "y" : "b";
    }),
    block: gridOf(15, 13, function (x, y) {
      return cube(x, y, 0, 6, "y", "Y") || cube(x, y, 8, 6, "g", "G") || cube(x, y, 4, 0, "b", "N") || ".";
    })
  };
  function toSvg(g) {
    var w = 0, out = "";
    g.forEach(function (r) { w = Math.max(w, r.length); });
    g.forEach(function (row, y) {
      for (var x = 0; x < row.length;) {
        var ch = row.charAt(x), n = 1;
        while (row.charAt(x + n) === ch) n++;
        if (TPAL[ch]) out += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + TPAL[ch] + '"/>';
        x += n;
      }
    });
    return '<svg viewBox="0 0 ' + w + ' ' + g.length + '" shape-rendering="crispEdges" aria-hidden="true">' + out + '</svg>';
  }

  /* ===== 啵啵的姿势：站 / 坐沙发 / 看电视 / 玩玩具 / 看鱼缸 ===== */
  function later(m, ms) { clearTimeout(backTimer); backTimer = setTimeout(function () { if (mode === m) stand(); }, ms); }
  function setMode(m, toy) {
    var e = st();
    if (!e) return;
    mode = m; toyId = toy || "";
    ["sit", "watch", "play", "look", "read", "roll", "lie", "swing"].forEach(function (c) {
      e.classList.toggle("pet-" + c, m === c);
    });
    var pc = $id("petCharacter"), box = $id("petToy");
    if (m === "play" && pc) {
      if (!box) { pc.insertAdjacentHTML("beforeend", '<span class="pet-toy" id="petToy"></span>'); box = $id("petToy"); }
      box.className = "pet-toy toy-" + toyId;
      box.innerHTML = toSvg(TOY_ART[toyId] || TOY_ART.ball);
      box.hidden = false;
    } else if (box) box.hidden = true;
    var bk = $id("petBook");
    if (m === "read" && pc) {
      if (!bk) { pc.insertAdjacentHTML("beforeend", '<span class="pet-book" id="petBook">' + BOOK + '</span>'); bk = $id("petBook"); }
      bk.hidden = false;
    } else if (bk) bk.hidden = true;
    var at = m === "watch" ? "tv" : m === "sit" ? "sofa" : m === "look" ? "tank" : "";
    if (at && R().spotOf) {
      var sp = R().spotOf(at);
      if (sp) {
        e.style.setProperty("--pet-x", (at === "tv" ? sp.x - 14 : at === "tank" ? sp.x - 26 : sp.x + 4) + "%");
        e.style.setProperty("--pet-b", (at === "sofa" ? sp.b + Math.round(sp.h * 0.5) - 34 : 16) + "px");
      }
    }
    clearInterval(sofaTimer); sofaTimer = 0;
    if (m === "sit") sofaTimer = setInterval(function () {
      if (mode !== "sit" || S.sleeping) return;
      if (S.energy < 100) { S.energy = clamp(S.energy + 1); API.save(); API.render(); }
    }, 20000);
  }
  function stand(why) {
    if (!mode) return;
    setMode("");
    if (why) API.say(why);
  }

  function tvOn(on) {
    D.tv = !!on; save();
    var e = st();
    if (e) e.classList.toggle("tv-on", D.tv);
    clearInterval(tvTimer); tvTimer = 0;
    if (D.tv) tvTimer = setInterval(function () {
      if (!D.tv || S.sleeping) return;
      if (mode === "watch" && S.mood < 100) { S.mood = clamp(S.mood + 1); API.save(); API.render(); }
    }, 8000);
  }
  /* 每盏灯各自一个开关：null 跟随昼夜，1 强制亮，0 强制灭 */
  function lampOf(id) { var v = D.lamps ? D.lamps[id] : null; return v === 1 ? 1 : v === 0 ? 0 : null; }
  function paintLamps() {
    var e = st();
    if (!e) return;
    var any = false;
    LAMPS.forEach(function (id) {
      var v = lampOf(id);
      e.classList.toggle("lamp-" + id + "-on", v === 1);
      e.classList.toggle("lamp-" + id + "-off", v === 0);
      if (v === 1) any = true;
    });
    e.classList.toggle("lamp-any-on", any);
  }
  /* 哄睡时把手动开关清掉，让灯回到"跟随昼夜"，夜里自动当夜灯 */
  function lampAuto() {
    if (!D.lamps) D.lamps = {};
    LAMPS.forEach(function (k) { D.lamps[k] = null; });
    save(); paintLamps();
  }
  function lampOn(id, v) {
    if (!D.lamps) D.lamps = {};
    D.lamps[id] = v === 1 ? 1 : 0;
    save(); paintLamps();
  }
  function flip(id, onTxt, offTxt) {
    var next = lampOf(id) === 1 ? 0 : 1;
    lampOn(id, next);
    API.say(next === 1 ? onTxt : offTxt);
  }

  var USE = {
    bed: function () {
      var b = $id("sleepBtn");
      if (!b) return;
      if (!S.sleeping) { API.say("啵啵爬上床，把被子拉到下巴，眼睛一点点闭上了。"); bump("bed"); }
      b.click();
    },
    shelf: function () {
      if (mode === "read") { stand("啵啵把书合上，踮着脚放回书架。"); return; }
      setMode("read"); bump("book");
      S.mood = clamp(S.mood + 6); S.bond = clamp(S.bond + 1);
      API.say("啵啵抽出一本画册，坐下来一页一页慢慢翻。");
      API.pose("love"); API.spawnFx("\u2726", 2);
      API.save(); API.render();
      later("read", 16000);
    },
    table: function () {
      S.mood = clamp(S.mood + 3);
      var flower = (S.placed || []).indexOf("flower") >= 0;
      API.say(flower ? "啵啵扶正床头柜上的小花，凑过去闻了闻。" : "啵啵把床头柜擦干净，认真整理好这个小角落。");
      API.pose("happy"); API.save(); API.render();
    },
    tree: function () {
      S.mood = clamp(S.mood + 4);
      API.say(["啵啵摸摸盆栽的叶子，又把土轻轻压平。",
        "啵啵凑近闻了闻，叶尖上还挂着一颗水珠。",
        "啵啵躲到盆栽后面，只露出两根小触角。"][Math.floor(Math.random() * 3)]);
      API.pose("happy"); API.save(); API.render();
    },
    pillow: function () {
      S.mood = clamp(S.mood + 5); S.bond = clamp(S.bond + 2);
      API.say("啵啵把整张脸埋进抱枕里，闷闷地「啵」了一声。");
      API.pose("love"); API.spawnFx("\u2665", 2);
      API.save(); API.render();
    },
    tv: function () {
      if (D.tv) { tvOn(false); stand(); API.say("把电视关掉，啵啵揉揉眼睛站起来。"); return; }
      tvOn(true); setMode("watch"); bump("tv");
      API.say("电视开啦！啵啵坐到电视前，看得入迷。心情会慢慢变好。");
      API.pose("happy");
    },
    floorlamp: function () { flip("floorlamp", "落地灯打开，暖黄的光铺了一地。", "落地灯关了，客厅安静下来。"); },
    lamp: function () { flip("lamp", "星星吊灯亮起来，小窝一下子暖暖的。", "把星星吊灯关好啦。"); },
    sofa: function () {
      if (mode === "sit") { stand("啵啵从沙发上滑下来，蹦了两下。"); return; }
      setMode("sit"); bump("sofa");
      API.say("啵啵爬上沙发，陷进软垫里，体力在慢慢恢复。");
      API.pose("love");
    },
    toybox: function () {
      if (S.energy < 10) { API.say("啵啵没力气玩啦，先休息一下吧。"); API.setFace("sleepy"); return; }
      var t = TOYS[D.toy % TOYS.length];
      D.toy = (D.toy + 1) % TOYS.length; save();
      S.mood = clamp(S.mood + 8); S.energy = clamp(S.energy - 5); S.bond = clamp(S.bond + 1);
      setMode("play", t[0]); bump("toy");
      API.say("从玩具箱里翻出" + t[1] + "！啵啵玩得起劲。");
      API.pose("bounce"); API.spawnFx("\u2726", 3);
      API.save(); API.render();
      API.emit("action", { action: "play", via: "toybox" });
      later("play", 9000);
    },
    tank: function () {
      if (D.fishDay !== today()) { D.fishDay = today(); D.fish = 0; }
      if (D.fish >= 3) { API.say("小鱼今天已经吃饱了，明天再喂吧。"); return; }
      D.fish++; save(); bump("fish");
      var e = st();
      if (e) {
        e.classList.remove("fish-feed"); void e.offsetWidth; e.classList.add("fish-feed");
        setTimeout(function () { e.classList.remove("fish-feed"); }, 3200);
      }
      S.mood = clamp(S.mood + 5); S.bond = clamp(S.bond + 1);
      setMode("look");
      API.say("撒下一点鱼食，两条小鱼争着游过来。啵啵趴在缸边看得出神。（今天还能喂 " + (3 - D.fish) + " 次）");
      API.pose("happy"); API.spawnFx("\u2726", 2);
      API.save(); API.render();
      later("look", 8000);
    },
    board: function () {
      var P = window.BooboPlus && window.BooboPlus.get();
      if (!P) { API.say("小黑板上还什么都没写。"); return; }
      var done = 0, txt = window.BooboPlus.TASKS.map(function (t) {
        var c = Math.min(parseInt(P.tasks[t.id], 10) || 0, t.need);
        if (c >= t.need) done++;
        return t.name + " " + c + "/" + t.need;
      }).join("　");
      API.say("小黑板上写着：" + txt + "　（完成 " + done + "/" + window.BooboPlus.TASKS.length + "）");
    },
    clock: function () {
      var d = new Date(), h = d.getHours(), m = d.getMinutes();
      var tip = h < 5 ? "夜还长，再睡会儿吧。" : h < 7 ? "清晨啦，慢慢醒一醒。" : h < 9 ? "早上好，今天也要好好吃饭。"
        : h < 12 ? "上午过得真快。" : h < 14 ? "到午饭时间啦。"
        : h < 18 ? "下午适合玩一会儿。" : h < 19 ? "傍晚啦，该放松一下。" : h < 21 ? "晚上好，放松一会儿吧。" : "快到睡觉时间啦。";
      API.say("咕咕——现在是 " + h + " 点 " + (m < 10 ? "0" : "") + m + " 分。" + tip);
      API.pose("bounce");
    }
  };

  function tap(id) {
    if (busy || !USE[id]) return;
    busy = 1;
    idleAt = Date.now();
    /* 灯和钟睡着也能动，省得为了关灯把它叫醒 */
    if (S.sleeping && !WAKEFREE[id]) { API.say("啵啵睡着啦，先把它叫醒吧。"); busy = 0; return; }
    try { USE[id](); } catch (e) {}
    setTimeout(function () { busy = 0; }, 260);
  }

  function idle() {
    if (S.sleeping || mode || Date.now() - idleAt < 45000) return;
    if (!$id("gameOverlay") || !$id("gameOverlay").hidden) return;
    if (R().scene() !== "living") return;
    var pick = [];
    if (has("sofa")) pick.push("sit");
    if (has("tank")) pick.push("look");
    if (D.tv && has("tv")) pick.push("watch");
    if (!pick.length || Math.random() > 0.5) return;
    var m = pick[Math.floor(Math.random() * pick.length)];
    setMode(m);
    API.say(m === "sit" ? "啵啵自己爬上沙发，舒服地窝着。"
      : m === "look" ? "啵啵趴在鱼缸边，看小鱼游来游去。" : "啵啵搬了个位置，继续看电视。");
    later(m, 25000);
  }

  function boot() {
    API = window.BooboAPI;
    S = API.state;
    D = load();
    /* 坐姿用的小脚：向前伸，搭在坐垫边上，平时隐藏 */
    var g = document.querySelector("#petCharacter .pet-svg > g");
    if (g && !g.querySelector(".sit-legs")) g.insertAdjacentHTML("beforeend",
      '<g class="sit-legs">' +
      '<rect x="42" y="106" width="30" height="16" fill="#527a60"/><rect x="46" y="106" width="22" height="12" fill="#a2d9a9"/>' +
      '<rect x="50" y="109" width="6" height="3" fill="#b8e8b7"/>' +
      '<rect x="88" y="106" width="30" height="16" fill="#527a60"/><rect x="92" y="106" width="22" height="12" fill="#a2d9a9"/>' +
      '<rect x="96" y="109" width="6" height="3" fill="#b8e8b7"/></g>');
    tvOn(D.tv);
    paintLamps();
    document.addEventListener("click", function (ev) {
      var f = ev.target.closest && ev.target.closest(".rm-fur.tappable");
      if (!f) return;
      f.classList.remove("tap-pop", "is-new"); void f.offsetWidth; f.classList.add("tap-pop");
      setTimeout(function () { f.classList.remove("tap-pop"); }, 320);
      var m = /rm-([a-z]+)/.exec(f.className.replace("rm-fur", ""));
      if (m) tap(m[1]);
    });
    var pb = $id("petButton");
    if (pb) pb.addEventListener("click", function () { idleAt = Date.now(); if (mode) stand(); }, true);
    document.addEventListener("boobo:scene", function () { stand(); });
    API.on("action", function (ev) {
      idleAt = Date.now();
      var d = ev.detail || {};
      if ((d.action === "sleep" || d.action === "feed") && mode) stand();
      if (d.action === "sleep" && d.sleeping) lampAuto();
    });
    document.addEventListener("pointerdown", function () { idleAt = Date.now(); }, true);
    setInterval(idle, 10000);
  }

  window.BooboAct = { tap: tap, state: function () { return D; }, stand: stand, mode: function () { return mode; },
    add: function (id, fn) { if (id && typeof fn === "function") USE[id] = fn; },
    lamp: function (id, v) { lampOn(id, v); }, lampOf: lampOf, flip: flip };

  var tries = 0;
  (function wait() {
    if (window.BooboAPI && window.BooboRoom) { boot(); return; }
    if (tries++ > 60) return;
    setTimeout(wait, 60);
  })();
})();
