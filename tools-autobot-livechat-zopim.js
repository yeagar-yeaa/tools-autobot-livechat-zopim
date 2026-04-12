(() => {
  "use strict";

  try { if (window._s1panelKill) window._s1panelKill(); } catch (_) {}

  const META = { NAME: "Autobot LiveChat", VERSION: "vNext Arbiter by yeagarr" };
  const UI = { PANEL_ID: "s1-puck", STYLE_ID: "s1-style", CB_STYLE_ID: "s1-chatbar-style" };

  const CFG = {
    WRAP_SEL: ".react_meshim_dashboard_components_navBar_OldServeButton",
    READY_SPAN_SEL: "span[title]",
    RE_READY: /^\s*serve\s*1\s*request\s*$/i,
    RE_ZERO: /^\s*0\s*requests?\s*$/i,
    TOK_READY: ["serve","1","request"],
    TOK_ZERO: ["0","request"],
    CLICK_ON_ZERO: false,
    ZERO_POKE_MODE: "off",
    ZERO_POKE_VISITOR_GRACE_MS: 1600,

    READY_COOLDOWN_MS: 18,
    ZERO_COOLDOWN_MS: 120,

    GLOBAL_COOLDOWN_MS: 8,
    GLOBAL_WINDOW_MS: 5000,
    GLOBAL_MAX_CLICKS_PER_WINDOW: 140,

    BURST_MS: 2400,
    HOT_BURST_FIRST_MS: 720,
    MO_BURST_THROTTLE_MS: 3,

    WRAP_RESYNC_MS: 1200,
    WRAP_PRUNE_EVERY_MS: 1800,
    MAX_SCAN: 40,
    STOP_SCAN_AFTER_CLICK: true,
    IDLE_STOP_AFTER_FRAMES: 22,

    POLL_FAST_MS: 45,
    POLL_SLOW_MS: 180,

    VERIFY_READY_DELAY_MS: 54,
    VERIFY_ZERO_DELAY_MS: 120,
    RETRY_READY_MAX: 4,
    RETRY_ZERO_MAX: 1,
    RETRY_BURST_MS: 150,

    USER_GRACE_ON_DOWN_MS: 650,
    USER_GRACE_AFTER_UP_MS: 90,
    USER_GRACE_ON_WHEEL_MS: 220,
    USER_GRACE_ON_KEY_MS: 280,

    VIS_ENABLE: true,
    VIS_INCOMING_SEL: '[data-test-id="incomingList"]',
    VIS_GENERAL_SEL: '[data-test-id="generalVisitorList"]',
    VIS_ROW_SEL: '[data-test-id="visitorRow"]',
    VIS_GROUP_COUNT_SEL: '[data-test-id="groupCount"]',
    VIS_ROW_NAME_SEL: '[data-test-id="nameCell"]',
    VIS_ROW_TIME_SEL: '[data-test-id="timeCell"]',
    VIS_ROW_SERVED_SEL: '[data-test-id="servedByCell"]',
    VIS_ROW_VIEWING_SEL: '[data-test-id="viewingPage"]',
    VIS_ROW_SCAN_LIMIT: 220,
    VIS_WAKE_BURST_MS: 760,
    VIS_HARD_WAKE_BURST_MS: 1200,
    VIS_SCAN_MS: 260,
    VIS_RESYNC_MS: 320,
    VIS_UNSERVED_ONLY: true,

    CB_ITEM_SEL: ".meshim_dashboard_components_chatBar_Renderer.chat_bar_renderer",
    CB_UNREAD_SEL: ".unread_count",
    CB_DOTS_SEL: ".dots",
    CB_MSG_SEL: ".msg",
    CB_CLOSE_SEL: ".round_close_button",

    CB_LEAVE_CLASS: "leave",
    CB_LEAVE_TEXT_RE: /\bhas\s+left\b/i,
    CB_UNREAD_CLASS: "unread",

    CB_IGNORE_AGENT_ITEMS: true,
    CB_AGENT_CLASS: "agent",
    CB_AGENT_ROWID_PREFIX: "#agentchat:",

    CB_AUTO_OPEN_ON_UNREAD: true,
    CB_AUTO_OPEN_NEXT_UNREAD: true,
    CB_SKIP_LEAVE_ON_OPEN: true,

    CB_AUTO_CLOSE_LEAVE: true,
    CB_CLOSE_ONLY_IF_UNREAD_ZERO: true,
    CB_CLOSE_COOLDOWN_MS: 1200,
    CB_CLOSE_WINDOW_MS: 8000,
    CB_CLOSE_MAX_PER_WINDOW: 6,

    CB_IDLE_REQUIRED_MS: 70,
    CB_OPEN_COOLDOWN_MS: 170,
    CB_ITEM_OPEN_COOLDOWN_MS: 520,
    CB_POST_CLICK_LOCK_MS: 160,

    CB_OPEN_IGNORE_IDLE_ON_UNREAD: true,

    CB_SCAN_LIMIT: 240,
    CB_FAST_SCAN_MS: 110,
    CB_SLOW_SCAN_MS: 720,
    CB_IDLE_TO_SLOW_AFTER_MS: 2400,
    CB_FORCE_RESCAN_AFTER_MS: 4200,

    CB_CLICK_X_RATIO: 0.35,
    CB_CLICK_Y_RATIO: 0.55,

    CB_STRICT_TOPMOST_CHECK: false,
    CB_RESPECT_USER_MANUAL_SWITCH: true,
    CB_MANUAL_OVERRIDE_MS: 6500,
    CB_MANUAL_PANEL_HOLD_MS: 2600,
    CB_MANUAL_ACTIVE_GRACE_MS: 12000,

    TA_SEL: "textarea[data-test-id='chatTextArea'], textarea.meshim_dashboard_components_chatPanel_ChatTextAreaList.chat_input",
    TA_SHORTCUT_LIST_SEL: ".textfieldlist_list_container",
    TA_CLIPBOARD_IMG_SEL: ".meshim_dashboard_components_chatPanel_chatTextArea_ClipboardImage.clipboard_image",

    AS_ENABLE: true,
    AS_TRIGGER: "/a",
    AS_SCAN_MS: 90,
    AS_OPEN_SETTLE_MS: 260,
    AS_EXPAND_WAIT_MS: 1400,
    AS_SEND_LOCK_MS: 2200,
    AS_MAX_TRIES_PER_CHAT: 2,
    AS_MEMORY_SENT_LIMIT: 260,
    AS_MEMORY_TRY_LIMIT: 520,
    AS_ACTIVE_ITEM_SEL: ".meshim_dashboard_components_chatBar_Renderer.chat_bar_renderer.active, .meshim_dashboard_components_chatBar_Renderer.chat_bar_renderer[aria-selected='true']",
    AS_COMPOSER_SEL: "[data-test-id='chatActionsComposer']",
    AS_NO_MATCH_SEL: ".textfieldlist_container > .no_matches",
    AS_SHORTCUT_LIST_BOX_SEL: ".textfieldlist_list_container",
    AS_SHORTCUT_OPTION_SEL: ".meshim_dashboard_components_chatPanel_ShortcutItem.textfieldlist_list_option",
    AS_GHOST_TEXT_SEL: ".meshim_dashboard_components_chatPanel_GhostChatArea .text_container",
    AS_ROOT_SEL: ".meshim_dashboard_components_chatPanel_ChatTextArea",
    AS_ACTIVE_PANEL_SEL: ".meshim_dashboard_components_ChatPanel.chat_panel.active",
    AS_PANEL_TITLE_SEL: "[data-test-id='displayNameTitleBar']",
    AS_SEND_VERIFY_MS: 700,
    AS_REQUIRE_LATEST_SERVE_ONLY: true,
    AS_SERVE_BIND_SETTLE_MS: 140,
    AS_SERVE_BIND_FALLBACK_MS: 900,
    AS_SELECT_WAIT_MS: 140,
    AS_ONE_SEND_PER_SERVE: true,
    AS_MAX_SEND_PRESSES: 1,
    AS_TYPE_CHAR_DELAY_MS: 28,
    AS_AFTER_TYPE_SETTLE_MS: 120,
    AS_REQUIRE_EXPAND_BEFORE_SEND: true,
    AS_SERVE_TOKEN_TTL_MS: 12000,
    AS_CHATLOG_ROW_SEL: ".meshim_dashboard_components_widgets_ChatLogRenderer.chat_log_line",
    AS_CHATLOG_NAME_SEL: ".header_container .name",
    AS_CHATLOG_MSG_SEL: ".message_container .message",
    AS_CHATLOG_SCAN_LIMIT: 80,
    AS_PROOF_MIN_LEN: 8,
    AS_AGENT_NAME_RE: /^(?:CS\d*[_A-Z0-9]*|ADMIN[_A-Z0-9]*|SUPPORT[_A-Z0-9]*)$/i,
    AS_SYSTEM_SKIP_RE: /\bhas\s+joined\b|\bhas\s+left\b|\brated the chat\b/i,

    S1_ALLOW_HIDDEN: true,
    S1_ALLOW_DURING_USER_INPUT: true,
    S1_ALLOW_WHILE_COMPOSER_BUSY: true,
    S1_IGNORE_USER_BUSY_UNTIL: true,

    CB_ALLOW_HIDDEN: true,
    CB_ALLOW_DURING_USER_INPUT: true,
    CB_ALLOW_WHILE_COMPOSER_BUSY: true,
    CB_IGNORE_IDLE_REQUIRED: true,

    AS_ALLOW_HIDDEN: true,
    AS_ALLOW_DURING_USER_INPUT: true,
    AS_ALLOW_WHILE_COMPOSER_BUSY: true,
    AS_IGNORE_USER_BUSY_UNTIL: true,

    BG_WORKER_ENABLE: true,
    BG_WORKER_TICK_MS: 60,
    BG_WORKER_HIDDEN_TICK_MS: 220,

    ACTION_ARB_ENABLE: true,
    ACTION_ARB_DEBOUNCE_MS: 10,
    ACTION_ARB_EXEC_LOCK_MS: 10,
    ACTION_ARB_CB_LOCK_MS: 42,
    ACTION_ARB_TTL_MS: 160,

    S1_NATIVE_CLICK_FIRST: true,
    S1_STRICT_TOPMOST_CHECK: true,
    S1_CLICK_X_RATIO: 0.50,
    S1_CLICK_Y_RATIO: 0.50,

    CB_NATIVE_CLICK_FIRST: true,
    CB_STRICT_TOPMOST_CHECK: true,
  };

  let on = true;
  let GEN = 1;

  const wrapObserved = new WeakSet();
  const wrapLocalMO = new WeakMap();
  const lastState = new WeakMap();
  const armedReady = new WeakMap();
  const armedZero  = new WeakMap();
  const clickedAtReady = new WeakMap();
  const clickedAtZero  = new WeakMap();
  const readyAttempts = new WeakMap();
  const zeroAttempts  = new WeakMap();

  const nodeIds = new WeakMap();
  let nodeSeq = 1;

  const STATS = {
    serveSeen: 0,
    serveQueued: 0,
    serveClicked: 0,
    serveNativeClick: 0,
    serveFallbackClick: 0,
    serveTopmostReject: 0,
    cbOpenQueued: 0,
    cbOpenClicked: 0,
    cbCloseQueued: 0,
    cbCloseClicked: 0,
    arbExecuted: 0,
    arbDropped: 0
  };

  const ROOTS = new WeakSet();
  const rootMOs = [];
  const IFRS = new WeakSet();
  const shortcutBinds = [];

  const clickTimes = [];
  let clickHead = 0;
  let lastGlobalClickAt = 0;

  let burstUntil = 0;
  let burstHotUntil = 0;
  let hotTimer = 0;
  let rafId = 0;

  let lastMoBurstAt = 0;

  let userBusyUntil = 0;
  let userDown = false;
  let idleFrames = 0;
  let lastUserAt = 0;

  let pendingBurst = false;
  let wakeTimer = 0;

  let ecoUntil = 0;
  let lastFrameAt = 0;
  let jankScore = 0;

  const wrapsSet = new WeakSet();
  const wrapsList = [];
  let wrapsResyncAt = 0;
  let wrapsPruneAt = 0;

  let visRootMO = null;
  let visScanTimer = 0;
  let visLastScanAt = 0;
  let visLastMutAt = 0;
  let visLastWakeAt = 0;
  let visLastVisitorSignalAt = 0;
  const visRowState = new WeakMap();

  let asTimer = 0;
  const asFlow = { key: "", step: "", stepAt: 0, openUntil: 0, ghostBase: "", proofText: "", lastSendAt: 0, sendPresses: 0, typedValue: "" };
  const asServe = { armed: false, armedAt: 0, anchorKey: "", targetKey: "", sendKey: "", sendAt: 0, tokenSeq: 0 };
  const asSentKeys = new Set();
  const asTryCount = new Map();
  const asProofByKey = new Map();

  function asHasPriorityLock() {
    try {
      if (!CFG.AS_ENABLE) return false;
      const t = now();
      if (asFlow.key) return true;
      if (asServe.armed && (typeof asServeTokenExpired !== "function" || !asServeTokenExpired())) return true;
      if (asFlow.lastSendAt && (t - asFlow.lastSendAt) < Math.max(CFG.AS_SEND_LOCK_MS, CFG.AS_SEND_VERIFY_MS)) return true;
      if (asServe.sendAt && (t - asServe.sendAt) < Math.max(CFG.AS_SEND_VERIFY_MS, 650)) return true;
      return false;
    } catch (_) { return false; }
  }

  const uiRM = { resize: null };

  const ORIG = {
    attachShadow: Element.prototype.attachShadow,
    pushState: history.pushState,
    replaceState: history.replaceState,
  };

  let onFocus = null, onVis = null, onPop = null;

  const now = () => (performance && performance.now ? performance.now() : Date.now());
  const norm = (t) => String(t || "").replace(/\s+/g, " ").trim();
  const safeAttr = (el, name) => { try { return el?.getAttribute?.(name) || ""; } catch (_) { return ""; } };
  const getNodeKey = (el, prefix = "n") => {
    try {
      if (!el || (typeof el !== "object" && typeof el !== "function")) return prefix + "0";
      let id = nodeIds.get(el);
      if (!id) {
        id = prefix + String(nodeSeq++);
        nodeIds.set(el, id);
      }
      return id;
    } catch (_) { return prefix + "x"; }
  };

  const microtask = (fn) => {
    try { (typeof queueMicrotask === "function" ? queueMicrotask : (f)=>Promise.resolve().then(f))(fn); }
    catch (_) { try { setTimeout(fn, 0); } catch (__) {} }
  };

  const markUserBusy = (ms) => {
    lastUserAt = now();
    const t = lastUserAt + ms;
    if (t > userBusyUntil) userBusyUntil = t;
  };

  const isDisabledish = (el) => {
    if (!el || el.nodeType !== 1) return true;
    if (el.disabled) return true;
    const ad = safeAttr(el, "aria-disabled");
    if (ad && ad.toLowerCase() === "true") return true;
    return false;
  };

  const isVisible = (el) => {
    try {
      if (!el || el.nodeType !== 1 || !el.isConnected) return false;
      if (isDisabledish(el)) return false;

      const w = el.ownerDocument?.defaultView || window;
      const cs = w.getComputedStyle(el);
      if (!cs) return false;
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (cs.pointerEvents === "none") return false;
      if (+cs.opacity === 0) return false;

      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;

      const vw = w.innerWidth || 0, vh = w.innerHeight || 0;
      const pad = 2;
      if (r.bottom < -pad || r.right < -pad || r.left > vw + pad || r.top > vh + pad) return false;

      return true;
    } catch (_) { return false; }
  };

  const elementFromPointOK = (el, x, y) => {
    try {
      const doc = el.ownerDocument || document;
      const top = doc.elementFromPoint(x, y);
      if (!top) return false;
      return (top === el) || el.contains(top);
    } catch (_) { return true; }
  };

  const ensureInView = (el) => {
    try {
      if (!el || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      const w = el.ownerDocument?.defaultView || window;
      const vw = w.innerWidth || 0;
      const vh = w.innerHeight || 0;
      if (r.top < 0 || r.left < 0 || r.bottom > vh || r.right > vw) {
        try { el.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (_) {}
      }
    } catch (_) {}
  };

  const textLooksLike = (text, tokens) => {
    const s = norm(text).toLowerCase();
    for (let i = 0; i < tokens.length; i++) if (!s.includes(tokens[i])) return false;
    return true;
  };

  let composerCacheAt = 0;
  let composerCacheVal = false;
  const isComposerBusy = () => {
    try {
      const t = now();
      if ((t - composerCacheAt) < 120) return composerCacheVal;

      let busy = false;
      const ae = document.activeElement;
      if (ae && ae.matches && ae.matches(CFG.TA_SEL)) busy = true;

      if (!busy) {
        const list = document.querySelector?.(CFG.TA_SHORTCUT_LIST_SEL);
        if (list) {
          const cs = (list.ownerDocument?.defaultView || window).getComputedStyle(list);
          if (cs && cs.display !== "none" && cs.visibility !== "hidden") busy = true;
        }
      }

      if (!busy) {
        const clip = document.querySelector?.(CFG.TA_CLIPBOARD_IMG_SEL);
        if (clip) {
          const cs = (clip.ownerDocument?.defaultView || window).getComputedStyle(clip);
          if (cs && cs.display !== "none" && cs.visibility !== "hidden") busy = true;
        }
      }

      composerCacheAt = t;
      composerCacheVal = busy;
      return busy;
    } catch (_) { return false; }
  };

  const canAct = (st = "ready") => {
    if (!on) return false;

    const isReady = st === "ready";
    const allowHidden = isReady ? CFG.S1_ALLOW_HIDDEN : false;
    const allowUserInput = isReady ? CFG.S1_ALLOW_DURING_USER_INPUT : false;
    const allowComposerBusy = isReady ? CFG.S1_ALLOW_WHILE_COMPOSER_BUSY : false;
    const ignoreBusyUntil = isReady ? CFG.S1_IGNORE_USER_BUSY_UNTIL : false;

    if (document.visibilityState && document.visibilityState !== "visible" && !allowHidden) return false;
    if (userDown && !allowUserInput) return false;
    if (isComposerBusy() && !allowComposerBusy) return false;
    if (!ignoreBusyUntil && now() < userBusyUntil) return false;
    return true;
  };

  const canServeEngineRun = () => canAct("ready");

  const pruneClicks = (t) => {
    while (clickHead < clickTimes.length && (t - clickTimes[clickHead]) > CFG.GLOBAL_WINDOW_MS) clickHead++;
    if (clickHead > 96 && clickHead * 2 > clickTimes.length) {
      clickTimes.splice(0, clickHead);
      clickHead = 0;
    }
  };

  const globalThrottleOK = (t) => {
    pruneClicks(t);
    const live = clickTimes.length - clickHead;
    if (live >= CFG.GLOBAL_MAX_CLICKS_PER_WINDOW) return false;
    if ((t - lastGlobalClickAt) < CFG.GLOBAL_COOLDOWN_MS) return false;
    return true;
  };

  const actArb = { q: [], byKey: new Map(), timer: 0, busyUntil: 0 };

  const actArbPrune = (t = now()) => {
    try {
      for (let i = actArb.q.length - 1; i >= 0; i--) {
        const item = actArb.q[i];
        if (!item || item.cancelled || item.expiresAt <= t) {
          if (item && actArb.byKey.get(item.key) === item) actArb.byKey.delete(item.key);
          actArb.q.splice(i, 1);
          STATS.arbDropped += 1;
        }
      }
    } catch (_) {}
  };

  const actArbSchedule = (delay = CFG.ACTION_ARB_DEBOUNCE_MS) => {
    if (!CFG.ACTION_ARB_ENABLE) return;
    if (actArb.timer) return;
    actArb.timer = setTimeout(() => {
      actArb.timer = 0;
      actArbDrain();
    }, Math.max(0, delay | 0));
  };

  const actArbEnqueue = (kind, key, priority, run, lockMs = CFG.ACTION_ARB_EXEC_LOCK_MS, ttlMs = CFG.ACTION_ARB_TTL_MS) => {
    try {
      if (!CFG.ACTION_ARB_ENABLE) return !!run?.();
      if (!on || typeof run !== "function" || !key) return false;

      const t = now();
      const cur = actArb.byKey.get(key);
      if (cur && cur.expiresAt > t) {
        if (priority >= cur.priority) {
          cur.kind = kind;
          cur.priority = priority;
          cur.run = run;
          cur.lockMs = lockMs;
          cur.expiresAt = t + ttlMs;
          cur.createdAt = t;
        }
        actArbSchedule();
        return true;
      }

      const item = { kind, key, priority, run, lockMs, createdAt: t, expiresAt: t + ttlMs, cancelled: false };
      actArb.byKey.set(key, item);
      actArb.q.push(item);
      actArbSchedule();
      return true;
    } catch (_) { return false; }
  };

  const actArbDrain = () => {
    if (!CFG.ACTION_ARB_ENABLE) return;
    if (!on) {
      actArb.q.length = 0;
      actArb.byKey.clear();
      return;
    }

    const t = now();
    actArbPrune(t);

    if (t < actArb.busyUntil) {
      actArbSchedule(Math.max(4, actArb.busyUntil - t));
      return;
    }

    if (!actArb.q.length) return;

    actArb.q.sort((a, b) => (b.priority - a.priority) || (a.createdAt - b.createdAt));
    const item = actArb.q.shift();
    if (!item) return;

    if (actArb.byKey.get(item.key) === item) actArb.byKey.delete(item.key);
    if (item.cancelled || item.expiresAt <= t) {
      STATS.arbDropped += 1;
      if (actArb.q.length) actArbSchedule();
      return;
    }

    let ok = false;
    try { ok = !!item.run(); } catch (_) {}
    STATS.arbExecuted += ok ? 1 : 0;
    if (!ok) STATS.arbDropped += 1;

    actArb.busyUntil = now() + Math.max(0, item.lockMs || 0);
    if (actArb.q.length) actArbSchedule();
  };

  const actArbClear = () => {
    try {
      actArb.q.length = 0;
      actArb.byKey.clear();
      if (actArb.timer) clearTimeout(actArb.timer);
    } catch (_) {}
    actArb.timer = 0;
    actArb.busyUntil = 0;
  };

  const getWrapState = (wrap) => {
    try {
      if (!wrap || wrap.nodeType !== 1) return "none";
      const sp = wrap.querySelector ? wrap.querySelector(CFG.READY_SPAN_SEL) : null;
      const a = norm(sp ? safeAttr(sp, "title") : "");
      const b = norm(sp ? (sp.textContent || "") : (wrap.textContent || ""));
      if (CFG.RE_READY.test(a) || CFG.RE_READY.test(b) || textLooksLike(a, CFG.TOK_READY) || textLooksLike(b, CFG.TOK_READY)) return "ready";
      if (CFG.RE_ZERO.test(a)  || CFG.RE_ZERO.test(b)  || textLooksLike(a, CFG.TOK_ZERO)  || textLooksLike(b, CFG.TOK_ZERO))  return "zero";
      return "none";
    } catch (_) { return "none"; }
  };

  const dispatchMouseLike = (el, type, o) => {
    try {
      const w = el.ownerDocument?.defaultView || window;
      const Ctor =
        (type.startsWith("pointer") && w.PointerEvent) ? w.PointerEvent :
        (w.MouseEvent ? w.MouseEvent : MouseEvent);
      el.dispatchEvent(new Ctor(type, o));
      return true;
    } catch (_) {
      try { el.dispatchEvent(new MouseEvent(type, o)); return true; }
      catch (__) { return false; }
    }
  };

  const getClickableTarget = (wrap) => {
    try {
      if (!wrap) return null;
      const btn = wrap.querySelector?.("button,[role='button'],a[href]");
      if (btn && isVisible(btn)) return btn;
      const sp = wrap.querySelector?.(CFG.READY_SPAN_SEL);
      if (sp && isVisible(sp)) return sp;
      return wrap;
    } catch (_) { return wrap; }
  };

  const fireSequence = (target) => {
    try {
      const w = target.ownerDocument?.defaultView || window;
      const pt = ("ontouchstart" in w) ? "touch" : "mouse";
      const r = target.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      const base = { bubbles:true, cancelable:true, view:w, clientX:cx, clientY:cy, composed:true };
      const down = { ...base, button:0, buttons:1 };
      const up   = { ...base, button:0, buttons:0 };

      dispatchMouseLike(target, "pointerover",  { ...base, pointerType:pt, isPrimary:true, pointerId:1 });
      dispatchMouseLike(target, "pointerenter", { ...base, pointerType:pt, isPrimary:true, pointerId:1 });
      dispatchMouseLike(target, "mouseover", base);
      dispatchMouseLike(target, "pointerdown", { ...down, pointerType:pt, isPrimary:true, pointerId:1 });
      dispatchMouseLike(target, "mousedown", down);
      dispatchMouseLike(target, "pointerup", { ...up, pointerType:pt, isPrimary:true, pointerId:1 });
      dispatchMouseLike(target, "mouseup", up);
      dispatchMouseLike(target, "click", { ...base, button:0 });
      return true;
    } catch (_) {
      try { target.click(); return true; } catch (__) { return false; }
    }
  };

  const nativeClickTarget = (target) => {
    try { target.click(); return true; }
    catch (_) { return false; }
  };

  const runClickPipeline = (target, preferNative, statNativeKey, statFallbackKey) => {
    try {
      if (!target) return false;
      if (preferNative) {
        const okNative = nativeClickTarget(target);
        if (okNative) {
          if (statNativeKey) STATS[statNativeKey] = (STATS[statNativeKey] || 0) + 1;
          return true;
        }
      }
      const okFallback = fireSequence(target);
      if (okFallback && statFallbackKey) STATS[statFallbackKey] = (STATS[statFallbackKey] || 0) + 1;
      return okFallback;
    } catch (_) { return false; }
  };

  const wrapTopmostOK = (wrap, target) => {
    try {
      if (!CFG.S1_STRICT_TOPMOST_CHECK) return true;
      const el = target || wrap;
      if (!el || !isVisible(el)) return false;
      ensureInView(el);
      const r = el.getBoundingClientRect();
      const w = el.ownerDocument?.defaultView || window;
      const cx = r.left + r.width * CFG.S1_CLICK_X_RATIO;
      const cy = r.top + r.height * CFG.S1_CLICK_Y_RATIO;
      const vw = w.innerWidth || 0;
      const vh = w.innerHeight || 0;
      if (!(cx >= 0 && cy >= 0 && cx <= vw && cy <= vh)) return false;
      return elementFromPointOK(el, cx, cy);
    } catch (_) { return true; }
  };

  const resetAttempts = (wrap, st) => {
    try {
      if (st === "ready") readyAttempts.set(wrap, 0);
      else if (st === "zero") zeroAttempts.set(wrap, 0);
    } catch (_) {}
  };

  const clearAttempts = (wrap, st) => {
    try {
      if (st === "ready") readyAttempts.delete(wrap);
      else if (st === "zero") zeroAttempts.delete(wrap);
    } catch (_) {}
  };

  const bumpAttempt = (wrap, st) => {
    try {
      if (st === "ready") readyAttempts.set(wrap, (readyAttempts.get(wrap) || 0) + 1);
      else if (st === "zero") zeroAttempts.set(wrap, (zeroAttempts.get(wrap) || 0) + 1);
    } catch (_) {}
  };

  const getAttempt = (wrap, st) => {
    try {
      if (st === "ready") return (readyAttempts.get(wrap) || 0);
      if (st === "zero") return (zeroAttempts.get(wrap) || 0);
      return 0;
    } catch (_) { return 0; }
  };

  const rearmIfNeeded = (wrap, st) => {
    const prev = lastState.get(wrap) || "none";

    if (st !== prev) {
      if (prev === "ready" && st !== "ready") { armedReady.set(wrap, true); clearAttempts(wrap, "ready"); }
      if (prev === "zero"  && st !== "zero")  { armedZero.set(wrap, true);  clearAttempts(wrap, "zero"); }

      if (st === "ready") resetAttempts(wrap, "ready");
      if (st === "zero")  resetAttempts(wrap, "zero");

      if (st === "none") {
        armedReady.set(wrap, true);
        armedZero.set(wrap, true);
        clearAttempts(wrap, "ready");
        clearAttempts(wrap, "zero");
      }

      lastState.set(wrap, st);
    } else {
      if (!armedReady.has(wrap)) armedReady.set(wrap, true);
      if (!armedZero.has(wrap))  armedZero.set(wrap, true);
      if (st === "ready" && !readyAttempts.has(wrap)) resetAttempts(wrap, "ready");
      if (st === "zero"  && !zeroAttempts.has(wrap))  resetAttempts(wrap, "zero");
    }
  };

  const postClickVerify = (wrap, st, g) => {
    const delay = (st === "ready") ? CFG.VERIFY_READY_DELAY_MS : CFG.VERIFY_ZERO_DELAY_MS;
    setTimeout(() => {
      try {
        if (!on || g !== GEN) return;
        if (!wrap || wrap.nodeType !== 1 || !wrap.isConnected) return;

        const cur = getWrapState(wrap);
        if (cur !== st) return;

        const attempts = getAttempt(wrap, st);
        const max = (st === "ready") ? CFG.RETRY_READY_MAX : CFG.RETRY_ZERO_MAX;
        if (attempts >= max) return;

        if (st === "ready") armedReady.set(wrap, true);
        if (st === "zero")  armedZero.set(wrap, true);

        scheduleBurst(CFG.RETRY_BURST_MS);
      } catch (_) {}
    }, delay);
  };

  const smartClickExec = (wrap, st) => {
    if (!canAct(st)) return false;
    if (!wrap || wrap.nodeType !== 1 || !wrap.isConnected) return false;
    if (!isVisible(wrap)) return false;

    st = st || getWrapState(wrap);
    if (st === "none") return false;
    if (getWrapState(wrap) !== st) return false;

    const t = now();

    if (st === "zero") {
      if (!CFG.CLICK_ON_ZERO) return false;
      if (CFG.ZERO_POKE_MODE === "off") return false;
      if (CFG.ZERO_POKE_MODE === "adaptive") {
        const recentVisitor = (t - visLastVisitorSignalAt) <= CFG.ZERO_POKE_VISITOR_GRACE_MS;
        const recentVisMut = (t - visLastMutAt) <= Math.min(900, CFG.ZERO_POKE_VISITOR_GRACE_MS);
        if (!recentVisitor && !recentVisMut) return false;
      }
    }

    if (st === "ready" && armedReady.get(wrap) === false) return false;
    if (st === "zero"  && armedZero.get(wrap)  === false) return false;

    if (!globalThrottleOK(t)) return false;

    const map = (st === "ready") ? clickedAtReady : clickedAtZero;
    const cd  = (st === "ready") ? CFG.READY_COOLDOWN_MS : CFG.ZERO_COOLDOWN_MS;
    const prev = map.get(wrap) || 0;
    if ((t - prev) < cd) return false;

    const tgt = getClickableTarget(wrap);
    if (!wrapTopmostOK(wrap, tgt)) {
      STATS.serveTopmostReject += 1;
      return false;
    }

    map.set(wrap, t);
    clickTimes.push(t);
    lastGlobalClickAt = t;

    if (st === "ready") armedReady.set(wrap, false);
    if (st === "zero")  armedZero.set(wrap, false);

    bumpAttempt(wrap, st);
    STATS.serveClicked += 1;

    const ok = runClickPipeline(tgt, CFG.S1_NATIVE_CLICK_FIRST, "serveNativeClick", "serveFallbackClick");
    try { if (ok && st === "ready") asArmServeToken(); } catch (_) {}

    postClickVerify(wrap, st, GEN);
    return ok;
  };

  const smartClick = (wrap, st) => {
    try {
      if (!wrap || wrap.nodeType !== 1) return false;
      const state = st || getWrapState(wrap);
      if (state === "ready") STATS.serveSeen += 1;
      const key = "serve:" + state + ":" + getNodeKey(wrap, "w");
      const enq = actArbEnqueue("serve", key, state === "ready" ? 100 : 20, () => smartClickExec(wrap, state), CFG.ACTION_ARB_EXEC_LOCK_MS, 120);
      if (enq && state === "ready") STATS.serveQueued += 1;
      return enq;
    } catch (_) { return false; }
  };

  const attachWrapLocalObserver = (wrap) => {
    if (!wrap || wrap.nodeType !== 1) return;
    if (wrapLocalMO.has(wrap)) return;

    const mo = new MutationObserver(() => {
      try {
        if (!on) return;
        if (!wrap.isConnected) {
          try { mo.disconnect(); } catch (_) {}
          try { wrapLocalMO.delete(wrap); } catch (_) {}
          return;
        }

        const t = now();
        if ((t - lastMoBurstAt) < CFG.MO_BURST_THROTTLE_MS) return;
        lastMoBurstAt = t;

        const st = getWrapState(wrap);
        rearmIfNeeded(wrap, st);
        if (st !== "none") smartClick(wrap, st);

        scheduleBurst();
      } catch (_) {}
    });

    try {
      mo.observe(wrap, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["title","class","style","hidden","aria-hidden","aria-disabled","disabled","role"]
      });
    } catch (_) {}

    wrapLocalMO.set(wrap, mo);
  };

  const registerWrap = (wrap, stOpt) => {
    if (!wrap || wrap.nodeType !== 1) return { st: "none", clicked: false };

    if (!wrapObserved.has(wrap)) {
      wrapObserved.add(wrap);
      attachWrapLocalObserver(wrap);
    }

    let st = stOpt;
    try { st = st || getWrapState(wrap); } catch (_) { st = "none"; }

    try { rearmIfNeeded(wrap, st); } catch (_) {}
    let clicked = false;
    try { if (st !== "none") clicked = smartClick(wrap, st); } catch (_) {}

    return { st, clicked };
  };

  const addWrap = (wrap) => {
    try {
      if (!wrap || wrap.nodeType !== 1) return;
      if (wrapsSet.has(wrap)) return;
      wrapsSet.add(wrap);
      wrapsList.push(wrap);
      registerWrap(wrap);
    } catch (_) {}
  };

  const pruneWrapsList = (force=false) => {
    const t = now();
    if (!force && (t - wrapsPruneAt) < CFG.WRAP_PRUNE_EVERY_MS) return;
    wrapsPruneAt = t;

    if (!wrapsList.length) return;

    let write = 0;
    for (let i = 0; i < wrapsList.length; i++) {
      const w = wrapsList[i];
      if (w && w.isConnected) {
        wrapsList[write++] = w;
        continue;
      }

      try {
        const mo = wrapLocalMO.get(w);
        if (mo) mo.disconnect();
      } catch (_) {}
      try { wrapLocalMO.delete(w); } catch (_) {}
      try { lastState.delete(w); } catch (_) {}
      try { armedReady.delete(w); } catch (_) {}
      try { armedZero.delete(w); } catch (_) {}
      try { clickedAtReady.delete(w); } catch (_) {}
      try { clickedAtZero.delete(w); } catch (_) {}
      try { readyAttempts.delete(w); } catch (_) {}
      try { zeroAttempts.delete(w); } catch (_) {}
    }

    wrapsList.length = write;
  };

  const resyncWraps = (force=false) => {
    const t = now();
    if (!force && (t - wrapsResyncAt) < CFG.WRAP_RESYNC_MS) return;
    wrapsResyncAt = t;

    pruneWrapsList(force);

    let wraps = [];
    try { wraps = document.querySelectorAll ? document.querySelectorAll(CFG.WRAP_SEL) : []; } catch (_) { wraps = []; }
    if (!wraps || !wraps.length) return;

    const lim = Math.min(wraps.length, CFG.MAX_SCAN * 4);
    for (let i = 0; i < lim; i++) addWrap(wraps[i]);
  };

  const visQS = (root, sel) => { try { return root?.querySelector?.(sel) || null; } catch (_) { return null; } };
  const visQSA = (root, sel) => { try { return root?.querySelectorAll?.(sel) || []; } catch (_) { return []; } };
  const visText = (root, sel) => norm(visQS(root, sel)?.textContent || "");
  const visNum = (s) => {
    const m = String(s || "").match(/\d+/);
    if (!m) return 0;
    const n = parseInt(m[0], 10);
    return Number.isFinite(n) ? n : 0;
  };

  const visListVisible = (el) => {
    try {
      if (!el || !el.isConnected) return false;
      const w = el.ownerDocument?.defaultView || window;
      const cs = w.getComputedStyle(el);
      if (!cs) return false;
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      return true;
    } catch (_) { return false; }
  };

  const visSignal = (ms = CFG.VIS_WAKE_BURST_MS, hard = false) => {
    const t = now();
    visLastVisitorSignalAt = t;
    if ((t - visLastWakeAt) < 36 && !hard) return;
    visLastWakeAt = t;
    scheduleBurst(hard ? Math.max(ms, CFG.VIS_HARD_WAKE_BURST_MS) : ms);
  };

  const visRowSnapshot = (row) => {
    const name = visText(row, CFG.VIS_ROW_NAME_SEL);
    const served = visText(row, CFG.VIS_ROW_SERVED_SEL);
    const timeText = visText(row, CFG.VIS_ROW_TIME_SEL);
    const viewing = visText(row, CFG.VIS_ROW_VIEWING_SEL);
    return {
      key: [name, served, timeText, viewing].join("|"),
      served,
      uns: !served || served === "-"
    };
  };

  const visEvalRow = (row) => {
    try {
      if (!row || row.nodeType !== 1) return false;

      const cur = visRowSnapshot(row);
      if (CFG.VIS_UNSERVED_ONLY && !cur.uns) {
        visRowState.set(row, cur);
        return false;
      }

      const prev = visRowState.get(row);
      visRowState.set(row, cur);

      if (!prev) {
        visSignal(CFG.VIS_HARD_WAKE_BURST_MS, true);
        return true;
      }

      if (prev.key !== cur.key) {
        visSignal(CFG.VIS_WAKE_BURST_MS, false);
        return true;
      }

      return false;
    } catch (_) { return false; }
  };

  const visScanAll = (hard = false) => {
    if (!CFG.VIS_ENABLE) return false;

    let hit = false;

    try {
      const incoming = document.querySelector?.(CFG.VIS_INCOMING_SEL);
      if (incoming && visListVisible(incoming)) {
        const count = visNum(visText(incoming, CFG.VIS_GROUP_COUNT_SEL));
        if (count > 0) {
          visSignal(CFG.VIS_HARD_WAKE_BURST_MS, true);
          hit = true;
        }
      }
    } catch (_) {}

    let rows = [];
    try { rows = document.querySelectorAll ? document.querySelectorAll(CFG.VIS_ROW_SEL) : []; } catch (_) { rows = []; }
    const lim = Math.min(rows.length, CFG.VIS_ROW_SCAN_LIMIT);
    for (let i = 0; i < lim; i++) {
      if (visEvalRow(rows[i])) hit = true;
    }

    if (hard && !hit && lim > 0) visSignal(CFG.VIS_WAKE_BURST_MS, false);

    visLastScanAt = now();
    return hit;
  };

  const visPlanNext = () => {
    if (!CFG.VIS_ENABLE || !on) return;
    if (visScanTimer) return;

    visScanTimer = setTimeout(() => {
      visScanTimer = 0;
      if (!CFG.VIS_ENABLE || !on) return;
      visScanAll(false);
    }, CFG.VIS_SCAN_MS);
  };

  const visKick = (hard = false) => {
    if (!CFG.VIS_ENABLE || !on) return;
    visLastMutAt = now();
    microtask(() => {
      try { if (on) visScanAll(hard); } catch (_) {}
    });
    visPlanNext();
  };

  const scanAndRegister = () => {
    if (!on) return { found:false, clicked:false };

    resyncWraps(false);
    pruneWrapsList(false);

    let found = false;
    let clicked = false;

    const hardLim = Math.min(wrapsList.length, CFG.MAX_SCAN);

    for (let i = 0; i < hardLim; i++) {
      const w = wrapsList[i];
      if (!w || !w.isConnected) continue;
      const st = getWrapState(w);
      if (st !== "none") found = true;
      if (st !== "ready") continue;
      const r = registerWrap(w, st);
      if (r.clicked) { clicked = true; if (CFG.STOP_SCAN_AFTER_CLICK) return { found, clicked }; }
    }

    if (CFG.CLICK_ON_ZERO) {
      for (let i = 0; i < hardLim; i++) {
        const w = wrapsList[i];
        if (!w || !w.isConnected) continue;
        const st = getWrapState(w);
        if (st !== "none") found = true;
        if (st !== "zero") continue;
        const r = registerWrap(w, st);
        if (r.clicked) { clicked = true; if (CFG.STOP_SCAN_AFTER_CLICK) break; }
      }
    }

    return { found, clicked };
  };

  const hotTick = (g) => {
    if (!on || g !== GEN) { hotTimer = 0; return; }
    if (!canServeEngineRun()) { hotTimer = 0; return; }
    if (now() < ecoUntil) { hotTimer = 0; return; }

    const t = now();
    if (t > burstUntil) { hotTimer = 0; return; }

    const r = scanAndRegister();
    if (!r.found && !r.clicked) idleFrames++; else idleFrames = 0;
    if (idleFrames >= CFG.IDLE_STOP_AFTER_FRAMES) { hotTimer = 0; return; }

    if (t < burstHotUntil) hotTimer = setTimeout(() => hotTick(g), 0);
    else hotTimer = 0;
  };

  const rafTick = (g) => {
    if (!on || g !== GEN) { rafId = 0; return; }
    if (!canServeEngineRun()) { rafId = 0; return; }

    const t = now();
    if (t > burstUntil) { rafId = 0; return; }

    if (lastFrameAt) {
      const dt = t - lastFrameAt;
      if (dt > 70) jankScore++; else jankScore = Math.max(0, jankScore - 1);
      if (jankScore >= 6) {
        ecoUntil = t + 4200;
        jankScore = 0;
        rafId = 0;
        hotTimer = 0;
        pendingBurst = true;
        wakeIfNeeded();
        return;
      }
    }
    lastFrameAt = t;

    const r = scanAndRegister();
    if (!r.found && !r.clicked) idleFrames++; else idleFrames = 0;
    if (idleFrames >= CFG.IDLE_STOP_AFTER_FRAMES) { rafId = 0; return; }

    rafId = requestAnimationFrame(() => rafTick(g));
  };

  function wakeIfNeeded() {
    if (wakeTimer) return;
    wakeTimer = setTimeout(() => {
      wakeTimer = 0;
      if (!on) return;
      const t = now();
      if (t < ecoUntil) { wakeIfNeeded(); return; }
      if (!canServeEngineRun()) { wakeIfNeeded(); return; }
      if (pendingBurst) {
        pendingBurst = false;
        scheduleBurst(420);
      }
    }, 140);
  }

  function scheduleBurst(ms = CFG.BURST_MS) {
    if (!on) return;

    const t = now();
    burstUntil = Math.max(burstUntil, t + ms);
    burstHotUntil = Math.max(burstHotUntil, t + CFG.HOT_BURST_FIRST_MS);

    if (t < ecoUntil) {
      pendingBurst = true;
      wakeIfNeeded();
      return;
    }

    if (!canServeEngineRun()) {
      pendingBurst = true;
      wakeIfNeeded();
      return;
    }

    const g = GEN;

    try { scanAndRegister(); } catch (_) {}

    if (!hotTimer) hotTimer = setTimeout(() => hotTick(g), 0);
    if (!rafId && typeof requestAnimationFrame === "function") rafId = requestAnimationFrame(() => rafTick(g));
  }

  const wireRoot = (root) => {
    try {
      if (!root || ROOTS.has(root)) return;
      ROOTS.add(root);

      const mo = new MutationObserver((records) => {
        if (!on) return;

        let hit = false;
        for (let i = 0; i < records.length; i++) {
          const m = records[i];
          if (!m) continue;

          if (m.type === "childList") {
            const nodes = m.addedNodes;
            if (nodes && nodes.length) {
              for (let j = 0; j < nodes.length; j++) {
                const n = nodes[j];
                if (!n || n.nodeType !== 1) continue;
                try {
                  if (n.matches && n.matches(CFG.WRAP_SEL)) { addWrap(n); hit = true; }
                  const q = n.querySelectorAll ? n.querySelectorAll(CFG.WRAP_SEL) : null;
                  if (q && q.length) { q.forEach(addWrap); hit = true; }
                } catch (_) {}
              }
            }
          }

          if (m.type === "attributes") {
            const tt = (m.target && m.target.nodeType === 1) ? m.target : m.target?.parentElement;
            if (!tt) continue;
            try {
              const w = tt.matches?.(CFG.WRAP_SEL) ? tt : tt.closest?.(CFG.WRAP_SEL);
              if (w) { addWrap(w); hit = true; }
            } catch (_) {}
          }
        }

        if (hit) scheduleBurst();
      });

      mo.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["title","class","style","hidden","aria-hidden","aria-disabled","disabled","role"]
      });

      rootMOs.push(mo);
      resyncWraps(true);
      scheduleBurst(900);
    } catch (_) {}
  };

  const wireFrame = (f) => {
    try {
      if (!f || f.nodeName !== "IFRAME" || IFRS.has(f)) return;
      IFRS.add(f);

      const bind = () => {
        try {
          if (!on) return;
          const d = f.contentDocument;
          const w = f.contentWindow;
          if (d) wireRoot(d);
          if (w) bindShortcut(w);
          scheduleBurst(900);
          cbKick();
          visKick(true);
          asKick("frame");
        } catch (_) {}
      };

      f.addEventListener("load", bind, { passive: true });
      bind();
    } catch (_) {}
  };

  const bindShortcut = (w) => {
    try {
      if (!w) return;
      for (let i = 0; i < shortcutBinds.length; i++) if (shortcutBinds[i].w === w) return;

      let last = 0;
      const h = (e) => {
        try {
          const k = e.key || "";
          const isEnter = (k === "Enter" || k === "NumpadEnter" || e.keyCode === 13);
          if (!(e.ctrlKey || e.metaKey) || !isEnter) return;
          const t = now();
          if ((t - last) < 160) return;
          last = t;
          toggle();
        } catch (_) {}
      };

      w.addEventListener("keydown", h, { capture: true });
      shortcutBinds.push({ w, h });
    } catch (_) {}
  };

  const unbindShortcuts = () => {
    for (let i = 0; i < shortcutBinds.length; i++) {
      const { w, h } = shortcutBinds[i];
      try { w.removeEventListener("keydown", h, { capture: true }); } catch (_) {}
    }
    shortcutBinds.length = 0;
  };

  const POS_KEY = "s1_puck_pos_v1";

  const updateUI = () => {
    const d = document.getElementById(UI.PANEL_ID);
    if (!d) return;
    d.classList.toggle("off", !on);
    d.title = `${META.NAME} ${META.VERSION} - ${on ? "Active" : "Off"}\nCtrl+Enter : On/Off\nShift+Tap Bubble : Remove`;
  };

  const buildUI = () => {
    if (!document.getElementById(UI.STYLE_ID)) {
      const s = document.createElement("style");
      s.id = UI.STYLE_ID;
      s.textContent = `
#${UI.PANEL_ID}{
  position:fixed; z-index:2147483647;
  left:0; top:0; right:auto; bottom:auto;
  width:42px; height:42px;
  display:inline-flex; align-items:center; justify-content:center;
  border-radius:9999px; cursor:pointer;
  box-shadow: 0 10px 26px rgba(0,0,0,.34),
              inset 0 1px 0 rgba(255,255,255,.12),
              inset 0 -1px 0 rgba(0,0,0,.22);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: opacity .16s ease, transform .05s linear;
  background: linear-gradient(145deg, rgba(36,36,36,.90), rgba(10,10,10,.72));
  touch-action:none;
  -webkit-user-select:none; user-select:none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  contain: layout paint style;
}
#${UI.PANEL_ID}.off{ opacity:.45; }
#${UI.PANEL_ID}:active{ filter: brightness(1.03); }
#${UI.PANEL_ID} .logo{ width:24px; height:24px; pointer-events:none; filter: drop-shadow(0 1px 2px rgba(0,0,0,.3)); }
@media (prefers-color-scheme: light){
  #${UI.PANEL_ID}{ background: linear-gradient(145deg, rgba(255,255,255,.95), rgba(240,240,240,.80)); }
}`.trim();
      (document.head || document.documentElement).appendChild(s);
    }

    let d = document.getElementById(UI.PANEL_ID);
    if (!d) {
      d = document.createElement("div");
      d.id = UI.PANEL_ID;

      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 -30.5 256 256");
      svg.setAttribute("class", "logo");
      svg.setAttribute("preserveAspectRatio", "xMidYMid");
      const g = document.createElementNS(NS, "g");
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d",
        "M118.249172,51.2326115 L118.249172,194.005605 L0,194.005605 L118.249172,51.2326115 Z "+
        "M118.249172,0 C118.249172,32.6440764 91.7686624,59.124586 59.124586,59.124586 "+
        "C26.4805096,59.124586 0,32.6440764 0,0 L118.249172,0 Z "+
        "M137.750828,194.005605 C137.750828,161.328917 164.198726,134.881019 196.875414,134.881019 "+
        "C229.552102,134.881019 256,161.361529 256,194.005605 L137.750828,194.005605 Z "+
        "M137.750828,142.740382 L137.750828,0 L256,0 L137.750828,142.740382 Z"
      );
      p.setAttribute("fill", "#03363D");
      g.appendChild(p);
      svg.appendChild(g);
      d.appendChild(svg);

      let x = 0, y = 0, w = 42, h = 42;
      let drag = false, moved = false;
      let startCX = 0, startCY = 0, startX = 0, startY = 0;
      let rafPos = 0, dirty = false;
      let capId = null;

      const clamp = (vx, vy) => {
        const vw = innerWidth || 0, vh = innerHeight || 0;
        const pad = 6;
        const cx = Math.min(Math.max(pad, vx), Math.max(pad, vw - w - pad));
        const cy = Math.min(Math.max(pad, vy), Math.max(pad, vh - h - pad));
        return [cx, cy];
      };

      const applyPos = () => {
        rafPos = 0;
        if (!dirty) return;
        dirty = false;
        d.style.transform = `translate3d(${x}px,${y}px,0)`;
      };

      const setPos = (vx, vy) => {
        const c = clamp(vx, vy);
        x = c[0]; y = c[1];
        dirty = true;
        if (!rafPos) rafPos = requestAnimationFrame(applyPos);
      };

      const loadPos = () => {
        try {
          const raw = localStorage.getItem(POS_KEY);
          if (raw) {
            const j = JSON.parse(raw);
            if (j && Number.isFinite(j.x) && Number.isFinite(j.y)) {
              x = j.x; y = j.y;
              dirty = true;
              applyPos();
              return;
            }
          }
        } catch (_) {}
        x = Math.max(6, (innerWidth || 0) - 14 - 42);
        y = Math.max(6, (innerHeight || 0) - 14 - 42);
        dirty = true;
        applyPos();
      };

      const savePos = () => { try { localStorage.setItem(POS_KEY, JSON.stringify({ x, y })); } catch (_) {} };

      const refreshSize = () => {
        try {
          const r = d.getBoundingClientRect();
          if (r && r.width > 0 && r.height > 0) { w = r.width; h = r.height; }
        } catch (_) {}
      };

      loadPos();
      refreshSize();

      const onResize = () => { refreshSize(); setPos(x, y); };
      uiRM.resize = onResize;
      addEventListener("resize", onResize, { passive: true });

      d.onpointerdown = (e) => {
        try {
          drag = true; moved = false;
          refreshSize();
          startCX = e.clientX; startCY = e.clientY;
          startX = x; startY = y;
          capId = e.pointerId;
          try { d.setPointerCapture(e.pointerId); } catch (_) {}
          if (e.cancelable) { try { e.preventDefault(); } catch (_) {} }
        } catch (_) {}
      };

      d.onpointermove = (e) => {
        if (!drag) return;
        try {
          const dx = e.clientX - startCX;
          const dy = e.clientY - startCY;
          if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
          setPos(startX + dx, startY + dy);
          if (e.cancelable) { try { e.preventDefault(); } catch (_) {} }
        } catch (_) {}
      };

      const endDrag = () => {
        drag = false;
        try { if (capId != null) d.releasePointerCapture(capId); } catch (_) {}
        capId = null;
        savePos();
      };

      d.onpointerup = endDrag;
      d.onpointercancel = endDrag;
      d.onlostpointercapture = endDrag;

      d.onclick = (e) => {
        if (moved) { moved = false; return; }
        if (e && e.shiftKey) { kill(); return; }
        toggle();
      };

      (document.body || document.documentElement).appendChild(d);
    }

    updateUI();
  };

  const cbState = new WeakMap();
  const cbManual = { holdUntil: 0, stickyUntil: 0, targetKey: "", lastUserAt: 0 };
  let cbRootMO = null;

  let cbScanTimer = 0;
  let cbLastMutAt = 0;
  let cbLastScanAt = 0;
  let cbLastOpenAt = 0;

  const cbCloseTimes = [];
  let cbCloseHead = 0;
  let cbLastCloseAt = 0;

  const cbPendingOpen = new WeakMap();
  const cbPostClickLockUntil = new WeakMap();

  const cbQS = (root, sel) => { try { return root?.querySelector?.(sel) || null; } catch (_) { return null; } };
  const cbQSA = (root, sel) => { try { return root?.querySelectorAll?.(sel) || []; } catch (_) { return []; } };

  const cbParseUnread = (s) => {
    const m = String(s || "").match(/\d+/);
    if (!m) return 0;
    const n = parseInt(m[0], 10);
    return Number.isFinite(n) ? n : 0;
  };

  const cbGetItemKey = (item) => {
    try {
      if (!item) return "";
      const rowid = safeAttr(item, "jx:list:rowid") || safeAttr(item, "jx:list:rowId") || safeAttr(item, "data-rowid");
      if (rowid) return "rowid:" + rowid;
      const name = norm(item.querySelector?.(".name, [data-test-id='nameCell']")?.textContent || "");
      const msg = norm(cbQS(item, CFG.CB_MSG_SEL)?.textContent || "");
      const jxid = norm(safeAttr(item, "__jx__id") || safeAttr(item, "id"));
      const sig = [name.slice(0, 80), msg.slice(0, 120), jxid].filter(Boolean).join("|");
      return sig ? ("sig:" + sig) : getNodeKey(item, "c");
    } catch (_) { return ""; }
  };

  const cbGetCurrentActiveItem = () => {
    try {
      const direct = document.querySelector(CFG.AS_ACTIVE_ITEM_SEL || CFG.CB_ITEM_SEL + ".active");
      if (direct && !cbIsAgentItem(direct)) return direct;
    } catch (_) {}
    try {
      const items = document.querySelectorAll(CFG.CB_ITEM_SEL);
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it || cbIsAgentItem(it)) continue;
        if (cbGetActive(it)) return it;
      }
    } catch (_) {}
    return null;
  };

  const cbSetManualTarget = (item, ms = CFG.CB_MANUAL_OVERRIDE_MS) => {
    try {
      if (!CFG.CB_RESPECT_USER_MANUAL_SWITCH) return;
      if (!item || cbIsAgentItem(item)) return;
      const key = cbGetItemKey(item);
      if (!key) return;
      const t = now();
      cbManual.targetKey = key;
      cbManual.lastUserAt = t;
      cbManual.holdUntil = Math.max(cbManual.holdUntil, t + Math.max(180, ms || 0));
      cbManual.stickyUntil = Math.max(cbManual.stickyUntil, t + Math.max(CFG.CB_MANUAL_ACTIVE_GRACE_MS, ms || 0));
    } catch (_) {}
  };

  const cbTouchManualTarget = (ms = CFG.CB_MANUAL_PANEL_HOLD_MS) => {
    try {
      if (!CFG.CB_RESPECT_USER_MANUAL_SWITCH) return;
      if (!cbManual.targetKey) return;
      const t = now();
      cbManual.lastUserAt = t;
      cbManual.stickyUntil = Math.max(cbManual.stickyUntil, t + Math.max(180, ms || 0));
    } catch (_) {}
  };

  const cbShouldPauseAutoOpen = () => {
    try {
      if (!CFG.CB_RESPECT_USER_MANUAL_SWITCH) return false;
      const t = now();
      if (t < cbManual.holdUntil) return true;
      if (!cbManual.targetKey) return false;
      if (t >= cbManual.stickyUntil) return false;
      const active = cbGetCurrentActiveItem();
      const activeKey = cbGetItemKey(active);
      return !!(activeKey && activeKey === cbManual.targetKey);
    } catch (_) { return false; }
  };

  const cbIsAgentItem = (item) => {
    try {
      if (!CFG.CB_IGNORE_AGENT_ITEMS) return false;
      if (!item || item.nodeType !== 1) return false;
      if (item.classList?.contains(CFG.CB_AGENT_CLASS)) return true;

      const rowid = safeAttr(item, "jx:list:rowid") || safeAttr(item, "jx:list:rowId") || safeAttr(item, "data-rowid");
      if (rowid && String(rowid).toLowerCase().startsWith(String(CFG.CB_AGENT_ROWID_PREFIX).toLowerCase())) return true;
      return false;
    } catch (_) { return false; }
  };

  const cbGetUnread = (item) => {
    const el = cbQS(item, CFG.CB_UNREAD_SEL);
    if (el) return cbParseUnread(el.textContent);
    try { if (item.classList?.contains(CFG.CB_UNREAD_CLASS)) return 1; } catch (_) {}
    return 0;
  };

  const cbGetLoading = (item) => {
    const el = cbQS(item, CFG.CB_DOTS_SEL);
    if (!el) return false;
    try {
      const w = el.ownerDocument?.defaultView || window;
      const cs = w.getComputedStyle(el);
      if (!cs) return false;
      if (cs.display === "none") return false;
      if (cs.visibility === "hidden") return false;
      if (+cs.opacity === 0) return false;
      return true;
    } catch (_) {
      const st = (el.getAttribute("style") || "").toLowerCase();
      return st.includes("visibility: visible") || st.includes("visibility:visible");
    }
  };

  const cbGetActive = (item) => {
    try {
      if (item.classList?.contains("active")) return true;
      const aria = safeAttr(item, "aria-selected");
      if (aria && aria.toLowerCase() === "true") return true;
      return false;
    } catch (_) { return false; }
  };

  const cbGetLeave = (item) => {
    try {
      if (item.classList?.contains(CFG.CB_LEAVE_CLASS)) return true;
      const msg = cbQS(item, CFG.CB_MSG_SEL);
      const t = norm(msg ? msg.textContent : "");
      return !!(t && CFG.CB_LEAVE_TEXT_RE.test(t));
    } catch (_) { return false; }
  };

  const cbCanOpen = (reason) => {
    if (!on) return false;
    if (document.visibilityState && document.visibilityState !== "visible" && !CFG.CB_ALLOW_HIDDEN) return false;
    if (userDown && !CFG.CB_ALLOW_DURING_USER_INPUT) return false;
    if (isComposerBusy() && !CFG.CB_ALLOW_WHILE_COMPOSER_BUSY) return false;
    if (asHasPriorityLock()) return false;
    if (cbShouldPauseAutoOpen()) return false;
    if (CFG.CB_IGNORE_IDLE_REQUIRED) return true;
    if (reason === "unread" && CFG.CB_OPEN_IGNORE_IDLE_ON_UNREAD) return true;
    return (now() - lastUserAt) >= CFG.CB_IDLE_REQUIRED_MS;
  };

  const cbEnsureInView = (el) => {
    try {
      if (!el || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      const w = el.ownerDocument?.defaultView || window;
      const vh = w.innerHeight || 0;
      if (r.top < 0 || r.bottom > vh) {
        try { el.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (_) {}
      }
    } catch (_) {}
  };

  const cbTopmostOK = (item) => {
    if (!CFG.CB_STRICT_TOPMOST_CHECK) return true;
    try {
      const doc = item.ownerDocument || document;
      const w = doc.defaultView || window;
      const r = item.getBoundingClientRect();
      const cx = r.left + r.width * CFG.CB_CLICK_X_RATIO;
      const cy = r.top + r.height * CFG.CB_CLICK_Y_RATIO;
      const vw = w.innerWidth || 0, vh = w.innerHeight || 0;
      if (!(cx >= 0 && cy >= 0 && cx <= vw && cy <= vh)) return false;
      return elementFromPointOK(item, cx, cy);
    } catch (_) { return true; }
  };

  const cbFireItemClick = (item) => {
    try {
      if (!item) return false;

      const w = item.ownerDocument?.defaultView || window;
      const pt = ("ontouchstart" in w) ? "touch" : "mouse";
      const r = item.getBoundingClientRect();
      const cx = r.left + r.width * CFG.CB_CLICK_X_RATIO;
      const cy = r.top + r.height * CFG.CB_CLICK_Y_RATIO;

      const base = { bubbles:true, cancelable:true, view:w, clientX:cx, clientY:cy, composed:true };
      const down = { ...base, button:0, buttons:1 };
      const up   = { ...base, button:0, buttons:0 };

      dispatchMouseLike(item, "pointerover",  { ...base, pointerType:pt, isPrimary:true, pointerId:2 });
      dispatchMouseLike(item, "pointerdown",  { ...down, pointerType:pt, isPrimary:true, pointerId:2 });
      dispatchMouseLike(item, "mousedown", down);
      dispatchMouseLike(item, "pointerup",    { ...up, pointerType:pt, isPrimary:true, pointerId:2 });
      dispatchMouseLike(item, "mouseup", up);
      dispatchMouseLike(item, "click", { ...base, button:0 });
      return true;
    } catch (_) {
      try { item.click(); return true; } catch (__) { return false; }
    }
  };

  const cbPruneCloses = (t) => {
    while (cbCloseHead < cbCloseTimes.length && (t - cbCloseTimes[cbCloseHead]) > CFG.CB_CLOSE_WINDOW_MS) cbCloseHead++;
    if (cbCloseHead > 24 && cbCloseHead * 2 > cbCloseTimes.length) {
      cbCloseTimes.splice(0, cbCloseHead);
      cbCloseHead = 0;
    }
  };

  const cbCloseThrottleOK = (t) => {
    cbPruneCloses(t);
    const live = cbCloseTimes.length - cbCloseHead;
    if (live >= CFG.CB_CLOSE_MAX_PER_WINDOW) return false;
    if ((t - cbLastCloseAt) < CFG.CB_CLOSE_COOLDOWN_MS) return false;
    return true;
  };

  const cbOpenThrottleOK = (t) => {
    if ((t - cbLastOpenAt) < CFG.CB_OPEN_COOLDOWN_MS) return false;
    return true;
  };

  const cbScheduleOpen = (item, reason) => {
    try {
      const t = now();
      const p = cbPendingOpen.get(item) || 0;
      if ((t - p) < 25) return;
      cbPendingOpen.set(item, t);

      microtask(() => {
        try { cbOpenIfAllowed(item, reason); } catch (_) {}
      });
    } catch (_) {}
  };

  const cbOpenExec = (item, reason) => {
    if (reason === "unread" && !CFG.CB_AUTO_OPEN_ON_UNREAD) return false;
    if (reason === "next" && !CFG.CB_AUTO_OPEN_NEXT_UNREAD) return false;

    if (!cbCanOpen(reason)) return false;
    if (!item || item.nodeType !== 1 || !item.isConnected) return false;
    if (!isVisible(item)) return false;

    if (cbIsAgentItem(item)) return false;

    const s = cbState.get(item);
    if (!s) return false;

    if (CFG.CB_SKIP_LEAVE_ON_OPEN && s.leave) return false;
    if (s.loading) return false;
    if (s.active) return false;

    const t = now();
    if (!cbOpenThrottleOK(t)) return false;

    const lockUntil = cbPostClickLockUntil.get(item) || 0;
    if (t < lockUntil) return false;

    if ((t - (s.lastOpenAt || 0)) < CFG.CB_ITEM_OPEN_COOLDOWN_MS) return false;

    cbEnsureInView(item);
    if (!cbTopmostOK(item)) return false;

    cbLastOpenAt = t;
    s.lastOpenAt = t;
    cbState.set(item, s);

    STATS.cbOpenClicked += 1;
    const ok = runClickPipeline(item, CFG.CB_NATIVE_CLICK_FIRST, null, null) || cbFireItemClick(item);
    cbPostClickLockUntil.set(item, t + CFG.CB_POST_CLICK_LOCK_MS);
    if (ok) asKick("open");
    return ok;
  };

  const cbOpenIfAllowed = (item, reason) => {
    try {
      if (!item || item.nodeType !== 1) return false;
      const key = "cbopen:" + getNodeKey(item, "c");
      const pri = reason === "unread" ? 60 : 50;
      const enq = actArbEnqueue("cb_open", key, pri, () => cbOpenExec(item, reason), CFG.ACTION_ARB_CB_LOCK_MS, 220);
      if (enq) STATS.cbOpenQueued += 1;
      return enq;
    } catch (_) { return false; }
  };

  const cbCloseExec = (item) => {
    if (!CFG.CB_AUTO_CLOSE_LEAVE) return false;
    if (!item || item.nodeType !== 1 || !item.isConnected) return false;
    if (!isVisible(item)) return false;

    if (cbIsAgentItem(item)) return false;

    const s = cbState.get(item);
    if (!s) return false;

    if (!s.leave) return false;
    if (s.loading) return false;
    if (s.active) return false;
    if (CFG.CB_CLOSE_ONLY_IF_UNREAD_ZERO && s.unread > 0) return false;

    const t = now();
    if (!cbCloseThrottleOK(t)) return false;
    if ((t - (s.lastCloseAt || 0)) < CFG.CB_CLOSE_COOLDOWN_MS) return false;

    const closeBtn = cbQS(item, CFG.CB_CLOSE_SEL);
    if (!closeBtn) return false;

    cbEnsureInView(closeBtn);

    cbLastCloseAt = t;
    cbCloseTimes.push(t);

    s.lastCloseAt = t;
    cbState.set(item, s);

    STATS.cbCloseClicked += 1;
    try { return runClickPipeline(closeBtn, CFG.CB_NATIVE_CLICK_FIRST, null, null) || cbFireItemClick(closeBtn); }
    catch (_) { return false; }
  };

  const cbCloseIfAllowed = (item) => {
    try {
      if (!item || item.nodeType !== 1) return false;
      const key = "cbclose:" + getNodeKey(item, "c");
      const enq = actArbEnqueue("cb_close", key, 10, () => cbCloseExec(item), CFG.ACTION_ARB_CB_LOCK_MS, 240);
      if (enq) STATS.cbCloseQueued += 1;
      return enq;
    } catch (_) { return false; }
  };

  const cbPickBestUnread = () => {
    const items = cbQSA(document, CFG.CB_ITEM_SEL);
    let best = null;
    let bestN = -1;

    const n = Math.min(items.length, CFG.CB_SCAN_LIMIT);
    for (let i = 0; i < n; i++) {
      const it = items[i];
      if (!it || it.nodeType !== 1) continue;

      if (cbIsAgentItem(it)) continue;

      const s = cbState.get(it);
      const unread = s ? s.unread : cbGetUnread(it);
      if (unread <= 0) continue;

      const loading = s ? s.loading : cbGetLoading(it);
      const active  = s ? s.active  : cbGetActive(it);
      const leave   = s ? s.leave   : cbGetLeave(it);

      if (loading || active) continue;
      if (CFG.CB_SKIP_LEAVE_ON_OPEN && leave) continue;

      if (unread > bestN) { bestN = unread; best = it; }
    }

    return best;
  };

  const cbEvalItem = (item) => {
    try {
      if (!item || item.nodeType !== 1) return;

      const isAgent = cbIsAgentItem(item);

      const prev = cbState.get(item) || {
        unread: 0, loading: false, active: false, leave: false,
        lastOpenAt: 0, lastCloseAt: 0, isAgent: false
      };

      const unread = cbGetUnread(item);
      const loading = cbGetLoading(item);
      const active = cbGetActive(item);
      const leave = cbGetLeave(item);

      const unreadUp = unread > prev.unread;
      const becameUnread = prev.unread === 0 && unread > 0;
      const leaveUp = !prev.leave && leave;

      const next = { ...prev, unread, loading, active, leave, isAgent };
      cbState.set(item, next);

      if (isAgent) return;

      if (CFG.CB_AUTO_OPEN_ON_UNREAD && (becameUnread || unreadUp)) {
        if (!(CFG.CB_SKIP_LEAVE_ON_OPEN && leave)) cbScheduleOpen(item, "unread");
      }

      if (CFG.CB_AUTO_OPEN_NEXT_UNREAD) {
        const readyToAdvance =
          (active && unread === 0) ||
          (prev.unread > 0 && unread === 0);

        if (readyToAdvance && cbCanOpen("next")) {
          const nx = cbPickBestUnread();
          if (nx) cbScheduleOpen(nx, "next");
        }
      }

      if (CFG.CB_AUTO_CLOSE_LEAVE && (leaveUp || (leave && unread === 0 && !active))) {
        cbCloseIfAllowed(item);
      }

      if (unread > 0 || loading || (leave && CFG.CB_AUTO_CLOSE_LEAVE)) cbKick();
    } catch (_) {}
  };

  const cbScanAll = () => {
    try {
      const items = cbQSA(document, CFG.CB_ITEM_SEL);
      const n = Math.min(items.length, CFG.CB_SCAN_LIMIT);
      for (let i = 0; i < n; i++) cbEvalItem(items[i]);
    } catch (_) {}
  };

  const cbHasWork = () => {
    try {
      const items = cbQSA(document, CFG.CB_ITEM_SEL);
      const n = Math.min(items.length, 80);
      for (let i = 0; i < n; i++) {
        const it = items[i];
        if (!it) continue;
        if (cbIsAgentItem(it)) continue;
        const unread = cbGetUnread(it);
        if (unread > 0) return true;
      }
      return false;
    } catch (_) { return true; }
  };

  const cbPlanNextScan = () => {
    try {
      if (!on) return;
      if (cbScanTimer) return;

      if (userDown || isComposerBusy()) {
        cbScanTimer = setTimeout(() => { cbScanTimer = 0; cbPlanNextScan(); }, 260);
        return;
      }

      const t = now();
      const quietFor = t - cbLastMutAt;
      const sinceScan = t - cbLastScanAt;

      const hasWork = cbHasWork();
      const fast = hasWork || quietFor < CFG.CB_IDLE_TO_SLOW_AFTER_MS;

      let ms = fast ? CFG.CB_FAST_SCAN_MS : CFG.CB_SLOW_SCAN_MS;
      if (sinceScan > CFG.CB_FORCE_RESCAN_AFTER_MS) ms = Math.min(ms, CFG.CB_FAST_SCAN_MS);

      cbScanTimer = setTimeout(() => {
        cbScanTimer = 0;
        if (!on) return;
        if (userDown || isComposerBusy()) { cbPlanNextScan(); return; }
        cbLastScanAt = now();
        cbScanAll();
        cbPlanNextScan();
      }, ms);
    } catch (_) {}
  };

  const cbKick = () => {
    try {
      if (!on) return;
      cbLastMutAt = now();
      microtask(() => {
        try {
          if (!on) return;
          if (userDown || isComposerBusy()) return;
          if (CFG.CB_AUTO_OPEN_NEXT_UNREAD && cbCanOpen("next")) {
            const nx = cbPickBestUnread();
            if (nx) cbScheduleOpen(nx, "next");
          }
        } catch (_) {}
      });
      cbPlanNextScan();
    } catch (_) {}
  };

  const cbWire = () => {
    if (cbRootMO) return;

    if (!document.getElementById(UI.CB_STYLE_ID)) {
      const s = document.createElement("style");
      s.id = UI.CB_STYLE_ID;
      s.textContent = `
${CFG.CB_ITEM_SEL}{ transition: filter .12s ease; }
${CFG.CB_ITEM_SEL}.${CFG.CB_LEAVE_CLASS}{ filter: grayscale(.25) contrast(0.95); }
`.trim();
      (document.head || document.documentElement).appendChild(s);
    }

    cbRootMO = new MutationObserver((recs) => {
      if (!on) return;
      cbLastMutAt = now();

      const touched = new Set();
      try {
        for (let i = 0; i < recs.length; i++) {
          const m = recs[i];
          if (!m) continue;

          if (m.type === "childList") {
            const a = m.addedNodes;
            if (a && a.length) {
              for (let j = 0; j < a.length; j++) {
                const n = a[j];
                if (!n || n.nodeType !== 1) continue;
                const it = n.matches?.(CFG.CB_ITEM_SEL) ? n : n.closest?.(CFG.CB_ITEM_SEL);
                if (it) touched.add(it);
                const q = n.querySelectorAll?.(CFG.CB_ITEM_SEL);
                if (q && q.length) q.forEach((x) => touched.add(x));
              }
            }
          } else {
            const tt = (m.target && m.target.nodeType === 1) ? m.target : m.target?.parentElement;
            if (!tt) continue;
            const it = tt.matches?.(CFG.CB_ITEM_SEL) ? tt : tt.closest?.(CFG.CB_ITEM_SEL);
            if (it) touched.add(it);
          }
        }
      } catch (_) {}

      if (touched.size) touched.forEach((it) => cbEvalItem(it));
      cbPlanNextScan();
    });

    try {
      cbRootMO.observe(document.body || document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true
      });
    } catch (_) {}

    cbLastMutAt = now();
    cbLastScanAt = now();
    cbScanAll();
    cbPlanNextScan();
  };

  const cbUnwire = () => {
    try { if (cbRootMO) cbRootMO.disconnect(); } catch (_) {}
    cbRootMO = null;

    try { if (cbScanTimer) clearTimeout(cbScanTimer); } catch (_) {}
    cbScanTimer = 0;

    try { const s = document.getElementById(UI.CB_STYLE_ID); if (s) s.remove(); } catch (_) {}
  };

  const visWire = () => {
    if (!CFG.VIS_ENABLE || visRootMO) return;

    visRootMO = new MutationObserver((records) => {
      if (!on) return;
      visLastMutAt = now();

      let hit = false;
      try {
        for (let i = 0; i < records.length; i++) {
          const m = records[i];
          if (!m) continue;

          if (m.type === "childList") {
            const nodes = m.addedNodes;
            if (!nodes || !nodes.length) continue;
            for (let j = 0; j < nodes.length; j++) {
              const n = nodes[j];
              if (!n || n.nodeType !== 1) continue;
              if (
                n.matches?.(CFG.VIS_ROW_SEL) ||
                n.matches?.(CFG.VIS_INCOMING_SEL) ||
                n.matches?.(CFG.VIS_GENERAL_SEL) ||
                n.querySelector?.(CFG.VIS_ROW_SEL) ||
                n.querySelector?.(CFG.VIS_INCOMING_SEL) ||
                n.querySelector?.(CFG.VIS_GENERAL_SEL)
              ) { hit = true; break; }
            }
          } else {
            const tt = (m.target && m.target.nodeType === 1) ? m.target : m.target?.parentElement;
            if (!tt) continue;
            if (
              tt.matches?.(CFG.VIS_ROW_SEL) ||
              tt.matches?.(CFG.VIS_INCOMING_SEL) ||
              tt.matches?.(CFG.VIS_GENERAL_SEL) ||
              tt.closest?.(CFG.VIS_ROW_SEL) ||
              tt.closest?.(CFG.VIS_INCOMING_SEL) ||
              tt.closest?.(CFG.VIS_GENERAL_SEL)
            ) { hit = true; }
          }

          if (hit) break;
        }
      } catch (_) {}

      if (hit) visKick(false);
    });

    try {
      visRootMO.observe(document.body || document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true
      });
    } catch (_) {}

    visKick(true);
  };

  const visUnwire = () => {
    try { if (visRootMO) visRootMO.disconnect(); } catch (_) {}
    visRootMO = null;

    try { if (visScanTimer) clearTimeout(visScanTimer); } catch (_) {}
    visScanTimer = 0;
  };


  const asQS = (root, sel) => { try { return root?.querySelector?.(sel) || null; } catch (_) { return null; } };

  const asVisible = (el) => {
    try {
      if (!el || el.nodeType !== 1 || !el.isConnected) return false;
      const w = el.ownerDocument?.defaultView || window;
      const cs = w.getComputedStyle(el);
      if (!cs) return false;
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (+cs.opacity === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    } catch (_) { return false; }
  };

  const asCanRun = () => {
    if (!on || !CFG.AS_ENABLE) return false;
    if (document.visibilityState && document.visibilityState !== "visible" && !CFG.AS_ALLOW_HIDDEN) return false;
    if (userDown && !CFG.AS_ALLOW_DURING_USER_INPUT) return false;
    if (isComposerBusy() && !CFG.AS_ALLOW_WHILE_COMPOSER_BUSY) return false;
    if (!CFG.AS_IGNORE_USER_BUSY_UNTIL && now() < userBusyUntil) return false;
    return true;
  };

  const asDispatchInputValue = (ta, value) => {
    try {
      const w = ta.ownerDocument?.defaultView || window;
      const next = String(value || "");
      const proto = Object.getPrototypeOf(ta);
      const desc = proto && Object.getOwnPropertyDescriptor(proto, "value");
      if (desc && typeof desc.set === "function") desc.set.call(ta, next);
      else ta.value = next;
      try {
        if (typeof ta.setSelectionRange === "function") ta.setSelectionRange(next.length, next.length);
      } catch (_) {}
      try {
        ta.dispatchEvent(new w.InputEvent("beforeinput", { bubbles: true, cancelable: true, composed: true, data: next.slice(-1) || null, inputType: "insertText" }));
      } catch (_) {}
      try {
        ta.dispatchEvent(new w.InputEvent("input", { bubbles: true, composed: true, data: next.slice(-1) || null, inputType: "insertText" }));
      } catch (_) {
        ta.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      }
      ta.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      return true;
    } catch (_) {
      try {
        ta.value = String(value || "");
        try {
          if (typeof ta.setSelectionRange === "function") ta.setSelectionRange(ta.value.length, ta.value.length);
        } catch (_) {}
        ta.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        return true;
      } catch (__) { return false; }
    }
  };

  const asDispatchKey = (el, key, code) => {
    try {
      const w = el.ownerDocument?.defaultView || window;
      const kc = key === "Enter" ? 13 : (typeof key === "string" && key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0);
      const init = { key, code, bubbles: true, cancelable: true, composed: true, keyCode: kc || undefined, which: kc || undefined, charCode: kc || undefined };
      el.dispatchEvent(new w.KeyboardEvent("keydown", init));
      el.dispatchEvent(new w.KeyboardEvent("keypress", init));
      return true;
    } catch (_) { return false; }
  };

  const asKeyMeta = (ch) => {
    try {
      if (ch === "/") return { key: "/", code: "Slash" };
      if (ch === "\\") return { key: "\\", code: "Backslash" };
      if (ch === " ") return { key: " ", code: "Space" };
      if (/^[0-9]$/.test(ch)) return { key: ch, code: "Digit" + ch };
      const up = String(ch || "").toUpperCase();
      if (/^[A-Z]$/.test(up)) return { key: ch, code: "Key" + up };
      return { key: ch, code: "" };
    } catch (_) { return { key: ch, code: "" }; }
  };

  const asTypeTriggerValue = (ta, value) => {
    try {
      if (!ta) return false;
      try { ta.focus(); } catch (_) {}
      try { ta.click(); } catch (_) {}
      asDispatchInputValue(ta, "");
      const raw = String(value || "");
      let acc = "";
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        const meta = asKeyMeta(ch);
        acc += ch;
        asDispatchKey(ta, meta.key, meta.code);
        asDispatchInputValue(ta, acc);
        try {
          const w = ta.ownerDocument?.defaultView || window;
          ta.dispatchEvent(new w.KeyboardEvent("keyup", { key: meta.key, code: meta.code, bubbles: true, cancelable: true, composed: true }));
        } catch (_) {}
      }
      return norm(ta.value) === norm(raw);
    } catch (_) {
      try { return asDispatchInputValue(ta, value); } catch (__) { return false; }
    }
  };

  const asGetActiveItem = () => {
    try { return cbGetCurrentActiveItem(); }
    catch (_) { return null; }
  };

  const asGetActivePanel = () => {
    try {
      const panels = document.querySelectorAll(CFG.AS_ACTIVE_PANEL_SEL);
      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        if (panel && asVisible(panel)) return panel;
      }
    } catch (_) {}
    return null;
  };

  const asGetPanelKey = (panel) => {
    try {
      if (!panel) return "";
      const title = norm(panel.querySelector?.(CFG.AS_PANEL_TITLE_SEL)?.textContent || "");
      const jxid = norm(safeAttr(panel, "__jx__id") || safeAttr(panel, "id"));
      const ta = panel.querySelector?.(CFG.TA_SEL);
      const taid = norm(safeAttr(ta, "id") || safeAttr(ta, "__jx__id"));
      const sig = [jxid, title, taid].filter(Boolean).join("|");
      return sig ? ("panel:" + sig) : getNodeKey(panel, "p");
    } catch (_) { return ""; }
  };

  const asGetChatKey = (item) => {
    try {
      if (!item) return "";
      const base = cbGetItemKey(item);
      if (base && !base.startsWith("sig:")) return base;
      const name = norm(item.querySelector?.(".name, [data-test-id='nameCell']")?.textContent || "");
      const msg = norm(cbQS(item, CFG.CB_MSG_SEL)?.textContent || "");
      const view = norm(item.querySelector?.("[data-test-id='viewingPage']")?.textContent || "");
      const served = norm(item.querySelector?.("[data-test-id='servedByCell']")?.textContent || "");
      const sig = [name.slice(0, 80), msg.slice(0, 120), view.slice(0, 80), served.slice(0, 40)].join("|");
      return sig ? ("sig:" + sig) : base;
    } catch (_) { return ""; }
  };

  const asCleanProof = (t) => {
    try { return norm(String(t || "").replace(/\s+/g, " ").trim()); }
    catch (_) { return ""; }
  };

  const asRememberProof = (key, proof) => {
    try {
      const k = String(key || "");
      const p = asCleanProof(proof);
      if (!k || !p) return;
      if (asProofByKey.has(k)) asProofByKey.delete(k);
      asProofByKey.set(k, p);
      pruneOrderedMap(asProofByKey, CFG.AS_MEMORY_SENT_LIMIT);
    } catch (_) {}
  };

  const asGetProof = (key) => {
    try { return asProofByKey.get(String(key || "")) || ""; }
    catch (_) { return ""; }
  };


  const pruneOrderedSet = (set, max) => {
    try {
      if (!set || set.size <= max) return;
      while (set.size > max) {
        const first = set.values().next();
        if (first?.done) break;
        set.delete(first.value);
      }
    } catch (_) {}
  };

  const pruneOrderedMap = (map, max) => {
    try {
      if (!map || map.size <= max) return;
      while (map.size > max) {
        const first = map.keys().next();
        if (first?.done) break;
        map.delete(first.value);
      }
    } catch (_) {}
  };

  const asRememberSent = (key) => {
    try {
      if (!key) return;
      if (asSentKeys.has(key)) asSentKeys.delete(key);
      asSentKeys.add(key);
      pruneOrderedSet(asSentKeys, CFG.AS_MEMORY_SENT_LIMIT);
    } catch (_) {}
  };

  const asMarkTry = (key) => {
    try {
      const n = (asTryCount.get(key) || 0) + 1;
      asTryCount.set(key, n);
      pruneOrderedMap(asTryCount, CFG.AS_MEMORY_TRY_LIMIT);
      return n;
    } catch (_) { return 1; }
  };

  const asServeTokenExpired = () => {
    if (!asServe.armed) return false;
    return (now() - asServe.armedAt) > CFG.AS_SERVE_TOKEN_TTL_MS;
  };

  const asClearServeToken = () => {
    asServe.armed = false;
    asServe.armedAt = 0;
    asServe.anchorKey = "";
    asServe.targetKey = "";
  };

  const asAbortPending = () => {
    asFlow.key = "";
    asFlow.step = "";
    asFlow.stepAt = 0;
    asFlow.ghostBase = "";
    asFlow.proofText = "";
    asFlow.sendPresses = 0;
    asFlow.typedValue = "";
  };

  const asResetFlow = () => {
    asAbortPending();
    asFlow.openUntil = 0;
  };

  const asArmServeToken = () => {
    try {
      const panel = asGetActivePanel();
      const item = asGetActiveItem();
      asServe.armed = true;
      asServe.armedAt = now();
      asServe.anchorKey = asGetPanelKey(panel) || (item ? asGetChatKey(item) : "");
      asServe.targetKey = "";
      asServe.sendKey = "";
      asServe.sendAt = 0;
      asServe.tokenSeq = (asServe.tokenSeq || 0) + 1;
      asResetFlow();
      asKick("serve");
    } catch (_) {}
  };

  const asResolveServeTarget = (panel, item, key) => {
    try {
      if (!CFG.AS_REQUIRE_LATEST_SERVE_ONLY) return key;
      if (!asServe.armed) return "";
      if (asServeTokenExpired()) {
        asResetFlow();
        asClearServeToken();
        return "";
      }
      if (asServe.targetKey) return asServe.targetKey;

      const age = now() - asServe.armedAt;
      if (age < CFG.AS_SERVE_BIND_SETTLE_MS) return "";

      const state = cbState.get(item);
      const recentlyOpened = !!(state && state.lastOpenAt && state.lastOpenAt >= (asServe.armedAt - 80));
      const panelKey = key || asGetPanelKey(panel);
      const isNewTarget = !asServe.anchorKey || panelKey !== asServe.anchorKey || recentlyOpened;
      if (isNewTarget) {
        asServe.targetKey = panelKey;
        return asServe.targetKey;
      }

      if (panelKey && age >= CFG.AS_SERVE_BIND_FALLBACK_MS) {
        asServe.targetKey = panelKey;
        return asServe.targetKey;
      }

      return "";
    } catch (_) { return ""; }
  };

  const asGetComposer = () => {
    try {
      const panel = asGetActivePanel();
      let ta = null;

      if (panel && panel.querySelectorAll) {
        const scoped = panel.querySelectorAll(CFG.TA_SEL);
        for (let i = 0; i < scoped.length; i++) {
          const cand = scoped[i];
          if (cand && asVisible(cand) && !cand.disabled) { ta = cand; break; }
        }
      }

      if (!ta) {
        const tas = document.querySelectorAll(CFG.TA_SEL);
        for (let i = 0; i < tas.length; i++) {
          const cand = tas[i];
          if (cand && asVisible(cand) && !cand.disabled) { ta = cand; break; }
        }
      }

      if (!ta) return null;
      const panelRoot = panel || ta.closest(CFG.AS_ACTIVE_PANEL_SEL) || null;
      const root = ta.closest(CFG.AS_ROOT_SEL) || panelRoot || ta.parentElement || document.body;
      const composer = root.querySelector?.(CFG.AS_COMPOSER_SEL) || panelRoot?.querySelector?.(CFG.AS_COMPOSER_SEL) || ta.closest(CFG.AS_COMPOSER_SEL) || document.querySelector(CFG.AS_COMPOSER_SEL);
      return {
        ta,
        root,
        panel: panelRoot || root,
        panelKey: asGetPanelKey(panelRoot || root),
        composer: composer || root || ta.parentElement || document.body
      };
    } catch (_) { return null; }
  };

  const asNoMatchesVisible = (ctx) => {
    try {
      const root = ctx?.root || ctx?.composer || ctx || document;
      const els = root.querySelectorAll ? root.querySelectorAll(CFG.AS_NO_MATCH_SEL) : document.querySelectorAll(CFG.AS_NO_MATCH_SEL);
      for (let i = 0; i < els.length; i++) if (asVisible(els[i])) return true;
      return false;
    } catch (_) { return false; }
  };

  const asShortcutListVisible = (ctx) => {
    try {
      const root = ctx?.root || ctx?.composer || ctx || document;
      const box = root.querySelector ? root.querySelector(CFG.AS_SHORTCUT_LIST_BOX_SEL) : document.querySelector(CFG.AS_SHORTCUT_LIST_BOX_SEL);
      return !!(box && asVisible(box));
    } catch (_) { return false; }
  };

  const asShortcutOptionVisible = (ctx) => {
    try {
      const root = ctx?.root || ctx?.composer || ctx || document;
      const els = root.querySelectorAll ? root.querySelectorAll(CFG.AS_SHORTCUT_OPTION_SEL) : document.querySelectorAll(CFG.AS_SHORTCUT_OPTION_SEL);
      for (let i = 0; i < els.length; i++) if (asVisible(els[i])) return true;
      return false;
    } catch (_) { return false; }
  };

  const asGetFirstShortcutOption = (ctx) => {
    try {
      const root = ctx?.root || ctx?.composer || ctx || document;
      const els = root.querySelectorAll ? root.querySelectorAll(CFG.AS_SHORTCUT_OPTION_SEL) : document.querySelectorAll(CFG.AS_SHORTCUT_OPTION_SEL);
      for (let i = 0; i < els.length; i++) if (asVisible(els[i])) return els[i];
      return null;
    } catch (_) { return null; }
  };

  const asClickShortcutOption = (ctx) => {
    try {
      const opt = asGetFirstShortcutOption(ctx);
      if (!opt) return false;
      try { opt.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (_) {}
      try { opt.click(); return true; }
      catch (_) { return fireSequence(opt); }
    } catch (_) { return false; }
  };

  const asGhostText = (ctx) => {
    try {
      const root = ctx?.root || ctx?.composer || ctx || document;
      return norm((root.querySelector?.(CFG.AS_GHOST_TEXT_SEL) || document.querySelector(CFG.AS_GHOST_TEXT_SEL))?.textContent || "");
    }
    catch (_) { return ""; }
  };

  const asGetVisibleShortcutMessage = (ctx) => {
    try {
      const opt = asGetFirstShortcutOption(ctx);
      if (!opt) return "";
      const msg = opt.querySelector?.(".message, .text, [data-test-id='message']");
      return asCleanProof(msg?.textContent || opt.textContent || "");
    } catch (_) { return ""; }
  };

  const asBuildProofText = (ta, ctx) => {
    try {
      const trigger = norm(CFG.AS_TRIGGER);
      const val = asCleanProof(ta?.value || "");
      const ghost = asCleanProof(asGhostText(ctx));
      const optMsg = asGetVisibleShortcutMessage(ctx);

      if (val && val !== trigger) return val;
      if (ghost && ghost !== asCleanProof(asFlow.ghostBase)) return ghost;
      if (optMsg) return optMsg;
      return "";
    } catch (_) { return ""; }
  };

  const asIsAgentChatRow = (row) => {
    try {
      if (!row || row.nodeType !== 1) return false;
      const name = asCleanProof(row.querySelector?.(CFG.AS_CHATLOG_NAME_SEL)?.textContent || "");
      if (!name) return false;
      if (/^visitor\b/i.test(name)) return false;
      return CFG.AS_AGENT_NAME_RE.test(name);
    } catch (_) { return false; }
  };

  const asRowMessageText = (row) => {
    try {
      return asCleanProof(row.querySelector?.(CFG.AS_CHATLOG_MSG_SEL)?.textContent || "");
    } catch (_) { return ""; }
  };

  const asActiveChatHasProof = (proofText) => {
    try {
      const proof = asCleanProof(proofText);
      if (!proof || proof.length < CFG.AS_PROOF_MIN_LEN) return false;

      const rows = document.querySelectorAll(CFG.AS_CHATLOG_ROW_SEL);
      let seen = 0;

      for (let i = rows.length - 1; i >= 0 && seen < CFG.AS_CHATLOG_SCAN_LIMIT; i--, seen++) {
        const row = rows[i];
        if (!asIsAgentChatRow(row)) continue;

        const msg = asRowMessageText(row);
        if (!msg) continue;
        if (CFG.AS_SYSTEM_SKIP_RE.test(msg)) continue;

        if (msg === proof) return true;
        if (msg.includes(proof)) return true;

        const shortProof = proof.slice(0, 120);
        if (shortProof && msg.includes(shortProof)) return true;
      }

      return false;
    } catch (_) { return false; }
  };

  const asSyncSentFromActiveChat = (key) => {
    try {
      if (!key) return false;
      const proof = asGetProof(key);
      if (!proof) return false;
      if (!asActiveChatHasProof(proof)) return false;

      asRememberSent(key);
      asTryCount.delete(key);
      if (CFG.AS_REQUIRE_LATEST_SERVE_ONLY && key === asServe.targetKey) asClearServeToken();
      asAbortPending();
      return true;
    } catch (_) { return false; }
  };

  const asLooksExpanded = (ta, ctx) => {
    try {
      const trigger = norm(CFG.AS_TRIGGER);
      const val = norm(ta?.value);
      const ghost = asGhostText(ctx);
      const hasList = asShortcutListVisible(ctx);
      const hasOption = asShortcutOptionVisible(ctx);

      if (hasList || hasOption) return true;
      if (val && val !== trigger) return true;
      if (ghost && ghost !== asFlow.ghostBase) return true;
      if (!ghost && !hasList && !hasOption && val !== trigger) return true;
      return false;
    } catch (_) { return false; }
  };

  const asPressEnter = (ta) => {
    try { ta.focus(); } catch (_) {}
    const ok = asDispatchKey(ta, "Enter", "Enter");
    try {
      const w = ta.ownerDocument?.defaultView || window;
      ta.dispatchEvent(new w.KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true, cancelable: true, composed: true, keyCode: 13, which: 13, charCode: 13 }));
    } catch (_) {}
    return ok;
  };

  const asKick = (reason) => {
    try {
      if (!CFG.AS_ENABLE) return;
      const t = now();
      if (reason === "open") asFlow.openUntil = Math.max(asFlow.openUntil, t + CFG.AS_OPEN_SETTLE_MS);
      if (!asTimer) {
        asTimer = setTimeout(() => {
          asTimer = 0;
          asLoop();
        }, 30);
      }
    } catch (_) {}
  };

  const asTryAdvance = () => {
    if (!asCanRun()) return;

    if (CFG.AS_REQUIRE_LATEST_SERVE_ONLY && asServeTokenExpired()) {
      asResetFlow();
      asClearServeToken();
      return;
    }

    const panel = asGetActivePanel();
    if (!panel) { asAbortPending(); return; }
    const item = asGetActiveItem();
    const key = asGetPanelKey(panel);
    if (!key) return;

    if (asSyncSentFromActiveChat(key)) return;

    if (CFG.AS_REQUIRE_LATEST_SERVE_ONLY) {
      const targetKey = asResolveServeTarget(panel, item, key);
      if (!targetKey) return;
      if (key !== targetKey) {
        if (asFlow.key && asFlow.key !== key) asAbortPending();
        return;
      }
    }

    if (asSentKeys.has(key)) return;
    if (CFG.AS_ONE_SEND_PER_SERVE && asServe.sendKey && asServe.sendKey === key) return;

    const tries = asTryCount.get(key) || 0;
    if (tries >= CFG.AS_MAX_TRIES_PER_CHAT) return;

    const pack = asGetComposer();
    if (!pack || pack.panelKey !== key) return;
    const { ta } = pack;

    const trigger = norm(CFG.AS_TRIGGER);
    const val = norm(ta.value);

    if (asFlow.key && asFlow.key !== key) asAbortPending();

    if (!asFlow.key) {
      if (val && val !== trigger) return;
      if (now() < asFlow.openUntil) return;

      asFlow.ghostBase = asGhostText(pack);

      const typed = asTypeTriggerValue(ta, trigger);
      if (!typed) { asAbortPending(); return; }
      asFlow.key = key;
      asFlow.step = "typed";
      asFlow.stepAt = now();
      asFlow.proofText = "";
      asFlow.sendPresses = 0;
      asFlow.typedValue = "";
      asMarkTry(key);
      return;
    }

    if (asFlow.key !== key) return;

    if (asFlow.step === "typed") {
      if ((now() - asFlow.stepAt) < CFG.AS_AFTER_TYPE_SETTLE_MS) return;
      const curVal = norm(ta.value);
      const ghost = asGhostText(pack);
      if (asFlow.typedValue && asFlow.typedValue !== trigger) {
        if (curVal !== asFlow.typedValue) { asAbortPending(); return; }
        if ((now() - asFlow.stepAt) < CFG.AS_AFTER_TYPE_SETTLE_MS) return;
        const advanced = asTypeTriggerValue(ta, trigger);
        if (!advanced) { asAbortPending(); return; }
        asFlow.typedValue = trigger;
        asFlow.ghostBase = asGhostText(pack);
        asFlow.stepAt = now();
        return;
      }
      if (curVal && curVal !== trigger) {
        asFlow.step = "send";
        asFlow.stepAt = now();
        return;
      }
      if (ghost && ghost !== asFlow.ghostBase) {
        asFlow.step = "send";
        asFlow.stepAt = now();
        return;
      }
      asFlow.step = "expand";
      asFlow.stepAt = now();
      return;
    }

    if (asFlow.step === "expand") {
      if (asNoMatchesVisible(pack)) { asAbortPending(); return; }
      if (asLooksExpanded(ta, pack)) {
        asFlow.step = "select";
        asFlow.stepAt = now();
        return;
      }

      asPressEnter(ta);
      asFlow.step = "wait_expand";
      asFlow.stepAt = now();
      return;
    }

    if (asFlow.step === "wait_expand") {
      if (asNoMatchesVisible(pack)) { asAbortPending(); return; }
      if (asLooksExpanded(ta, pack)) {
        asFlow.step = "select";
        asFlow.stepAt = now();
        return;
      }
      if ((now() - asFlow.stepAt) >= CFG.AS_EXPAND_WAIT_MS) {
        asFlow.step = "send";
        asFlow.stepAt = now();
      }
      return;
    }

    if (asFlow.step === "select") {
      if (asNoMatchesVisible(pack)) { asAbortPending(); return; }
      if (asShortcutOptionVisible(pack) || asShortcutListVisible(pack)) {
        const picked = asClickShortcutOption(pack) || asPressEnter(ta);
        if (picked) {
          asFlow.step = "wait_selected";
          asFlow.stepAt = now();
          return;
        }
      }
      asFlow.step = "send";
      asFlow.stepAt = now();
      return;
    }

    if (asFlow.step === "wait_selected") {
      if (asNoMatchesVisible(pack)) { asAbortPending(); return; }
      const curVal = norm(ta.value);
      const hasList = asShortcutListVisible(pack) || asShortcutOptionVisible(pack);
      const ghost = asGhostText(pack);
      if (curVal !== trigger || !hasList || ghost !== asFlow.ghostBase) {
        asFlow.step = "send";
        asFlow.stepAt = now();
        return;
      }
      if ((now() - asFlow.stepAt) >= CFG.AS_SELECT_WAIT_MS) {
        asFlow.step = "send";
        asFlow.stepAt = now();
      }
      return;
    }

    if (asFlow.step === "send") {
      if (pack.panelKey !== key) { asAbortPending(); return; }
      if (CFG.AS_REQUIRE_EXPAND_BEFORE_SEND) {
        const curVal = norm(ta.value);
        const ghost = asGhostText(pack);
        const hasList = asShortcutListVisible(pack) || asShortcutOptionVisible(pack);
        const expanded = (curVal && curVal !== trigger) || (ghost && ghost !== asFlow.ghostBase) || hasList;
        if (!expanded && curVal === trigger) { asAbortPending(); return; }
      }
      if ((now() - asFlow.lastSendAt) < CFG.AS_SEND_LOCK_MS) return;
      if (asFlow.sendPresses >= CFG.AS_MAX_SEND_PRESSES) { asAbortPending(); return; }
      if (CFG.AS_ONE_SEND_PER_SERVE && asServe.sendKey && asServe.sendKey === key) { asAbortPending(); return; }

      const proofText = asBuildProofText(ta, pack);
      if (proofText) {
        asFlow.proofText = proofText;
        asRememberProof(key, proofText);
      }

      asFlow.lastSendAt = now();
      asFlow.sendPresses += 1;

      const ok = asPressEnter(ta);
      if (ok) {
        if (CFG.AS_ONE_SEND_PER_SERVE) {
          asServe.sendKey = key;
          asServe.sendAt = now();
        }
        const startVal = norm(ta.value);
        const startGhost = asGhostText(pack);
        const sendPressNo = asFlow.sendPresses;
        setTimeout(() => {
          try {
            const curPanel = asGetActivePanel();
            const curKey = curPanel ? asGetPanelKey(curPanel) : "";
            const curPack = asGetComposer();
            const curVal = norm(curPack?.ta?.value || "");
            const curGhost = asGhostText(curPack);

            const changedChat = !!curKey && curKey !== key;
            const clearedInput = !curVal || curVal !== startVal;
            const changedGhost = curGhost !== startGhost;

            const proof = asFlow.proofText || asGetProof(key);
            const proofSeen = !!proof && (
              (curKey === key && asActiveChatHasProof(proof)) ||
              (changedChat && (clearedInput || changedGhost || !curPack))
            );

            if (proofSeen || clearedInput || changedGhost) {
              asRememberSent(key);
              asTryCount.delete(key);
              if (CFG.AS_REQUIRE_LATEST_SERVE_ONLY && key === asServe.targetKey) asClearServeToken();
              asAbortPending();
              return;
            }

            if (asFlow.key === key && asFlow.step === "send" && sendPressNo < CFG.AS_MAX_SEND_PRESSES) {
              asKick("send_retry");
              return;
            }
          } catch (_) {}
          asAbortPending();
        }, CFG.AS_SEND_VERIFY_MS);
      } else {
        asAbortPending();
      }
      return;
    }
  };

  const asLoop = () => {
    try {
      if (!on || !CFG.AS_ENABLE) { asTimer = 0; return; }
      asTryAdvance();
    } catch (_) {}
    finally {
      if (on && CFG.AS_ENABLE) {
        asTimer = setTimeout(() => {
          asTimer = 0;
          asLoop();
        }, CFG.AS_SCAN_MS);
      } else {
        asTimer = 0;
      }
    }
  };

  const asStart = () => {
    if (!CFG.AS_ENABLE) return;
    asResetFlow();
    if (!asTimer) asKick("start");
  };

  const asStop = () => {
    try { if (asTimer) clearTimeout(asTimer); } catch (_) {}
    asTimer = 0;
    asResetFlow();
    asClearServeToken();
  };

  const installUserGuard = () => {
    const isPuck = (t) => { try { return !!(t && t.closest && t.closest("#"+UI.PANEL_ID)); } catch (_) { return false; } };
    const isChatbarTarget = (t) => { try { return !!(t && t.closest && t.closest(CFG.CB_ITEM_SEL)); } catch (_) { return false; } };
    const isChatbarClose = (t) => { try { return !!(t && t.closest && t.closest(CFG.CB_CLOSE_SEL)); } catch (_) { return false; } };
    const isActivePanelTarget = (t) => { try { return !!(t && t.closest && t.closest(CFG.AS_ACTIVE_PANEL_SEL)); } catch (_) { return false; } };
    const bindManualPreference = (t) => {
      try {
        if (!CFG.CB_RESPECT_USER_MANUAL_SWITCH || !t) return;
        const bar = t.closest?.(CFG.CB_ITEM_SEL);
        if (bar && !isChatbarClose(t)) { cbSetManualTarget(bar, CFG.CB_MANUAL_OVERRIDE_MS); return; }
        if (isActivePanelTarget(t)) cbTouchManualTarget(CFG.CB_MANUAL_PANEL_HOLD_MS);
      } catch (_) {}
    };

    const onDown = (e) => { if (!e?.isTrusted) return; if (isPuck(e.target)) return; bindManualPreference(e.target); userDown = true;  markUserBusy(CFG.USER_GRACE_ON_DOWN_MS); };
    const onUp   = (e) => { if (!e?.isTrusted) return; if (isPuck(e.target)) return; userDown = false; markUserBusy(CFG.USER_GRACE_AFTER_UP_MS); };
    const onWheel= (e) => { if (!e?.isTrusted) return; if (isPuck(e.target)) return; if (isChatbarTarget(e.target) || isActivePanelTarget(e.target)) cbTouchManualTarget(CFG.CB_MANUAL_PANEL_HOLD_MS); markUserBusy(CFG.USER_GRACE_ON_WHEEL_MS); };
    const onKey  = (e) => { if (!e?.isTrusted) return; if (isActivePanelTarget(e.target)) cbTouchManualTarget(CFG.CB_MANUAL_PANEL_HOLD_MS); markUserBusy(CFG.USER_GRACE_ON_KEY_MS); };
    const onBlur = () => { try { userDown = false; markUserBusy(140); } catch (_) {} };

    const wheelOpt = { capture:true, passive:true };
    const touchOpt = { capture:true, passive:true };

    const hasPointer = typeof PointerEvent !== "undefined";
    if (hasPointer) {
      addEventListener("pointerdown", onDown, true);
      addEventListener("pointerup", onUp, true);
      addEventListener("pointercancel", onUp, true);
    } else {
      addEventListener("mousedown", onDown, true);
      addEventListener("mouseup", onUp, true);
      addEventListener("touchstart", onDown, touchOpt);
      addEventListener("touchend", onUp, touchOpt);
      addEventListener("touchcancel", onUp, touchOpt);
    }

    addEventListener("wheel", onWheel, wheelOpt);
    addEventListener("keydown", onKey, true);
    addEventListener("blur", onBlur, true);

    installUserGuard._rm = () => {
      try {
        if (hasPointer) {
          removeEventListener("pointerdown", onDown, true);
          removeEventListener("pointerup", onUp, true);
          removeEventListener("pointercancel", onUp, true);
        } else {
          removeEventListener("mousedown", onDown, true);
          removeEventListener("mouseup", onUp, true);
          removeEventListener("touchstart", onDown, touchOpt);
          removeEventListener("touchend", onUp, touchOpt);
          removeEventListener("touchcancel", onUp, touchOpt);
        }
      } catch (_) {}
      try { removeEventListener("wheel", onWheel, wheelOpt); } catch (_) {}
      try { removeEventListener("keydown", onKey, true); } catch (_) {}
      try { removeEventListener("blur", onBlur, true); } catch (_) {}
    };
  };

  const uninstallUserGuard = () => { try { installUserGuard._rm && installUserGuard._rm(); } catch (_) {} };

  const installNavHooks = () => {
    history.pushState = function () { const ret = ORIG.pushState.apply(this, arguments); if (on) { resyncWraps(true); scheduleBurst(700); cbKick(); visKick(true); asKick("nav"); } return ret; };
    history.replaceState = function () { const ret = ORIG.replaceState.apply(this, arguments); if (on) { resyncWraps(true); scheduleBurst(700); cbKick(); visKick(true); asKick("nav"); } return ret; };

    onPop = () => { if (on) { resyncWraps(true); scheduleBurst(700); cbKick(); visKick(true); asKick("nav"); } };
    addEventListener("popstate", onPop, true);

    onFocus = () => { if (on) { resyncWraps(true); scheduleBurst(520); cbKick(); visKick(true); asKick("focus"); } };
    addEventListener("focus", onFocus, false);

    onVis = () => {
      if (!on) return;
      const hidden = !!(document.visibilityState && document.visibilityState !== "visible");
      try { if (bgWorker) bgWorker.postMessage({ type: hidden ? "hidden" : "visible" }); } catch (_) {}
      if (!hidden) {
        ecoUntil = 0;
        resyncWraps(true);
        scheduleBurst(700);
        cbKick();
        visKick(true);
        asKick("visible");
      }
    };
    document.addEventListener("visibilitychange", onVis, false);
  };

  const uninstallNavHooks = () => {
    try { history.pushState = ORIG.pushState; } catch (_) {}
    try { history.replaceState = ORIG.replaceState; } catch (_) {}
    try { if (onPop) removeEventListener("popstate", onPop, true); } catch (_) {}
    try { if (onFocus) removeEventListener("focus", onFocus, false); } catch (_) {}
    try { if (onVis) document.removeEventListener("visibilitychange", onVis, false); } catch (_) {}
    onPop = onFocus = onVis = null;
  };

  const installShadowPatch = () => {
    try {
      Element.prototype.attachShadow = function () {
        const sr = ORIG.attachShadow.apply(this, arguments);
        try { if (on) wireRoot(sr); } catch (_) {}
        try { if (on) cbKick(); } catch (_) {}
        try { if (on) visKick(true); } catch (_) {}
        try { if (on) asKick("shadow"); } catch (_) {}
        return sr;
      };
    } catch (_) {}
  };

  const uninstallShadowPatch = () => { try { Element.prototype.attachShadow = ORIG.attachShadow; } catch (_) {} };

  let pollTimer = 0;
  let pollMs = CFG.POLL_FAST_MS;

  const pollLoop = (g) => {
    if (!on || g !== GEN) { pollTimer = 0; return; }

    const t = now();
    if (t < ecoUntil || !canServeEngineRun()) {
      pollMs = Math.min(CFG.POLL_SLOW_MS, pollMs + 24);
      pollTimer = setTimeout(() => pollLoop(g), Math.max(CFG.POLL_FAST_MS, pollMs));
      return;
    }

    const r = scanAndRegister();
    if (r.found || r.clicked) pollMs = CFG.POLL_FAST_MS;
    else pollMs = Math.min(CFG.POLL_SLOW_MS, pollMs + 18);

    pollTimer = setTimeout(() => pollLoop(g), pollMs);
  };

  let bgWorker = null;
  let bgWorkerLastAt = 0;

  const bgWorkerStart = () => {
    if (!CFG.BG_WORKER_ENABLE || bgWorker) return;
    try {
      const src = `
        let fg = 60;
        let bg = 220;
        let timer = 0;
        const restart = (ms) => {
          try { if (timer) clearInterval(timer); } catch (_) {}
          timer = setInterval(() => postMessage({ type: "tick" }), Math.max(25, ms || fg));
        };
        onmessage = (e) => {
          const d = e.data || {};
          if (d.type === "cfg") {
            fg = d.fg || fg;
            bg = d.bg || bg;
            restart(d.hidden ? bg : fg);
            return;
          }
          if (d.type === "hidden") { restart(bg); return; }
          if (d.type === "visible") { restart(fg); return; }
          if (d.type === "stop") {
            try { if (timer) clearInterval(timer); } catch (_) {}
            close();
          }
        };
        restart(fg);
      `;

      const blob = new Blob([src], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      try { URL.revokeObjectURL(url); } catch (_) {}

      worker.onmessage = () => {
        try {
          if (!on) return;
          const t = now();
          if ((t - bgWorkerLastAt) < 20) return;
          bgWorkerLastAt = t;
          if (t < ecoUntil) return;
          resyncWraps(false);
          scanAndRegister();
        } catch (_) {}
      };

      worker.postMessage({
        type: "cfg",
        fg: CFG.BG_WORKER_TICK_MS,
        bg: CFG.BG_WORKER_HIDDEN_TICK_MS,
        hidden: !!(document.visibilityState && document.visibilityState !== "visible")
      });

      bgWorker = worker;
    } catch (_) {
      bgWorker = null;
    }
  };

  const bgWorkerStop = () => {
    try { if (bgWorker) bgWorker.postMessage({ type: "stop" }); } catch (_) {}
    try { if (bgWorker) bgWorker.terminate(); } catch (_) {}
    bgWorker = null;
    bgWorkerLastAt = 0;
  };

  const startWatchers = () => {
    wireRoot(document.documentElement || document);
    try { document.querySelectorAll("iframe").forEach(wireFrame); } catch (_) {}
    bindShortcut(window);

    resyncWraps(true);
    cbWire();
    visWire();
    visKick(true);
    asStart();
    scheduleBurst(900);
    bgWorkerStart();

    if (!pollTimer) {
      pollMs = CFG.POLL_FAST_MS;
      pollLoop(GEN);
    }
  };

  const stopWatchers = () => {
    while (rootMOs.length) { const mo = rootMOs.pop(); try { mo.disconnect(); } catch (_) {} }

    try { if (hotTimer) clearTimeout(hotTimer); } catch (_) {}
    try { if (rafId) cancelAnimationFrame(rafId); } catch (_) {}
    hotTimer = 0; rafId = 0; burstUntil = 0; burstHotUntil = 0;

    pendingBurst = false;
    try { if (wakeTimer) clearTimeout(wakeTimer); } catch (_) {}
    wakeTimer = 0;

    try { if (pollTimer) clearTimeout(pollTimer); } catch (_) {}
    pollTimer = 0;

    bgWorkerStop();
    actArbClear();

    cbUnwire();
    visUnwire();
    asStop();
  };

  const toggle = () => {
    GEN++;
    on = !on;
    updateUI();
    if (on) startWatchers();
    else stopWatchers();
  };

  function kill() {
    try {
      on = false;
      GEN++;

      stopWatchers();
      unbindShortcuts();
      uninstallNavHooks();
      uninstallShadowPatch();
      uninstallUserGuard();

      try { const d = document.getElementById(UI.PANEL_ID); if (d) d.remove(); } catch (_) {}
      try { const s = document.getElementById(UI.STYLE_ID); if (s) s.remove(); } catch (_) {}
      try { const cs = document.getElementById(UI.CB_STYLE_ID); if (cs) cs.remove(); } catch (_) {}

      try { if (uiRM.resize) removeEventListener("resize", uiRM.resize, { passive: true }); } catch (_) {}
      uiRM.resize = null;

      try { delete window._s1panelKill; } catch (_) { window._s1panelKill = undefined; }
      try { delete window._s1panelStats; } catch (_) { window._s1panelStats = undefined; }
    } catch (_) {}
  }

  window._s1panelKill = kill;
  window._s1panelStats = () => JSON.parse(JSON.stringify(STATS));

  lastUserAt = now();
  buildUI();
  installUserGuard();
  installNavHooks();
  installShadowPatch();
  startWatchers();
})();