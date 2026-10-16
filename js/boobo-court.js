/* boobo-court.js : 小院互动（秋千 / 喂鸟）+ 拍球小游戏
   存档 key: boobo_court_v1  swing 荡秋千次数 / lie 躺吊床次数 / ball 最长连击 / waterDay+water 每日浇水 */
(function () {
  "use strict";
  if (window.__booboCourt) return;
  window.__booboCourt = 1;

  var KEY = "boobo_court_v1";
  /* 坐垫高度比例和下落补偿：和沙发那套一个算法，啵啵底边 = 坐面高度 - drop */
  /* el 量哪一件、f 坐面占它高度的比例、drop 啵啵下沉多少像素。数字是按像素格反推的 */
  var POSE = { swing: { el: "swseat", c: "swing", f: 1, drop: 34 } };
  /* 拍球场上的两个小头像，重新画的 */
  var AV_B = '<svg viewBox="0 0 18 18" shape-rendering="crispEdges" aria-hidden="true">' +
    '<rect x="5" y="0" width="1" height="3" fill="#527a60"/><rect x="12" y="0" width="1" height="3" fill="#527a60"/>' +
    '<rect x="5" y="0" width="1" height="1" fill="#a8ddb0"/><rect x="12" y="0" width="1" height="1" fill="#a8ddb0"/>' +
    '<rect x="5" y="3" width="8" height="1" fill="#527a60"/><rect x="3" y="4" width="12" height="1" fill="#527a60"/>' +
    '<rect x="2" y="5" width="14" height="8" fill="#527a60"/>' +
    '<rect x="0" y="5" width="2" height="4" fill="#527a60"/><rect x="16" y="5" width="2" height="4" fill="#527a60"/>' +
    '<rect x="4" y="13" width="4" height="2" fill="#527a60"/><rect x="10" y="13" width="4" height="2" fill="#527a60"/>' +
    '<rect x="5" y="4" width="8" height="1" fill="#b8e8b7"/><rect x="3" y="5" width="12" height="1" fill="#b8e8b7"/>' +
    '<rect x="3" y="6" width="12" height="6" fill="#a2d9a9"/><rect x="4" y="12" width="10" height="1" fill="#a2d9a9"/>' +
    '<rect x="0" y="6" width="1" height="2" fill="#a2d9a9"/><rect x="17" y="6" width="1" height="2" fill="#a2d9a9"/>' +
    '<rect x="6" y="7" width="2" height="2" fill="#365b4b"/><rect x="10" y="7" width="2" height="2" fill="#365b4b"/>' +
    '<rect x="6" y="7" width="1" height="1" fill="#fff"/><rect x="10" y="7" width="1" height="1" fill="#fff"/>' +
    '<rect x="4" y="9" width="2" height="1" fill="#edacb6"/><rect x="12" y="9" width="2" height="1" fill="#edacb6"/>' +
    '<rect x="8" y="11" width="2" height="1" fill="#365b4b"/>' +
    '<rect x="7" y="10" width="1" height="1" fill="#365b4b"/><rect x="10" y="10" width="1" height="1" fill="#365b4b"/>' +
    '<rect x="4" y="16" width="10" height="1" fill="#0000001f"/></svg>';
  var AV_P = window.BooboPolish.player;
  var ZL = 68, ZR = 92, CL = 76.5, CR = 83.5;
  var API, S, D, mode = "", backT = 0, gainT = 0, G = null, timer = 0, touched = Date.now();

  function $id(x) { return document.getElementById(x); }
  function stg() { return $id("petStage"); }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(Number(v) || 0))); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function has(id) { return (S.placed || []).indexOf(id) >= 0; }
  function lv() { var p = window.BooboPlus && window.BooboPlus.get(); return p ? p.lv : 1; }
  function plus() { var P = window.BooboPlus; if (P) { P.checkAch(); P.refresh(); } }
  function load() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
    return { swing: Math.max(0, parseInt(d.swing, 10) || 0),
      lie: Math.max(0, parseInt(d.lie, 10) || 0),
      ball: Math.max(0, parseInt(d.ball, 10) || 0),
      waterDay: typeof d.waterDay === "string" ? d.waterDay : "",
      water: Math.max(0, parseInt(d.water, 10) || 0),
      seedDay: typeof d.seedDay === "string" ? d.seedDay : "",
      seed: Math.max(0, parseInt(d.seed, 10) || 0) };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }

  /* ===== 坐秋千 ===== */
  function down(why) {
    clearTimeout(backT); backT = 0;
    clearInterval(gainT); gainT = 0;
    /* 没在院子里坐着就什么都不做。以前无条件清 pet-sit，把厨房刚坐下的餐椅也一起清掉了 */
    if (!mode) return;
    var e = stg();
    if (e) { window.BooboPolish.ungroup(e); e.classList.remove("pet-sit", "pet-swing", "pet-lie"); }
    mode = "";
    window.BooboPolish.stopSwing();
    if (why) API.say(why);
  }
  function seat(id, ms) {
    var e = stg(), R = window.BooboRoom, p = POSE[id];
    if (!e || !R || !R.spotOf || !p) return false;
    var sp = R.spotOf(p.el || id);
    if (!sp) return false;
    e.classList.remove("pet-sit", "pet-swing", "pet-lie");
    e.style.setProperty("--pet-x", sp.x + "%");
    e.style.setProperty("--pet-b", Math.max(2, Math.round(sp.b + sp.h * p.f - p.drop)) + "px");
    if (p.c === "lie") e.classList.add("pet-lie");
    else { e.classList.add("pet-sit"); if (p.c === "swing") e.classList.add("pet-swing"); }
    window.BooboPolish.group(e);
    mode = id;
    clearTimeout(backT);
    backT = setTimeout(function () { down(); }, ms || 14000);
    return true;
  }
  /* 待着不动时慢慢加数值 */
  function drip(key, n, every) {
    clearInterval(gainT);
    gainT = setInterval(function () {
      if (mode !== key || S.sleeping) { clearInterval(gainT); gainT = 0; return; }
      if (S[n] < 100) { S[n] = clamp(S[n] + 1); API.save(); API.render(); }
    }, every);
  }

  var USE = {
    swing: function () {
      if (mode === "swing") { down("啵啵从秋千上跳下来，稳稳落地。"); return; }
      if (S.energy < 8) { API.say("啵啵没力气蹬腿了，先歇一会儿吧。"); API.setFace("sleepy"); return; }
      if (!seat("swing", 30000)) { API.say("秋千好像还没摆稳……"); return; }
      D.swing++; save();
      S.mood = clamp(S.mood + 8); S.energy = clamp(S.energy - 3); S.bond = clamp(S.bond + 1);
      drip("swing", "mood", 15000);
      API.say("啵啵坐上秋千，小腿一蹬就晃起来了，笑得眼睛都弯了。");
      API.pose("happy"); API.spawnFx("\u2665", 3);
      API.save(); API.render(); plus();
    },
    feeder: function () {
      if (D.seedDay !== today()) { D.seedDay = today(); D.seed = 0; save(); }
      if (D.seed >= 3) { API.say("谷子撒完啦，小鸟明天还会来的。"); return; }
      if(stg()&&stg().classList.contains("bird-come")){API.say("等这只小鸟吃完，再撒下一把谷子吧。");return;}
      D.seed++; save();
      var e = stg();
      if (e) {
        e.classList.remove("bird-come"); void e.offsetWidth; e.classList.add("bird-come");
        setTimeout(function () { e.classList.remove("bird-come"); }, 6000);
      }
      S.mood = clamp(S.mood + 5); S.bond = clamp(S.bond + 1);
      API.say("啵啵抓了一把谷子撒在托盘里，一只小鸟很快就落下来啄着吃。（今天还能撒 " + (3 - D.seed) + " 次）");
      API.pose("happy"); API.spawnFx("\u2726", 2);
      API.save(); API.render(); plus();
    }
  };
  USE.swseat = USE.swing;
  USE.swrope = USE.swing;


  /* ===== 拍球：球在你和啵啵之间来回，进黄区就按，正中绿心得 2 分 ===== */
  var roundDelay = 0;
  function stop() { if (timer) clearInterval(timer); clearTimeout(roundDelay); roundDelay = 0; timer = 0; G = null; }
  function panel(html, title) {
    var ov = $id("gameOverlay");
    if (!ov) return;
    ov.hidden = false;
    ov.classList.add("show");
    var h = ov.querySelector(".modal-head strong");
    if (h) h.textContent = title || "和啵啵拍球";
    var box = $id("gameContent");
    if (box) box.innerHTML = html;
  }
  function closePanel() { var b = $id("closeGame"); stop(); if (b) b.click(); }
  function pips() {
    var box = $id("balPips");
    if (!box || !G) return;
    var h = "";
    for (var i = 0; i < 3; i++) h += '<i class="' + (i < G.miss ? "miss" : "") + '"></i>';
    box.innerHTML = h;
    var ln = $id("balInfo");
    if (ln) ln.innerHTML = "连击 <b>" + G.rally + "</b> 下　得分 <b>" + G.score + "</b>" +
      '<span>最佳 ' + D.ball + " 下</span>";
  }
  function openBall() {
    stop();
    if (lv() < 27) { API.say("小院还没解锁，Lv27 之后才能在院子里拍球。"); return; }
    if (S.sleeping) { API.say("啵啵睡着啦，等它醒了再玩。"); return; }
    if (S.energy < 12) { API.say("啵啵的体力只剩 " + S.energy + "%，先让它歇歇。"); API.setFace("sleepy"); return; }
    if (S.hunger < 12) { API.say("啵啵饿得没力气跑，先喂点东西吧。"); API.setFace("hungry"); return; }
    S.energy = clamp(S.energy - 5); S.hunger = clamp(S.hunger - 3);
    API.save(); API.render();
    G = { pos: 0, dir: 1, sp: 1.7, rally: 0, score: 0, miss: 0, wait: 0 };
    panel('<div class="bal-wrap">' +
      '<p class="bal-line" id="balInfo"></p>' +
      '<div class="bal-court" id="balCourt">' +
      '<i class="bal-zone"></i><i class="bal-core"></i><i class="bal-net"></i>' +
      '<span class="bal-who b" id="balWhoB"><i>' + AV_B + '</i><b>啵啵</b></span>' +
      '<span class="bal-who p" id="balWhoP"><i>' + AV_P + '</i><b>你</b></span>' +
      '<i class="bal-ball" id="balBall" style="left:0%"></i></div>' +
      '<div class="cook-pips" id="balPips"></div>' +
      '<button type="button" class="primary-btn cook-go" id="balGo">接球！</button>' +
      '<p class="bal-tip" id="balTip">球飞进黄色区域就按一下，正中间的绿格子得 2 分。漏三次就结束。</p></div>',
      "和啵啵拍球");
    var go = $id("balGo");
    if (go) go.addEventListener("click", hit);
    pips();
    timer = setInterval(tick, 26);
  }
  function tick() {
    if (!G) { clearInterval(timer); timer = 0; return; }
    var b = $id("balBall");
    if (!b) { stop(); return; }
    if (G.wait) return;
    G.pos += G.dir * G.sp;
    if (G.pos >= 100) { G.pos = 100; b.style.left = "100%"; miss(); return; }
    if (G.pos <= 0) {
      G.pos = 0; G.dir = 1;
      jump("balWhoB");
    }
    b.style.left = G.pos + "%";
  }
  function flash(txt) { var t = $id("balTip"); if (t) t.textContent = txt; }
  function jump(id) {
    var el = $id(id);
    if (!el) return;
    el.classList.remove("go"); void el.offsetWidth; el.classList.add("go");
  }
  function hit() {
    if (!G || G.wait) return;
    if (G.dir !== 1) { flash("球还在飞回去，别急。"); return; }
    if (G.pos < ZL || G.pos > ZR) { flash(G.pos < ZL ? "挥早了，球还没到。" : "挥晚了一点点……"); return; }
    var good = G.pos >= CL && G.pos <= CR;
    G.rally++;
    G.score += good ? 2 : 1;
    G.dir = -1;
    G.sp = Math.min(5, G.sp + 0.13);
    var c = $id("balCourt");
    if (c) { c.classList.remove("hit"); void c.offsetWidth; c.classList.add("hit"); }
    jump("balWhoP");
    flash(good ? "正中球心！啵啵都看呆了。" : "接到啦，继续！");
    pips();
  }
  function miss() {
    G.miss++;
    G.wait = 1;
    var b = $id("balBall");
    if (b) b.classList.add("gone");
    flash(G.miss >= 3 ? "球滚到篱笆外面去了……" : "没接住！还能漏 " + (3 - G.miss) + " 次。");
    pips();
    var session = G;
    roundDelay = setTimeout(function () {
      roundDelay = 0;
      if (!G || G !== session) return;
      if (G.miss >= 3) { finish(); return; }
      G.pos = 0; G.dir = 1; G.wait = 0;
      if (b) { b.classList.remove("gone"); b.style.left = "0%"; }
    }, 900);
  }
  function finish() {
    var rally = G.rally, sc = G.score;
    stop();
    var star = Math.min(16, Math.max(1, Math.ceil(sc / 2)));
    var best = rally > D.ball;
    if (best) { D.ball = rally; save(); }
    S.stars = Math.max(0, Math.floor(Number(S.stars) || 0)) + star;
    S.mood = clamp(S.mood + 6); S.bond = clamp(S.bond + 2);
    S.games = (Number(S.games) || 0) + 1;
    API.save(); API.render();
    API.emit("game", { game: "ball", score: rally, reward: star });
    panel('<div class="game-result">' +
      '<span class="intro-star">' + (rally >= 20 ? "\u2726" : "\u2605") + "</span>" +
      "<h3>" + (rally >= 20 ? "配合得太好啦！" : rally > 0 ? "拍球结束！" : "下次一定能接住！") + "</h3>" +
      "<p>啵啵抱着球跑回来，还想再来一局。</p>" +
      '<span class="rec-badge" id="recBadge" hidden></span>' +
      '<div class="result-score"><div class="result-box"><b>' + rally + "</b><span>最长连击</span></div>" +
      '<div class="result-box"><b>+' + star + ' \u2605</b><span>获得星星</span></div></div>' +
      '<div class="result-buttons"><button type="button" class="primary-btn" id="balAgain">再来一局</button>' +
      '<button type="button" class="secondary-btn" id="balBack">回到小窝</button></div></div>', "拍球结束");
    var a = $id("balAgain"), b = $id("balBack");
    if (a) a.addEventListener("click", openBall);
    if (b) b.addEventListener("click", closePanel);
    plus();
  }

  /* 小游戏屋追加入口 */
  function addEntry() {
    var box = document.querySelector("#gameContent .game-choice-grid");
    if (!box || $id("chooseBall")) return;
    var ok = lv() >= 27;
    box.insertAdjacentHTML("beforeend",
      '<button class="game-choice' + (ok ? "" : " locked") + '" id="chooseBall"' + (ok ? "" : " disabled") +
      '><span class="px-icon" data-icon="ball"></span><b>和啵啵拍球</b><small>' +
      (ok ? "球来回飞 · 接得越多星星越多" : "Lv27 解锁小院后开放") + "</small></button>");
    if (ok) $id("chooseBall").addEventListener("click", openBall);
    if (window.BooboPaintIcons) window.BooboPaintIcons();
  }

  /* 待机：小院里闲着会自己去荡秋千 */
  function idle() {
    if (!API || S.sleeping || mode) return;
    var e = stg(), ov = $id("gameOverlay");
    if (!e || e.dataset.scene !== "yard") return;
    if (ov && !ov.hidden) return;
    if (Date.now() - touched < 45000 || Math.random() > 0.45) return;
    var pick = [];

    if (has("swing")) pick.push("swing");
    if (!pick.length) { API.say("啵啵在院子里转了一圈，闻闻草的味道。"); return; }
    var m = pick[Math.floor(Math.random() * pick.length)];
    if (!seat(m, 26000)) return;
    API.say("啵啵自己爬上秋千，慢慢晃着发呆。");
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
      if (ev.target.closest("#openGame,#playAgain,#noticeBack,#playRpsAgain,#cookAgain")) setTimeout(addEntry, 0);
    });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") stop(); });
    document.addEventListener("boobo:scene", function () { stop(); down(); });
    document.addEventListener("pointerdown", function () { touched = Date.now(); }, true);
    var pb = $id("petButton");
    if (pb) pb.addEventListener("click", function () { if (mode) down(); }, true);
    API.on("action", function (ev) {
      var a = (ev.detail || {}).action;
      if (a === "sleep" || a === "play" || a === "feed") down();
    });
    setInterval(idle, 12000);
  }

  window.BooboCourt = { ball: openBall, state: function () { return D; }, stand: down };
  var tries = 0;
  (function wait() {
    if (window.BooboAPI && window.BooboRoom && window.BooboAct) { boot(); return; }
    if (tries++ > 60) return;
    setTimeout(wait, 60);
  })();
})();
