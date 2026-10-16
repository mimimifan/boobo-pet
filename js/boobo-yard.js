/* boobo-yard.js v24 : 家门口的互动（信箱 / 台阶 / 路灯 / 脚垫 / 门牌）
   存档 key: boobo_yard_v1  mailDay 今天取过信没 / mails 累计收信数 */
(function () {
  "use strict";
  if (window.__booboYard) return;
  window.__booboYard = 1;

  var KEY = "boobo_yard_v1";
  var API, S, D, sitT = 0;

  function $id(x) { return document.getElementById(x); }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(Number(v) || 0))); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function has(id) { return (S.placed || []).indexOf(id) >= 0; }
  function load() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
    return { mailDay: typeof d.mailDay === "string" ? d.mailDay : "",
      mails: Math.max(0, parseInt(d.mails, 10) || 0) };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  function plus() { var P = window.BooboPlus; if (P) { P.checkAch(); P.refresh(); } }

  /* 信箱里每天一封信，内容是随机的小纸条 */
  var NOTES = [
    ["邻居的便条", "「今天的天气很好，要不要一起晒晒太阳？」", 3],
    ["超市传单", "上面画着打折的胡萝卜，啵啵盯着看了很久。", 2],
    ["手写明信片", "背面是一片海，啵啵把它举起来对着光看。", 4],
    ["一枚旧邮票", "边角有点卷，但图案是只小鸟，啵啵很喜欢。", 3],
    ["空信封", "什么都没有。啵啵失望地抖了抖耳朵。", 1],
    ["小小的贺卡", "「祝你每天都有好胃口」，字写得歪歪扭扭。", 4]
  ];

  function hasMail() { return D.mailDay !== today(); }
  function paintFlag() {
    var el = document.querySelector(".rm-mailbox");
    if (el) el.classList.toggle("has-mail", hasMail());
  }
  function sitStep() {
    var st = $id("petStage"), R = window.BooboRoom;
    if (!st || !R || !R.spotOf || st.dataset.scene !== "door") return;
    var sp = R.spotOf("steps");
    if (!sp) return;
    /* 和沙发同一套：啵啵底边 = 踏面高度 - 34，小脚正好落在最上一级上 */
    st.style.setProperty("--pet-x", (sp.x + 1) + "%");
    st.style.setProperty("--pet-b", Math.max(2, Math.round(sp.b + sp.h - 34)) + "px");
    st.classList.add("pet-sit");
    clearTimeout(sitT);
    sitT = setTimeout(getUp, 9000);
  }
  function getUp() {
    clearTimeout(sitT); sitT = 0;
    var st = $id("petStage");
    if (st) st.classList.remove("pet-sit");
  }

  var USE = {
    mailbox: function () {
      if (!hasMail()) {
        API.say("信箱是空的。明天再来看看吧。（已经收到过 " + D.mails + " 封）");
        return;
      }
      D.mailDay = today();
      D.mails++;
      save(); paintFlag();
      var n = NOTES[Math.floor(Math.random() * NOTES.length)];
      S.stars = Math.max(0, Math.floor(Number(S.stars) || 0)) + n[2];
      S.mood = clamp(S.mood + 6);
      S.bond = clamp(S.bond + 1);
      API.say("信箱里有东西！" + n[0] + "：" + n[1] + "　+" + n[2] + "★");
      API.pose("happy"); API.spawnFx("\u2605", 3);
      API.save(); API.render();
      plus();
    },
    steps: function () {
      var st = $id("petStage");
      if (st && st.classList.contains("pet-sit")) { getUp(); API.say("啵啵从台阶上站起来，拍了拍身上的土。"); return; }
      sitStep();
      S.mood = clamp(S.mood + 5);
      S.energy = clamp(S.energy + 3);
      API.say("啵啵坐在台阶上吹吹风，看着门前的小路发呆。");
      API.pose("love");
      API.save(); API.render();
    },
    streetlamp: function () {
      var a = window.BooboAct;
      if (!a || !a.flip) { API.say("灯好像有点接触不良……"); return; }
      a.flip("streetlamp", "壁灯开了，暖黄的光洒在门前的台阶上。", "把门前的壁灯关好啦。");
    },
    doorplate: function () {
      var p = window.BooboPlus && window.BooboPlus.get();
      var t = p && window.BooboPlus.titleOf ? window.BooboPlus.titleOf(p.lv) : "小团子";
      S.bond = clamp(S.bond + 1);
      API.say("门牌上刻着「啵啵的小窝」，下面一行小字写着现在的称号：" + t + "。");
      API.pose("happy");
      API.save(); API.render();
    }
  };

  /* 待机：门口闲着时自己坐台阶，或者去瞄一眼信箱 */
  var touched = Date.now();
  function idle() {
    if (!API || S.sleeping) return;
    var st = $id("petStage"), ov = $id("gameOverlay");
    if (!st || st.dataset.scene !== "door" || st.classList.contains("pet-sit")) return;
    if (ov && !ov.hidden) return;
    if (Date.now() - touched < 45000 || Math.random() > 0.45) return;
    if (hasMail() && has("mailbox")) API.say("啵啵盯着信箱上的小红旗，好像在等什么。");
    else { sitStep(); API.say("啵啵自己坐到台阶上，看着远处的小山。"); }
  }

  function boot() {
    API = window.BooboAPI;
    S = API.state;
    D = load();
    if (window.BooboAct && window.BooboAct.add) {
      Object.keys(USE).forEach(function (id) { window.BooboAct.add(id, USE[id]); });
    }
    document.addEventListener("boobo:scene", function () { getUp(); setTimeout(paintFlag, 60); });
    /* 点大门进屋：有客厅去客厅，没有就回卧室 */
    document.addEventListener("click", function (ev) {
      if (!ev.target || !ev.target.closest || !ev.target.closest(".hs-door")) return;
      var R = window.BooboRoom;
      if (!R || R.scene() !== "door") return;
      var h = document.getElementById("rmDoorHit");
      if (h) {
        h.classList.remove("tap-pop"); void h.offsetWidth; h.classList.add("tap-pop");
        setTimeout(function () { h.classList.remove("tap-pop"); }, 320);
      }
      var p = window.BooboPlus && window.BooboPlus.get();
      API.say("啵啵推开门，蹦蹦跳跳地回屋里去了。");
      API.pose("happy");
      R.setScene(p && p.lv >= 5 ? "living" : "bed");
    });
    document.addEventListener("pointerdown", function () { touched = Date.now(); }, true);
    var pb = $id("petButton");
    if (pb) pb.addEventListener("click", getUp, true);
    API.on("action", function (ev) {
      var a = (ev.detail || {}).action;
      if (a === "sleep" || a === "play") getUp();
    });
    setInterval(idle, 12000);
    setInterval(paintFlag, 3000);
    paintFlag();
  }

  window.BooboYard = { state: function () { return D; }, mail: function () { return hasMail(); } };

  var tries = 0;
  (function wait() {
    if (window.BooboAPI && window.BooboRoom && window.BooboAct) { boot(); return; }
    if (tries++ > 60) return;
    setTimeout(wait, 60);
  })();
})();
