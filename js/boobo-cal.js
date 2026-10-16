/* boobo-cal.js : 中国内地日历（农历 / 节气 / 法定节假日与调休） */
(function () {
  "use strict";
  if (window.__booboCal) return;
  window.__booboCal = 1;
  /* 调试用的模拟日期：只影响日历高亮和小店打折日，不动存档里的时间 */
  window.BooboDay = window.BooboDay || (function () {
    var K = "boobo_dbg_day", off = 0;
    try { off = parseInt(localStorage.getItem(K), 10) || 0; } catch (e) {}
    return {
      off: function () { return off; },
      now: function () { return new Date(Date.now() + off * 864e5); },
      shift: function (n) {
        off = n === 0 ? 0 : off + n;
        try { if (off) localStorage.setItem(K, String(off)); else localStorage.removeItem(K); } catch (e) {}
        try { document.dispatchEvent(new CustomEvent("boobo:day", { detail: { off: off } })); } catch (e) {}
        return off;
      }
    };
  })();

  /* 法定节假日：按 2026 年国务院办公厅通知整理，请对照官方通知核对。
     新年度通知发布后照格式加一项即可。 */
  var OFFICIAL = {
    2026: {
      rest: [["01-01","01-03","元旦"],["02-15","02-23","春节"],["04-04","04-06","清明节"],
             ["05-01","05-05","劳动节"],["06-19","06-21","端午节"],["09-25","09-27","中秋节"],
             ["10-01","10-07","国庆节"]],
      work: ["01-04","02-14","02-28","05-09","09-20","10-10"]
    }
  };

  var SOLAR = {
    "01-01":["元旦","新年第一天，适合写下新一年的小目标。"],
    "02-14":["情人节","互送卡片或小礼物，表达心意。"],
    "03-08":["妇女节","国际劳动妇女节，向女性致敬。"],
    "03-12":["植树节","种一棵树，或给身边的植物浇浇水。"],
    "05-01":["劳动节","国际劳动节，向每一位劳动者致敬。"],
    "05-04":["青年节","纪念五四运动，属于年轻人的节日。"],
    "06-01":["儿童节","国际儿童节，大朋友也可以开心一下。"],
    "07-01":["建党节","中国共产党成立纪念日。"],
    "08-01":["建军节","中国人民解放军建军纪念日。"],
    "09-10":["教师节","向老师说一声谢谢。"],
    "10-01":["国庆节","中华人民共和国成立纪念日，常有升旗和出游。"],
    "12-24":["平安夜","圣诞前夜，挂彩灯、交换祝福。"],
    "12-25":["圣诞节","装饰圣诞树、互送礼物。"]
  };

  var LUNAR_FEST = {
    "1-1":["春节","农历新年。拜年、发红包、贴春联、吃团圆饭。"],
    "1-15":["元宵节","赏花灯、猜灯谜、吃元宵或汤圆。"],
    "2-2":["龙抬头","民间有理发、吃春饼、祈求好收成的习俗。"],
    "5-5":["端午节","吃粽子、赛龙舟、挂艾草，纪念屈原。"],
    "7-7":["七夕节","源自牛郎织女的传说，也叫乞巧节。"],
    "7-15":["中元节","民间祭祖、放河灯的传统日子。"],
    "8-15":["中秋节","赏月、吃月饼，家人团圆。"],
    "9-9":["重阳节","登高、赏菊、敬老。"],
    "12-8":["腊八节","喝腊八粥、泡腊八蒜，年味开始了。"],
    "12-23":["小年","北方小年，祭灶、扫尘，准备过年。"]
  };
  var EVE = ["除夕","农历年最后一天。吃年夜饭、守岁、看春晚。"];

  var TERMS = ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至",
               "小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"];
  var TERM_NOTE = ["天气渐冷，注意保暖。","一年中最冷的时候。","春天开始，有咬春吃春饼的习俗。","降雨增多，草木萌动。",
    "春雷响起，小虫子醒过来。","昼夜等长，可以试试竖蛋。","踏青扫墓，纪念先人。","雨水滋润谷物生长。",
    "夏天开始，万物繁茂。","麦粒渐渐饱满。","适合播种的忙碌时节。","一年中白天最长。",
    "天气开始炎热。","一年中最热的时候，注意防暑。","秋天开始，有贴秋膘的说法。","暑气渐渐退去。",
    "早晚凉爽，露水凝结。","昼夜再次等长，秋高气爽。","露水寒凉，记得添衣。","开始降霜，适合吃柿子。",
    "冬天开始，北方吃饺子。","开始飘小雪。","雪量增多，天寒地冻。","白天最短，北方吃饺子，南方吃汤圆。"];
  var TC = [5.4055,20.12,3.87,18.73,5.63,20.646,4.81,20.1,5.52,21.04,5.678,21.37,
            7.108,22.83,7.5,23.13,7.646,23.042,8.318,23.438,7.438,22.36,7.18,21.94];
  var TFIX = { "2019-0":-1, "2026-3":-1, "2008-9":1, "2016-12":1, "2002-14":1,
               "2082-1":1, "2084-5":1, "2089-19":1, "2089-20":1 };

  /* 浏览器不支持中国历法时的兜底 */
  var FALLBACK = { "2026-02-16":"除夕","2026-02-17":"春节","2026-03-03":"元宵节","2026-06-19":"端午节",
    "2026-08-19":"七夕节","2026-09-25":"中秋节","2026-10-18":"重阳节","2027-02-05":"除夕",
    "2027-02-06":"春节","2027-02-20":"元宵节","2027-06-09":"端午节","2027-08-08":"七夕节",
    "2027-09-15":"中秋节","2027-10-08":"重阳节" };

  function $id(x) { return document.getElementById(x); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function md(d) { return pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]; }); }
  var WD = "日一二三四五六";
  var NUM = "零一二三四五六七八九十";
  var MON = ["", "正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];

  /* 兼容"8"/"八月"/"冬月"/"十八"/"廿三"等各种写法 */
  function cnToInt(t) {
    t = String(t || "").replace(/[闰月日\s]/g, "");
    var d = parseInt(t.replace(/\D/g, ""), 10);
    if (!isNaN(d)) return d;
    if (t === "正") return 1;
    if (t === "冬") return 11;
    if (t === "腊") return 12;
    t = t.replace(/^初/, "").replace(/^廿/, "二十").replace(/^卅/, "三十");
    var i = t.indexOf("十");
    if (i < 0) return NUM.indexOf(t);
    var n = (i === 0 ? 1 : NUM.indexOf(t.charAt(0))) * 10;
    if (i < t.length - 1) n += NUM.indexOf(t.charAt(i + 1));
    return n;
  }

  var fmt = null;
  try { fmt = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", { month: "long", day: "numeric" }); } catch (e) {}
  function lunar(d) {
    if (!fmt || !fmt.formatToParts) return null;
    try {
      var m = "", dd = "";
      fmt.formatToParts(d).forEach(function (p) {
        if (p.type === "month") m = p.value;
        if (p.type === "day") dd = p.value;
      });
      var mn = cnToInt(m), dn = cnToInt(dd);
      if (!(mn >= 1 && mn <= 12 && dn >= 1 && dn <= 30)) return null;
      return { m: mn, d: dn, leap: m.indexOf("闰") >= 0 };
    } catch (e) { return null; }
  }
  var c1 = lunar(new Date(2026, 1, 17)), c2 = lunar(new Date(2026, 8, 25));
  var OK = !!(c1 && c1.m === 1 && c1.d === 1 && c2 && c2.m === 8 && c2.d === 15);

  function dayName(n) {
    if (n <= 10) return "初" + NUM.charAt(n);
    if (n < 20) return "十" + NUM.charAt(n - 10);
    if (n === 20) return "二十";
    if (n < 30) return "廿" + NUM.charAt(n - 20);
    return "三十";
  }
  function monName(l) { return (l.leap ? "闰" : "") + MON[l.m] + "月"; }

  function termDay(y, i) {
    if (y < 2001 || y > 2099) return 0;
    var Y = y % 100, L = i < 4 ? Math.floor((Y - 1) / 4) : Math.floor(Y / 4);
    return Math.floor(Y * 0.2422 + TC[i]) - L + (TFIX[y + "-" + i] || 0);
  }
  function termOn(d) {
    var i = d.getMonth() * 2, y = d.getFullYear();
    if (termDay(y, i) === d.getDate()) return i;
    if (termDay(y, i + 1) === d.getDate()) return i + 1;
    return -1;
  }

  /* 联网同步：公开数据源 holiday-cn，结果缓存在本机 */
  var REMOTE = {}, RDAYS = {}, LOADING = {}, TRIED = {};
  var SRC = ["https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/",
             "https://fastly.jsdelivr.net/gh/NateScarlet/holiday-cn@master/",
             "https://gcore.jsdelivr.net/gh/NateScarlet/holiday-cn@master/"];
  function useData(y, days) {
    REMOTE[y] = true;
    days.forEach(function (x) {
      if (!x || typeof x.date !== "string" || x.date.slice(0,4)!==String(y) || !/^\d{4}-\d{2}-\d{2}$/.test(x.date) || typeof x.isOffDay!=="boolean") return;
      RDAYS[x.date] = x.isOffDay ? { t: "rest", name: String(x.name || "假期") } : { t: "work" };
    });
  }
  function fetchYear(y) {
    if (TRIED[y]) return;
    TRIED[y] = 1;
    var ck = "boobo_hol_" + y, c = null;
    try { c = JSON.parse(localStorage.getItem(ck) || "null"); } catch (e) {}
    var age = c ? Date.now() - (c.t || 0) : Infinity;
    if (c && Array.isArray(c.days)) { useData(y, c.days); if (age < 7 * 864e5) return; }
    else if (c && age < 864e5) return;
    if (!window.fetch) return;
    LOADING[y] = true;
    var i = 0;
    (function next() {
      if (i >= SRC.length) {
        LOADING[y] = false;
        if (!REMOTE[y]) { try { localStorage.setItem(ck, JSON.stringify({ t: Date.now(), days: null })); } catch (e) {} }
        if (view.getFullYear() === y) render();
        return;
      }
      var url = SRC[i++] + y + ".json";
      var controller = new AbortController(), timeoutId;
      var request = fetch(url, { cache: "no-cache", credentials: "omit", referrerPolicy: "no-referrer", signal: controller.signal }).then(function(res){
        if (!res.ok) throw new Error("http " + res.status);
        return res.json();
      });
      var timeout = new Promise(function(_, no){timeoutId=setTimeout(function(){controller.abort();no(new Error("timeout"));},6000);});
      Promise.race([request,timeout]).then(function (j) {
        if (!j || !Array.isArray(j.days) || !j.days.length) throw new Error("empty");
        useData(y, j.days);
        try { localStorage.setItem(ck, JSON.stringify({ t: Date.now(), days: j.days })); } catch (e) {}
        LOADING[y] = false;
        if (view.getFullYear() === y) render();
      }).then(function(){clearTimeout(timeoutId);},function(){clearTimeout(timeoutId);controller.abort();next();});
    })();
  }

  function official(d) {
    var iso = d.getFullYear() + "-" + md(d);
    if (RDAYS[iso]) return RDAYS[iso];
    if (REMOTE[d.getFullYear()]) return null;
    var o = OFFICIAL[d.getFullYear()], k = md(d);
    if (!o) return null;
    for (var i = 0; i < o.rest.length; i++) {
      if (k >= o.rest[i][0] && k <= o.rest[i][1]) return { t: "rest", name: o.rest[i][2] };
    }
    return o.work.indexOf(k) >= 0 ? { t: "work" } : null;
  }

  function info(d) {
    var r = { fest: [], term: termOn(d), l: OK ? lunar(d) : null, off: official(d) };
    r.sale = d.getDay() === 4;
    if (SOLAR[md(d)]) r.fest.push(SOLAR[md(d)]);
    if (d.getDay() === 0 && d.getMonth() === 4 && Math.ceil(d.getDate() / 7) === 2) r.fest.push(["母亲节", "五月第二个星期日，向妈妈说声辛苦了。"]);
    if (d.getDay() === 0 && d.getMonth() === 5 && Math.ceil(d.getDate() / 7) === 3) r.fest.push(["父亲节", "六月第三个星期日，陪爸爸聊聊天。"]);
    if (r.l && !r.l.leap) {
      if (LUNAR_FEST[r.l.m + "-" + r.l.d]) r.fest.unshift(LUNAR_FEST[r.l.m + "-" + r.l.d]);
      var nx = lunar(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
      if (nx && nx.m === 1 && nx.d === 1 && !nx.leap) r.fest.unshift(EVE);
    } else if (!OK) {
      var fb = FALLBACK[d.getFullYear() + "-" + md(d)], note = fb === "除夕" ? EVE : null;
      for (var k in LUNAR_FEST) if (LUNAR_FEST[k][0] === fb) note = LUNAR_FEST[k];
      if (note) r.fest.unshift(note);
    }
    return r;
  }
  function label(r) {
    if (r.fest.length) return r.fest[0][0];
    if (r.term >= 0) return TERMS[r.term];
    if (r.l) return r.l.d === 1 ? monName(r.l) : dayName(r.l.d);
    return "";
  }
  function ganzhi(d, l) {
    var y = d.getFullYear();
    if (l && l.m >= 10 && d.getMonth() <= 1) y--;
    var i = ((y - 4) % 60 + 60) % 60;
    return "甲乙丙丁戊己庚辛壬癸".charAt(i % 10) + "子丑寅卯辰巳午未申酉戌亥".charAt(i % 12) +
      "年（" + "鼠牛虎兔龙蛇马羊猴鸡狗猪".charAt(i % 12) + "年）";
  }
  function same(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

  var now0 = window.BooboDay.now(), view = new Date(now0.getFullYear(), now0.getMonth(), 1), sel = new Date(now0.getFullYear(), now0.getMonth(), now0.getDate());

  function render() {
    var y = view.getFullYear(), m = view.getMonth(), now = window.BooboDay.now();
    fetchYear(y);
    $id("calendarTitle").textContent = y + "年 " + (m + 1) + "月";
    var tl = OK ? lunar(now) : null;
    $id("calendarTodayLine").textContent = "今天 " + (now.getMonth() + 1) + "月" + now.getDate() + "日 星期" +
      WD.charAt(now.getDay()) + (tl ? " · 农历" + monName(tl) + dayName(tl.d) : "");
    var off = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(), h = "";
    for (var i = 0; i < off; i++) h += '<span class="calendar-blank"></span>';
    for (var d = 1; d <= n; d++) {
      var dt = new Date(y, m, d), r = info(dt), wd = dt.getDay(), c = "calendar-day";
      if (same(dt, now)) c += " is-today";
      if (same(dt, sel)) c += " is-selected";
      if ((wd === 0 || wd === 6) && !(r.off && r.off.t === "work")) c += " is-weekend";
      if (r.off) c += r.off.t === "rest" ? " is-rest" : " is-work";
      if (r.fest.length) c += " is-fest"; else if (r.term >= 0) c += " is-term";
      if (r.sale) c += " is-sale";
      h += '<button type="button" class="' + c + '" data-cal="' + d + '">' +
        (r.off ? '<i class="cal-mark">' + (r.off.t === "rest" ? "休" : "班") + '</i>' : "") +
        (r.sale ? '<i class="cal-sale">折</i>' : "") + '<b>' + d + '</b><small>' + esc(label(r)) + '</small></button>';
    }
    $id("calendarDays").innerHTML = h;
    var lg = $id("calLegend");
    if (lg) lg.innerHTML = '<span><i class="cal-mark">休</i>放假</span><span><i class="cal-mark w">班</i>补班</span>' +
      '<span class="g">绿字 节气</span><span class="rd">红字 节日</span><span class="sl">折 小店打折日</span>' +
      (REMOTE[y] ? '<span class="g">放假安排已联网同步</span>' : OFFICIAL[y] ? '<span>内置放假安排</span>' : '<span>' + (LOADING[y] ? "正在同步放假安排…" : "本年放假安排暂未公布") + '</span>');
    detail(sel);
  }

  function detail(d) {
    var r = info(d);
    $id("calendarDetailTitle").textContent = d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日　星期" + WD.charAt(d.getDay());
    var h = r.l ? '<span class="cal-lunar">农历 ' + ganzhi(d, r.l) + " " + monName(r.l) + dayName(r.l.d) + '</span>' : "";
    var tags = "";
    if (r.off) tags += '<span class="cal-tag">' + (r.off.t === "rest" ? esc(r.off.name) + " 放假" : "调休上班") + '</span>';
    r.fest.forEach(function (f) { tags += '<span class="cal-tag">' + esc(f[0]) + '</span>'; });
    if (r.term >= 0) tags += '<span class="cal-tag term">' + TERMS[r.term] + '</span>';
    if (r.sale) tags += '<span class="cal-tag sale">小店打折日</span>';
    var notes = r.fest.map(function (f) { return esc(f[0]) + "：" + esc(f[1]); });
    if (r.term >= 0) notes.push(TERMS[r.term] + "：" + TERM_NOTE[r.term]);
    if (r.sale) notes.push("每周四是啵啵家具小店打折日，所有家具 8 折。");
    if (r.off && r.off.t === "work") notes.push("这天是调休补班日，要正常上班上学哦。");
    if (!notes.length) notes.push("普通的一天，也值得好好过。");
    $id("calendarDetailText").innerHTML = h + (tags ? '<span class="cal-tags">' + tags + '</span>' : "") +
      '<span class="cal-notes">' + notes.join("<br>") + '</span>';
  }



  function boot() {
    if (!$id("calendarDays")) return;
    var p = document.getElementById("calendarPrev"), nx = document.getElementById("calendarNext"), t = document.getElementById("calendarToday");
    if (!$id("calLegend")) $id("calendarDays").insertAdjacentHTML("afterend", '<div class="cal-legend" id="calLegend"></div>');
    p.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); sel = new Date(view); render(); });
    nx.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); sel = new Date(view); render(); });
    t.addEventListener("click", function () {
      var n = window.BooboDay.now();
      view = new Date(n.getFullYear(), n.getMonth(), 1);
      sel = new Date(n.getFullYear(), n.getMonth(), n.getDate());
      render();
    });
    $id("calendarDays").addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-cal]");
      if (!b) return;
      sel = new Date(view.getFullYear(), view.getMonth(), Number(b.dataset.cal));
      render();
    });
    document.addEventListener("boobo:day", function () { t.click(); });
    render();
    var r = info(new Date());
    if ((r.fest.length || r.term >= 0) && window.BooboAPI) {
      var name = r.fest.length ? r.fest[0][0] : TERMS[r.term];
      setTimeout(function () { window.BooboAPI.say("今天是" + name + "！啵啵也想和你一起过。"); }, 900);
    }
  }
  window.BooboCal = { lunarOK: OK };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
