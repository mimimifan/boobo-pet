/* boobo-plus.js : 像素图标 / 等级经验 / 每日任务 / 成就 / 家具图鉴
   独立存档 key: boobo_plus_v1（不影响 boobo_pet_v2） */
(function () {
  "use strict";
  if (window.__booboPlusLoaded) return;
  window.__booboPlusLoaded = 1;

  var KEY = "boobo_plus_v1";
  var MAX_LV = 36;
  var API = null, S = null, P = null;

  function r(x, y, w, h, c) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>';
  }
  function wrap(inner) {
    return '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' + inner + '</svg>';
  }
  var SPRITES = {
    tofu:wrap(r(1,5,14,9,'#b49976')+r(2,6,12,6,'#fff3cc')+r(2,6,12,1,'#fffce8')+r(5,8,1,2,'#907758')+r(10,8,1,2,'#907758')+r(7,11,2,1,'#c5977d')),
    flower:wrap(r(7,7,2,8,'#538447')+r(3,11,4,2,'#83b35f')+r(9,9,4,2,'#83b35f')+
      r(6,1,4,3,'#fff0bd')+r(6,7,4,3,'#fff0bd')+r(2,4,4,3,'#fff0bd')+r(10,4,4,3,'#fff0bd')+
      r(5,3,6,5,'#f5cd5d')+r(6,4,4,3,'#c18b3b')),
    cookie: wrap(r(4,2,8,12,"#cf9655") + r(2,4,12,8,"#cf9655") + r(3,3,10,10,"#cf9655") +
      r(5,5,2,2,"#7d4b25") + r(9,4,2,2,"#7d4b25") + r(7,8,2,2,"#7d4b25") +
      r(10,9,2,2,"#7d4b25") + r(4,9,2,2,"#7d4b25")),
    heart: wrap(r(2,3,4,2,"#e4788c") + r(10,3,4,2,"#e4788c") + r(1,5,14,3,"#e4788c") +
      r(2,8,12,2,"#e4788c") + r(4,10,8,2,"#e4788c") + r(6,12,4,2,"#e4788c") + r(3,5,2,1,"#ffd6dd")),
    ball: wrap(r(4,2,8,2,"#e79fae") + r(2,4,12,6,"#e79fae") + r(4,10,8,2,"#e79fae") +
      r(7,12,2,3,"#9c7c5e") + r(4,5,2,2,"#fff2f5") + r(2,8,12,1,"#cf7f90")),
    moon: wrap(r(5,2,6,2,"#f2d98a") + r(3,4,4,2,"#f2d98a") + r(9,4,3,2,"#f2d98a") +
      r(2,6,3,4,"#f2d98a") + r(3,10,4,2,"#f2d98a") + r(9,10,3,2,"#f2d98a") +
      r(5,12,6,2,"#f2d98a") + r(3,6,2,2,"#fff3c6")),
    sun: wrap(r(4,6,8,4,"#f3c24e") + r(5,5,6,6,"#f3c24e") + r(6,4,4,8,"#f3c24e") +
      r(7,1,2,2,"#e7a92f") + r(7,13,2,2,"#e7a92f") + r(1,7,2,2,"#e7a92f") + r(13,7,2,2,"#e7a92f") +
      r(3,3,2,2,"#e7a92f") + r(11,3,2,2,"#e7a92f") + r(3,11,2,2,"#e7a92f") + r(11,11,2,2,"#e7a92f")),
    star: wrap(r(7,1,2,4,"#f0c45b") + r(6,4,4,3,"#f0c45b") + r(1,6,14,2,"#f0c45b") +
      r(3,8,10,2,"#f0c45b") + r(4,10,3,2,"#f0c45b") + r(9,10,3,2,"#f0c45b") +
      r(3,12,2,2,"#d2a23c") + r(11,12,2,2,"#d2a23c")),
    medal: wrap(r(4,1,2,4,"#c98f8f") + r(10,1,2,4,"#c98f8f") + r(5,5,6,2,"#e9b650") +
      r(4,6,8,6,"#e9b650") + r(5,12,6,2,"#e9b650") + r(6,8,4,2,"#fff0bb")),
    lock: wrap(r(5,3,6,2,"#8a9c8c") + r(4,5,2,3,"#8a9c8c") + r(10,5,2,3,"#8a9c8c") +
      r(3,8,10,6,"#a4b3a1") + r(7,10,2,3,"#5d6b5c")),
    mole: wrap(r(4,5,8,2,"#8c6a4c") + r(3,7,10,6,"#8c6a4c") + r(5,13,6,1,"#6e5238") +
      r(5,8,2,2,"#2f2a24") + r(9,8,2,2,"#2f2a24") + r(7,10,2,2,"#d78b8b") +
      r(2,9,1,2,"#6e5238") + r(13,9,1,2,"#6e5238")),
    hand: wrap(r(4,4,8,2,"#e7b18b") + r(3,6,10,6,"#e7b18b") + r(4,12,8,1,"#c98f6a") +
      r(5,6,1,2,"#c98f6a") + r(7,6,1,2,"#c98f6a") + r(9,6,1,2,"#c98f6a")),
    clock: wrap(r(5,2,6,2,"#9fb6a0") + r(3,4,10,8,"#d9e6d6") + r(5,12,6,2,"#9fb6a0") +
      r(2,6,1,4,"#9fb6a0") + r(13,6,1,4,"#9fb6a0") + r(7,5,2,4,"#4d6652") + r(8,8,3,1,"#4d6652"))
  };

  function paintIcons(root) {
    var list = (root || document).querySelectorAll(".px-icon[data-icon]");
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.dataset.painted === "1") continue;
      var art = SPRITES[el.dataset.icon];
      if (!art) continue;
      el.innerHTML = art;
      el.dataset.painted = "1";
    }
  }
  window.BooboPaintIcons = function () { paintIcons(document); };

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function yesterKey() { var d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); }
  function int(v, dflt) { var n = parseInt(v, 10); return isNaN(n) ? (dflt || 0) : n; }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $id(x) { return document.getElementById(x); }

  var TASKS = [
    { id: "feed", name: "喂啵啵吃点心", need: 2, star: 2, exp: 18, hint: "今天喂它 2 次" },
    { id: "care", name: "摸摸头或陪它玩", need: 3, star: 2, exp: 18, hint: "互动 3 次" },
    { id: "game", name: "玩一局小游戏", need: 1, star: 3, exp: 24, hint: "任意小游戏 1 局" },
    { id: "sleep", name: "让啵啵好好休息", need: 1, star: 1, exp: 12, hint: "哄它睡觉 1 次" }
  ];

  var EXTRA = [
    { id: "bed",    name: "软软双人床", icon: "\u25a7", cost: 12, desc: "又大又软，睡觉会更香",   lv: 2 },
    { id: "table",  name: "床头柜",     icon: "\u25a4", cost: 14, desc: "放在床边，摆杯温牛奶",   lv: 3 },
    { id: "window", name: "碎花窗帘",   icon: "\u25a2", cost: 16, desc: "给窗户挂上碎花窗帘",     lv: 4 },
    { id: "sofa",   name: "软绵绵沙发", icon: "\u25ac", cost: 18, desc: "客厅的主角，又大又软",   lv: 5 },
    { id: "rug",    name: "方格地毯",   icon: "\u25a6", cost: 18, desc: "踩上去软软的",           lv: 6 },
    { id: "tv",     name: "复古小电视", icon: "\u25a3", cost: 20, desc: "带电视柜，爱看动画片",   lv: 7 },
    { id: "shelf",  name: "小书架",     icon: "\u25a5", cost: 22, desc: "摆满小本子",             lv: 8 },
    { id: "clock",  name: "咕咕挂钟",   icon: "\u25cb", cost: 22, desc: "跟着真实时间走",         lv: 9 },
    { id: "tree",   name: "小盆栽树",   icon: "\u273e", cost: 24, desc: "房间更有生气",           lv: 10 },
    { id: "tank",   name: "小鱼缸",     icon: "\u25a1", cost: 26, desc: "两条小鱼游来游去",       lv: 11 },
    { id: "board",  name: "小黑板",     icon: "\u25a0", cost: 24, desc: "写着今天要做的事",       lv: 12 },
    { id: "toybox", name: "玩具箱",     icon: "\u25a9", cost: 26, desc: "装满啵啵的宝贝",         lv: 13 },
    { id: "floorlamp", name: "暖光落地灯", icon: "\u2600", cost: 28, desc: "立在沙发旁，夜里暖暖的", lv: 14 },
    { id: "wallshelf", name: "墙上置物架", icon: "\u25ad", cost: 28, desc: "相框、小盆栽和杯子", lv: 16 },
    { id: "artframe", name: "三联小挂画", icon: "\u25f1", cost: 26, desc: "三幅画框挂成一排", lv: 16 },
    { id: "stove",    name: "小灶台",     icon: "\u2668", cost: 32, desc: "开火做饭，锅里咕嘟咕嘟", lv: 17 },
    { id: "dtable",   name: "小餐桌",     icon: "\u25a4", cost: 30, desc: "铺着格子桌布，坐下来吃饭", lv: 18 },
    { id: "fridge",   name: "小冰箱",     icon: "\u25af", cost: 34, desc: "做好的菜先存进来", lv: 19 },
    { id: "cupboard", name: "零食柜",     icon: "\u25a9", cost: 30, desc: "每天都能摸两次零食", lv: 20 },
    { id: "potrack",  name: "挂锅架",     icon: "\u2315", cost: 28, desc: "锅铲汤勺挂成一排", lv: 21 },
    { id: "ceiling",  name: "厨房吸顶灯", icon: "\u25cf", cost: 28, desc: "开火做饭也看得清", lv: 22 },
    { id: "mailbox",    name: "小信箱",     icon: "\u2709", cost: 34, desc: "每天来看看有没有信", lv: 24 },
    { id: "streetlamp", name: "门口壁灯",   icon: "\u2600", cost: 36, desc: "挂在门边，天黑会亮", lv: 25 },
    { id: "doorplate",  name: "小门牌",     icon: "\u25a4", cost: 38, desc: "写着啵啵的名字",     lv: 26 },
    { id: "swing",   name: "木架秋千", icon: "\u2602", cost: 30, desc: "坐上秋千，轻轻摇晃。", lv: 27 },
    { id: "garden",  name: "小院绿化",   icon: "\u273f", cost: 28, desc: "灌木花丛，装点小院。",   lv: 29 },
    { id: "feeder",  name: "小鸟食台", icon: "\u2698", cost: 26, desc: "撒些谷子，等小鸟来。",   lv: 30 },
    {id:"gh_shelf",name:"盆栽花架",icon:"",cost:24,lv:32,desc:"摆上喜欢的小盆栽。"},
    {id:"gh_lights",name:"暖光灯串",icon:"",cost:24,lv:35,desc:"点一下，开关暖灯。"},
    {id:"gh_workbench",name:"育苗工作台",icon:"",cost:22,lv:33,desc:"整理花种和小工具。"},
    {id:"gh_mat",name:"方格地垫",icon:"",cost:18,lv:36,desc:"铺一块柔软的地垫。"}
  ];

  var TITLES = [[1,"小团子"],[3,"黏人小精"],[5,"小窝房东"],[8,"贴心搭子"],[12,"星星收藏家"],
    [15,"收纳小能手"],[16,"小窝掌门"],[20,"厨房大将"],[23,"暖暖小厨"],[24,"门前小主"],[27,"庭院园丁"],[28,"小鸟邻居"],[31,"花环匠人"],
    [36,"永远的家人"]];
  /* 家具互动次数（存在 boobo_act_v1） */
  function AC(k) {
    var a = window.BooboAct && window.BooboAct.state && window.BooboAct.state();
    return a && a.cnt ? (parseInt(a.cnt[k], 10) || 0) : 0;
  }
  function KC(k) {
    var d = null;
    try { d = JSON.parse(localStorage.getItem("boobo_kitchen_v1") || "{}"); } catch (e) {}
    return d ? (parseInt(d[k], 10) || 0) : 0;
  }
  function YC(k) {
    var d = null;
    try { d = JSON.parse(localStorage.getItem("boobo_court_v1") || "{}"); } catch (e) {}
    return d ? (parseInt(d[k], 10) || 0) : 0;
  }
  function FS(){
    if(window.BooboFlower)return window.BooboFlower.state().stats||{};
    try{return JSON.parse(localStorage.getItem('boobo_flower_v1')||'{}').stats||{};}catch(e){return {};}
  }
  function FC(k){return Math.max(0,parseInt(FS()[k],10)||0);}
  function flowerKinds(){return Array.isArray(FS().kinds)?FS().kinds.length:0;}
  var ACHS = [
    { id:"first",   name:"初次见面",   icon:"heart",  star:1,  test:function(){ return P.counts.touch + P.counts.pet >= 1; } },
    { id:"cook",    name:"喂饭能手",   icon:"cookie", star:3,  test:function(){ return P.counts.feed >= 10; } },
    { id:"play10",  name:"最佳玩伴",   icon:"ball",   star:3,  test:function(){ return P.counts.play >= 10; } },
    { id:"night",   name:"晚安仪式",   icon:"moon",   star:2,  test:function(){ return P.counts.sleep >= 5; } },
    { id:"bond50",  name:"心有灵犀",   icon:"heart",  star:5,  test:function(){ return S.bond >= 50; } },
    { id:"bond100", name:"形影不离",   icon:"medal",  star:10, test:function(){ return S.bond >= 100; } },
    { id:"lv5",     name:"稳步成长",   icon:"star",   star:4,  test:function(){ return P.lv >= 5; } },
    { id:"lv10",    name:"资深饲主",   icon:"medal",  star:8,  test:function(){ return P.lv >= 10; } },
    { id:"streak3", name:"三日不断",   icon:"clock",  star:3,  test:function(){ return P.streak >= 3; } },
    { id:"streak7", name:"一周陪伴",   icon:"clock",  star:7,  test:function(){ return P.streak >= 7; } },
    { id:"game10",  name:"游戏达人",   icon:"hand",   star:4,  test:function(){ return P.counts.game >= 10; } },
    { id:"sc30",    name:"神之手速",   icon:"star",   star:5,  test:function(){ return P.best.stars >= 30; } },
    { id:"mole20",  name:"地鼠克星",   icon:"mole",   star:5,  test:function(){ return P.best.mole >= 20; } },
    { id:"deco5",   name:"装饰达人",   icon:"medal",  star:6,  test:function(){ return (S.owned || []).length >= 5; } },
    { id:"tv10",     name:"电视迷",       icon:"star",   star:3,  test:function(){ return AC("tv") >= 10; } },
    { id:"fish15",   name:"小鱼的朋友",   icon:"heart",  star:4,  test:function(){ return AC("fish") >= 15; } },
    { id:"toy10",    name:"玩具收藏家",   icon:"ball",   star:3,  test:function(){ return AC("toy") >= 10; } },
    { id:"sofa10",   name:"沙发土豆",     icon:"moon",   star:3,  test:function(){ return AC("sofa") >= 10; } },
    { id:"feed50",   name:"美食家",       icon:"cookie", star:6,  test:function(){ return P.counts.feed >= 50; } },
    { id:"sleep30",  name:"早睡早起",     icon:"moon",   star:6,  test:function(){ return P.counts.sleep >= 30; } },
    { id:"game50",   name:"游戏大师",     icon:"hand",   star:8,  test:function(){ return P.counts.game >= 50; } },
    { id:"rps5",     name:"猜拳之王",     icon:"hand",   star:5,  test:function(){ return P.best.rps >= 5; } },
    { id:"deco10",   name:"装修大师",     icon:"medal",  star:8,  test:function(){ return (S.owned || []).length >= 10; } },
    { id:"deco15",   name:"小家落成",     icon:"medal",  star:15, test:function(){ return (S.owned || []).length >= 15; } },
    { id:"streak30", name:"一个月的陪伴", icon:"clock",  star:15, test:function(){ return P.streak >= 30; } },
    { id:"lv20",     name:"小家掌门",     icon:"star",   star:10, test:function(){ return P.lv >= 20; } },
    { id:"lv30",     name:"永远在一起",   icon:"medal",  star:20, test:function(){ return P.lv >= 30; } },
    { id:"cook1",    name:"第一次下厨",   icon:"cookie", star:3,  test:function(){ return KC("made") >= 1; } },
    { id:"cook20",   name:"小小厨神",     icon:"medal",  star:8,  test:function(){ return KC("made") >= 20; } },
    { id:"perf5",    name:"完美出锅",     icon:"star",   star:6,  test:function(){ return KC("perfect") >= 5; } },
    { id:"swing10",  name:"晃晃悠悠",     icon:"heart",  star:4,  test:function(){ return YC("swing") >= 10; } },
    { id:"ball20",   name:"默契拍球",     icon:"ball",   star:7,  test:function(){ return P.best.ball >= 20; } },
    { id:"book10",   name:"小书虫",       icon:"star",   star:4,  test:function(){ return AC("book") >= 10; } }
  ];
  ACHS=ACHS.concat([
    {id:'flower1',name:'第一束花',icon:'flower',star:3,test:function(){return FC('harvests')>=1;}},
    {id:'flower20',name:'花圃常客',icon:'flower',star:8,test:function(){return FC('harvests')>=20;}},
    {id:'water10',name:'细心园丁',icon:'heart',star:4,test:function(){return FC('watered')>=10;}},
    {id:'wreath1',name:'为你编花环',icon:'heart',star:5,test:function(){return FC('crafted')>=1;}},
    {id:'wreath5',name:'花环匠人',icon:'medal',star:8,test:function(){return FC('crafted')>=5;}},
    {id:'flowers6',name:'六色花篮',icon:'flower',star:6,test:function(){return flowerKinds()>=6;}},
    {id:'lv36',name:'小窝大圆满',icon:'medal',star:20,test:function(){return P.lv>=36;}}
  ]);

  var ACH_INFO = {
    first:   { req: "第一次摸摸或戳戳啵啵", slogan: "从这一下开始，我们就是朋友啦。", prog: function () { return [P.counts.touch + P.counts.pet, 1]; } },
    cook:    { req: "累计喂食 10 次", slogan: "啵啵的小肚子由你来守护。", prog: function () { return [P.counts.feed, 10]; } },
    play10:  { req: "累计陪它玩 10 次", slogan: "跑跑跳跳的日子最开心。", prog: function () { return [P.counts.play, 10]; } },
    night:   { req: "累计哄睡 5 次", slogan: "晚安，明天见。", prog: function () { return [P.counts.sleep, 5]; } },
    bond50:  { req: "亲密度达到 50%", slogan: "不用说话也知道你在想什么。", prog: function () { return [S.bond, 50]; } },
    bond100: { req: "亲密度达到 100%", slogan: "去哪儿都想跟着你。", prog: function () { return [S.bond, 100]; } },
    lv5:     { req: "成长等级达到 Lv.5", slogan: "一点一点，长成更好的啵啵。", prog: function () { return [P.lv, 5]; } },
    lv10:    { req: "成长等级达到 Lv.10", slogan: "你已经是很可靠的饲主了。", prog: function () { return [P.lv, 10]; } },
    streak3: { req: "连续照顾 3 天", slogan: "第三天，也准时出现了。", prog: function () { return [P.streak, 3]; } },
    streak7: { req: "连续照顾 7 天", slogan: "一整周都有你，真好。", prog: function () { return [P.streak, 7]; } },
    game10:  { req: "累计玩 10 局小游戏", slogan: "玩着玩着，就成了高手。", prog: function () { return [P.counts.game, 10]; } },
    sc30:    { req: "星星收集单局 30 分", slogan: "手比流星还快。", prog: function () { return [P.best.stars, 30]; } },
    mole20:  { req: "打地鼠单局 20 分", slogan: "地鼠们已经开始躲着你了。", prog: function () { return [P.best.mole, 20]; } },
    deco5:   { req: "收藏 5 件家具", slogan: "小窝越来越像家了。", prog: function () { return [(S.owned || []).length, 5]; } },
    tv10:     { req: "打开电视 10 次", slogan: "动画片的主题曲已经会唱了。", prog: function () { return [AC("tv"), 10]; } },
    fish15:   { req: "喂鱼 15 次", slogan: "小鱼一看到你就游过来。", prog: function () { return [AC("fish"), 15]; } },
    toy10:    { req: "从玩具箱翻玩具 10 次", slogan: "每个玩具都有名字了。", prog: function () { return [AC("toy"), 10]; } },
    sofa10:   { req: "请啵啵坐沙发 10 次", slogan: "沙发上有一个啵啵形状的坑。", prog: function () { return [AC("sofa"), 10]; } },
    feed50:   { req: "累计喂食 50 次", slogan: "吃遍了小窝里的每一种点心。", prog: function () { return [P.counts.feed, 50]; } },
    sleep30:  { req: "累计哄睡 30 次", slogan: "睡得香，长得快。", prog: function () { return [P.counts.sleep, 30]; } },
    game50:   { req: "累计玩 50 局小游戏", slogan: "游戏屋的常客。", prog: function () { return [P.counts.game, 50]; } },
    rps5:     { req: "猜拳一场赢满 5 局", slogan: "啵啵决定偷偷练习。", prog: function () { return [P.best.rps, 5]; } },
    deco10:   { req: "收藏 10 件家具", slogan: "每个角落都有心思。", prog: function () { return [(S.owned || []).length, 10]; } },
    deco15:   { req: "收藏 15 件家具", slogan: "小窝的每个角落都越来越热闹。", prog: function () { return [(S.owned || []).length, 15]; } },
    streak30: { req: "连续照顾 30 天", slogan: "一个月，每天都见面。", prog: function () { return [P.streak, 30]; } },
    lv20:     { req: "成长等级达到 Lv.20", slogan: "小家的大小事都交给你了。", prog: function () { return [P.lv, 20]; } },
    lv30:     { req: "成长等级达到 Lv.30", slogan: "以后也要一直在一起。", prog: function () { return [P.lv, 30]; } },
    cook1:    { req: "做出第一道菜", slogan: "厨房里飘出了第一股香味。", prog: function () { return [KC("made"), 1]; } },
    cook20:   { req: "累计做菜 20 道", slogan: "锅铲比触角还听话。", prog: function () { return [KC("made"), 20]; } },
    perf5:    { req: "完美出锅 5 次", slogan: "火候、时间、心意，刚刚好。", prog: function () { return [KC("perfect"), 5]; } },
    swing10:  { req: "荡秋千 10 次", slogan: "风一吹，整个下午就过去了。", prog: function () { return [YC("swing"), 10]; } },
    book10:   { req: "在书架前看书 10 次", slogan: "书里的小人，啵啵都认识了。", prog: function () { return [AC("book"), 10]; } },
    ball20:   { req: "拍球一局连击 20 下", slogan: "一个眼神就知道球要往哪儿去。", prog: function () { return [P.best.ball, 20]; } }
  };

  ACHS=ACHS.concat([
    {id:'tofu10',name:'豆腐小高塔',icon:'tofu',star:4,test:function(){return P.best.tofu>=10;}},
    {id:'tofu25',name:'云端小跳豆',icon:'tofu',star:8,test:function(){return P.best.tofu>=25;}}
  ]);
  Object.assign(ACH_INFO,{
    tofu10:{req:'跳豆腐单局跳上 10 层',slogan:'小小的啵啵，也能跳得很高。',prog:function(){return [P.best.tofu,10];}},
    tofu25:{req:'跳豆腐单局跳上 25 层',slogan:'再往上，就能摸到云啦。',prog:function(){return [P.best.tofu,25];}},
    flower1:{req:'收获第一块成熟花田',slogan:'把第一束花送给啵啵。',prog:function(){return [FC('harvests'),1];}},
    flower20:{req:'累计收获 20 块花田',slogan:'每一次等待，都开出了花。',prog:function(){return [FC('harvests'),20];}},
    water10:{req:'给花田浇水 10 次',slogan:'小水壶记得每一株花。',prog:function(){return [FC('watered'),10];}},
    wreath1:{req:'编好第一只花环',slogan:'戴在头上的是你的心意。',prog:function(){return [FC('crafted'),1];}},
    wreath5:{req:'累计编好 5 只花环',slogan:'今天也要换一只喜欢的。',prog:function(){return [FC('crafted'),5];}},
    flowers6:{req:'收集过全部 6 种花材',slogan:'一篮子花，六种颜色。',prog:function(){return [flowerKinds(),6];}},
    lv36:{req:'成长等级达到 Lv.36',slogan:'六个场景，都有我们的回忆。',prog:function(){return [P.lv,36];}}
  });

  /* 等级越高升一级越久，但不至于卡死：前 20 级平缓，之后逐段加码 */
  function needExp(lv) { return 30 + lv * 7; }
  /* 当前等级能用的最高称号 */
  function titleAt(lv) {
    var t = TITLES[0][1];
    for (var i = 0; i < TITLES.length; i++) if (lv >= TITLES[i][0]) t = TITLES[i][1];
    return t;
  }
  /* 实际显示的称号：自己选过就用选的，否则跟着等级走 */
  function titleOf(lv) {
    var pick = P ? (parseInt(P.pick, 10) || 0) : 0;
    if (pick) {
      for (var i = 0; i < TITLES.length; i++) {
        if (TITLES[i][0] === pick) return lv >= pick ? TITLES[i][1] : titleAt(lv);
      }
    }
    return titleAt(lv);
  }
  function loadPlus() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { d = {}; }
    var c = d.counts || {};
    var b = d.best || {};
    return {
      lv: Math.max(1, Math.min(MAX_LV, int(d.lv, 1))),
      exp: Math.max(0, int(d.exp, 0)),
      day: typeof d.day === "string" ? d.day : "",
      streak: Math.max(0, int(d.streak, 0)),
      days: Math.max(1, int(d.days, 1)),
      dayExp: Math.max(0, int(d.dayExp, 0)),
      tasks: (d.tasks && typeof d.tasks === "object") ? d.tasks : {},
      achs: Array.isArray(d.achs) ? d.achs.filter(function (x) { return typeof x === "string"; }) : [],
      achAt: (d.achAt && typeof d.achAt === "object") ? d.achAt : {},
      best: { stars: int(b.stars, 0), mole: int(b.mole, 0), rps: int(b.rps, 0), cook: int(b.cook, 0), ball: int(b.ball, 0), tofu:int(b.tofu,0) },
      counts: {
        feed: int(c.feed, 0), pet: int(c.pet, 0), play: int(c.play, 0),
        sleep: int(c.sleep, 0), touch: int(c.touch, 0), game: int(c.game, 0), buy: int(c.buy, 0)
      },
      tab: d.tab === "codex" || d.tab === "rec" ? d.tab : "ach",
      pick: int(d.pick,0)>36?36:Math.max(0,int(d.pick,0))
    };
  }
  function savePlus() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }

  function toast(text, gold) {
    var box = $id("pxToastWrap");
    if (!box) { box = document.createElement("div"); box.id = "pxToastWrap"; document.body.appendChild(box); }
    var el = document.createElement("div");
    el.className = "px-toast" + (gold ? " gold" : "");
    el.textContent = text;
    box.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
    while (box.children.length > 3) box.removeChild(box.firstChild);
  }

  function syncUnlocks() {
    var add = [];
    for (var i = 0; i < EXTRA.length; i++) {
      var e = EXTRA[i];
      if ((P.lv >= e.lv || (S.owned || []).indexOf(e.id) >= 0) && !API.items.some(function (it) { return it.id === e.id; })) {
        add.push({ id: e.id, name: e.name, icon: e.icon, cost: e.cost, desc: e.desc });
      }
    }
    if (add.length) {
      API.addItems(add);
      return add;
    }
    return [];
  }

  function grantExp(n) {
    n = Math.max(0, int(n, 0));
    if (!n) return;
    P.exp += n;
    var leveled = 0;
    while (P.lv < MAX_LV && P.exp >= needExp(P.lv)) {
      P.exp -= needExp(P.lv);
      P.lv++;
      leveled++;
      var bonus = 3 + Math.floor(P.lv / 2) + (P.lv % 5 === 0 ? 10 : 0);
      S.stars = Math.max(0, int(S.stars, 0)) + bonus;
      var got = syncUnlocks();
      var flowerReward = P.lv>=31 ? ["小雏菊花种","郁金香花种","向日葵花种","波斯菊花种","三色堇花种","勿忘草花种"][P.lv-31] : "";
      toast("升到 Lv." + P.lv + "（" + titleOf(P.lv) + "）  +" + bonus + "★" +
        (got.length ? "　解锁：" + got[0].name : flowerReward?"　解锁："+flowerReward:""), true);
    }
    if (P.lv >= MAX_LV) P.exp = Math.min(P.exp, needExp(MAX_LV));
    if (leveled) {
      API.say("啵啵升到 Lv." + P.lv + " 啦！它骄傲地转了个圈，现在是「" + titleOf(P.lv) + "」。");
      API.pose("happy"); API.spawnFx("\u2605", 5);
      API.save(); API.render();
      if(window.BooboFlower)window.BooboFlower.render();
    }
    savePlus();
  }

  function checkAch() {
    for (var i = 0; i < ACHS.length; i++) {
      var a = ACHS[i];
      if (P.achs.indexOf(a.id) >= 0) continue;
      var ok = false;
      try { ok = !!a.test(); } catch (e) { ok = false; }
      if (!ok) continue;
      P.achs.push(a.id);
      P.achAt[a.id] = dayKey();
      S.stars = Math.max(0, int(S.stars, 0)) + a.star;
      toast("达成成就「" + a.name + "」  +" + a.star + "★", true);
      API.save();
    }
    savePlus();
  }

  function taskStep(id, n) {
    var t = null;
    for (var i = 0; i < TASKS.length; i++) if (TASKS[i].id === id) t = TASKS[i];
    if (!t) return;
    var cur = int(P.tasks[id], 0);
    if (cur >= t.need) return;
    cur += (n || 1);
    P.tasks[id] = cur;
    if (cur >= t.need) {
      S.stars = Math.max(0, int(S.stars, 0)) + t.star;
      toast("任务完成：" + t.name + "　+" + t.star + "★ +" + t.exp + "EXP", true);
      API.save();
      grantExp(t.exp);
    }
    savePlus();
  }

  function checkDay() {
    var today = dayKey();
    if (P.day === today) return;
    if (P.day) {
      P.streak = (P.day === yesterKey()) ? P.streak + 1 : 1;
      P.days++;
    } else {
      P.streak = Math.max(1, P.streak);
    }
    P.day = today;
    P.tasks = {};
    P.dayExp = 0;
    savePlus();
    toast("新的一天！今日任务已刷新，连续照顾 " + P.streak + " 天。");
  }

  function injectPanels() {
    if (!$id("pxToastWrap")) {
      var tw = document.createElement("div");
      tw.id = "pxToastWrap";
      document.body.appendChild(tw);
    }
    var hero = document.querySelector(".hero");
    if (hero && !$id("growthSection")) {
      hero.insertAdjacentHTML("afterend",
        '<section class="section" id="growthSection">' +
        '<div class="section-heading"><h2>啵啵的成长</h2><p>照顾它就会一起变强</p></div>' +
        '<div class="card px-panel">' +
        '<div class="growth-top">' +
        '<div class="lv-badge"><small>LV</small><b id="gLv">1</b></div>' +
        '<div class="growth-meta">' +
        '<div class="growth-line"><span id="gTitle">小团子</span><span>EXP <b id="gExp">0</b> / <b id="gNeed">50</b></span></div>' +
        '<div class="exp-bar"><div class="exp-fill" id="gExpFill"></div></div>' +
        '<div class="growth-line" style="margin-top:7px"><span>连续照顾 <b id="gStreak">1</b> 天</span><span>累计陪伴 <b id="gDays">1</b> 天</span></div>' +
        '</div></div>' +
        '<div id="titleBox" hidden></div>' +
        '<div class="task-head">今日任务 <span id="gTaskCount">0/4</span></div>' +
        '<div class="task-list" id="gTaskList"></div>' +
        '</div></section>');
    }
    var cal = $id("calendarSection");
    if (cal && !$id("bookSection")) {
      cal.insertAdjacentHTML("beforebegin",
        '<section class="section" id="bookSection">' +
        '<div class="section-heading"><h2>啵啵的小手册</h2><p>成就 · 收藏 · 纪录</p></div>' +
        '<div class="card px-panel">' +
        '<div class="px-tabs" id="gTabs">' +
        '<button class="px-tab" type="button" data-tab="ach">成就</button>' +
        '<button class="px-tab" type="button" data-tab="codex">收藏图鉴</button>' +
        '<button class="px-tab" type="button" data-tab="rec">纪录</button>' +
        '</div><div id="gTabBody"></div></div></section>');
      $id("gTabs").addEventListener("click", function (ev) {
        var btn = ev.target.closest("[data-tab]");
        if (!btn) return;
        P.tab = btn.dataset.tab;
        savePlus();
        renderBook();
      });
    }
  }

  function renderGrowth() {
    if (!$id("gLv")) return;
    var cap = needExp(P.lv);
    $id("gLv").textContent = P.lv;
    var tt = $id("gTitle");
    tt.innerHTML = '<button type="button" class="title-tap" id="gTitleTap">' +
      esc(titleOf(P.lv)) + " \u25be</button>" + (P.lv >= MAX_LV ? " 已满级" : "");
    renderTitles();
    $id("gExp").textContent = P.exp;
    $id("gNeed").textContent = cap;
    $id("gExpFill").style.width = Math.max(0, Math.min(100, Math.round(P.exp / cap * 100))) + "%";
    $id("gStreak").textContent = P.streak;
    $id("gDays").textContent = P.days;

    var done = 0, html = "";
    for (var i = 0; i < TASKS.length; i++) {
      var t = TASKS[i];
      var cur = Math.min(int(P.tasks[t.id], 0), t.need);
      var ok = cur >= t.need;
      if (ok) done++;
      html += '<div class="task-row' + (ok ? " is-done" : "") + '">' +
        '<span class="task-check"></span>' +
        '<span class="task-name">' + esc(t.name) +
        '<small>' + esc(t.hint) + ' · ' + cur + '/' + t.need + '</small></span>' +
        '<span class="task-gain">+' + t.star + '\u2605 +' + t.exp + 'EXP</span></div>';
    }
    $id("gTaskList").innerHTML = html;
    $id("gTaskCount").textContent = done + "/" + TASKS.length;
  }

  function renderBook() {
    var body = $id("gTabBody");
    if (!body) return;
    var tabs = $id("gTabs").querySelectorAll("[data-tab]");
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle("on", tabs[i].dataset.tab === P.tab);

    var html = "";
    if (P.tab === "ach") {
      html = '<div class="ach-grid">';
      for (var a = 0; a < ACHS.length; a++) {
        var it = ACHS[a];
        var got = P.achs.indexOf(it.id) >= 0;
        html += '<button type="button" class="ach-item' + (got ? "" : " locked") + (achSel === it.id ? " on" : "") + '" data-ach="' + it.id + '">' +
          '<span class="px-icon ach-medal" data-icon="' + (got ? it.icon : "lock") + '"></span>' +
          '<b>' + esc(it.name) + '</b></button>';
      }
      html += '</div>' + achDetail() + '<p class="game-tip">已达成 ' + P.achs.length + ' / ' + ACHS.length + ' 个成就</p>';
    } else if (P.tab === "codex") {
      var all = API.items.slice();
      for (var e = 0; e < EXTRA.length; e++) {
        if (!all.some(function (x) { return x.id === EXTRA[e].id; })) all.push(EXTRA[e]);
      }
      html = '<div class="codex-list">';
      for (var c = 0; c < all.length; c++) {
        var item = all[c];
        var lvNeed = 0;
        for (var k = 0; k < EXTRA.length; k++) if (EXTRA[k].id === item.id) lvNeed = EXTRA[k].lv;
        var locked = lvNeed > P.lv;
        var owned = (S.owned || []).indexOf(item.id) >= 0;
        var tag = locked ? "Lv." + lvNeed + " 解锁" : owned ? "已收藏" : item.cost + "\u2605";
        html += '<div class="codex-row' + (locked ? " locked" : "") + '"><span>' +
          (locked ? '<span class="px-icon" data-icon="lock"></span>'
                  : (window.BooboRoom ? window.BooboRoom.icon(item.id) : API.furnitureSvg(API.furnitureKind(item, c)))) + '</span>' +
          '<div><b>' + esc(locked ? "未解锁家具" : item.name) + '</b><small>' +
          esc(locked ? "继续陪啵啵长大就能解锁" : item.desc) + '</small></div>' +
          '<span class="codex-tag">' + esc(tag) + '</span></div>';
      }
      html += '</div><p class="game-tip">已收藏 ' + (S.owned || []).length + ' / ' + all.length + ' 件家具</p>';
      if(window.BooboFlower){
        var flowers=window.BooboFlower.FLOWERS;
        html+='<h3 class="fl-codex-heading">花种图鉴 · 6 种</h3><div class="codex-list">';
        flowers.forEach(function(f){var locked=P.lv<f.lv;
          html+='<div class="codex-row'+(locked?' locked':'')+'"><span class="fl-book-icon">'+window.BooboFlower.icon(f.id)+'</span><div><b>'+esc(f.name)+'</b><small>'+f.time/60+' 分钟成熟 · 一簇收获 3 朵</small></div><span class="codex-tag">'+(locked?'Lv.'+f.lv+' 解锁':'已解锁')+'</span></div>';
        });
        html+='</div><p class="game-tip">升级赠送 4 包对应花种，补种 1★。浇水缩短剩余时间 30%；铲除退回花种。<br>离开或关闭页面后，花仍按实际时间生长，回来即可收获。</p>';
      }

    } else {
      var rows = [
        ["星星收集 最高分", P.best.stars + " 分"],
        ["跳豆腐 最高层数", P.best.tofu + " 层"],
        ["打地鼠 最高分", P.best.mole + " 分"],
        ["猜拳 单场最多胜", P.best.rps + " 胜"],
        ["做菜 最高火候分", P.best.cook + " 分"],
        ["拍球 最长连击", P.best.ball + " 下"],
        ["花田收获", FC('harvests') + " 块"],
        ["花田浇水", FC('watered') + " 次"],
        ["编织花环", FC('crafted') + " 只"],
        ["收集过的花材", flowerKinds() + " / 6 种"],
        ["小游戏总场次", int(S.games, 0) + " 场"],
        ["喂食次数", P.counts.feed + " 次"],
        ["摸摸 / 陪玩次数", (P.counts.pet + P.counts.play + P.counts.touch) + " 次"],
        ["连续照顾天数", P.streak + " 天"],
        ["累计陪伴天数", P.days + " 天"]
      ];
      html = '<div class="codex-list">';
      for (var x = 0; x < rows.length; x++) {
        html += '<div class="codex-row"><span class="px-icon" data-icon="clock"></span>' +
          '<div><b>' + esc(rows[x][0]) + '</b></div>' +
          '<span class="codex-tag">' + esc(rows[x][1]) + '</span></div>';
      }
      html += '</div><p class="game-tip">花田收获、浇水次数从本次更新起记录；已有花环和花材会计入相应收藏。</p>';
    }
    body.innerHTML = html;
    paintIcons(body);
  }

  var achSel = "";
  function achDetail() {
    var a = null;
    for (var i = 0; i < ACHS.length; i++) if (ACHS[i].id === achSel) a = ACHS[i];
    if (!a) return '<div class="ach-detail empty">点一枚徽章，看看它的故事</div>';
    var inf = ACH_INFO[a.id] || {}, got = P.achs.indexOf(a.id) >= 0, pr = [0, 1];
    try { pr = inf.prog(); } catch (e) {}
    var cur = Math.min(pr[0], pr[1]), pct = Math.round(cur / pr[1] * 100);
    var when = got ? (P.achAt[a.id] ? P.achAt[a.id] + " 达成" : "早先达成，日期未知") : "尚未达成";
    return '<div class="ach-detail' + (got ? " got" : "") + '">' +
      '<span class="px-icon ach-big" data-icon="' + (got ? a.icon : "lock") + '"></span>' +
      '<div class="ach-info"><b>' + esc(a.name) + '</b>' +
      '<q>' + esc(got ? inf.slogan : "达成后揭晓这枚徽章的寄语") + '</q>' +
      '<small>条件：' + esc(inf.req || "") + '</small>' +
      '<div class="exp-bar"><div class="exp-fill" style="width:' + pct + '%"></div></div>' +
      '<small>进度 ' + cur + ' / ' + pr[1] + '　奖励 ' + a.star + '\u2605　' + when + '</small></div></div>';
  }

  function renderTitles() {
    var box = $id("titleBox");
    if (!box || box.hidden) return;
    var pick = parseInt(P.pick, 10) || 0;
    var h = '<button type="button" class="title-pick' + (pick ? "" : " on") + '" data-title="0">' +
      "<b>跟着等级走</b><small>当前 " + esc(titleAt(P.lv)) + "</small></button>";
    for (var i = 0; i < TITLES.length; i++) {
      var t = TITLES[i], ok = P.lv >= t[0];
      h += '<button type="button" class="title-pick' + (pick === t[0] ? " on" : "") +
        (ok ? "" : " lock") + '"' + (ok ? ' data-title="' + t[0] + '"' : " disabled") + ">" +
        "<b>" + esc(t[1]) + "</b><small>" + (ok ? "Lv." + t[0] + " 解锁" : "Lv." + t[0] + " 才能用") + "</small></button>";
    }
    box.innerHTML = '<div class="title-list">' + h + "</div>";
  }

  function renderAll() { renderGrowth(); renderBook(); paintIcons(document); }

  function onAction(ev) {
    checkDay();
    var a = (ev.detail || {}).action;
    if (!a) return;
    if (a === "feed")  { P.counts.feed++;  taskStep("feed", 1); }
    if (a === "pet")   { P.counts.pet++;   taskStep("care", 1); }
    if (a === "play")  { P.counts.play++;  taskStep("care", 1); }
    if (a === "touch") { P.counts.touch++; }
    if (a === "sleep" && (ev.detail || {}).sleeping) { P.counts.sleep++; taskStep("sleep", 1); }
    if (P.dayExp < 120) { var g = Math.min(6, 120 - P.dayExp); P.dayExp += g; grantExp(g); }
    savePlus(); checkAch(); renderAll();
  }

  function onGame(ev) {
    checkDay();
    var d = ev.detail || {};
    var score = Math.max(0, int(d.score, 0));
    var bk = d.game === "mole" ? "mole" : d.game === "rps" ? "rps"
      : d.game === "tofu" ? "tofu" : d.game === "cook" ? "cook" : d.game === "ball" ? "ball" : "stars";
    var oldBest = P.best[bk];
    P.best[bk] = Math.max(oldBest, score);
    setTimeout(function () {
      var b = $id("recBadge");
      if (!b) return;
      b.hidden = false;
      if (score > oldBest && score > 0) { b.className = "rec-badge new"; b.textContent = "NEW 新纪录 " + score; }
      else { b.className = "rec-badge"; b.textContent = "最佳纪录 " + P.best[bk]; }
    }, 0);
    P.counts.game++;
    taskStep("game", 1);
    grantExp(12 + Math.min(24, Math.floor(score / 3)));
    savePlus(); checkAch(); renderAll();
  }

  function boot() {
    API = window.BooboAPI;
    if (!API) { return false; }
    S = API.state;
    var retired='gh_hanging';
    if((S.owned||[]).indexOf(retired)>=0){
      var paid=S.paid||{},refund=Object.prototype.hasOwnProperty.call(paid,retired)?Math.max(0,Number(paid[retired])||0):20;
      S.stars+=refund;
    }
    S.owned=(S.owned||[]).filter(function(id){return id!==retired;});
    S.placed=(S.placed||[]).filter(function(id){return id!==retired;});
    if(S.paid)delete S.paid[retired];
    API.save();
    P = loadPlus();
    injectPanels();
    checkDay();
    syncUnlocks();
    API.on("action", onAction);
    API.on("game", onGame);
    API.on("flower",function(){checkAch();renderAll();API.render();});
    API.on("buy", function () { P.counts.buy++; savePlus(); checkAch(); renderAll(); });
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-ach]");
      if (!b) return;
      achSel = achSel === b.dataset.ach ? "" : b.dataset.ach;
      /* 只换详情块，不重绘整个徽章墙，否则会连带折叠按钮一起闪 */
      var box = $id("gTabBody"), had = box && box.querySelector(".ach-detail");
      if (had) {
        had.insertAdjacentHTML("afterend", achDetail());
        had.remove();
        var cells = box.querySelectorAll("[data-ach]");
        for (var i = 0; i < cells.length; i++) {
          cells[i].classList.toggle("on", cells[i].dataset.ach === achSel);
        }
        paintIcons(box);
        return;
      }
      renderBook();
    });
    document.addEventListener("click", function (ev) {
      var tp = ev.target.closest && ev.target.closest("#gTitleTap");
      if (tp) {
        var box = $id("titleBox");
        if (box) { box.hidden = !box.hidden; renderTitles(); }
        return;
      }
      var pk = ev.target.closest && ev.target.closest("[data-title]");
      if (!pk) return;
      P.pick = parseInt(pk.dataset.title, 10) || 0;
      savePlus();
      var box2 = $id("titleBox");
      if (box2) box2.hidden = true;
      renderGrowth();
      toast(P.pick ? "称号换成「" + titleOf(P.lv) + "」啦" : "称号改成跟着等级走");
    });
    checkAch();
    API.render();
    renderAll();
    function refreshDay(){var before=P.day;checkDay();if(P.day!==before){checkAch();renderAll();API.render();}}
    document.addEventListener("visibilitychange",function(){if(!document.hidden)refreshDay();});
    setInterval(refreshDay,60000);
    return true;
  }

  window.BooboPlus = {
    get: function () { return P; },
    grantExp: function (n) { grantExp(n); },
    taskStep: function (id, n) { taskStep(id, n); },
    checkAch: function () { checkAch(); },
    checkDay: function () { checkDay(); },
    syncUnlocks: function () { return syncUnlocks(); },
    save: function () { savePlus(); },
    refresh: function () { renderAll(); },
    toast: function (t, g) { toast(t, g); },
    TASKS: TASKS, EXTRA: EXTRA, ACHS: ACHS, MAX_LV: MAX_LV, TITLES: TITLES, needExp: needExp,
    titleAt: titleAt, titleOf: titleOf
  };
  var tries = 0;
  (function waitApi() {
    if (window.BooboAPI) { boot(); return; }
    if (tries++ > 40) return;
    setTimeout(waitApi, 60);
  })();
})();
