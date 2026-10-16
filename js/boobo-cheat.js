/* boobo-cheat.js : 隐藏调试面板。入口：连点页脚 5 次，或控制台 BooboCheat.open() */
(function () {
  "use strict";
  if (window.BooboCheat) return;

  var FACES = ["neutral", "happy", "eat", "love", "sleepy", "sad", "hungry"];
  var faceAt = 0, pickId = "";
  var STATS = [["hunger", "饱腹"], ["mood", "心情"], ["energy", "体力"], ["bond", "亲密"]];

  function $id(x) { return document.getElementById(x); }
  function A() { return window.BooboAPI || null; }
  function P() { return window.BooboPlus ? window.BooboPlus.get() : null; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayStr(off) {
    var d = new Date();
    d.setDate(d.getDate() + (off || 0));
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function note(t) {
    if (window.BooboPlus) window.BooboPlus.toast(t);
    else if (A()) A().say(t);
  }
  function copy(t) {
    var done = function () { note("布局已复制到剪贴板，粘贴发我就能写进默认值"); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(done, function () { fallbackCopy(t, done); });
        return;
      }
    } catch (e) {}
    fallbackCopy(t, done);
  }
  function fallbackCopy(t, done) {
    var ta = document.createElement("textarea");
    ta.value = t;
    ta.style.cssText = "position:fixed;top:-300px;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    if (ok) done(); else note("复制失败，长按面板顶部深色文字手动复制");
  }
  function refresh() {
    if (A()) { A().save(); A().render(); }
    if (window.BooboPlus) { window.BooboPlus.save(); window.BooboPlus.refresh(); }
    build();
  }

  function diag() {
    var p = P(), mods = [
      ["核心 app.js", !!A()], ["成长 plus", !!window.BooboPlus],
      ["作息 life", !!window.BooboLife], ["家具 room", !!window.BooboRoom],
      ["日历 cal", !!window.BooboCal], ["互动 act", !!window.BooboAct],
      ["厨房 kitchen", !!window.BooboKitchen], ["门口 yard", !!window.BooboYard]
    ];
    var h = mods.map(function (m) {
      return '<span class="' + (m[1] ? "ok" : "no") + '">' + m[0] + (m[1] ? " 已载入" : " 缺失") + '</span>';
    }).join("");
    h += '<span class="' + (window.BooboCal && window.BooboCal.lunarOK ? "ok" : "no") + '">农历' +
      (window.BooboCal && window.BooboCal.lunarOK ? "可用" : "不可用（走兜底表）") + '</span>';
    if (p) h += '<span>Lv.' + p.lv + ' EXP ' + p.exp + ' 连续 ' + p.streak + ' 天 成就 ' +
      p.achs.length + '/' + (window.BooboPlus.ACHS || []).length + '</span>';
    if (A()) h += '<span>星星 ' + A().state.stars + ' 家具 ' + A().items.length +
      ' 已有 ' + (A().state.owned || []).length + '</span>';
    return '<div class="cheat-diag">' + h + '</div>';
  }

  function layoutUI() {
    var R = window.BooboRoom;
    if (!R || !R.placedIds) return '<p class="cheat-tip">家具模块未载入</p>';
    var ids = R.editIds ? R.editIds() : R.placedIds();
    if(ids.indexOf(pickId)<0)pickId="";
    if (!ids.length) return '<p class="cheat-tip">先摆几件家具，再回来调位置</p>';
    var h = '<div class="cheat-pick">' + ids.map(function (id) {
      var it = A().items.filter(function (x) { return x.id === id; })[0];
      return '<button class="' + (pickId === id ? "on" : "") + '" data-cmd="pick:' + id + '">' +
        (it ? it.name : (R.nameOf ? R.nameOf(id) : id)) + '</button>';
    }).join("") + '</div>';
    if (pickId) h += '<div class="cheat-nudge">' +
      '<button data-cmd="nd:x:-2">\u2190 左</button><button data-cmd="nd:x:2">右 \u2192</button>' +
      '<button data-cmd="nd:b:4">\u2191 上</button><button data-cmd="nd:b:-4">\u2193 下</button>' +
      '<button data-cmd="nd:u:0.2">放大</button><button data-cmd="nd:u:-0.2">缩小</button></div>';
    h += '<button data-cmd="lrst">全部复位</button><button data-cmd="lexp">导出布局</button>';
    return h;
  }

  function dayUI() {
    var B = window.BooboDay;
    if (!B) return '<p class="cheat-tip">日历模块未载入</p>';
    var d = B.now(), off = B.off();
    return '<p class="cheat-tip" style="grid-column:1/-1;margin:0">现在按 ' + (d.getMonth() + 1) + "月" + d.getDate() +
      "日 星期" + "日一二三四五六".charAt(d.getDay()) +
      (off ? "（偏移 " + (off > 0 ? "+" : "") + off + " 天）" : "（真实日期）") + "</p>" +
      '<button data-cmd="dd:-1">前一天</button><button data-cmd="dd:1">后一天</button>' +
      '<button data-cmd="dthu">跳到周四</button><button data-cmd="dd:0">回到今天</button>';
  }
  function build() {
    var body = $id("cheatBody");
    if (!body || !A()) return;
    var s = A().state, h = diag();
    h += '<div class="cheat-grid"><h4>状态数值</h4>';
    h += STATS.map(function (k) {
      return '<div class="cheat-stat"><b>' + k[1] + '<i>' + s[k[0]] + '</i></b>' +
        '<button data-cmd="set:' + k[0] + ':0">0</button>' +
        '<button data-cmd="add:' + k[0] + ':-15">-15</button>' +
        '<button data-cmd="add:' + k[0] + ':15">+15</button>' +
        '<button data-cmd="set:' + k[0] + ':100">满</button></div>';
    }).join("");
    h += moreUI();
    h += '<h4>星星与等级</h4>' +
      '<button data-cmd="star:20">星星 +20</button>' +
      '<button data-cmd="star:100">星星 +100</button>' +
      '<button data-cmd="star:0">星星清零</button>' +
      '<button data-cmd="exp:60">经验 +60</button>' +
      '<button data-cmd="exp:600">经验 +600</button>' +
      '<button data-cmd="lvup">升一级</button>' +
      '<button data-cmd="lvmax">直接满级</button>' +
      '<button data-cmd="lv1">等级回到 1</button>' +
      '<h4>家具</h4>' +
      '<button data-cmd="furshop">全部进商店</button>' +
      '<button data-cmd="furown">全部直接拥有</button>' +
      '<button data-cmd="furall">全部摆进房间</button>' +
      '<button data-cmd="furnone">全部收起来</button>' +
      '<h4>时间</h4>' +
      '<button data-cmd="time:3600">快进 1 小时</button>' +
      '<button data-cmd="time:28800">快进 8 小时</button>' +
      '<button data-cmd="time:86400">快进 24 小时</button>' +
      '<button data-cmd="nextday">跳到明天</button>' +
      '<button data-cmd="streak">连续天数 +1</button>' +
      '<h4>任务与成就</h4>' +
      '<button data-cmd="taskall">今日任务全完成</button>' +
      '<button data-cmd="achall">解锁全部成就</button>' +
      '<button data-cmd="achnone">清空成就记录</button>' +
      '<h4>布局编辑</h4>' + layoutUI() +
      '<h4>做饭难度</h4>' +
      '<button data-cmd="ck:0">简单</button>' +
      '<button data-cmd="ck:1">普通</button>' +
      '<button data-cmd="ck:2">困难</button>' +
      '<h4>模拟日期（只影响日历和小店打折）</h4>' + dayUI() +
      '<h4>其他</h4>' +
      '<button data-cmd="sleep">切换睡眠</button>' +
      '<button data-cmd="face">下一个表情</button>' +
      '<button data-cmd="sky">窗外时间切换</button>' +
      '<button class="warn" data-cmd="wipe">清空全部存档</button>' +
      '</div><p class="cheat-tip">调试用，正常玩不需要打开。入口是连点页脚 5 次。</p>';
    body.innerHTML = h;
  }

  function allIds() {
    var ids = A().items.map(function (x) { return x.id; });
    (window.BooboPlus ? window.BooboPlus.EXTRA : []).forEach(function (e) {
      if (ids.indexOf(e.id) < 0) ids.push(e.id);
    });
    return ids;
  }
  function intoShop() {
    if (!window.BooboPlus) return;
    A().addItems(window.BooboPlus.EXTRA.map(function (e) {
      return { id: e.id, name: e.name, icon: e.icon, cost: e.cost, desc: e.desc };
    }));
  }

  function run(cmd) {
    var api = A(), s = api.state, p = P(), a = cmd.split(":");
    if (moreRun(a)) return;
    if (a[0] === "set") { s[a[1]] = api.clamp(Number(a[2])); }
    else if (a[0] === "add") { s[a[1]] = api.clamp(Number(s[a[1]]) + Number(a[2])); }
    else if (a[0] === "star") { s.stars = a[1] === "0" ? 0 : s.stars + Number(a[1]); }
    else if (a[0] === "exp") { if (window.BooboPlus) window.BooboPlus.grantExp(Number(a[1])); }
    else if (a[0] === "lvup") { if (p) window.BooboPlus.grantExp(Math.max(1, window.BooboPlus.needExp(p.lv) - p.exp)); }
    else if (a[0] === "lvmax") {
      if (p) { p.lv = window.BooboPlus.MAX_LV; p.exp = 0; window.BooboPlus.save(); window.BooboPlus.syncUnlocks(); note("已设为满级"); }
    } else if (a[0] === "lv1") { if (p) { p.lv = 1; p.exp = 0; window.BooboPlus.save(); note("等级已归 1，商店家具不会收回"); } }
    else if (a[0] === "furshop") {
      intoShop();var refund=0;s.paid=s.paid||{};
      Array.from(new Set(s.owned||[])).forEach(function(id){
        var it=api.items.filter(function(x){return x.id===id;})[0];
        var price=Object.prototype.hasOwnProperty.call(s.paid,id)?s.paid[id]:(it?(it.base!=null?it.base:it.cost):0);
        refund+=Math.max(0,Math.floor(Number(price)||0));
      });
      s.stars+=refund;s.owned=[];s.placed=[];s.paid={};
      if(window.BooboAct)window.BooboAct.stand();if(window.BooboCourt)window.BooboCourt.stand();
      note("全部家具已回商店，退回 "+refund+" 颗星星");
    }
    else if (a[0] === "furown") {
      intoShop();
      s.paid=s.paid||{};allIds().forEach(function(id){if(s.owned.indexOf(id)<0)s.paid[id]=0;});
      s.owned = allIds();
      note("已拥有 " + s.owned.length + " 件家具");
    } else if (a[0] === "furall") {
      intoShop();
      s.paid=s.paid||{};allIds().forEach(function(id){if(s.owned.indexOf(id)<0)s.paid[id]=0;});
      s.owned = allIds();
      s.placed = s.owned.slice();
      note("全部摆进房间，可能会有点挤");
    } else if (a[0] === "furnone") { s.placed = []; note("家具已全部收起"); }
    else if (a[0] === "time") {
      if (window.BooboLife) { window.BooboLife.advance(Number(a[1])); note("时间快进 " + Math.round(Number(a[1]) / 3600) + " 小时"); }
      else note("作息模块没载入");
    } else if (a[0] === "nextday") {
      if (p) { p.day = dayStr(-1); window.BooboPlus.save(); window.BooboPlus.checkDay(); }
      if (window.BooboLife) window.BooboLife.resetMilk();
    } else if (a[0] === "streak") { if (p) { p.streak++; p.days++; window.BooboPlus.save(); note("连续 " + p.streak + " 天"); } }
    else if (a[0] === "milk") { if (window.BooboLife) { window.BooboLife.resetMilk(); note("牛奶次数已重置"); } }
    else if (a[0] === "taskall") {
      if (window.BooboPlus) window.BooboPlus.TASKS.forEach(function (t) { window.BooboPlus.taskStep(t.id, t.need); });
    } else if (a[0] === "achall") {
      if (p) {
        window.BooboPlus.ACHS.forEach(function (x) {
          if (p.achs.indexOf(x.id) < 0) { p.achs.push(x.id); p.achAt[x.id] = dayStr(0); }
        });
        window.BooboPlus.save(); note("全部成就已解锁（未发星星）");
      }
    } else if (a[0] === "achnone") { if (p) { p.achs = []; p.achAt = {}; window.BooboPlus.save(); note("成就已清空"); } }
    else if (a[0] === "sleep") {
      var b = $id("sleepBtn");
      if (b) b.click();
      return;
    } else if (a[0] === "face") {
      faceAt = (faceAt + 1) % FACES.length;
      api.setFace(FACES[faceAt]);
      api.say("表情预览：" + FACES[faceAt] + "　" + ($id("petExpression") || {}).textContent);
      return;
    } else if (a[0] === "pick") {
      pickId = pickId === a[1] ? "" : a[1]; build(); return;
    } else if (a[0] === "nd") {
      if (pickId && window.BooboRoom) window.BooboRoom.nudge(pickId, a[1], Number(a[2]));
      build(); return;
    } else if (a[0] === "lrst") {
      if (window.BooboRoom) window.BooboRoom.resetLayout();
      note("布局已复位"); build(); return;
    } else if (a[0] === "lexp") {
      var R = window.BooboRoom;
      var t = R ? (R.dumpLayout ? R.dumpLayout() : R.exportLayout()) : "{}";
      var old = $id("layoutOut");
      if (old) old.remove();
      $id("cheatBody").insertAdjacentHTML("afterbegin",
        '<pre class="layout-out" id="layoutOut">' + t.replace(/&/g, "&amp;").replace(/</g, "&lt;") + '</pre>');
      $id("layoutOut").scrollIntoView({ block: "center" });
      copy(t);
      return;
    } else if (a[0] === "dd" || a[0] === "dthu") {
      var BD = window.BooboDay;
      if (BD) {
        if (a[0] === "dthu") { var gap = (4 - BD.now().getDay() + 7) % 7; if (gap) BD.shift(gap); }
        else BD.shift(Number(a[1]));
        note("模拟日期：" + (BD.now().getMonth() + 1) + "月" + BD.now().getDate() + "日");
      }
      build(); return;
    } else if (a[0] === "ck") {
      note(window.BooboKitchen ? "做饭难度：" + window.BooboKitchen.diff(Number(a[1])) : "厨房模块未载入");
      return;
    } else if (a[0] === "sky") {
      note("窗外：" + (window.BooboRoom && window.BooboRoom.cycleTime ? window.BooboRoom.cycleTime() : "模块未载入"));
      return;
    } else if (a[0] === "wipe") {
      window.BooboConfirm.ask('会清空全部进度和本机回退备份。请先导出 JSON 存档。',function(){
      window.__booboStorageReload=true;
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && k.indexOf("boobo_") === 0) localStorage.removeItem(k);
      }
      location.reload();
      },'清空全部存档？');
      return;
    }
    refresh();
  }


  function resetLimit(kind) {
    var defs={snack:['BooboKitchen','snack','snackDay','boobo_kitchen_v1','零食柜'],bird:['BooboCourt','seed','seedDay','boobo_court_v1','喂小鸟'],fish:['BooboAct','fish','fishDay','boobo_act_v1','喂小鱼'],mail:['BooboYard',null,'mailDay','boobo_yard_v1','信箱']};
    if(kind==='milk'){if(window.BooboLife)window.BooboLife.resetMilk();return;}
    if(kind==='all'){Object.keys(defs).forEach(resetLimit);resetLimit('milk');note('全部日常次数已重置');return;}
    var def=defs[kind],mod=def&&window[def[0]],d=mod&&mod.state();if(!d){note('对应模块未载入');return;}
    if(def[1])d[def[1]]=0;d[def[2]]='';localStorage.setItem(def[3],JSON.stringify(d));note(def[4]+'次数已重置');
  }
  function moreUI(){
    return '<h4>日常次数</h4><button data-cmd="limit:snack">重置零食柜</button><button data-cmd="limit:bird">重置喂鸟</button><button data-cmd="limit:fish">重置喂鱼</button><button data-cmd="limit:milk">重置牛奶</button><button data-cmd="limit:mail">重置信箱</button><button data-cmd="limit:all">重置全部日常</button>'+
    '<h4>存菜作弊</h4><button data-cmd="kit:fill">装满存菜</button><button data-cmd="kit:clear">清空存菜</button>'+
    '<h4>花圃</h4><button data-cmd="flower:grow">花田全部催熟</button><button data-cmd="flower:stock">每种花材＋12</button><h4>便捷操作</h4><button data-cmd="healthy">状态全满</button><button data-cmd="hungry">饱腹降到20</button><button data-cmd="taskreset">重置今日任务</button><button data-cmd="layoutyard">恢复小院默认位置</button>';
  }
  function moreRun(a){
    var api=A(),s=api.state,p=P(),k=window.BooboKitchen,d=k&&k.state();
    if(a[0]==='flower'){if(window.BooboFlower)window.BooboFlower.cheat(a[1]);}
    else if(a[0]==='limit')resetLimit(a[1]);
    else if(a[0]==='healthy')STATS.forEach(function(t){s[t[0]]=100;});
    else if(a[0]==='hungry')s.hunger=20;
    else if(a[0]==='taskreset'){if(p){p.tasks={};window.BooboPlus.save();note('今日任务与领取状态已重置');}}
    else if(a[0]==='layoutyard'){['swing','feeder','garden'].forEach(function(id){window.BooboRoom.resetLayout(id);});note('小院已恢复默认布局');}
    else if(a[0]==='kit'){
      if(!d){note('厨房未载入');return true;}
      if(a[1]==='fill'||a[1]==='clear'){
        if(a[1]==='clear'){window.BooboConfirm.ask('清空存菜和待吃的餐点。',function(){d.dishes=[];d.pending=null;localStorage.setItem('boobo_kitchen_v1',JSON.stringify(d));note('存菜已清空');refresh();},'清空存菜？');return true;}
        d.dishes=[];if(a[1]==='clear')d.pending=null;if(a[1]==='fill')for(var i=0;i<k.CAP;i++)d.dishes.push({id:k.RECIPES[i%k.RECIPES.length].id,q:3});
        localStorage.setItem('boobo_kitchen_v1',JSON.stringify(d));note(a[1]==='fill'?'已装满存菜':'存菜已清空');
      }
    }else return false;
    refresh();return true;
  }
  var floatBall=null,drag=null,dragged=false;
  function minimize(){
    if(!floatBall){
      floatBall=document.createElement('button');floatBall.id='cheatFloat';floatBall.type='button';floatBall.setAttribute('aria-label','打开作弊面板');
      var pet=document.querySelector('#petCharacter .pet-svg');floatBall.innerHTML=pet?pet.outerHTML:'<span>啵</span>';floatBall.querySelectorAll('.sit-legs').forEach(function(el){el.remove();});floatBall.querySelectorAll('[id]').forEach(function(el){el.removeAttribute('id');});document.body.appendChild(floatBall);
      floatBall.addEventListener('pointerdown',function(e){dragged=false;drag={x:e.clientX,y:e.clientY,left:floatBall.offsetLeft,top:floatBall.offsetTop};floatBall.setPointerCapture(e.pointerId);});
      floatBall.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)dragged=true;if(!dragged)return;floatBall.style.right='auto';floatBall.style.bottom='auto';floatBall.style.left=Math.max(4,Math.min(innerWidth-58,drag.left+dx))+'px';floatBall.style.top=Math.max(4,Math.min(innerHeight-58,drag.top+dy))+'px';});
      floatBall.addEventListener('pointerup',function(){drag=null;});floatBall.addEventListener('pointercancel',function(){drag=null;});
      floatBall.addEventListener('click',function(){if(!dragged)open();});
    }
    close();floatBall.hidden=false;
  }

  function open() {
    var ov = $id("cheatOverlay");
    if (!ov) {
      document.body.insertAdjacentHTML("beforeend",
        '<div class="overlay" id="cheatOverlay" hidden><div class="game-panel cheat-panel">' +
        '<div class="modal-head"><strong>调试面板</strong>' +
        '<button class="close-btn" id="cheatMin" aria-label="最小化">−</button><button class="close-btn" id="cheatClose" aria-label="关闭">×</button></div>' +
        '<div id="cheatBody"></div></div></div>');
      ov = $id("cheatOverlay");
      $id("cheatClose").addEventListener("click", exit);
      $id("cheatMin").addEventListener("click", minimize);
      ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
      $id("cheatBody").addEventListener("click", function (e) {
        var b = e.target.closest("[data-cmd]");
        if (b) run(b.dataset.cmd);
      });
    }
    if(floatBall)floatBall.hidden=true;
    ov.hidden = false;
    build();
  }
  function close() { var ov=$id("cheatOverlay");if(ov)ov.hidden=true;if(floatBall)floatBall.hidden=false; }
  function exit() { close();if(floatBall)floatBall.hidden=true; }

  function clearSel() { try { var s = window.getSelection && window.getSelection(); if (s && s.removeAllRanges) s.removeAllRanges(); } catch (e) {} }
  var taps = 0, last = 0;
  function boot() {
    var f = document.querySelector("footer");
    if (!f) return;
    f.addEventListener("selectstart", function (e) { e.preventDefault(); });
    f.addEventListener("dblclick", function (e) { e.preventDefault(); clearSel(); });
    f.addEventListener("click", function () {
      clearSel();
      var now = Date.now();
      taps = now - last > 2500 ? 1 : taps + 1;
      last = now;
      if (taps >= 5) { taps = 0; open(); }
      else if (taps >= 3) note("再点 " + (5 - taps) + " 下");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }
  window.BooboCheat = { open: open, close: exit, run: run };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
