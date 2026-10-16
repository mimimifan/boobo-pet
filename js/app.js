
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = "boobo_pet_v2";
  const defaults = {
    hunger: 66, mood: 72, energy: 78, bond: 8,
    stars: 0, owned: [], placed: [], paid: {}, games: 0, sleeping: false
  };
  const items = [
    { id:"flower", name:"小花花", icon:"✿", cost:5, desc:"一朵心情很好的小花" },
    { id:"pillow", name:"软乎抱枕", icon:"▣", cost:8, desc:"软软的，适合发呆" },
    { id:"lamp", name:"星星吊灯", icon:"✦", cost:12, desc:"挂在天花板上，夜里暖暖的" }
  ];

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return {
          hunger: clamp(data.hunger ?? defaults.hunger),
          mood: clamp(data.mood ?? defaults.mood),
          energy: clamp(data.energy ?? defaults.energy),
          bond: clamp(data.bond ?? defaults.bond),
          stars: Math.max(0, Math.floor(Number(data.stars) || 0)),
          owned: Array.isArray(data.owned) ? data.owned.filter(id => typeof id === "string") : [],
          placed: Array.isArray(data.placed) ? data.placed.filter(id => typeof id === "string") : [],
          paid: data.paid && typeof data.paid === "object" ? data.paid : {},
          games: Math.max(0, Math.floor(Number(data.games) || 0)),
          sleeping: Boolean(data.sleeping)
        };
      }
    } catch (e) {}
    return { ...defaults, owned: [], placed: [] };
  }
  let state = loadState();
  let gameTimer = null;
  let moleTimer = null, moleDeadline = 0, molePrevious = -1;
  let gameActive = false;
  let gameScore = 0;
  let secondsLeft = 30, starDeadline = 0;
  let isGoldenStar = false;
  let poseTimer = null;
  let rpsTimer = null;
  let lastInteractionAt = Date.now();

  function clamp(value) { return Math.max(0, Math.min(100, Math.round(Number(value) || 0))); }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
    catch (e) { say("存档好像暂时写不进去，不过啵啵还在这里喔。"); }
  }
  function say(message) { $("speech").textContent = message; }
  function emitEvent(name, detail) {
    try { document.dispatchEvent(new CustomEvent("boobo:" + name, { detail: detail || {} })); }
    catch (e) {}
  }
  let currentGame = "stars";

  const faceText = {
    neutral: "•ᴗ•",
    happy: "˃ᴗ˂",
    eat: "˃ڡ˂",
    love: "˃ᴗ˂",
    sleepy: "-ᴗ-",
    sad: "•ᴖ•",
    hungry: "•﹏•"
  };

  function idleFace() {
    if (state.sleeping) return "sleepy";
    if (state.hunger < 20) return "hungry";
    if (state.mood < 25) return "sad";
    if (state.energy < 20) return "sleepy";
    return "neutral";
  }

  function setFace(name) {
    const face = $("petExpression");
    if (!face) return;
    const faceStr = faceText[name] || faceText.neutral;
    const parts = Array.from(faceStr);
    if (parts.length === 3) face.innerHTML = `<span>${parts[0]}</span><i class="mouth">${parts[1]}</i><span>${parts[2]}</span>`;
    else face.textContent = faceStr;
    face.dataset.face = name;
  }

  function pose(name) {
    lastInteractionAt = Date.now();
    const pet = $("petCharacter");
    if (poseTimer) clearTimeout(poseTimer);
    pet.classList.remove("bounce","eat","love","happy");

    const expressions = {
      bounce: "happy", happy: "happy", eat: "eat", love: "love"
    };
    setFace(state.sleeping ? "sleepy" : (expressions[name] || idleFace()));
    void pet.offsetWidth;
    if (name && !state.sleeping) pet.classList.add(name);

    if (name) poseTimer = setTimeout(() => {
      pet.classList.remove("bounce","eat","love","happy");
      setFace(idleFace());
      poseTimer = null;
    }, 950);
  }

  function spawnFx(symbol, amount) {
    const layer = $("fxLayer");
    for (let i = 0; i < (amount || 3); i++) {
      const bit = document.createElement("span");
      bit.className = "float-fx";
      bit.textContent = symbol;
      bit.style.left = (25 + Math.random() * 50) + "%";
      bit.style.top = (40 + Math.random() * 33) + "%";
      bit.style.animationDelay = (i * 0.09) + "s";
      layer.appendChild(bit);
      setTimeout(() => bit.remove(), 1500);
    }
  }

  function furnitureKind(item, index = 0) {
    const label = `${item.name || ""} ${item.id || ""} ${item.desc || ""}`.toLowerCase();
    if (/床|bed/.test(label)) return "bed";
    if (/灯|lamp|light/.test(label)) return "lamp";
    if (/书|架|book|shelf/.test(label)) return "bookshelf";
    if (/窗|window/.test(label)) return "window";
    if (/地毯|地垫|rug|mat/.test(label)) return "rug";
    if (/玩偶|抱枕|毛绒|布偶|熊|plush|cushion|toy/.test(label)) return "plush";
    if (/桌|凳|table|stool/.test(label)) return "table";
    if (/花|草|植物|盆栽|樹|树|plant|flower/.test(label)) return "plant";
    return ["plant", "lamp", "bookshelf", "bed", "plush", "table"][index % 6];
  }

  function furnitureSvg(kind) {
    const sprites = {
      plant: `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges"><rect x="12" y="20" width="8" height="4" fill="#986343"/><rect x="8" y="24" width="16" height="4" fill="#bb8259"/><rect x="8" y="8" width="8" height="4" fill="#76b96c"/><rect x="4" y="12" width="8" height="4" fill="#6ba75f"/><rect x="12" y="12" width="8" height="8" fill="#8aca79"/><rect x="20" y="8" width="8" height="4" fill="#75b96a"/><rect x="20" y="12" width="8" height="4" fill="#6ba75f"/><rect x="16" y="4" width="4" height="12" fill="#579552"/></svg>`,
      bed: `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges"><rect x="4" y="12" width="24" height="12" fill="#a77756"/><rect x="4" y="8" width="8" height="8" fill="#f6e8c9"/><rect x="12" y="12" width="16" height="8" fill="#8eb7d4"/><rect x="4" y="24" width="4" height="4" fill="#75503c"/><rect x="24" y="24" width="4" height="4" fill="#75503c"/><rect x="12" y="16" width="8" height="4" fill="#b7d6e7"/></svg>`,
      lamp: `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges"><rect x="8" y="4" width="16" height="4" fill="#eac96d"/><rect x="4" y="8" width="24" height="4" fill="#dfb65b"/><rect x="8" y="12" width="16" height="4" fill="#f6df94"/><rect x="14" y="16" width="4" height="8" fill="#8c7657"/><rect x="8" y="24" width="16" height="4" fill="#8c7657"/><rect x="4" y="28" width="24" height="2" fill="#6e5e4b"/></svg>`,
      bookshelf: `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges"><rect x="4" y="4" width="24" height="24" fill="#8a6047"/><rect x="8" y="8" width="4" height="8" fill="#d68e79"/><rect x="12" y="8" width="4" height="8" fill="#e5c36d"/><rect x="20" y="8" width="4" height="8" fill="#8eb5d0"/><rect x="8" y="20" width="4" height="4" fill="#e5c36d"/><rect x="12" y="18" width="4" height="6" fill="#8eb5d0"/><rect x="20" y="19" width="4" height="5" fill="#d68e79"/><rect x="4" y="16" width="24" height="4" fill="#6d4c3b"/></svg>`,
      window: `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges"><rect x="4" y="4" width="24" height="24" fill="#8d6749"/><rect x="8" y="8" width="16" height="16" fill="#b7deec"/><rect x="14" y="8" width="4" height="16" fill="#8d6749"/><rect x="8" y="14" width="16" height="4" fill="#8d6749"/><rect x="8" y="8" width="4" height="4" fill="#fff0af"/></svg>`,
      rug: `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges"><rect x="4" y="8" width="24" height="16" fill="#d88491"/><rect x="8" y="12" width="16" height="8" fill="#f1c1bd"/><rect x="12" y="12" width="8" height="8" fill="#e8a5ae"/><rect x="0" y="12" width="4" height="8" fill="#d88491"/><rect x="28" y="12" width="4" height="8" fill="#d88491"/></svg>`,
      plush: `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges"><rect x="8" y="4" width="4" height="8" fill="#d8a879"/><rect x="20" y="4" width="4" height="8" fill="#d8a879"/><rect x="8" y="8" width="16" height="16" fill="#d8a879"/><rect x="4" y="12" width="4" height="8" fill="#d8a879"/><rect x="24" y="12" width="4" height="8" fill="#d8a879"/><rect x="12" y="24" width="4" height="4" fill="#d8a879"/><rect x="20" y="24" width="4" height="4" fill="#d8a879"/><rect x="12" y="14" width="4" height="4" fill="#5b493c"/><rect x="20" y="14" width="4" height="4" fill="#5b493c"/><rect x="16" y="18" width="4" height="4" fill="#b66e70"/></svg>`,
      table: `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges"><rect x="4" y="8" width="24" height="6" fill="#b9855d"/><rect x="8" y="14" width="4" height="12" fill="#8b6044"/><rect x="20" y="14" width="4" height="12" fill="#8b6044"/><rect x="2" y="8" width="28" height="4" fill="#d5a16f"/></svg>`
    };
    return sprites[kind] || sprites.plant;
  }

  function safeTitle(value) {
    return String(value || "啵啵的小家具").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  const DECOR_SLOTS = {
    window: { x: 82, top: 14, s: 56 },
    shelf:  { x: 13, y: 84, s: 66 },
    tree:   { x: 89, y: 84, s: 58 },
    rug:    { x: 50, y: 14, s: 124 },
    bed:    { x: 14, y: 4,  s: 72 },
    flower: { x: 33, y: 2,  s: 36, front: true },
    pillow: { x: 64, y: 2,  s: 40, front: true },
    table:  { x: 79, y: 2,  s: 52, front: true },
    lamp:   { x: 93, y: 4,  s: 44, front: true }
  };

  function renderDecor() {
    const decorSig = state.placed.join(",") + "|" + items.length;
    if (renderDecor.sig === decorSig) return;
    renderDecor.sig = decorSig;
    if (window.BooboRoom) { window.BooboRoom.draw(state, items, $("roomDecor"), $("roomDecorFront")); return; }
    const decor = items.filter(item => state.placed.includes(item.id));
    const back = [];
    const front = [];
    decor.forEach((item, i) => {
      const kind = furnitureKind(item, i);
      const label = `${item.name || ""} ${item.id || ""}`;
      const slot = DECOR_SLOTS[item.id] || { x: 22 + (i * 19) % 56, y: 84, s: 48 };
      const inFront = Boolean(slot.front);
      const where = slot.top != null ? `top:${slot.top}px;bottom:auto;` : `bottom:${slot.y}px;top:auto;`;
      const node = `<span class="decor furniture-item slot-${kind}" style="left:${slot.x}%;${where}width:${slot.s}px;height:${slot.s}px" title="${safeTitle(item.name)}">${furnitureSvg(kind)}</span>`;
      (inFront ? front : back).push(node);
    });
    $("roomDecor").innerHTML = back.length ? back.join("") : '<span class="empty-room">等你来装饰这里</span>';
    const frontLayer = $("roomDecorFront");
    if (frontLayer) frontLayer.innerHTML = front.join("");
  }

  function render() {
    $("starBalance").textContent = state.stars;
    ["hunger","mood","energy","bond"].forEach(key => {
      $(key + "Val").textContent = state[key] + "%";
      $(key + "Bar").style.width = state[key] + "%";
    });

    $("petCharacter").classList.toggle("is-sleeping", state.sleeping);
    if (window.BooboRoom && window.BooboRoom.sync) window.BooboRoom.sync(state);
    if (state.sleeping) setFace("sleepy");
    else if (!["bounce","eat","love","happy"].some(
      name => $("petCharacter").classList.contains(name)
    )) setFace(idleFace());
    const sleepIcon = $("sleepBtn").querySelector(".action-icon");
    if (sleepIcon) {
      const wantIcon = state.sleeping ? "sun" : "moon";
      if (sleepIcon.dataset.icon !== wantIcon) {
        sleepIcon.dataset.icon = wantIcon;
        sleepIcon.dataset.painted = "";
        sleepIcon.innerHTML = "";
        if (window.BooboPaintIcons) window.BooboPaintIcons();
      }
    }
    $("sleepBtn").querySelector(".action-label").textContent = state.sleeping ? "叫醒啵啵" : "哄它睡觉";
    $("sleepBtn").querySelector(".action-hint").textContent = state.sleeping ? "醒来活动一下" : "恢复体力";

    renderDecor();

    const shopSig = state.owned.join(",") + "|" + state.placed.join(",") + "|" + items.length;
    if (render.shopSig !== shopSig) {
    render.shopSig = shopSig;
    $("shopGrid").innerHTML = items.map((item, i) => {
      const owned = state.owned.includes(item.id);
      const placed = state.placed.includes(item.id);
      let buttonText = owned ? (placed ? "收起来" : "摆进小窝") : (item.base > item.cost ? `特价 · ${item.cost}★` : `兑换 · ${item.cost}★`);
      const className = owned ? "shop-btn owned" : "shop-btn";
      return `<div class="shop-item">
        <div class="shop-icon shop-pixel">${(window.BooboRoom ? window.BooboRoom.icon(item.id) : furnitureSvg(furnitureKind(item, i)))}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
        <button class="${className}" data-item="${item.id}">${buttonText}</button>
      </div>`;
    }).join("");
    }
  }

  function act(action) {
    if (window.BooboLife) window.BooboLife.flush();
    lastInteractionAt = Date.now();

    if (action === "feed") {
      if (state.hunger >= 100) {
        say("啵啵拍拍圆滚滚的小肚子：已经吃饱啦！点心可以先留着。 ");
        pose("happy"); spawnFx("✦", 3);
        return;
      }
      const wasHungry = state.hunger < 25;
      const wasHalfFull = state.hunger < 60;
      state.hunger = clamp(state.hunger + (wasHungry ? 26 : wasHalfFull ? 20 : 12));
      state.mood = clamp(state.mood + (wasHungry ? 8 : wasHalfFull ? 4 : 2));
      state.bond = clamp(state.bond + (wasHungry ? 2 : 1));
      say(wasHungry
        ? "啵啵饿得小肚子咕噜叫！这一口吃得超满足，连眼睛都亮啦。"
        : wasHalfFull
          ? ["嚼嚼嚼……这份点心刚刚好！", "啵啵认真地把点心吃干净了。", "好吃！想把最后一口也留给你看。"][Math.floor(Math.random() * 3)]
          : "啵啵慢慢吃着小点心，舒服地拍拍肚子。");
      pose("eat"); spawnFx("✦", 3);

    } else if (action === "pet") {
      const oldBond = state.bond;
      const moodWasLow = state.mood < 35;
      state.mood = clamp(state.mood + (moodWasLow ? 14 : 8));
      state.bond = clamp(state.bond + (state.bond < 35 ? 4 : 2));
      const milestone = [25, 50, 75, 100].find(point => oldBond < point && state.bond >= point);
      if (milestone) {
        const bonus = milestone === 25 ? 3 : milestone === 50 ? 5 : milestone === 75 ? 8 : 10;
        state.stars = (Number(state.stars) || 0) + bonus;
        say(`亲密度达到 ${milestone}% 啦！啵啵开心地蹭蹭你，还送了你 ${bonus} 颗星星。`);
      } else if (moodWasLow) {
        say("啵啵把小脑袋凑过来，在你的手心里蹭了蹭，好像安心多了。");
      } else {
        say(["再摸摸嘛……就一下下！", "啵啵舒服得眼睛弯起来啦。", "蹭蹭你的手，今天也喜欢和你待在一起。", "啵啵把脑袋主动送到你手边。"]
          [Math.floor(Math.random() * 4)]);
      }
      pose("love"); spawnFx("♥", 3);

    } else if (action === "play") {
      if (state.sleeping) {
        say("啵啵已经睡着啦。等它醒来，再一起玩吧。");
        setFace("sleepy"); return;
      }
      if (state.energy < 10) {
        say("啵啵的小腿有点发软，今天先休息一下，等恢复些体力再玩吧。");
        setFace("sleepy"); spawnFx("z", 2); return;
      }
      const moodWasLow = state.mood < 35;
      state.energy = clamp(state.energy - 8);
      state.mood = clamp(state.mood + (moodWasLow ? 15 : 10));
      state.bond = clamp(state.bond + 2);
      say(state.energy < 25
        ? "啵啵追着小星星跑了一圈，开心是开心，就是有点喘啦。"
        : ["啵啵追着看不见的小蝴蝶跑了一圈！", "蹦起来啦！啵啵的胜利姿势！", "啵啵绕着你跑了一小圈，又蹦回你面前。"]
          [Math.floor(Math.random() * 3)]);
      pose("bounce"); spawnFx("✦", 3);

    } else if (action === "sleep") {
      if (state.sleeping) {
        state.sleeping = false;
        say(`啵啵醒啦！现在体力是 ${state.energy}%，慢慢伸了个懒腰。`);
        pose("happy");
      } else {
        state.sleeping = true;
        say("啵啵缩进小窝开始睡觉。睡着时每 10 秒恢复 1 点体力，离开网页期间也会继续恢复。");
        if (poseTimer) clearTimeout(poseTimer);
        const pet = $("petCharacter");
        pet.classList.remove("bounce", "eat", "love", "happy");
        setFace("sleepy");
      }
    }

    save(); render();
    emitEvent("action", { action: action, sleeping: state.sleeping });
  }

  function shopAction(id) {
    const item = items.find(entry => entry.id === id);
    if (!item) return;
    const owned = state.owned.includes(id);
    if (!owned) {
      if (state.stars < item.cost) {
        say(`啵啵指指星星罐：还差 ${item.cost - state.stars} 颗星星就能带它回家啦！`);
        pose("bounce"); spawnFx("★", 2); return;
      }
      state.stars -= item.cost;
      state.paid=state.paid||{};state.paid[id]=item.cost;
      state.owned.push(id);
      state.placed.push(id);
      say(`买到${item.name}啦！啵啵开心得转了个圈！`);
      pose("happy"); spawnFx("★", 4);
      emitEvent("buy", { id: id, name: item.name });
    } else if (state.placed.includes(id)) {
      state.placed = state.placed.filter(value => value !== id);
      say(`${item.name}先收进小柜子里，想摆出来随时都行。`);
      pose("bounce");
    } else {
      state.placed.push(id);
      say(`把${item.name}摆好啦！小窝越来越像家了。`);
      pose("happy"); spawnFx("★", 3);
    }
    save(); render();
  }


  function spendGameEnergy(cost) {
    if (state.sleeping) { showGameNotice("啵啵正睡得香，先把它叫醒再一起玩吧。"); return false; }
    if (state.energy < cost + 5) { showGameNotice("啵啵的体力只剩 " + state.energy + "%，让它休息一下再来玩吧。"); return false; }
    if (state.hunger < 12) { showGameNotice("啵啵饿得肚子咕咕叫，先喂点东西再来玩吧。"); return false; }
    state.energy = clamp(state.energy - cost);
    state.hunger = clamp(state.hunger - 4);
    state.mood = clamp(state.mood + 2);
    save(); render();
    return true;
  }

  function showGameNotice(text) {
    $("gameContent").innerHTML = `
      <div class="game-intro">
        <span class="intro-star">z</span>
        <h3>先休息一下</h3>
        <p>${text}</p>
        <div class="result-buttons">
          <button class="primary-btn" id="noticeBack">换个游戏</button>
          <button class="secondary-btn" id="noticeClose">回到小窝</button>
        </div>
      </div>`;
    $("noticeBack").addEventListener("click", openGame);
    $("noticeClose").addEventListener("click", closeGame);
  }

  function openGame() {
    clearTimeout(rpsTimer);
    stopTofu();
    clearMoleTimer();
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = null;
    gameActive = false;
    $("gameOverlay").hidden = false;
    $("gameOverlay").classList.add("show");
    const modalTitle = $("gameOverlay").querySelector(".modal-head strong");
    if (modalTitle) modalTitle.textContent = "啵啵的小游戏屋";
    $("gameContent").innerHTML = `
      <div class="game-intro">
        <span class="intro-star">✦</span>
        <h3>今天想玩什么？</h3>
        <p>玩游戏可以赚星星，攒够了就能给啵啵装饰小窝。</p>
        <div class="game-choice-grid">
          <button class="game-choice" id="chooseStars"><span class="px-icon" data-icon="star"></span><b>星星收集</b><small>30 秒 · 点击星星</small></button>
          <button class="game-choice" id="chooseMole"><span class="px-icon" data-icon="mole"></span><b>打地鼠</b><small>30 秒 · 抓住冒头的小家伙</small></button>
          <button class="game-choice" id="chooseTofu"><span class="px-icon" data-icon="tofu"></span><b>啵啵跳豆腐</b><small>看准时机跳 · 越叠越高</small></button>
          <button class="game-choice" id="chooseRps"><span class="px-icon" data-icon="hand"></span><b>啵啵猜拳</b><small>五回合 · 赢取额外星星</small></button>
        </div>
      </div>`;
    $("chooseTofu").addEventListener("click",startTofuGame);
    $("chooseStars").addEventListener("click", startGame);
    $("chooseMole").addEventListener("click", startMoleGame);
    $("chooseRps").addEventListener("click", startRpsGame);
  }

  /* BOOBO_TOFU_V45：固定坐标物理、单条动画链，暂停时不推进。 */
  let tofuSession = null;
  function stopTofu() { if (tofuSession) { tofuSession.stop(); tofuSession = null; } }
  function startTofuGame() {
    if (!spendGameEnergy(6)) return;
    stopTofu();
    currentGame = 'tofu'; gameScore = 0; gameActive = true;
    $('gameContent').innerHTML = '<div class="game-hud"><span>跳上：<b id="gameScore">0</b> 层</span><button class="tofu-pause" id="tofuPause">暂停</button></div>'+
      '<canvas id="tofuCanvas" class="tofu-canvas" width="300" height="340" aria-label="啵啵跳豆腐，点击下方按钮或按空格跳跃"></canvas>'+
      '<p id="tofuHint" class="game-tip" aria-live="polite">豆腐从左边滑来，靠近啵啵时再跳！</p>'+
      '<button id="tofuJump" class="primary-btn tofu-jump">跳！</button>';
    $('gameOverlay').querySelector('.modal-head strong').textContent = '啵啵跳豆腐';
    const canvas=$('tofuCanvas'),ctx=canvas.getContext('2d'),hint=$('tofuHint'),jumpButton=$('tofuJump'),pauseButton=$('tofuPause');
    if(!ctx){hint.textContent='画板暂时没准备好，请关闭后重试。';return;}
    ctx.imageSmoothingEnabled=false;
    const abort=new AbortController(),options={signal:abort.signal};
    let alive=true,paused=false,phase='moving',raf=0,last=0,top=282,feet=282,vy=0,grounded=true,camera=0,delay=0,age=0,perfect=false;
    const blocks=[{x:98,y:282}],W=104,PH=32;
    let incoming={x:-112,y:top-24,dir:1,speed:95};
    function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
    function tofu(x,y,n){rect(x,y,W,24,'#b49976');rect(x+2,y+2,W-4,18,'#fff3cc');rect(x+2,y+2,W-4,3,'#fffce8');rect(x+2,y+18,W-4,4,'#dfc69a');
      [12,31,64,84].forEach((dx,i)=>rect(x+dx,y+6+(i%2)*5,3,2,n%2?'#e9cc9b':'#edd8af'));
      rect(x+39,y+9,2,3,'#907758');rect(x+62,y+9,2,3,'#907758');rect(x+48,y+14,8,2,'#c5977d');}
    function draw(){
      const g=ctx.createLinearGradient(0,0,0,340);g.addColorStop(0,'#b8dce3');g.addColorStop(.65,'#f3ebcb');g.addColorStop(1,'#e1c89e');ctx.fillStyle=g;ctx.fillRect(0,0,300,340);
      [[25,42],[182,66],[90,112]].forEach(([x,y],i)=>{const cx=(x+age*(i+1)*2)%340-20;rect(cx,y,42,6,'#fff8e7');rect(cx+8,y-5,24,5,'#fff8e7');});
      rect(0,316,300,24,'#b89670');rect(0,316,300,3,'#dcc49b');
      blocks.slice(-14).forEach((b,i)=>tofu(b.x,b.y+camera,i));
      if(incoming)tofu(incoming.x,incoming.y+camera,gameScore+1);
      const py=Math.round(feet-PH+camera);
      // 圆滚滚的啵啵：和舞台一致的绿团子、触角、腮红，直接绘制避免图片加载等待。
      function body(x,y){return ((x-9.5)*(x-9.5))/64+((y-11)*(y-11))/56<=1;}
      for(let y=1;y<20;y++)for(let x=1;x<19;x++){
        let c='';
        if(y>=1&&y<=5&&((x>=5&&x<=6)||(x>=13&&x<=14)))c=y<3?'#b7dca0':'#6f9f72';
        if(body(x,y))c=!body(x-1,y)||!body(x+1,y)||!body(x,y-1)||!body(x,y+1)?'#5c8968':y<8?'#b7dfab':'#9bce9b';
        if((x===6||x===13)&&y>=10&&y<=12)c='#3f6653';
        if((x===4||x===15)&&y>=13&&y<=14)c='#e9acac';
        if(y===14&&(x===9||x===11)||y===15&&x===10)c='#527d60';
        if(y===19&&(x===7||x===12))c='#5c8968';
        if(c)rect(130+x*2,py-8+y*2,2,2,c);
      }
      if(phase==='settle'){ctx.fillStyle=perfect?'#8b6735':'#56824e';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(perfect?'正正好！ +1':'+1',150,py-12);}
      if(paused){ctx.fillStyle='#34463899';ctx.fillRect(0,0,300,340);ctx.fillStyle='#fff4d7';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText('已暂停',150,152);ctx.font='13px sans-serif';ctx.fillText('点「继续」后再跳',150,179);}
    }
    function finish(){if(!alive||phase==='ending')return;phase='ending';delay=.55;incoming=null;jumpButton.disabled=true;pauseButton.disabled=true;hint.textContent='没关系，再试一次就会更准。';}
    function jump(){if(!alive||paused||phase!=='moving'||!grounded)return;grounded=false;vy=-350;hint.textContent='啵！';}
    function setPaused(value){if(!alive||phase==='ending')return;paused=value;cancelAnimationFrame(raf);last=0;pauseButton.textContent=paused?'继续':'暂停';jumpButton.disabled=paused;draw();if(!paused)raf=requestAnimationFrame(frame);}
    function frame(now){
      if(!alive)return;
      if(!canvas.isConnected||$('gameOverlay').hidden){stop();return;}
      if(document.hidden){if(phase==='ending'){stop();finishGame();}else setPaused(true);return;}
      const dt=last?Math.min(.04,(now-last)/1000):0;last=now;age+=dt;
      if(phase==='ending'){
        feet+=210*dt;delay-=dt;draw();if(delay<=0){stop();finishGame();return;}
      }else if(phase==='settle'){
        camera+=(Math.max(0,186-top)-camera)*Math.min(1,dt*15);delay-=dt;
        const b=blocks[blocks.length-1];b.x+=(98-b.x)*Math.min(1,dt*18);
        if(delay<=0){camera=Math.max(0,186-top);b.x=98;phase='moving';const dir=gameScore%2?-1:1;incoming={x:dir===1?-112:308,y:top-24,dir,speed:95+Math.min(85,gameScore*4)};hint.textContent='豆腐从'+(dir===1?'左':'右')+'边来啦，准备跳！';}
        draw();
      }else{
        const previous=feet;incoming.x+=incoming.dir*incoming.speed*dt;
        if(!grounded){vy+=900*dt;feet+=vy*dt;}
        const overlap=incoming.x<160&&incoming.x+W>140;
        if(!grounded&&vy>0&&previous<=incoming.y&&feet>=incoming.y&&overlap){
          perfect=Math.abs(incoming.x+W/2-150)<14;top=incoming.y;feet=top;vy=0;grounded=true;
          blocks.push({x:incoming.x,y:top});incoming=null;gameScore++;$('gameScore').textContent=gameScore;phase='settle';delay=.3;hint.textContent=perfect?'落在正中间啦！':'稳稳接住，下一块准备！';
        }else if(overlap&&feet>incoming.y+3&&feet-PH<incoming.y+24){finish();}
        else if(feet>=top){feet=top;vy=0;grounded=true;}
        if(incoming&&(incoming.x>420||incoming.x<-220))finish();
        draw();
      }
      if(alive)raf=requestAnimationFrame(frame);
    }
    function stop(){if(!alive)return;alive=false;cancelAnimationFrame(raf);abort.abort();}
    jumpButton.addEventListener('click',jump,options);
    canvas.addEventListener('pointerdown',e=>{e.preventDefault();jump();},options);
    pauseButton.addEventListener('click',()=>setPaused(!paused),options);
    document.addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('button')&&e.target.id!=='tofuJump')return;if(['Space','ArrowUp','KeyW','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat)jump();}},options);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){if(phase==='ending'){stop();finishGame();}else setPaused(true);}},options);
    tofuSession={stop};draw();raf=requestAnimationFrame(frame);
  }

  function startGame() {
    if (!spendGameEnergy(6)) return;
    currentGame = "stars";
    gameScore = 0;
    secondsLeft = 30;
    gameActive = true;
    $("gameContent").innerHTML = `
      <div class="game-hud"><span>已经收集：<b id="gameScore">0</b></span><span class="timer-pill" id="gameTimer">30 秒</span></div>
      <div class="time-bar"><i id="timeFill"></i></div><div class="game-arena" id="gameArena"><button class="star-target" id="starTarget" aria-label="收集这颗星星">✦</button></div>
      <p class="game-tip">看到星星就点它！金色星星一次 3 分。</p>`;
    $("starTarget").addEventListener("click", hitStar);
    moveStar();
    starDeadline = performance.now() + 30000;
    gameTimer = setInterval(starClock, 100);

  }


  /* BOOBO_MOLE_V43：倒计时只管结束，换洞只有一条可取消的计时链。 */
  function clearMoleTimer() {
    clearTimeout(moleTimer);
    moleTimer = null;
  }
  function moleClock() {
    if (!gameActive || currentGame !== "mole") return false;
    const remaining = Math.max(0, moleDeadline - performance.now());
    secondsLeft = Math.ceil(remaining / 1000);
    const timer = $("gameTimer"), fill = $("timeFill");
    if (timer) { timer.textContent = secondsLeft + " 秒"; if (secondsLeft <= 5) timer.style.background = "#ffe0de"; }
    if (fill) fill.style.width = (remaining / 30000 * 100) + "%";
    if (!remaining) { finishGame(); return false; }
    return true;
  }
  function startMoleGame() {
    if (!spendGameEnergy(6)) return;
    clearMoleTimer();
    clearInterval(gameTimer);
    currentGame = "mole";
    gameScore = 0;
    secondsLeft = 30;
    gameActive = true;
    moleDeadline = performance.now() + 30000;
    molePrevious = -1;
    let holes = "";
    for (let i = 0; i < 9; i++) holes += '<button class="mole-hole" type="button" aria-label="地鼠洞 '+(i+1)+'"><span class="hole-dot">·</span></button>';
    $("gameContent").innerHTML = `
      <div class="game-hud"><span>抓到：<b id="gameScore">0</b></span><span class="timer-pill" id="gameTimer">30 秒</span></div>
      <div class="time-bar"><i id="timeFill"></i></div><div class="game-arena mole-arena"><div class="mole-grid" id="moleGrid">${holes}</div></div>
      <p class="game-tip">点中得 1 分，稍等一下再冒头；每只地鼠会停留 1 秒。</p>`;
    $("moleGrid").querySelectorAll(".mole-hole").forEach(button => {
      button.addEventListener("click", () => {
        if (!moleClock()) return;
        if (!button.classList.contains("has-mole")) {
          button.classList.remove("miss"); void button.offsetWidth; button.classList.add("miss");
          return;
        }
        clearMoleTimer();
        button.classList.remove("has-mole");
        button.classList.add("mole-hit");
        button.innerHTML = '<span class="mole-point">+1</span>';
        gameScore++;
        $("gameScore").textContent = gameScore;
        moleTimer = setTimeout(moveMole, 180);
      });
    });
    moveMole();
    gameTimer = setInterval(moleClock, 100);
  }
  function moveMole() {
    clearMoleTimer();
    if (!moleClock() || document.hidden) return;
    const holes = Array.from(document.querySelectorAll("#moleGrid .mole-hole"));
    if (!holes.length) return;
    holes.forEach(hole => {
      hole.classList.remove("has-mole", "mole-hit", "miss");
      hole.innerHTML = '<span class="hole-dot">·</span>';
    });
    const candidates = holes.map((_, i) => i).filter(i => i !== molePrevious);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    const chosen = holes[next];
    molePrevious = next;
    chosen.classList.add("has-mole");
    chosen.innerHTML = '<span class="px-icon" data-icon="mole"></span>';
    if (window.BooboPaintIcons) window.BooboPaintIcons();
    moleTimer = setTimeout(moveMole, 1000);
  }
  document.addEventListener("visibilitychange", () => {
    if (!gameActive || currentGame !== "mole") return;
    clearMoleTimer();
    if (!document.hidden) moveMole();
  });

  function startRpsGame() {
    if (!spendGameEnergy(4)) return;
    currentGame = "rps";
    const box = $("gameContent");
    const title = $("gameOverlay").querySelector(".modal-head strong");
    if (title) title.textContent = "啵啵猜拳对决";
    const match = { round: 0, wins: 0, losses: 0, ties: 0, busy: false };
    const glyph = { rock: "拳", scissors: "剪", paper: "布" };
    box.innerHTML = `
      <div class="rps-match">
        <div class="rps-scoreline"><span>第 <b id="rpsRound">1</b> / 5 回合</span><span>你 <b id="rpsWins">0</b> 胜　啵啵 <b id="rpsLosses">0</b> 胜</span></div>
        <div class="rps-pips" id="rpsPips"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="rps-duel">
          <div class="rps-side player-side"><div class="rps-avatar player-avatar">${window.BooboPolish.player}</div><b>你</b><small>准备好了吗？</small></div>
          <div class="rps-vs">VS</div>
          <div class="rps-side boobo-side"><div class="rps-avatar boobo-avatar"><i></i></div><b>啵啵</b><small id="rpsBooboMood">认真备战中</small></div>
        </div>
        <div class="rps-hands">
          <div class="rps-hand-card"><small>你出的拳</small><strong id="rpsPlayerHand">？</strong></div>
          <div class="rps-count">✦</div>
          <div class="rps-hand-card boobo-hand-card"><small>啵啵出的拳</small><strong id="rpsBooboHand">？</strong></div>
        </div>
        <p class="rps-result" id="rpsResult" aria-live="polite">面对面站好！选好之后，我们一起出拳。</p>
        <div class="rps-choices" id="rpsChoices">
          <button class="rps-choice" data-rps="rock"><span class="rps-choice-pixel rock-pixel"></span><b>石头</b></button>
          <button class="rps-choice" data-rps="scissors"><span class="rps-choice-pixel scissors-pixel"></span><b>剪刀</b></button>
          <button class="rps-choice" data-rps="paper"><span class="rps-choice-pixel paper-pixel"></span><b>布</b></button>
        </div>
        <div class="rps-final" id="rpsFinal" hidden><b id="rpsSummary"></b><span class="rec-badge" id="recBadge" hidden></span><button type="button" class="primary-btn" id="playRpsAgain">再选一款小游戏</button></div>
      </div>`;

    const choices = box.querySelectorAll("[data-rps]");
    const playerHand = $("rpsPlayerHand");
    const booboHand = $("rpsBooboHand");
    const result = $("rpsResult");

    choices.forEach(button => button.addEventListener("click", () => {
      if (match.busy || match.round >= 5) return;
      match.busy = true;
      choices.forEach(choice => choice.disabled = true);
      const player = button.dataset.rps;
      const options = ["rock", "scissors", "paper"];
      const computer = options[Math.floor(Math.random() * options.length)];
      playerHand.innerHTML = '<span class="rps-choice-pixel rock-pixel"></span>';
      booboHand.innerHTML = '<span class="rps-choice-pixel rock-pixel"></span>';
      playerHand.parentElement.classList.add("rps-shaking");
      booboHand.parentElement.classList.add("rps-shaking");
      result.textContent = "石头……剪刀……布！一起亮拳！";

      rpsTimer = setTimeout(() => {
        rpsTimer = null;
        if ($("gameOverlay").hidden || !document.body.contains(playerHand)) { match.busy = false; return; }
        playerHand.parentElement.classList.remove("rps-shaking");
        booboHand.parentElement.classList.remove("rps-shaking");
        playerHand.innerHTML = `<span class="rps-choice-pixel ${player}-pixel"></span>`;
        booboHand.innerHTML = `<span class="rps-choice-pixel ${computer}-pixel"></span>`;
        playerHand.parentElement.classList.add("rps-revealed");
        booboHand.parentElement.classList.add("rps-revealed");

        let outcome = "tie";
        if (player !== computer) {
          outcome = ((player === "rock" && computer === "scissors") ||
            (player === "scissors" && computer === "paper") ||
            (player === "paper" && computer === "rock")) ? "win" : "lose";
        }
        match.round++;
        const duel = box.querySelector(".rps-duel");
        if (duel) duel.dataset.out = outcome;
        const pip = box.querySelectorAll("#rpsPips i")[match.round - 1];
        if (pip) pip.className = outcome;
        if (outcome === "win") {
          match.wins++;
          state.stars = (Number(state.stars) || 0) + 2;
          state.mood = clamp(state.mood + 5);
          state.bond = clamp(state.bond + 2);
          result.textContent = "你赢啦！啵啵不服气地鼓起脸，已经在想下一拳了。+2 星星";
          if ($("rpsBooboMood")) $("rpsBooboMood").textContent = "不服气，再来！";
          pose("happy");
        } else if (outcome === "lose") {
          match.losses++;
          state.mood = clamp(state.mood + 2);
          state.bond = clamp(state.bond + 1);
          result.textContent = "啵啵赢啦！它得意地蹦了一下，又把小拳头伸过来。";
          if ($("rpsBooboMood")) $("rpsBooboMood").textContent = "耶！我赢了";
          pose("love"); setFace("sad");
        } else {
          match.ties++;
          state.stars = (Number(state.stars) || 0) + 1;
          state.mood = clamp(state.mood + 3);
          state.bond = clamp(state.bond + 1);
          result.textContent = "平手！你和啵啵默契地出了一样的拳。+1 星星";
          if ($("rpsBooboMood")) $("rpsBooboMood").textContent = "好有默契！";
          pose("bounce");
        }
        $("rpsRound").textContent = Math.min(match.round + 1, 5);
        $("rpsWins").textContent = match.wins;
        $("rpsLosses").textContent = match.losses;
        save(); render();
        match.busy = false;

        if (match.round >= 5) {
          choices.forEach(choice => choice.hidden = true);
          $("rpsFinal").hidden = false;
          $("rpsSummary").textContent = `五回合结束：你赢 ${match.wins} 局，啵啵赢 ${match.losses} 局，平手 ${match.ties} 局。共获得 ${match.wins * 2 + match.ties} 颗星星。`;
          state.games = (Number(state.games) || 0) + 1;
          save();
          emitEvent("game", { game: "rps", score: match.wins, reward: match.wins * 2 + match.ties });
        } else {
          choices.forEach(choice => choice.disabled = false);
        }
      }, 520);
    }));
    $("playRpsAgain").addEventListener("click", openGame);
  }

  function moveStar() {
    const target = $("starTarget");
    if (!target) return;
    isGoldenStar = Math.random() < 0.17;
    target.classList.toggle("golden", isGoldenStar);
    target.innerHTML = '<span class="px-icon" data-icon="star"></span>';
    if (window.BooboPaintIcons) window.BooboPaintIcons();
    target.setAttribute("aria-label", isGoldenStar ? "金色星星，3 分" : "普通星星，1 分");
    target.style.left = (10 + Math.random() * 80) + "%";
    target.style.top = (12 + Math.random() * 74) + "%";
  }

  function starClock() {
    if (!gameActive || currentGame !== "stars") return false;
    const remaining = Math.max(0, starDeadline - performance.now());
    secondsLeft = Math.ceil(remaining / 1000);
    const timer = $("gameTimer"), fill = $("timeFill");
    if (timer) { timer.textContent = secondsLeft + " 秒"; if (secondsLeft <= 5) timer.style.background = "#ffe0de"; }
    if (fill) fill.style.width = (remaining / 30000 * 100) + "%";
    if (!remaining) { finishGame(); return false; }
    return true;
  }

  function hitStar(event) {
    if (!starClock()) return;
    event.preventDefault();
    const arena = $("gameArena"), tgt = $("starTarget");
    if (arena && tgt) {
      const pop = document.createElement("span");
      pop.className = "hit-pop" + (isGoldenStar ? " gold" : "");
      pop.textContent = isGoldenStar ? "+3" : "+1";
      pop.style.left = tgt.style.left;
      pop.style.top = tgt.style.top;
      arena.appendChild(pop);
      setTimeout(() => pop.remove(), 750);
    }
    gameScore += isGoldenStar ? 3 : 1;
    const scoreDisplay = $("gameScore");
    if (scoreDisplay) scoreDisplay.textContent = gameScore;
    moveStar();
  }

  function finishGame() {
    stopTofu();
    clearMoleTimer();
    if (!gameActive) return;
    gameActive = false;
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = null;

    const reward = gameScore > 0 ? Math.min(16, Math.max(2, Math.ceil(gameScore / 2.2))) : 1;
    state.stars += reward;
    state.mood = clamp(state.mood + 5);
    state.bond = clamp(state.bond + 1);
    state.games += 1;
    save(); render();
    emitEvent("game", { game: currentGame, score: gameScore, reward: reward });

    $("gameContent").innerHTML = `
      <div class="game-result">
        <span class="intro-star">${gameScore >= 20 ? "✦" : "★"}</span>
        <h3>${currentGame === "tofu" ? (gameScore>=10?"豆腐高高塔！":"这次跳了 "+gameScore+" 层") : currentGame === "mole" ? (gameScore >= 20 ? "地鼠克星！" : "打地鼠结束！") : gameScore >= 20 ? "星星大丰收！" : gameScore > 0 ? "收集完成！" : "下次一定能收集更多！"}</h3>
        <p>啵啵在旁边给你鼓掌呢。每次游戏结束都会结算奖励，继续努力把小窝装满吧！</p>
        <span class="rec-badge" id="recBadge" hidden></span>
        <div class="result-score">
          <div class="result-box"><b>${gameScore}</b><span>本局得分</span></div>
          <div class="result-box"><b>+${reward} ★</b><span>获得星星</span></div>
        </div>
        <div class="result-buttons">
          <button class="primary-btn" id="playAgain" style="font-size:13px;padding:12px 16px">再来一局</button>
          <button class="secondary-btn" id="backToRoom">回到小窝</button>
        </div>
      </div>`;
    $("playAgain").addEventListener("click", openGame);
    $("backToRoom").addEventListener("click", closeGame);
  }

  function closeGame() {
    clearTimeout(rpsTimer);
    stopTofu();
    clearMoleTimer();
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = null;
    gameActive = false;
    $("gameOverlay").classList.remove("show");
    $("gameOverlay").hidden = true;
  }

  document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => act(button.dataset.action));
  });
  $("petButton").addEventListener("click", () => {
    if (state.sleeping) {
      say("啵啵睡得香香的，点旁边的按钮就能叫醒它。");
      spawnFx("z", 2); return;
    }
    state.mood = clamp(state.mood + 2);
    state.bond = clamp(state.bond + 1);
    say(["啵啵：嗯？你叫我呀！","啵啵歪着脑袋，好奇地看着你。","啵！摸摸我是不是有什么好事？","啵啵轻轻晃晃小触角，回应你的呼唤。"][Math.floor(Math.random()*4)]);
    pose("bounce"); spawnFx("♥", 2); save(); render();
    emitEvent("action", { action: "touch", sleeping: state.sleeping });
  });
  $("openGame").addEventListener("click", openGame);
  $("shopGrid").addEventListener("click", event => {
    const btn = event.target.closest("[data-item]");
    if (btn) shopAction(btn.dataset.item);
  });
  $("closeGame").addEventListener("click", closeGame);
  $("gameOverlay").addEventListener("click", event => {
    if (event.target === $("gameOverlay")) closeGame();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("gameOverlay").hidden) closeGame();
  });


  render();

  const idleLines = [
    "啵啵盯着远处的小草看了好久……",
    "今天的小窝也很舒服，啵。",
    "啵啵偷偷把触角摆成了奇怪的形状。",
    "如果星星会掉进碗里就好啦……",
    "你在的话，啵啵就很安心。",
    "啵？刚刚是不是有小蝴蝶飞过去了？"
  ];
  setInterval(() => {
    if (!state.sleeping && $("gameOverlay").hidden && Date.now() - lastInteractionAt > 20000 && Math.random() < 0.45) {
      const moodLine = state.hunger < 25
        ? "啵啵的小肚子又咕噜叫了一声……"
        : state.energy < 20
          ? "啵啵揉揉眼睛，想找个软软的地方躺一躺。"
          : state.mood < 25
            ? "啵啵安静地靠在你旁边，想要一点点安慰。"
            : state.bond >= 75
              ? "啵啵已经很习惯有你陪着的小日子啦。"
              : "";
      say(moodLine || idleLines[Math.floor(Math.random() * idleLines.length)]);
    }
  }, 13000);

  window.BooboAPI = {
    state: state, items: items, clamp: clamp, save: save, render: render,
    say: say, pose: pose, setFace: setFace, spawnFx: spawnFx,
    furnitureKind: furnitureKind, furnitureSvg: furnitureSvg,
    addItems: function (list) {
      (list || []).forEach(function (entry) {
        if (!entry || !entry.id) return;
        if (!items.some(function (it) { return it.id === entry.id; })) items.push(entry);
      });
      render();
    },
    on: function (name, fn) { document.addEventListener("boobo:" + name, fn); },
    emit: emitEvent
  };
  emitEvent("ready", {});
})();
