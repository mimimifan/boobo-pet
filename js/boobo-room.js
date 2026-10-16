/* boobo-room.js v8 : 房间布局重做
   双人床 / 床头柜 / 吊灯 / 新窗帘 / 每件家具固定位置，可在调试面板微调（存 boobo_layout_v2） */
(function () {
  "use strict";
  if (window.BooboRoom) return;

  var PAL = { o:"#5a3d2b", w:"#b98256", W:"#d9a571", d:"#8c5e3d", D:"#6e4a30", g:"#6fae5c", G:"#9ad07a", k:"#4a8a48",
    p:"#f2a7b5", P:"#fbd3da", r:"#e2788c", y:"#f3cf5f", Y:"#fff0a8", b:"#8fc0e0", B:"#cfe9f5", q:"#a9d1ea",
    n:"#5f93bb", N:"#4a7aa0", c:"#fbf3dc", C:"#e8d9b5", x:"#c9744a", X:"#e39a6a", z:"#9a5232",
    s:"#ffffff", l:"#c9b3dd", L:"#e6daf0",
    e:"#6b5a4a", R:"#c25f72", f:"#efe0c4", F:"#dcc8a4", a:"#c9b08a",
    j:"#9a7260", J:"#b98f78", u:"#7c5c4c",
    S:"#d2cbb8", Z:"#aba292", H:"#857c6c" };
  function rep(t, n) { return new Array(n + 1).join(t); }
  function esc(t) { return String(t || "").replace(/[&<>"']/g, function (c) { return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function grid(W, H, f) {
    var g = [];
    for (var y = 0; y < H; y++) { var row = ""; for (var x = 0; x < W; x++) row += f(x, y) || "."; g.push(row); }
    return g;
  }
  /* 自动描边：贴着空白的像素变成深色轮廓 */
  function outline(g) {
    return g.map(function (row, y) {
      var out = "";
      for (var x = 0; x < row.length; x++) {
        var ch = row.charAt(x);
        if (ch !== "." && ch !== "o") {
          var edge = [[1,0],[-1,0],[0,1],[0,-1]].some(function (v) {
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

  function rugGrid() {
    var W = 40, H = 12, g = [];
    for (var y = 0; y < H; y++) {
      var row = "";
      for (var x = 0; x < W; x++) {
        var ex = Math.min(x, W - 1 - x), ey = Math.min(y, H - 1 - y), ch;
        if (ex + ey < 2) ch = ".";
        else if (ex === 0 || ey === 0 || ex + ey === 2) ch = "o";
        else if (ex < 3 || ey < 2) ch = "r";
        else ch = ((x + y) % 6 === 0 || (x - y + 60) % 6 === 0) ? "p" : "P";
        row += ch;
      }
      g.push(row);
    }
    return g;
  }

  /* 双人床 48x52：立柱床头板 / 床单+两个枕头 / 翻边 / 格子被面 / 被子垂边 / 床框 / 床脚，右侧暗面做立体 */
  var COVER = [24, 45];
  function bedArt() {
    return outline(grid(48, 52, function (x, y) {
      var m = x >= 1 && x <= 46, side = x >= 45;
      if (y < 16) {
        if (x >= 1 && x <= 4) return y === 0 || x === 1 ? "W" : x === 4 ? "d" : "w";
        if (x >= 43 && x <= 46) return y === 0 || x === 43 ? "W" : x === 46 ? "d" : "w";
        if (x < 5 || x > 42 || y < 3) return ".";
        if (y <= 4) return "W";
        if (y >= 6 && y <= 13 && x >= 7 && x <= 40) return (x - 7) % 6 === 5 ? "w" : "d";
        return "w";
      }
      if (y === 16 || y === 24 || y === 44) return m ? "o" : ".";
      if (y < 24) {
        if (!m) return ".";
        var px = x >= 4 && x <= 21 ? x - 4 : x >= 26 && x <= 43 ? x - 26 : -1;
        if (px >= 0 && y <= 22) return (y === 17 || y === 22 || px === 0 || px === 17) ? "C" : "s";
        return side || y === 23 ? "C" : "c";
      }
      if (y < 27) return m ? (y === 26 || side ? "C" : "c") : ".";
      if (y < 38) {
        if (!m) return ".";
        if (side) return "n";
        if ((x - 1) % 6 === 0 || (y - 27) % 5 === 0) return "q";
        return (Math.floor((x - 1) / 6) + Math.floor((y - 27) / 5)) % 2 ? "b" : "B";
      }
      if (y < 44) return m ? (side || y === 43 || x % 6 === 1 ? "N" : "n") : ".";
      if (y < 49) return y === 45 ? "W" : y === 48 ? "D" : "w";
      return (x >= 2 && x <= 6) || (x >= 41 && x <= 45) ? "D" : ".";
    }));
  }
  /* 床头柜：台面 / 两个抽屉 / 侧面阴影 / 柜脚 */
  function standArt() {
    return outline(grid(14, 17, function (x, y) {
      if (y < 2) return "W";
      if (y === 2) return "o";
      if (y < 15) {
        if (x < 1 || x > 12) return ".";
        if (x > 10 || y === 8 || y === 14) return "d";
        if ((x === 5 || x === 6) && (y === 5 || y === 11)) return "y";
        return "w";
      }
      return (x >= 2 && x <= 3) || (x >= 9 && x <= 10) ? "D" : ".";
    }));
  }
  /* 星星吊灯：吊线 / 灯座 / 圆顶灯罩（带小星星）/ 灯泡 */
  function lampArt() {
    return outline(grid(18, 26, function (x, y) {
      if (y < 9) return x === 8 || x === 9 ? "o" : ".";
      if (y < 12) return x >= 6 && x <= 11 ? (y === 9 ? "W" : "d") : ".";
      if (y < 21) {
        var t = (y - 11) / 9, hw = 8.6 * Math.sqrt(1 - (1 - t) * (1 - t));
        if (Math.abs(x - 8.5) > hw) return ".";
        if (y === 20) return "y";
        if ((y === 15 || y === 17) && (x === 8 || x === 9)) return "y";
        if (y === 16 && x >= 7 && x <= 10) return "y";
        return x >= 13 ? "C" : (x <= 4 && y >= 14 ? "s" : "c");
      }
      if (y < 24) return x >= 6 && x <= 11 ? (x === 6 || x === 11 ? "y" : "Y") : ".";
      return y === 24 && x >= 7 && x <= 10 ? "Y" : ".";
    }));
  }
  /* 商店图标：窗户 + 两侧碎花窗帘 + 帘头 */
  function winIconArt() {
    return outline(grid(22, 20, function (x, y) {
      if (y === 0) return "d";
      if (y < 4) { if (x < 1 || x > 20 || (y === 3 && x % 4 === 0)) return "."; return x % 2 ? "p" : "P"; }
      var cx = x <= 10 ? x : 21 - x;
      if (cx >= 1 && cx <= 5 && y <= 18) {
        if (y === 11 || y === 12) return "y";
        if ((y === 13 || y === 14) && (cx === 1 || cx === 5)) return ".";
        return "rpPp".charAt(cx % 4);
      }
      if (x >= 6 && x <= 15 && y <= 16) {
        if (x === 6 || x === 15 || y === 4 || y === 16 || x === 10 || x === 11 || y === 10) return "w";
        if (y >= 6 && y <= 7 && x >= 7 && x <= 8) return "y";
        return y >= 14 ? "g" : "B";
      }
      return ".";
    }));
  }
  /* 窗帘单片：上宽、中间束带、下摆散开，竖向褶皱 */
  function curtainArt() {
    return outline(grid(12, 32, function (x, y) {
      var xi = y <= 15 ? 11 - Math.floor(y / 3) : y <= 19 ? 5 : Math.min(11, 5 + Math.floor((y - 19) * 7 / 12));
      if (x > xi) return ".";
      if (y === 17 || y === 18) return "y";
      if (y === 31) return "r";
      return "rpPp".charAt(x % 4);
    }));
  }
  /* 波浪帘头 */
  function valanceArt() {
    return outline(grid(44, 8, function (x, y) {
      if (y === 0) return "r";
      if (y <= 4) return "pPpr".charAt(x % 4);
      return y - 4 <= [1,2,3,3,3,3,3,3,3,2,1][x % 11] ? "P" : ".";
    }));
  }

  var ART = {
    flower: ["..ppp.........", ".pPPPp...yyy..", ".pPyPp..yYYYy.", ".pPPPp..yYxYy.", "..ppp...yYYYy.",
      "...k.....yyy..", "...k......k...", ".ggk......k...", ".gGk......kgg.", "..gk...g..kGg.",
      "...k..gGg.kg..", "...k...k..k...", ".oooooooooooo.", ".oXXXXXXXXXXo.", "..oxxxxxxxxo..",
      "..oxxxxxxxxo..", "..ozzzzzzzzo..", "...oooooooo..."],
    pillow: [".y............y.", "..oooooooooooo..", ".oPPPPPPPPPPPPo.", ".oPPPPPPPPPPPpo.",
      ".oPPPrrPrrPPPpo.", ".oPPPrrrrrPPPpo.", ".oPPPPrrrPPPPpo.", ".oPPPPPrPPPPPpo.",
      ".oPPPPPPPPPPPpo.", ".oppppppppppppo.", "..oooooooooooo..", ".y............y."],
    tree: [".....kkkk.....", "...kkgGGgkk...", "..kgGGGggggk..", ".kgGGgggggggk.", ".kgGggggkgggk.",
      "kgggggkgggggk.", "kgGgggggggkggk", "kggggkgggggggk", ".kggggggkgggk.", ".kgkgggggggkk.",
      "..kkggkggkk...", "....kkddkk....", "......dd......", "......dd......", "......dd......",
      "..oooooooooo..", "..oXXXXXXXXo..", "...oxxxxxxo...", "...oxxxxxxo...", "...ozzzzzzo...",
      "...oxxxxxxo...", "....oooooo...."],
    rug: rugGrid()
  };
  ART.shelf = (function () {
    var rows = [rep("o", 16), "o" + rep("W", 14) + "o"], D = rep("d", 12), WW = rep("W", 12);
    [D, "bbddyddddddd", "bbrrydddlldd", "bbrryggdlldd", "bBrryggdlLdd", "bbrryggdlldd", "bbrryggdlldd",
     WW, D, "dgGgdddddddd", "ddkdddddoood", "dxxxddddyYyd", "dxxxddddyyyd", "dzzzddddyyyd", D,
     WW, D, "dpddddrrrrrd", "dpdddyyyyyyd", "dppddbbbbbbd", "dppdgggggggd", WW]
      .forEach(function (m) { rows.push("ow" + m + "wo"); });
    rows.push(rep("o", 16), ".oo" + rep(".", 10) + "oo.");
    return rows;
  })();
  ART.bed = bedArt();
  ART.cover = ART.bed.slice(COVER[0], COVER[1]);
  ART.wicon = winIconArt();
  ART.table = standArt();
  ART.lamp = lampArt();
  ART.window = curtainArt();
  ART.valance = valanceArt();

  /* ===== 客厅家具 ===== */
  PAL.h = "#c8ecc8"; PAL.m = "#a2d9a9"; PAL.M = "#6fae7f"; PAL.t = "#33405a"; PAL.T = "#6f93bd";
  PAL.E = "#d6e6ee"; PAL.v = "#3f5f4a"; PAL.V = "#4f7260";
  /* 沙发 48x29：高靠背带拉扣 / 两块坐垫 / 扶手 / 裙边 / 木脚，左边放个小抱枕 */
  /* 沙发 48x30：奶油圆角靠背 + 白高光 + 拉扣压线 + 两块坐垫 + 粉/紫抱枕 + 木锥脚 */
  function sofaArt() {
    return outline(grid(48, 30, function (x, y) {
      if (y >= 26) return (x >= 4 && x <= 7) || (x >= 40 && x <= 43) ? (y === 29 ? "D" : "w") : ".";
      if (y >= 22) return x >= 2 && x <= 45 ? (y === 22 ? "C" : y === 25 ? "d" : "W") : ".";
      var armL = x >= 1 && x <= 6, armR = x >= 41 && x <= 46;
      if (y >= 8 && (armL || armR)) {
        if (y === 8 && (x === 1 || x === 46)) return ".";
        return y <= 9 ? "s" : (x === 6 || x === 41) ? "C" : "c";
      }
      if (y >= 9 && y <= 14 && x >= 9 && x <= 15) return (y === 9 || y === 14 || x === 9 || x === 15) ? "r" : "P";
      if (y >= 10 && y <= 14 && x >= 32 && x <= 38) return (y === 10 || y === 14 || x === 32 || x === 38) ? "l" : "L";
      if (y >= 15 && x >= 7 && x <= 40) {
        if (y === 15) return "s";
        return (x === 23 || x === 24 || y === 21) ? "C" : "c";
      }
      if (y <= 14 && x >= 6 && x <= 41) {
        if (y === 0 && (x <= 7 || x >= 40)) return ".";
        if (y === 1) return "s";
        if (x === 23 || x === 24) return "C";
        if (y === 7 && (x - 6) % 7 === 3) return "C";
        return "c";
      }
      return ".";
    }));
  }
  /* 三联小挂画：一大两小错落挂（左大肖像 / 右上小花 / 右下横幅风景），每幅上方一颗钉子 */
  function artframeArt() {
    function frame(x, y, fx, fy, w, h, inner) {
      if (y === fy - 1 && x === fx + Math.floor(w / 2)) return "o";
      if (x < fx || x >= fx + w || y < fy || y >= fy + h) return "";
      if (x === fx || x === fx + w - 1 || y === fy || y === fy + h - 1) return "d";
      if (x === fx + 1 || x === fx + w - 2 || y === fy + 1 || y === fy + h - 2) return "W";
      return inner(x - fx - 2, y - fy - 2, w - 4, h - 4);
    }
    return outline(grid(30, 26, function (x, y) {
      return frame(x, y, 0, 2, 13, 17, function (ix, iy, iw, ih) {
        if (iy >= ih - 2) return "C";
        var dx = ix - 4, dy = iy - 6;
        if (dx * dx * 1.3 + dy * dy <= 14) {
          if (iy === 5 && (ix === 2 || ix === 6)) return "v";
          if (iy === 7 && ix >= 3 && ix <= 5) return "v";
          if (iy === 7 && (ix === 1 || ix === 7)) return "p";
          return "m";
        }
        return "c";
      }) || frame(x, y, 17, 4, 9, 9, function (ix, iy) {
        if (iy >= 3 && ix === 2) return "k";
        if (iy === 4 && ix === 3) return "g";
        if (iy === 1 && ix === 2) return "y";
        if (((iy === 0 || iy === 2) && ix === 2) || (iy === 1 && (ix === 1 || ix === 3))) return "p";
        return "L";
      }) || frame(x, y, 15, 16, 14, 10, function (ix, iy, iw, ih) {
        if (iy >= ih - 2) return (ix + iy) % 2 ? "G" : "g";
        if (iy === ih - 3 && ix >= 3 && ix <= 6) return "g";
        if (iy <= 1 && ix >= iw - 2) return "y";
        if (iy === 1 && ix >= 1 && ix <= 3) return "s";
        return "B";
      }) || ".";
    }));
  }
  /* 落地灯 14x42：灯罩 / 灯杆 / 底座 */
  function floorlampArt() {
    return outline(grid(14, 42, function (x, y) {
      if (y < 12) {
        if (Math.abs(x - 6.5) > 3 + y * 3.5 / 11) return ".";
        if (y === 11) return "X";
        return x < 6 ? "Y" : "y";
      }
      if (y < 38) return x === 6 || x === 7 ? "d" : ".";
      if (y < 41) return x >= 3 && x <= 10 ? (y === 38 ? "W" : "w") : ".";
      return x >= 2 && x <= 11 ? "D" : ".";
    }));
  }
  /* 电视 + 电视柜一体 */
  function tvArt() {
    return outline(grid(32, 32, function (x, y) {
      if (y < 4) return y < 3 && (x === 11 - y || x === 20 + y) ? "o" : ".";
      if (y < 20) {
        if (x < 4 || x > 27) return ".";
        if (y === 4 || y === 19) return "d";
        if (x >= 6 && x <= 21 && y >= 6 && y <= 17) {
          if ((x === 6 || x === 21) && (y === 6 || y === 17)) return "d";
          if ((y === 8 && x >= 8 && x <= 10) || (x === 8 && y >= 8 && y <= 10)) return "T";
          if (y >= 14 && x >= 9 && x <= 18) return "T";
          return "t";
        }
        if (x >= 23 && x <= 26) {
          if (y >= 7 && y <= 8 && x >= 24 && x <= 25) return "y";
          if (y >= 11 && y <= 12 && x >= 24 && x <= 25) return "x";
          if (y >= 15 && y <= 16) return "W";
          return "w";
        }
        return "w";
      }
      if (y < 22) return x >= 1 && x <= 30 ? (y === 20 ? "W" : "w") : ".";
      if (y < 30) {
        if (x < 2 || x > 29) return ".";
        if (x === 15 || x === 16) return "d";
        if (y === 25 && (x === 12 || x === 19)) return "y";
        return (x === 2 || x === 29 || y === 29) ? "d" : "w";
      }
      return (x >= 3 && x <= 6) || (x >= 25 && x <= 28) ? "D" : ".";
    }));
  }
  /* 鱼缸 + 木架（鱼和气泡由 CSS 动画加在上面） */
  function tankArt() {
    return outline(grid(28, 32, function (x, y) {
      if (y < 2) return x >= 1 && x <= 26 ? (y === 0 ? "d" : "D") : ".";
      if (y < 18) {
        if (x === 0 || x === 27) return "E";
        if (y < 4) return x % 7 === 3 ? "s" : "B";
        if (y >= 15) return (x + y) % 3 ? "y" : "Y";
        if (x >= 3 && x <= 5 && y >= 9) return (x + y) % 2 ? "g" : "G";
        if (x >= 22 && x <= 24 && y >= 11) return (x + y) % 2 ? "G" : "g";
        if (x >= 9 && x <= 11 && y >= 13) return "x";
        return "b";
      }
      if (y === 18) return "E";
      if (y < 21) return x >= 1 && x <= 26 ? (y === 19 ? "W" : "w") : ".";
      if (y < 30) {
        if ((x >= 2 && x <= 5) || (x >= 22 && x <= 25)) return x === 2 || x === 25 ? "d" : "w";
        if (y >= 24 && y <= 26 && x >= 5 && x <= 22) return y === 26 ? "d" : "w";
        return ".";
      }
      return (x >= 2 && x <= 5) || (x >= 22 && x <= 25) ? "D" : ".";
    }));
  }
  function toyArt() {
    return outline(grid(20, 16, function (x, y) {
      if (y < 5) {
        var dx = x - 5.5, dy = y - 3;
        if (dx * dx + dy * dy <= 5.5) return x < 5 ? "r" : "P";
        if (x >= 12 && x <= 16 && y >= 1) return x === 12 || y === 1 ? "Y" : "y";
        if (x >= 8 && x <= 10 && y >= 3) return "b";
        return ".";
      }
      if (x < 1 || x > 18) return ".";
      if (y === 5) return "W";
      if (y === 15) return "z";
      if (y === 9 || y === 10) return "X";
      if ((x === 9 || x === 10) && y === 12) return "y";
      return "x";
    }));
  }
  function boardArt() {
    return outline(grid(28, 18, function (x, y) {
      if (y <= 16) {
        if (x < 1 || x > 26) return ".";
        if (y < 2 || y > 14 || x < 3 || x > 24) return y < 1 ? "W" : "w";
        if ((y === 5 && x >= 6 && x <= 15) || (y === 8 && x >= 6 && x <= 20) || (y === 11 && x >= 6 && x <= 12)) return "s";
        if (y === 11 && x >= 15 && x <= 17) return "y";
        return (x + y * 3) % 11 === 0 ? "V" : "v";
      }
      if (x === 9 || x === 10) return "s";
      return x >= 4 && x <= 23 ? "W" : ".";
    }));
  }
  /* 挂钟：木框表盘 + 12 格刻度 + 钟摆箱，指针是 DOM 元素 */
  function clockArt() {
    return outline(grid(20, 32, function (x, y) {
      if (y < 2) return x >= 8 && x <= 11 ? "d" : ".";
      if (y < 21) {
        var dx = x - 9.5, dy = y - 11, r = Math.sqrt(dx * dx + dy * dy);
        if (r > 9) return ".";
        if (r > 7.2) return (x + y) % 2 ? "d" : "w";
        if (r > 6.3) return "W";
        if (r > 4.6) {
          var a = Math.atan2(dy, dx) * 6 / Math.PI;
          if (Math.abs(a - Math.round(a)) < 0.17) return "o";
        }
        return r < 1.2 ? "o" : "c";
      }
      if (y < 31) {
        if (x < 6 || x > 13) return ".";
        if (x === 6 || x === 13 || y === 30) return "d";
        if (y >= 26 && y <= 28 && x >= 8 && x <= 11) return "y";
        return (x === 9 || x === 10) ? "W" : "C";
      }
      return x >= 7 && x <= 12 ? "d" : ".";
    }));
  }
  /* 留声机：锥形花口喇叭 + 唱盘机身 + 矮几 */
  function phonoArt() {
    return outline(grid(26, 30, function (x, y) {
      if (y < 13) {
        var t = y / 12, cx = 6 + t * 9, hw = 6 - t * 4.8, dx = Math.abs(x - cx);
        if (dx > hw) return ".";
        if (y <= 1) return "z";
        if (y <= 4 && dx < hw - 1.3) return "x";
        return x < cx ? "Y" : "y";
      }
      if (y < 16) return x >= 14 && x <= 16 ? "d" : ".";
      if (y < 24) {
        if (x < 2 || x > 23) return ".";
        var ddx = (x - 11) / 6.4, ddy = (y - 17.4) / 2.4;
        if (ddx * ddx + ddy * ddy <= 1) return (Math.abs(x - 11) <= 1 && Math.abs(y - 17.4) <= 1) ? "r" : "o";
        if (y === 16) return x >= 18 && x <= 21 ? "W" : ".";
        if (y === 17) return "W";
        if (y === 18) return "C";
        if (x === 21 && y === 21) return "y";
        return y === 23 ? "d" : "w";
      }
      if (y === 24) return "W";
      if (y === 25) return x >= 1 && x <= 24 ? "w" : ".";
      if (y < 29) return (x >= 2 && x <= 5) || (x >= 20 && x <= 23) ? "w" : ".";
      return (x >= 2 && x <= 5) || (x >= 20 && x <= 23) ? "D" : ".";
    }));
  }
  /* 墙上置物架：小盆栽 / 相框 / 杯子 */
  function wallshelfArt() {
    return outline(grid(28, 18, function (x, y) {
      if (y < 12) {
        if (x >= 3 && x <= 8) {
          if (y >= 8) return y === 11 ? "z" : "x";
          if (y >= 4) return (x + y) % 2 ? "g" : "G";
          return y >= 2 && x >= 5 && x <= 6 ? "k" : ".";
        }
        if (x >= 12 && x <= 18 && y >= 4) {
          if (x === 12 || x === 18 || y === 4 || y === 11) return "d";
          return (x + y) % 3 === 0 ? "P" : "c";
        }
        if (x >= 21 && x <= 25 && y >= 6) {
          if (y === 11 || (x === 25 && y >= 7 && y <= 9)) return "C";
          return x === 21 || x === 24 ? "C" : "s";
        }
        return ".";
      }
      if (y < 15) return x >= 1 && x <= 26 ? (y === 12 ? "W" : y === 14 ? "d" : "w") : ".";
      return ((x >= 4 && x <= 6) || (x >= 21 && x <= 23)) && y <= 16 ? "d" : ".";
    }));
  }

  /* ===== 厨房家具 ===== */
  /* 灶台 32x36：汤锅（热气走 CSS 动画）/ 不锈钢台面 / 铸铁灶眼 / 玻璃门烤箱里烤着面包 */
  function stoveArt() {
    return outline(grid(32, 36, function (x, y) {
      if (y < 3) return ".";
      if (y < 11) {
        if (y === 3) return x >= 11 && x <= 13 ? "E" : ".";
        if (y === 4) return x >= 6 && x <= 18 ? "E" : ".";
        if (y === 5) return x >= 5 && x <= 19 ? "q" : ".";
        if (y <= 8 && (x === 3 || x === 4 || x === 20 || x === 21)) return "N";
        if (x >= 5 && x <= 19) return y === 10 ? "N" : x === 6 ? "E" : x >= 18 ? "N" : "n";
        return ".";
      }
      if (x < 1 || x > 30) return ".";
      if (y < 14) {
        if (y === 11) return "E";
        if (y === 13) return "n";
        return x >= 22 && x <= 28 ? "o" : "q";
      }
      if (y < 19) {
        if (y === 18) return "C";
        if ((y === 15 || y === 16) && [10, 11, 20, 21].indexOf(x) >= 0) return y === 15 ? "X" : "x";
        return "c";
      }
      if (y < 34) {
        if (y <= 20) return x >= 7 && x <= 24 ? "q" : "c";
        if (y >= 23 && y <= 31 && x >= 5 && x <= 26) {
          if (y === 23 || y === 31 || x === 5 || x === 26) return "C";
          if (y >= 28 && x >= 10 && x <= 21) return y === 28 ? "X" : "x";
          return "t";
        }
        return y === 33 ? "C" : "c";
      }
      return (x >= 2 && x <= 5) || (x >= 26 && x <= 29) ? "D" : ".";
    }));
  }
  /* 小餐桌拆两件：桌子 34x32，桌面只铺餐垫（菜由 JS 摆上去），渲染在啵啵前面 */
  function dtableArt() {
    return outline(grid(34, 32, function (x, y) {
      if (y === 7) return x >= 9 && x <= 23 ? ((x === 9 || x === 23) ? "r" : "P") : ".";
      if (y <= 10) return y >= 8 && x >= 1 && x <= 32 ? (y === 8 ? "W" : y === 9 ? "w" : "D") : ".";
      if (y <= 14) {
        if (x < 2 || x > 31) return ".";
        if (y === 14 && (x - 2) % 5 >= 3) return ".";
        return ((x - 2) % 5 === 0 || (y - 11) % 3 === 0) ? "p" : "c";
      }
      if (y <= 29) return (x >= 4 && x <= 7) || (x >= 26 && x <= 29) ? ((x === 7 || x === 29) ? "D" : "w") : ".";
      return (x >= 3 && x <= 8) || (x >= 25 && x <= 30) ? "D" : ".";
    }));
  }
  /* 餐椅 12x32：竖条镂空靠背，渲染在啵啵后面，坐下来椅背露在身后 */
  function dchairArt() {
    return outline(grid(12, 32, function (x, y) {
      if (y >= 2 && y <= 15) {
        if (x === 1 || x === 10) return "d";
        if (y <= 3) return x <= 10 ? "W" : ".";
        if (y >= 14) return x <= 10 ? "d" : ".";
        return (x === 4 || x === 7) ? "w" : ".";
      }
      if (y <= 18) return y >= 16 ? (y === 16 ? "W" : y === 18 ? "D" : "w") : ".";
      if (y <= 29) return (x >= 1 && x <= 3) || (x >= 8 && x <= 10) ? "w" : ".";
      if (y === 30) return (x >= 1 && x <= 3) || (x >= 8 && x <= 10) ? "D" : ".";
      return ".";
    }));
  }
  /* 厨房吸顶灯 22x14：短吊杆 + 白瓷灯盘 + 暖黄灯口，点一下开关灯 */
  function ceilingArt() {
    return outline(grid(22, 14, function (x, y) {
      if (y < 3) return x >= 10 && x <= 11 ? "o" : ".";
      if (y < 11) {
        var hw = 3 + (y - 3) / 8 * 7.5;
        if (Math.abs(x - 10.5) > hw) return ".";
        if (y >= 9) return "Y";
        return x <= 7 ? "s" : x >= 14 ? "C" : "c";
      }
      if (y < 13) return x >= 3 && x <= 18 ? (y === 11 ? "y" : "Y") : ".";
      return x >= 6 && x <= 15 ? "Y" : ".";
    }));
  }
  /* 冰箱 24x42：上冷冻下冷藏 / 竖把手 / 门上贴着粉色便签和绿色涂鸦磁贴 */
  function fridgeArt() {
    return outline(grid(24, 42, function (x, y) {
      if (y >= 40) return (x >= 2 && x <= 5) || (x >= 18 && x <= 21) ? "D" : ".";
      if (x < 1 || x > 22) return ".";
      if (y === 0) return "E";
      if (x >= 20) return "q";
      if (y === 12 || y === 13) return "q";
      if ((x === 17 || x === 18) && ((y >= 4 && y <= 10) || (y >= 17 && y <= 26))) return "n";
      if (y >= 18 && y <= 22 && x >= 4 && x <= 9) return (y === 18 || y === 22 || x === 4 || x === 9) ? "r" : "P";
      if (y >= 26 && y <= 31 && x >= 5 && x <= 11) {
        if (y === 26 || y === 31 || x === 5 || x === 11) return "k";
        return (x + y) % 3 === 0 ? "G" : "h";
      }
      return "c";
    }));
  }
  /* 零食柜 30x22：木框开放柜 / 上层饼干罐、果酱瓶、糖罐 / 下层小面包和糖果 */
  function cupboardArt() {
    return outline(grid(30, 22, function (x, y) {
      if (x < 1 || x > 28 || y > 20) return ".";
      if (y === 0) return "W";
      if (y === 20 || x <= 2 || x >= 27 || y === 10 || y === 11) return "d";
      if (y < 10) {
        if (x >= 4 && x <= 10 && y >= 3) return y === 3 ? "x" : y === 4 ? "X" : ((x + y) % 4 === 0 ? "C" : "c");
        if (x >= 13 && x <= 18) {
          if (y >= 2 && y <= 3) return x >= 15 && x <= 16 ? "x" : "C";
          if (y >= 4) return y === 4 ? "r" : "P";
          return "C";
        }
        if (x >= 21 && x <= 25 && y >= 5) return (x + y) % 2 ? "y" : "Y";
        return "C";
      }
      if (x >= 5 && x <= 13 && y >= 14) return y === 14 ? "X" : "x";
      if (x >= 16 && x <= 20 && y >= 15) return y === 15 ? "h" : "G";
      if (x >= 22 && x <= 25 && y >= 16) return (x + y) % 2 ? "p" : "P";
      return "C";
    }));
  }
  /* 挂锅架 32x18：木横杆上挂着平底锅、汤勺和锅铲 */
  function potrackArt() {
    return outline(grid(32, 18, function (x, y) {
      if (y < 2) return x >= 1 && x <= 30 ? (y === 0 ? "W" : "d") : ".";
      if (x >= 2 && x <= 11) {
        if (y === 2) return x >= 6 && x <= 7 ? "N" : ".";
        if (y >= 3 && y <= 5) return x >= 5 && x <= 8 ? (x <= 6 ? "q" : "N") : ".";
        if (y >= 6 && y <= 13) return (y === 13 || x === 2 || x === 11) ? "N" : (y <= 7 && x <= 5 ? "q" : "n");
        return ".";
      }
      if (x >= 14 && x <= 19) {
        if (y >= 2 && y <= 9) return x >= 16 && x <= 17 ? "q" : ".";
        if (y >= 10 && y <= 14) return (y === 14 || x === 14 || x === 19) ? "N" : "q";
        return ".";
      }
      if (x >= 22 && x <= 28) {
        if (y >= 2 && y <= 8) return x >= 24 && x <= 25 ? "d" : ".";
        if (y >= 9 && y <= 15) return (y === 15 || x === 22 || x === 28) ? "N" : "q";
        return ".";
      }
      return ".";
    }));
  }
  ART.sofa = sofaArt(); ART.tv = tvArt(); ART.tank = tankArt(); ART.toybox = toyArt();
  ART.board = boardArt(); ART.clock = clockArt(); ART.phono = phonoArt();
  ART.wallshelf = wallshelfArt();
  ART.floorlamp = floorlampArt();
  ART.artframe = artframeArt();
  ART.stove = stoveArt(); ART.dtable = dtableArt(); ART.fridge = fridgeArt();
  ART.cupboard = cupboardArt(); ART.potrack = potrackArt(); ART.ceiling = ceilingArt();
  ART.dchair = dchairArt();
  ART.fish = ["...oooo..", ".ooxxxxo.", "ooXxxsxxo", ".ooxxxxo.", "...oooo.."];

  /* ===== 家门口：房子 + 门前小院 ===== */
  /* 房子侧墙 44x66（u=3.2 约 141x211px）：赤陶瓦屋檐 + 砖烟囱 / 奶油外墙横板 / 门头雨棚 / 大门 / 石砌台基
     门占 x10-27 y24-51，门上玻璃 x14-23 y28-34，烟囱 x27-36；scene.css 的点击区、门玻璃透光、冒烟都按这个比例对齐 */
  function houseArt() {
    function sl(x) { return Math.floor(x * 14 / 43); }
    return outline(grid(44, 66, function (x, y) {
      var s = sl(x), r = y - s;
      if (r < 0) {
        /* 烟囱：上面一圈压檐，砖缝一层一错 */
        if (x >= 27 && x <= 36 && y >= 1 && y <= 3) return y === 3 ? "u" : "J";
        if (x >= 28 && x <= 35 && y >= 4) {
          if (x === 35) return "u";
          var br = y - 4;
          return (br % 3 === 2 || (x + (Math.floor(br / 3) % 2) * 2) % 4 === 0) ? "F" : "j";
        }
        return ".";
      }
      /* 两排瓦，接缝上下错开，每排顶上亮、底下暗 */
      if (r <= 5) {
        if (r === 5) return "z";
        var sx = (x + (r >= 3 ? 3 : 0)) % 6;
        if (sx === 0 || ((r === 2 || r === 4) && sx === 5)) return "z";
        return (r === 1 || r === 3) ? "X" : "x";
      }
      if (r === 6) return "D";
      if (r === 7) return "C";
      if (x > 40) return ".";
      if (r === 8) return "a";
      if (y >= 52) {
        if (y === 52) return "S";
        return ((x * 2 + y) % 11 === 0 || y === 65) ? "H" : (y % 4 === 1 ? "S" : "Z");
      }
      if (x >= 38) return (x === 40) ? "a" : "C";
      /* 门头小雨棚 + 两个托架 */
      if (y >= 21 && y <= 23 && x >= 8 && x <= 29) return y === 21 ? "D" : y === 23 ? "z" : (x % 4 === 0 ? "z" : "x");
      if ((y === 24 || y === 25) && (x === 8 || x === 9 || x === 28 || x === 29)) return "D";
      if (x >= 10 && x <= 27 && y >= 24) {
        if (x === 10 || x === 27 || y === 24) return "D";
        if (x === 11 || x === 26 || y === 25) return "d";
        if (y >= 28 && y <= 34 && x >= 14 && x <= 23) {
          if (x === 18 || y === 31) return "D";
          return (x <= 17 && y <= 30) ? "q" : "b";
        }
        if (x === 25 && y >= 38 && y <= 40) return "Y";
        if (((y >= 37 && y <= 42) || (y >= 45 && y <= 50)) && x >= 13 && x <= 24) {
          return (x === 13 || x === 24 || y === 37 || y === 42 || y === 45 || y === 50) ? "D" : "w";
        }
        return (x >= 25) ? "d" : "w";
      }
      return ((y - 9) % 4 === 0) ? "F" : "f";
    }));
  }
  /* 石砌台阶 30x15（u=3 约 90x45px）：三级踏步，顶面高度等于门槛，坐下来小脚正好落上去 */
  function stepsArt() {
    return outline(grid(30, 15, function (x, y) {
      var lv = Math.floor(y / 5), inset = [5, 2, 0][lv], iy = y % 5;
      if (x < inset || x > 29 - inset) return ".";
      if (iy === 0) return "S";
      if (iy === 4) return "H";
      return ((x + lv * 4) % 9 === 0) ? "H" : "Z";
    }));
  }
  /* 信箱 16x34：木柱 + 圆顶铁皮箱 + 投信口 + 红色小旗（有信时 CSS 让它抖） */
  function mailboxArt() {
    return outline(grid(16, 34, function (x, y) {
      if (y <= 12) {
        if (x >= 12 && y >= 2 && y <= 6) return (x === 15 || y === 2) ? "R" : "r";
        if (x === 11 && y >= 2 && y <= 9) return "N";
        if (x > 10) return ".";
        if (y === 0) return (x >= 3 && x <= 8) ? "N" : ".";
        if (y === 1) return (x >= 2 && x <= 9) ? "n" : ".";
        if (y >= 7 && y <= 8 && x >= 3 && x <= 8) return "o";
        if (y >= 3 && y <= 5 && x <= 3) return "q";
        return (x >= 9) ? "N" : "n";
      }
      if (y <= 31) return (x >= 6 && x <= 9) ? (x === 9 ? "D" : "w") : ".";
      return (x >= 4 && x <= 11) ? "D" : ".";
    }));
  }
  /* 门口壁灯 12x14：壁板 + 弯臂 + 六角灯笼，挂在门左侧墙上，天黑自动亮也能手动开关 */
  function streetlampArt() {
    return outline(grid(12, 14, function (x, y) {
      if (y === 0) return (x >= 4 && x <= 7) ? "D" : ".";
      if (y === 1) return (x >= 4 && x <= 7) ? "a" : ".";
      if (y === 2) return (x >= 5 && x <= 6) ? "o" : ".";
      if (y === 3) return (x >= 2 && x <= 9) ? "D" : ".";
      if (y <= 11) {
        if (x < 2 || x > 9) return ".";
        if (x === 2 || x === 9) return "N";
        return (x <= 5) ? "Y" : "y";
      }
      if (y === 12) return (x >= 3 && x <= 8) ? "D" : ".";
      return (x >= 5 && x <= 6) ? "D" : ".";
    }));
  }
  /* 门牌 10x13：竖木牌 + 两颗钉子 + 两行刻字 + 小心形 */
  function doorplateArt() {
    return outline(grid(10, 13, function (x, y) {
      if (y === 0) return (x === 2 || x === 7) ? "o" : ".";
      if (x < 1 || x > 8) return ".";
      if (y === 1 || y === 12 || x === 1 || x === 8) return "D";
      if ((y === 3 || y === 5) && x >= 3 && x <= 6) return "C";
      if ((y === 8 && (x === 3 || x === 6)) || (y === 9 && x >= 3 && x <= 6) ||
        (y === 10 && x >= 4 && x <= 5)) return "r";
      return ((x + y) % 5 === 0) ? "W" : "w";
    }));
  }
  ART.mailbox = mailboxArt(); ART.steps = stepsArt();
  ART.streetlamp = streetlampArt(); ART.doorplate = doorplateArt();
  ART.house = houseArt();


  /* ===== 小院 Lv27 ===== */
  /* 秋千木架 46x64（u=2.4 约 110x154px）：横梁 + 顶角斜撑 + 两根立柱 + 石脚
     座板是单独一件 swseat，挂在横梁下面，可以绕横梁摆动 */
  function swingArt() {
    return outline(grid(46, 64, function (x, y) {
      if (y <= 3) return (x >= 1 && x <= 44) ? (y === 0 ? "W" : y === 3 ? "D" : "w") : ".";
      if (y >= 62) return ((x <= 7) || (x >= 38)) ? "Z" : ".";
      var d = y - 4;
      if (d <= 4 && ((x >= 6 + d && x <= 7 + d) || (x >= 38 - d && x <= 39 - d))) return "d";
      if (x >= 2 && x <= 5) return x === 5 ? "D" : "w";
      if (x >= 40 && x <= 43) return x === 43 ? "D" : "w";
      return ".";
    }));
  }
  /* 秋千座板 34x42：两股麻绳 + 六格木板。不走 outline，细绳会被整条描黑 */
  function swseatArt() {
    return grid(34, 42, function (x, y) {
      if (y <= 35) {
        if (x === 3 || x === 30) return "o";
        if (x === 4 || x === 29) return "C";
        return ".";
      }
      if (y === 36 || y === 41 || x === 0 || x === 33) return "o";
      return ((x - 1) % 8 === 0) ? "D" : (y === 37 ? "W" : "w");
    });
  }
  /* 吊床（后半）54x56（u=2.2 约 119x123px）：两根木桩 + 挂绳 + 下垂的粉条纹布后沿
     布面内宽 106px，啵啵刚好窝进去；前沿布边是单独一件 hmfront，渲染在啵啵身前 */
  function hammockArt() {
    function sag(x) { var m = (x - 26.5) / 21.5; return Math.round(14 + 16 * (1 - m * m)); }
    return outline(grid(54, 56, function (x, y) {
      if (x <= 4 || x >= 49) {
        if (y >= 54) return "D";
        if (y < 8) return ".";
        if (y <= 9) return "W";
        return (x === 4 || x === 53) ? "D" : "w";
      }
      if (y >= 10 && y <= 14) {
        if (x >= 5 && x <= 7 && y - 10 >= x - 5) return "C";
        if (x >= 46 && x <= 48 && y - 10 >= 48 - x) return "C";
      }
      var s = sag(x);
      if (y >= s && y <= s + 3) return ((x + y) % 7 < 3) ? "P" : "p";
      return ".";
    }));
  }
  /* 吊床前沿 44x18：弧形布边 + 一排小流苏，盖住啵啵下半身 */
  function hmfrontArt() {
    function sag(x) { var m = (x - 21.5) / 21.5; return Math.round(2 + 10 * (1 - m * m)); }
    return outline(grid(44, 18, function (x, y) {
      var s = sag(x);
      if (y >= s && y <= s + 3) return ((x + y) % 7 < 3) ? "p" : "P";
      if (y === s + 4 && x % 5 === 2) return "r";
      return ".";
    }));
  }
  /* 花草角 64x24（u=2.2 约 141x53px）：三丛灌木 + 五色小花 + 零散小草，整片当背景美化 */
  function gardenArt() {
    function mound(x, y, cx, w, h) {
      var dx = (x - cx) / w, dy = (y - 21) / h;
      return y <= 21 && dx * dx + dy * dy <= 1;
    }
    function bloom(x, y, cx, cy, c) {
      if (x === cx && y > cy + 1 && y <= 21) return "k";
      if (x === cx && y === cy) return "Y";
      if ((x === cx - 1 || x === cx + 1) && y === cy) return c;
      if (x === cx && (y === cy - 1 || y === cy + 1)) return c;
      return "";
    }
    return outline(grid(64, 24, function (x, y) {
      var f = bloom(x, y, 11, 10, "r") || bloom(x, y, 22, 7, "y") || bloom(x, y, 34, 11, "s") ||
        bloom(x, y, 45, 8, "l") || bloom(x, y, 56, 11, "p");
      if (f) return f;
      if (y >= 22) return (x % 9 === 0) ? "D" : "z";
      if (mound(x, y, 6, 6, 9) || mound(x, y, 28, 9, 12) || mound(x, y, 50, 7, 10))
        return ((x * 3 + y * 5) % 13 === 0) ? "k" : (x % 7 < 3 ? "G" : "g");
      if ((x % 11 === 4 && y >= 20) || (x % 11 === 5 && y >= 19)) return "g";
      return ".";
    }));
  }
  /* 小鸟食台 20x46（u=2.2 约 44x101px）：尖顶小棚 + 谷粒托盘 + 立柱 + 石基 */
  function feederArt() {
    return outline(grid(20, 46, function (x, y) {
      if (y <= 5) {
        if (Math.abs(x - 9.5) > 2 + y * 1.6) return ".";
        return (y === 5) ? "z" : (x < 9 ? "X" : "x");
      }
      if (y <= 8) return (x >= 2 && x <= 17) ? (y === 6 ? "D" : "w") : ".";
      if (y <= 11) {
        if (x === 3 || x === 16) return "d";
        return (y === 11 && x >= 4 && x <= 15) ? "y" : ".";
      }
      if (y <= 13) return (x >= 2 && x <= 17) ? (y === 12 ? "W" : "D") : ".";
      if (y <= 42) return (x >= 8 && x <= 11) ? (x === 11 ? "D" : "w") : ".";
      return (x >= 5 && x <= 14) ? "Z" : ".";
    }));
  }
  ART.swing = swingArt(); ART.swseat = swseatArt();
  ART.hammock = hammockArt(); ART.hmfront = hmfrontArt();
  ART.garden = gardenArt(); ART.feeder = feederArt();


  var cache = {};
  ART.gh_shelf=["....................","....p.....y....l....","...pPp...yYy...lLl...","....k.....k.....k...","..oXXo..oXXo..oXXo..","..oXXo..oXXo..oXXo..",".oooooooooooooooooo.",".oWWWWWWWWWWWWWWWWo.",".oooooooooooooooooo.","..oo..........oo....","..ow..........ow....","..oo..........oo...."];
  ART.gh_hanging=["........o...........","........o...........","....oooooooooo......","....oXXXXXXXXo......","....oooooooooo......",".....gkgkgkgk.......",".....kGgGgGgk.......",".....kgkgkgGk.......","......GkGkGk........",".......k.k.k........"];
  ART.gh_lights=["oooooooooooooooooooo","...o....o....o....o.","..CCC..CCC..CCC..CCC","..CYC..CYC..CYC..CYC","..CcC..CcC..CcC..CcC","..CCC..CCC..CCC..CCC"];
  ART.gh_mat=["kkkkkkkkkkkkkkkkkkkk","kgggggggggggggggggak","kgGGggGGggGGggGGggak","kgGGggGGggGGggGGggak","kgggggggggggggggggak","kgGGggGGggGGggGGggak","kgGGggGGggGGggGGggak","kgggggggggggggggggak","kkkkkkkkkkkkkkkkkkkk"];
  function sprite(id) {
    if (!ART[id]) id = "pillow";
    if (cache[id]) return cache[id];
    var g = ART[id], w = 0, out = "";
    g.forEach(function (r) { w = Math.max(w, r.length); });
    g.forEach(function (row, y) {
      for (var x = 0; x < row.length;) {
        var ch = row.charAt(x), n = 1;
        while (row.charAt(x + n) === ch) n++;
        if (PAL[ch]) out += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + PAL[ch] + '"/>';
        x += n;
      }
    });
    return (cache[id] = { w: w, h: g.length,
      svg: '<svg viewBox="0 0 ' + w + ' ' + g.length + '" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">' + out + '</svg>' });
  }

  /* 默认摆位：按你导出的布局写死。x: 水平中心(%)  b: 离舞台底部(px，按 330px 宽设计)  u: 像素放大倍数  z: 前后顺序 */
  var SLOT = {
    bed:    { x: 22, b: 12,  u: 3,   z: 2 },
    rug:    { x: 66, b: 6,   u: 3,   z: 1, flat: true },
    table:  { x: 50, b: 86,  u: 3,   z: 1 },
    shelf:  { x: 88, b: 104, u: 4.2, z: 1 },
    lamp:   { x: 76, b: 0,   u: 2.6, z: 1, hang: true },
    pillow: { x: 13, b: 83,  u: 2.8, z: 3 },
    flower: { x: 50, b: 131, u: 2.2, z: 3 },
    tree:   { x: 91, b: 2,   u: 3.2, z: 9, front: true }
  };
  /* 上位替换接口：同族只显示 TIER 最高的那件。现在先空着，
     以前把吊床和床编成同一族，结果摆上吊床卧室的床就不见了 */
  var TIER = {}, FAMILY = {};
  /* v3：自定义位置存成"相对默认位置的偏移"，有床、没床两种摆法互不带歪 */
  var LKEY = "boobo_layout_v5", OV = {};
  /* 这三个 key 是窗户（不是家具），缩放下限放宽 */
  var WINK = { window: 1, kwin: 1, lwin: 1 };
  var EDNAME = { window: "卧室窗户", kwin: "厨房小窗", lwin: "客厅窗", house: "房子屋檐", steps: "门口台阶" };
  try { OV = JSON.parse(localStorage.getItem(LKEY) || "{}") || {}; } catch (e) { OV = {}; }
  function saveOV() { try { localStorage.setItem(LKEY, JSON.stringify(OV)); } catch (e) {} }
  /* 家门口的默认值已按实机导出结果写死，把旧的手调偏移清掉，否则会再偏一次 */
  if (OV.__v !== 29) {
    ["house", "door", "steps", "mailbox", "doorplate", "streetlamp", "doormat"].forEach(function (k) { delete OV[k]; });
    OV.__v = 29;
    saveOV();
  }
  function r2(v) { return Math.round(v * 100) / 100; }
  function base(id) { var s = SLOT[id] || { x: 40, b: 96, u: 3, z: 1 }, m = {}; for (var key in s) m[key] = s[key]; return m; }
  if(OV.__yard33!==1){["swing","garden","feeder"].forEach(function(id){delete OV[id];});OV.__yard33=1;saveOV();}
  function apply(id, m) {
    var o = OV[id] || {};
    m.x = r2(m.x + (Number(o.x) || 0));
    m.b = r2(m.b + (Number(o.b) || 0));
    m.u = r2(Math.max(WINK[id] ? 0.4 : 1, m.u + (Number(o.u) || 0)));
    return m;
  }

  /* 家具互相参照：窗跟床头、柜子贴床右、花在柜子上（没柜子放窗台）、抱枕有床放床上、没床啵啵抱着 */
  function layout(have) {
    var L = {}, bed = have.bed ? apply("bed", base("bed")) : null, petX = bed ? 66 : 50, f = bed ? bed.u / 3 : 1;
    if (bed) L.bed = bed;
    L.window = apply("window", { x: bed ? r2(bed.x + 6 * f) : 28, b: 196, u: 1 });
    var order = ["rug", "table", "shelf", "lamp", "pillow", "tree", "flower"];
    Object.keys(have).forEach(function (id) { if (order.indexOf(id) < 0 && id !== "bed" && id !== "window") order.push(id); });
    order.forEach(function (id) {
      if (!have[id]) return;
      var m = base(id);
      if (id === "table") m.x = bed ? r2(bed.x + 28 * f) : 24;
      if (id === "rug") m.x = petX;
      if (id === "lamp") m.x = petX + 10;
      if (id === "pillow") {
        if (!bed) { L.pillow = { x: petX, b: 0, u: 1, hug: true }; return; }
        m.x = r2(bed.x - 9 * f); m.b = bed.b + Math.round(23.7 * bed.u);
      }
      if (id === "flower") {
        if (L.table) { m.x = L.table.x; m.b = L.table.b + 15 * L.table.u; }
        else { m.x = r2(L.window.x + 10 * L.window.u); m.b = L.window.b + 2; }
      }
      L[id] = apply(id, m);
    });
    return L;
  }

  /* ===== 场景：卧室 / 客厅 ===== */
  var SCENES = [{ id: "bed", name: "卧室", lv: 1 }, { id: "living", name: "客厅", lv: 5 },
    { id: "kitchen", name: "厨房", lv: 17 }, { id: "door", name: "家门口", lv: 24 },
    { id: "yard", name: "小院", lv: 27 }, { id: "flower", name: "花圃", lv: 31 }];
  var SCENE_OF = { sofa: "living", tv: "living", tank: "living", toybox: "living", board: "living",
    clock: "living", phono: "living", wallshelf: "living", floorlamp: "living", artframe: "living",
    stove: "kitchen", dtable: "kitchen", fridge: "kitchen", cupboard: "kitchen", potrack: "kitchen",
    ceiling: "kitchen", dchair: "kitchen",
    steps: "door", mailbox: "door", streetlamp: "door", doorplate: "door",
    swing: "yard", swrope: "yard", swseat: "yard", hammock: "yard", hmfront: "yard",
    gh_workbench:"flower",gh_shelf:"flower",gh_hanging:"flower",gh_lights:"flower",gh_mat:"flower",garden: "yard", feeder: "yard" };
  var SKEY = "boobo_scene_v1", scene = "bed";
  try {
    var saved = localStorage.getItem(SKEY);
    if (SCENES.some(function (s) { return s.id === saved; })) scene = saved;
  } catch (e) {}
  function sceneOf(id) { return SCENE_OF[id] || "bed"; }
  function storeScene(n) {
    if (n === scene) return false;
    scene = n;
    try { localStorage.setItem(SKEY, n); } catch (e) {}
    setTimeout(function () { try { document.dispatchEvent(new CustomEvent("boobo:scene", { detail: { scene: n } })); } catch (e) {} }, 0);
    return true;
  }
  function setScene(n) { if (storeScene(n)) redraw(); }
  /* 客厅：沙发是主体，墙上挂件高低错开，电视柜靠右墙，前景玩具箱和鱼缸，落地灯站在沙发前面 */
  var LSLOT = {
    floorlamp: { x: 6,  b: 34,  u: 2.6, z: 3 },
    sofa:      { x: 27, b: 62,  u: 3.6, z: 2 },
    board:     { x: 23, b: 192, u: 4.8, z: 1, wall: true },
    wallshelf: { x: 56, b: 174, u: 2.4, z: 1, wall: true },
    clock:     { x: 60, b: 244, u: 2.6, z: 1, wall: true },
    tv:        { x: 82, b: 98,  u: 3.2, z: 1 },
    artframe:  { x: 86, b: 218, u: 2.6, z: 1, wall: true },
    toybox:    { x: 44, b: 46,  u: 2.2, z: 4 },
    tank:      { x: 88, b: 4,   u: 2.4, z: 9, front: true }
  };
  /* 厨房（按开发者导出的布局写死）。dtable 是桌+椅的锚点中心，拆分位置自动算 */
  var KSLOT = {
    fridge:   { x: 16, b: 94,  u: 4,   z: 2 },
    stove:    { x: 82, b: 98,  u: 3.6, z: 2 },
    cupboard: { x: 44, b: 104, u: 3,   z: 1, wall: true },
    potrack:  { x: 89, b: 220, u: 2.2, z: 1, wall: true },
    ceiling:  { x: 22, b: 0,   u: 2.6, z: 1, hang: true },
    dtable:   { x: 34, b: 16,  u: 3.6, z: 3 }
  };
  var KWIN = { x: 54, b: 222, u: 1.2 }, LWIN = { x: 28, b: 196, u: 1 };
  /* 家门口：房子在左半边，台阶脚垫在门下，信箱和路灯立在右边小路旁 */
  var DSLOT = {
    steps:      { x: 18, b: 0,   u: 3,   z: 2, flat: true },
    doorplate:  { x: 32.5, b: 82, u: 2.6, z: 2, wall: true },
    streetlamp: { x: 4.5,  b: 98, u: 2.2, z: 2, wall: true },
    mailbox:    { x: 48, b: 26,  u: 2.4, z: 2 }
  };
  var DHOUSE = { x: 21, b: 0, u: 3.2 };
  /* 小院：秋千在左、石桌椅居中、吊床在右、小树苗贴右边框、篱笆在后面当院墙 */
  var YSLOT = {
    garden:  { x:48, b:4, u:2, z: 2, flat: true },
    feeder:  { x:90, b:10,  u:2.2, z: 2 },
    swing:   { x:26, b:50,  u:3, z: 2 },
    hammock: { x: 68, b: 0,  u: 2, z: 2 }
  };
  function slotLayout(have, TBL, win, wkey) {
    var L = { window: apply(wkey, { x: win.x, b: win.b, u: win.u }) };
    Object.keys(have).forEach(function (id) {
      var sl = TBL[id];
      if (!sl) return;
      var m = {};
      for (var key in sl) m[key] = sl[key];
      L[id] = apply(id, m);
    });
    /* 餐桌拆件：椅子留在背景层，桌子提到前景层，啵啵正好夹在中间 */
    if (TBL === KSLOT && L.dtable) {
      var t = L.dtable, sh = t.u * 0.303;
      L.dchair = { x: r2(t.x + 16.5 * sh), b: t.b, u: t.u, z: 2 };
      L.dtable = { x: r2(t.x - 6.5 * sh), b: t.b, u: t.u, z: 9, front: true, ax: t.x };
    }
    /* 秋千座板挂在横梁下；吊床前沿提到前景层，啵啵正好夹在布面中间 */
    if (TBL === YSLOT) {
      if (L.swing) {
        L.swrope={x:L.swing.x,b:r2(L.swing.b+8*L.swing.u),u:L.swing.u,z:1,flat:true};
        L.swseat={x:L.swing.x,b:r2(L.swing.b+8*L.swing.u),u:L.swing.u,z:5,front:true,flat:true};
      }
      if (L.hammock) L.hmfront = { x: L.hammock.x, b: r2(L.hammock.b + 16 * L.hammock.u),
        u: L.hammock.u, z: 9, front: true, flat: true };
    }
    return L;
  }
  var prev = null, last = null, lay = {}, forced = "";
  /* 出场动画每件只播一次，收起来再摆才会重播，避免重绘时乱闪 */
  var seenNew = {}, hadCur = null;
  var PHASE_NAME = { day: "白天", dusk: "黄昏", night: "夜晚", dawn: "清晨" };
  var CYCLE = ["day", "dusk", "night", "dawn", ""];
  function phase() {
    if (forced) return forced;
    var h = new Date().getHours();
    if (h >= 7 && h < 17) return "day";
    if (h >= 5 && h < 7) return "dawn";
    if (h >= 17 && h < 19) return "dusk";
    return "night";
  }
  /* BOOBO_PREVIEW_V44：商店只用小幅概括图，舞台素材保持独立。 */
  function previewIcon(id) {
    var shapes={
      gh_workbench:[[3,14,26,3,"#bb8259"],[5,17,3,12,"#986343"],[24,17,3,12,"#986343"],[7,17,18,9,"#986343"],[9,19,6,5,"#d5a16f"],[17,19,6,5,"#d5a16f"],[15,18,2,7,"#986343"],[11,21,2,1,"#e5ba70"],[19,21,2,1,"#e5ba70"],[7,10,9,4,"#bb8259"],[9,5,2,5,"#579552"],[6,5,4,2,"#8aca79"],[11,3,4,2,"#8aca79"],[21,8,5,6,"#d9bc88"]],
      gh_shelf:[[5,14,3,16,'#986343'],[24,14,3,16,'#986343'],[3,14,26,3,'#bb8259'],[3,24,26,3,'#bb8259'],[7,9,6,5,'#cf9875'],[20,9,6,5,'#cf9875'],[9,5,2,4,'#579552'],[22,5,2,4,'#579552'],[7,3,6,3,'#e6a3b2'],[20,3,6,3,'#e8c866'],[12,20,8,4,'#a8bb84']],
      gh_lights:[[2,6,28,2,'#8c7657'],[6,8,2,5,'#8c7657'],[15,8,2,8,'#8c7657'],[24,8,2,5,'#8c7657'],[4,13,6,7,'#eac96d'],[13,16,6,7,'#eac96d'],[22,13,6,7,'#eac96d'],[6,14,2,4,'#fff1bb'],[15,17,2,4,'#fff1bb'],[24,14,2,4,'#fff1bb']],
      gh_mat:[[4,9,24,16,'#579552'],[7,12,18,10,'#b4d38d'],[10,12,3,10,'#83b46c'],[19,12,3,10,'#83b46c'],[7,16,18,3,'#83b46c'],[1,12,3,10,'#579552'],[28,12,3,10,'#579552']],
      swing:[[3,3,26,3,'#bb8259'],[4,6,3,24,'#986343'],[25,6,3,24,'#986343'],[10,6,2,15,'#b99d70'],[20,6,2,15,'#b99d70'],[9,21,14,4,'#bb8259'],[9,24,14,2,'#75503c']],
      garden:[[3,17,9,9,'#6ba75f'],[10,12,12,14,'#8aca79'],[21,16,9,10,'#6ba75f'],[1,26,30,3,'#bb8259'],[14,5,3,7,'#579552'],[11,3,9,4,'#e7c35e'],[5,12,3,6,'#579552'],[3,10,7,3,'#e79fae']],
      feeder:[[14,13,4,17,'#986343'],[7,11,18,3,'#bb8259'],[9,5,3,6,'#986343'],[21,5,3,6,'#986343'],[6,3,20,3,'#bb8259'],[4,6,24,2,'#d5a16f'],[10,11,3,2,'#eac96d'],[18,11,3,2,'#eac96d']]
    };
    if(!shapes[id])return '';
    // 和原家具图标一样：保留简化形状，把临近空白的边缘像素染成深棕。
    var pixels=Array.from({length:32},function(){return Array(32).fill('');});
    shapes[id].forEach(function(a){for(var y=a[1];y<a[1]+a[3];y++)for(var x=a[0];x<a[0]+a[2];x++)if(y>=0&&y<32&&x>=0&&x<32)pixels[y][x]=a[4];});
    var body='';
    function color(x,y){var c=pixels[y][x];if(!c)return '';return [[-1,0],[1,0],[0,-1],[0,1]].some(function(d){var row=pixels[y+d[1]];return !row||!row[x+d[0]];})?'#5a3d2b':c;}
    for(var y=0;y<32;y++)for(var x=0;x<32;){var c=color(x,y);if(!c){x++;continue;}var start=x++;while(x<32&&color(x,y)===c)x++;body+='<rect x="'+start+'" y="'+y+'" width="'+(x-start)+'" height="1" fill="'+c+'"/>';}
    return '<svg data-preview="simple" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">'+body+'</svg>';
  }

  function stageEl() { return document.getElementById("petStage"); }
  /* 门前小院：天空 / 日月星 / 云 / 远山远树 / 篱笆 / 草地 / 灌木 / 石板路 / 小花
     颜色全走 CSS 变量，跟着 #petStage[data-time] 换整套，和窗外同一个逻辑 */
  function ensureYard(st) {
    if (document.getElementById("rmYard")) return;
    var h = "";
    for (var i = 0; i < 12; i++) h += '<i class="yd-st s' + i + '"></i>';
    st.insertAdjacentHTML("afterbegin", '<div class="rm-yard" id="rmYard" aria-hidden="true">' +
      '<i class="yd-glow"></i><i class="yd-sun"></i><i class="yd-moon"></i><i class="yd-shoot"></i>' + h +
      '<i class="yd-cl a"></i><i class="yd-cl b"></i><i class="yd-cl c"></i>' +
      '<i class="yd-hill x"></i><i class="yd-hill f"></i><i class="yd-tree t1"></i><i class="yd-tree t2"></i><i class="yd-tree t3"></i>' +
      '<i class="yd-hill n"></i><i class="yd-fence"></i><i class="yd-grass"></i><i class="yd-tuft"></i>' +
      '<i class="yd-bush b1"></i><i class="yd-bush b2"></i><i class="yd-path"></i>' +
      '<i class="yd-flo f1"></i><i class="yd-flo f2"></i>' +
      '<i class="yd-flo f3"></i><i class="yd-flo f4"></i><i class="yd-flo f5"></i><i class="yd-flo f6"></i>' +
      '<i class="yd-bird b1"></i><i class="yd-bird b2"></i><i class="yd-fly"></i>' +
      '<i class="yd-ff a"></i><i class="yd-ff b"></i><i class="yd-ff c"></i></div>');
  }
  function ensureWindow(st) {
    ensureYard(st);
    if (document.getElementById("rmWindow")) return;
    var old = document.getElementById("roomWindow");
    if (old) old.remove();
    var stars = "";
    for (var i = 0; i < 6; i++) stars += '<i class="rw-star s' + i + '"></i>';
    var cur = sprite("window").svg;
    st.insertAdjacentHTML("afterbegin", '<div class="rm-window" id="rmWindow" aria-hidden="true">' +
      '<div class="rw-view"><i class="rw-sun"></i><i class="rw-moon"></i>' + stars +
      '<i class="rw-cloud a"></i><i class="rw-cloud b"></i><i class="rw-hill"></i></div>' +
      '<i class="rm-sill"></i><span class="rm-cur l">' + cur + '</span><span class="rm-cur r">' + cur + '</span>' +
      '<span class="rm-val">' + sprite("valance").svg + '</span></div>');
  }
  /* 房子（外墙 + 屋檐 + 大门）是常驻画面，不进商店，位置可用布局编辑器调 */
  function placeHouse(st, k) {
    var el = document.getElementById("rmHouse");
    if (!el) {
      var old = document.getElementById("rmDoor");
      if (old) old.remove();
      st.insertAdjacentHTML("afterbegin", '<div class="rm-house" id="rmHouse">' + sprite("house").svg +
        '<i class="hs-smoke"><i></i><i></i><i></i></i><i class="hs-glow"></i><i class="hs-win"></i>' +
        '<button type="button" class="hs-door" id="rmDoorHit" aria-label="进屋去"></button></div>');
      el = document.getElementById("rmHouse");
    }
    var m = apply("house", { x: DHOUSE.x, b: DHOUSE.b, u: DHOUSE.u }), a = sprite("house");
    lay.house = m;
    el.style.left = m.x + "%";
    el.style.bottom = Math.round(m.b * k) + "px";
    el.style.width = Math.round(a.w * m.u * k) + "px";
    el.style.height = Math.round(a.h * m.u * k) + "px";
  }

  function sync(state) {
    var st = stageEl();
    if (!st) return;
    ensureWindow(st);
    st.dataset.time = phase();
    var asleep = !!(state && state.sleeping);
    st.classList.toggle("is-asleep", asleep);
    st.classList.toggle("sleep-bed", asleep && st.classList.contains("has-bed"));
  }
  /* 家具上的动态小装饰（CSS 里把它们提到家具图上层） */
  function extraOf(id) {
    if (id === "stove") return '<i class="stm"><i></i><i></i><i></i></i>';
    if (id === "lamp" || id === "floorlamp" || id === "ceiling" || id === "streetlamp") return '<i class="rm-glow"></i>';
    if (id === "feeder") return '<i class="fd-bird">' + window.BooboPolish.bird + '</i>';
    if (id === "tv") return '<i class="scr tv-scr"><i><b></b></i><i><s></s></i><i><u></u></i></i>';
    if (id === "clock") {
      var d = new Date(), m = d.getMinutes(), h = d.getHours() % 12;
      return '<span class="ck"><i class="hh" style="transform:rotate(' + (h * 30 + m * 0.5) + 'deg)"></i>' +
        '<i class="mm" style="transform:rotate(' + (m * 6) + 'deg)"></i></span>';
    }
    if (id === "tank") {
      var f = sprite("fish").svg;
      return '<i class="fish f1">' + f + '</i><i class="fish f2">' + f + '</i>' +
        '<i class="bub b1"></i><i class="bub b2"></i><i class="bub b3"></i>';
    }
    return "";
  }
  var TAPPABLE = { tv: 1, floorlamp: 1, lamp: 1, toybox: 1, sofa: 1, tank: 1, board: 1, clock: 1,
    stove: 1, dtable: 1, dchair: 1, fridge: 1, cupboard: 1, potrack: 1, ceiling: 1,
    mailbox: 1, steps: 1, streetlamp: 1, doorplate: 1,
    swing: 1, swrope: 1, swseat: 1, feeder: 1,
    bed: 1, shelf: 1, table: 1, tree: 1, pillow: 1 };
  var FIXED = { steps: 1 };
  /* 合成件 -> 本体，用来判断出场动画和导出布局 */
  var SYN = { dchair: "dtable", swseat: "swing", swrope: "swing", hmfront: "hammock" };
  function piece(cls, id, s, k, extra, title) {
    var a = sprite(id), u = s.u * k;
    if (TAPPABLE[id]) cls += " tappable";
    var pos = s.hang ? "top:" + Math.round(-s.b * k) + "px" : "bottom:" + Math.round(s.b * k) + "px";
    return '<span class="' + cls + '" style="left:' + s.x + '%;' + pos + ';width:' + Math.round(a.w * u) +
      'px;height:' + Math.round(a.h * u) + 'px;z-index:' + (s.z || 1) + '"' +
      (title ? ' title="' + esc(title) + '"' : "") + '>' + (extra || "") + a.svg + '</span>';
  }

  /* 没床时啵啵抱着的抱枕：画在啵啵身体里，跟着一起动 */
  function hugEl() {
    var pc = document.getElementById("petCharacter");
    if (!pc) return null;
    var h = document.getElementById("petHug");
    if (!h) {
      pc.insertAdjacentHTML("beforeend", '<span class="pet-hug" id="petHug" hidden>' + sprite("pillow").svg + '</span>');
      h = document.getElementById("petHug");
    }
    return h;
  }
  function draw(state, items, back, front) {
    if (window.BooboPolish) window.BooboPolish.ungroup(stageEl());
    last = [state, items, back, front];
    var st = stageEl();
    if (!st) return;
    ensureWindow(st);
    var k = Math.max(0.8, Math.min(1.2, (st.clientWidth || 330) / 330));
    var placed = (state.placed || []).slice(), have = {}, fam = {};
    items.forEach(function (it) { if (placed.indexOf(it.id) >= 0) have[it.id] = it; });
    Object.keys(have).forEach(function (id) {
      var f = FAMILY[id];
      if (f && (!fam[f] || (TIER[id] || 0) > (TIER[fam[f]] || 0))) fam[f] = id;
    });
    Object.keys(have).forEach(function (id) { if (FAMILY[id] && fam[FAMILY[id]] !== id) delete have[id]; });
    if (prev) {
      var fresh = placed.filter(function (id) { return prev.indexOf(id) < 0; });
      if (fresh.length === 1) storeScene(sceneOf(fresh[0]));
    }
    st.dataset.scene = scene;
    /* 家门口和小院共用同一套天空分层，颜色和日月星都跟着 data-time 走 */
    st.classList.toggle("sky-scene", scene === "door" || scene === "yard" || scene === "flower");
    Object.keys(have).forEach(function (id) { if (sceneOf(id) !== scene) delete have[id]; });
    /* 台阶是房子自带的，不用买 */
    if (scene === "door") have.steps = { id: "steps", name: "门口台阶" };
    if (scene === "kitchen" && have.dtable) have.dchair = have.dtable;
    if (scene === "yard") {
      if (have.swing) {have.swseat=have.swing;have.swrope=have.swing;}

    }
    lay = scene === "living" ? slotLayout(have, LSLOT, LWIN, "lwin")
      : scene === "kitchen" ? slotLayout(have, KSLOT, KWIN, "kwin")
      : scene === "door" ? slotLayout(have, DSLOT, LWIN, "lwin")
      : scene === "yard" ? slotLayout(have, YSLOT, LWIN, "lwin") : scene === "flower" ? slotLayout({}, {}, LWIN, "lwin") : layout(have);
    if (scene === "door") placeHouse(st, k);
    var B = [], F = [];
    Object.keys(lay).sort(function (a, b) { return (lay[a].z || 0) - (lay[b].z || 0); }).forEach(function (id) {
      var s = lay[id];
      if (id === "window" || id === "garden" || !have[id] || s.hug) return;
      var kid = SYN[id] || id;
      var fresh = !FIXED[kid] && prev && prev.indexOf(kid) < 0 && !seenNew[kid];
      if (fresh) seenNew[kid] = 1;
      var cls = "rm-fur rm-" + id + (s.flat || s.hang || s.wall ? "" : " floor") + (fresh ? " is-new" : "");
      (s.front ? F : B).push(piece(cls, id, s, k, extraOf(id), have[id].name));
    });
    var bed = lay.bed;
    if (bed) {
      F.push(piece("rm-fur rm-bed rm-cover tappable", "cover", { x: bed.x, b: bed.b + (ART.bed.length - COVER[1]) * bed.u, u: bed.u, z: 1 }, k));
      st.style.setProperty("--bed-x", r2(bed.x + 9 * bed.u / 3) + "%");
      st.style.setProperty("--bed-pb", Math.round((bed.b + 20 * bed.u) * k) + "px");
      st.style.setProperty("--bed-s", (0.52 * k * bed.u / 3).toFixed(3));
    }
    var w = lay.window;
    st.style.setProperty("--win-x", w.x + "%");
    st.style.setProperty("--win-b", Math.round(w.b * k) + "px");
    st.style.setProperty("--win-s", String(w.u));
    var hug = hugEl();
    if (hug) hug.hidden = !(lay.pillow && lay.pillow.hug);
    prev = placed;
    Object.keys(seenNew).forEach(function (id) { if (placed.indexOf(id) < 0) delete seenNew[id]; });
    /* 窗帘不是 .rm-fur，单独给它一次挂上去的动画 */
    var cur = !!have.window;
    if (scene === "bed" && hadCur === false && cur) {
      st.classList.remove("cur-in"); void st.offsetWidth; st.classList.add("cur-in");
      setTimeout(function () { st.classList.remove("cur-in"); }, 420);
    }
    if (scene === "bed") hadCur = cur;
    st.classList.toggle("has-bed", !!bed);
    st.classList.toggle("has-curtain", cur);
    st.classList.toggle("has-lamp", !!have.lamp);
    st.classList.toggle("has-sofa", !!have.sofa);
    st.classList.toggle("has-tv", !!have.tv);
    st.classList.toggle("has-tank", !!have.tank);
    st.classList.toggle("has-dtable", !!have.dtable);
    if (back) back.innerHTML = (Object.keys(have).length ? "" : '<span class="empty-room">等你来装饰这里</span>') + B.join("");
    if (front) front.innerHTML = F.join("");
    sync(state);
    if (window.BooboPolish) { window.BooboPolish.plants(st,state); window.BooboPolish.group(st); }
  }
  function redraw() { if (last) {draw(last[0],last[1],last[2],last[3]);if(window.BooboFlower)window.BooboFlower.render();} }

  function cycleTime() {
    forced = CYCLE[(CYCLE.indexOf(forced) + 1) % CYCLE.length];
    sync(last ? last[0] : null);
    return forced ? PHASE_NAME[forced] : "跟随真实时间";
  }

  /* 出场动画播完就摘掉 is-new，否则别的动画结束后会回落重播 */
  document.addEventListener("animationend", function (ev) {
    var t = ev.target;
    if (t && t.classList && t.classList.contains("is-new") && ev.animationName === "rm-in") t.classList.remove("is-new");
  }, true);
  var rz = 0;
  window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(redraw, 200); });
  setInterval(function () { if (last) sync(last[0]); }, 60000);

  window.BooboRoom = {
    flowerDefaults: function(map){
      if(OV.__flower42===1)return;
      Object.keys(map).forEach(function(id){OV[id]=Object.assign({},map[id]);});
      OV.__flower42=1;saveOV();
    },
    flowerFinishingDefaults:function(map){
      if(OV.__flower44===1)return;
      Object.keys(map).forEach(function(id){OV[id]=Object.assign({},map[id]);});
      OV.__flower44=1;saveOV();
    },
    flowerDetailDefaults:function(){
      if(OV.__flower45===1)return;
      OV.fl_row1={x:0,b:0,u:0};OV.fl_row2={x:0,b:0,u:0};OV.__flower45=1;saveOV();
    },
    flowerOutlineDefaults:function(){
      if(OV.__flower46===1)return;
      OV.gh_workbench={x:-2,b:0,u:.4};OV.__flower46=1;saveOV();
    },
    flowerLayout: function(id,m){return apply(id,m);}, draw: draw, sync: sync, cycleTime: cycleTime, phase: phase, ART: ART,
    scene: function () { return scene; }, setScene: setScene, sceneOf: sceneOf, SCENES: SCENES, redraw: redraw,
    spotOf: function (id) {
      var m = lay[id];
      if (!m) return null;
      var a = sprite(id), st = stageEl();
      var k = st ? Math.max(0.8, Math.min(1.2, (st.clientWidth || 330) / 330)) : 1;
      return { x: m.x, b: Math.round(m.b * k), w: Math.round(a.w * m.u * k), h: Math.round(a.h * m.u * k) };
    },
    placedIds: function () { return last ? (last[0].placed || []).filter(function (id) { return sceneOf(id) === scene; }) : []; },
    /* 布局编辑器用：当前场景能调的东西 = 摆着的家具 + 这个场景的窗户 */
    winKey: function () { return scene === "kitchen" ? "kwin" : scene === "living" ? "lwin" : "window"; },
    nameOf: function (id) { return ({fl_row1:"第一排花田",fl_row2:"第二排花田"})[id] || EDNAME[id] || id; },
    editIds: function () {
      var ids = last ? (last[0].placed || []).filter(function (id) { return id !== "garden" && sceneOf(id) === scene; }) : [];
      if (scene === "bed" || scene === "kitchen") {
        var wk = scene === "kitchen" ? "kwin" : "window";
        if (ids.indexOf(wk) < 0) ids.push(wk);
      }
      if (scene === "door") {
        if (ids.indexOf("house") < 0) ids.push("house");
        if (ids.indexOf("steps") < 0) ids.push("steps");
      }
      if(scene==="flower")ids=ids.concat(["fl_row1","fl_row2"]);
      return ids;
    },
    nudge: function (id, key, d) {
      OV[id] = OV[id] || {};
      OV[id][key] = r2((Number(OV[id][key]) || 0) + d);
      saveOV(); redraw();
    },
    resetLayout: function (id) {
      var defaults={gh_workbench:{x:-2,b:0,u:.4},gh_shelf:{x:-66,b:60,u:0},gh_lights:{x:0,b:0,u:0},gh_mat:{x:0,b:0,u:0}};
      if(id){if(defaults[id])OV[id]=defaults[id];else delete OV[id];}
      else{OV={__flower42:1,__flower44:1,__flower45:1,__flower46:1};Object.keys(defaults).forEach(function(k){OV[k]=defaults[k];});}
      saveOV();redraw();
    },
    exportLayout: function () { return JSON.stringify(OV); },
    dumpLayout: function () {
      var o = { scene: scene }, wk = scene === "kitchen" ? "kwin" : scene === "living" ? "lwin" : "window";
      Object.keys(lay).forEach(function (id) {
        if (lay[id].hug || SYN[id] || (scene !== "bed" && scene !== "kitchen" && id === "window")) return;
        o[id === "window" ? wk : id] = { x: lay[id].ax != null ? lay[id].ax : lay[id].x,
          b: lay[id].b, u: lay[id].u };
      });
      return JSON.stringify(o);
    },
    icon: function (id) { var simple=previewIcon(id);if(simple)return simple;return sprite(id === "window" ? "wicon" : id).svg.replace(' preserveAspectRatio="none"', ""); }
  };
})();
