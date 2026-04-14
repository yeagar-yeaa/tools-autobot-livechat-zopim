(() => {
  "use strict";

  try { if (window._s1panelKill) window._s1panelKill(); } catch (_) {}

  const META = { NAME: "Autobot LiveChat", VERSION: "Omniscient Hybrid Edition" };
  const UI = { PANEL_ID: "s1-puck", STYLE_ID: "s1-style", CB_STYLE_ID: "s1-chatbar-style" };

  const _mc = (typeof MessageChannel !== "undefined") ? new MessageChannel() : null;
  const _mcQueue = [];
  if (_mc) {
    _mc.port2.onmessage = () => {
      const batch = _mcQueue.splice(0, _mcQueue.length);
      for (let i = 0; i < batch.length; i++) {
        try { batch[i](); } catch (_) {}
      }
    };
  }
  const fastMicrotask = (fn) => {
    if (_mc) {
      _mcQueue.push(fn);
      _mc.port1.postMessage(0);
    } else {
      try {
        (typeof queueMicrotask === "function" ? queueMicrotask : (f) => Promise.resolve().then(f))(fn);
      } catch (_) { try { setTimeout(fn, 0); } catch (__) {} }
    }
  };


  const wsIntercept = {
    installed: false,
    enabled: true,
    sockets: new Set(),
    origOnMsg: new WeakMap(),
    lastSignalAt: 0,
    _origWSClass: null,
    CHAT_PATTERNS: [
      /incoming/i,
      /new_visitor/i,
      /chat_start/i,
      /queue_update/i,
      /routing/i,
      /assign/i,
      /"type"\s*:\s*"(chat|visitor|routing|queue)"/i,
      /serve.*request/i,
      /pending_chat/i,
    ],
    VISITOR_PATTERNS: [
      /visitor.*joined/i,
      /visitor.*left/i,
      /visitor_count/i,
      /queue_size/i,
    ],
    install() {
      if (this.installed || !CFG.WS_INTERCEPT_ENABLE) return;
      const self = this;
      const OrigWS = window.WebSocket;
      if (typeof OrigWS !== "function") return;
      this._origWSClass = OrigWS;
      window.WebSocket = function(...args) {
        const ws = new OrigWS(...args);
        try { self.hookSocket(ws); } catch (_) {}
        return ws;
      };
      window.WebSocket.prototype = OrigWS.prototype;
      window.WebSocket.CONNECTING = OrigWS.CONNECTING;
      window.WebSocket.OPEN = OrigWS.OPEN;
      window.WebSocket.CLOSING = OrigWS.CLOSING;
      window.WebSocket.CLOSED = OrigWS.CLOSED;
      this.installed = true;
    },
    hookSocket(ws) {
      if (!ws || this.sockets.has(ws)) return;
      this.sockets.add(ws);
      const self = this;
      const origAddListener = ws.addEventListener?.bind(ws);
      if (origAddListener) {
        ws.addEventListener = function(type, listener, ...rest) {
          if (type === "message" && typeof listener === "function") {
            const wrapped = function(event) {
              self.onFrame(event);
              return listener.call(this, event);
            };
            return origAddListener(type, wrapped, ...rest);
          }
          return origAddListener(type, listener, ...rest);
        };
      }
      const desc = Object.getOwnPropertyDescriptor(this._origWSClass?.prototype || WebSocket.prototype, "onmessage")
        || Object.getOwnPropertyDescriptor(ws, "onmessage");
      if (desc) {
        try {
          Object.defineProperty(ws, "onmessage", {
            get() { return self.origOnMsg.get(ws) || null; },
            set(fn) {
              self.origOnMsg.set(ws, fn);
              const wrapped = function(event) {
                self.onFrame(event);
                if (typeof fn === "function") return fn.call(this, event);
              };
              if (desc.set) desc.set.call(ws, wrapped);
            },
            configurable: true
          });
        } catch (_) {}
      }
      try { ws.addEventListener?.("message", (e) => self.onFrame(e), { passive: true }); } catch (_) {}
    },
    onFrame(event) {
      try {
        if (!on) return;
        const data = typeof event?.data === "string" ? event.data : "";
        if (!data) return;
        let isChatSignal = false;
        let isVisitorSignal = false;
        for (const re of this.CHAT_PATTERNS) {
          if (re.test(data)) { isChatSignal = true; break; }
        }
        for (const re of this.VISITOR_PATTERNS) {
          if (re.test(data)) { isVisitorSignal = true; break; }
        }
        if (!isChatSignal && !isVisitorSignal) return;
        const t = now();
        if ((t - this.lastSignalAt) < 8) return;
        this.lastSignalAt = t;
        STATS.wsInterceptHits += 1;
        health.lastActivityAt = t;
        scheduleBurst(CFG.BURST_MS);
        try { if (CFG.TURBO_CLICK_ENABLE) turboClick.warmAll(); } catch (_) {}
        try { if (CFG.PREDICT_ENABLE) predict.onSignal("ws"); } catch (_) {}
        if (isVisitorSignal) visLastVisitorSignalAt = t;
      } catch (_) {}
    },
    uninstall() {
      try {
        if (this._origWSClass) window.WebSocket = this._origWSClass;
      } catch (_) {}
      this.sockets.clear();
      this.installed = false;
    }
  };

  const multiTab = {
    installed: false,
    enabled: true,
    channel: null,
    tabId: Math.random().toString(36).slice(2, 10) + "_" + Date.now(),
    isLeader: false,
    leaderTabId: "",
    leaderHeartbeatAt: 0,
    peers: new Map(),
    HEARTBEAT_MS: 2000,
    LEADER_TIMEOUT_MS: 6000,
    timer: 0,
    install() {
      if (this.installed) return;
      if (!CFG.MULTI_TAB_ENABLE || typeof BroadcastChannel === "undefined") {
        this.isLeader = true;
        this.installed = true;
        return;
      }
      try {
        this.channel = new BroadcastChannel("autobot_livechat_coord");
        this.channel.onmessage = (e) => this.onMessage(e.data);
        this.broadcast({ type: "join", tabId: this.tabId, at: now() });
        this.timer = setInterval(() => this.heartbeat(), this.HEARTBEAT_MS);
        setTimeout(() => this.electLeader(), 500);
        this.installed = true;
      } catch (_) {
        this.isLeader = true;
        this.installed = true;
      }
    },
    broadcast(msg) {
      try { this.channel?.postMessage(msg); } catch (_) {}
    },
    onMessage(msg) {
      try {
        if (!msg || msg.tabId === this.tabId) return;
        const t = now();
        switch (msg.type) {
          case "join":
          case "heartbeat":
            this.peers.set(msg.tabId, t);
            if (msg.type === "heartbeat" && msg.tabId === this.leaderTabId) this.leaderHeartbeatAt = t;
            if (!this.leaderTabId) this.electLeader();
            break;
          case "leader_claim":
            this.leaderTabId = msg.tabId;
            this.leaderHeartbeatAt = t;
            this.isLeader = (msg.tabId === this.tabId);
            break;
          case "serve_claimed":
            STATS.multiTabSkips += 1;
            serveClaimLockUntil = Math.max(serveClaimLockUntil, t + 800);
            break;
          case "serve_timing":
            try { predict.recordExternal(msg.interval); } catch (_) {}
            break;
          case "leave":
            this.peers.delete(msg.tabId);
            if (msg.tabId === this.leaderTabId) {
              this.leaderTabId = "";
              this.electLeader();
            }
            break;
        }
      } catch (_) {}
    },
    electLeader() {
      const allIds = [this.tabId, ...this.peers.keys()].sort();
      const newLeader = allIds[0] || this.tabId;
      this.isLeader = (newLeader === this.tabId);
      this.leaderTabId = newLeader;
      if (this.isLeader) this.broadcast({ type: "leader_claim", tabId: this.tabId, at: now() });
    },
    heartbeat() {
      const t = now();
      this.broadcast({ type: "heartbeat", tabId: this.tabId, at: t });
      for (const [id, lastSeen] of this.peers) {
        if ((t - lastSeen) > this.LEADER_TIMEOUT_MS) {
          this.peers.delete(id);
          if (id === this.leaderTabId) {
            this.leaderTabId = "";
            this.electLeader();
          }
        }
      }
    },
    canServe() {
      if (!CFG.MULTI_TAB_ENABLE || !this.channel) return true;
      if (this.isLeader) return true;
      const t = now();
      if (this.leaderTabId && (t - this.leaderHeartbeatAt) > this.LEADER_TIMEOUT_MS) return true;
      return true;
    },
    claimServe() {
      this.broadcast({ type: "serve_claimed", tabId: this.tabId, at: now() });
    },
    shareServeTime(interval) {
      this.broadcast({ type: "serve_timing", tabId: this.tabId, interval, at: now() });
    },
    uninstall() {
      try { this.broadcast({ type: "leave", tabId: this.tabId, at: now() }); } catch (_) {}
      try { if (this.timer) clearInterval(this.timer); } catch (_) {}
      try { this.channel?.close(); } catch (_) {}
      this.channel = null;
      this.timer = 0;
      this.peers.clear();
      this.installed = false;
      this.isLeader = false;
      this.leaderTabId = "";
      this.leaderHeartbeatAt = 0;
    }
  };

  let serveClaimLockUntil = 0;

  const predict = {
    enabled: true,
    intervals: [],
    lastServeAt: 0,
    MAX_HISTORY: 50,
    ema: 0,
    emaVariance: 0,
    EMA_ALPHA: 0.15,
    prePositionTimer: 0,
    isPrePositioned: false,
    onServe() {
      const t = now();
      if (this.lastServeAt > 0) {
        const interval = t - this.lastServeAt;
        if (interval > 2000 && interval < 300000) {
          this.intervals.push(interval);
          if (this.intervals.length > this.MAX_HISTORY) this.intervals.shift();
          if (this.ema === 0) {
            this.ema = interval;
            this.emaVariance = 0;
          } else {
            const diff = interval - this.ema;
            this.ema = this.ema + this.EMA_ALPHA * diff;
            this.emaVariance = (1 - this.EMA_ALPHA) * (this.emaVariance + this.EMA_ALPHA * diff * diff);
          }
          try { multiTab.shareServeTime(interval); } catch (_) {}
          STATS.predictIntervals = this.intervals.length;
          STATS.predictEmaMs = Math.round(this.ema);
          STATS.predictStdDevMs = Math.round(Math.sqrt(this.emaVariance));
        }
      }
      this.lastServeAt = t;
      this.isPrePositioned = false;
      this.schedulePrePosition();
    },
    recordExternal(interval) {
      if (!interval || interval <= 2000 || interval >= 300000) return;
      if (this.ema === 0) this.ema = interval;
      else this.ema = this.ema + (this.EMA_ALPHA * 0.5) * (interval - this.ema);
    },
    onSignal(source) {
      if (!CFG.PREDICT_ENABLE) return;
      if (source === "ws") this.preActivate(200);
      STATS.predictiveHits += 1;
    },
    schedulePrePosition() {
      if (!CFG.PREDICT_ENABLE || this.ema === 0) return;
      try { if (this.prePositionTimer) clearTimeout(this.prePositionTimer); } catch (_) {}
      const stdDev = Math.sqrt(this.emaVariance) || 1000;
      const earlyMs = Math.max(500, stdDev * 1.5);
      const waitMs = Math.max(100, this.ema - earlyMs);
      this.prePositionTimer = setTimeout(() => {
        this.prePositionTimer = 0;
        if (!on) return;
        this.preActivate(earlyMs * 2);
      }, waitMs);
    },
    preActivate(durationMs) {
      if (!on || this.isPrePositioned || !CFG.PREDICT_ENABLE) return;
      this.isPrePositioned = true;
      STATS.predictPrePositions += 1;
      try { if (CFG.TURBO_CLICK_ENABLE) turboClick.warmAll(); } catch (_) {}
      scheduleBurst(Math.max(durationMs, CFG.BURST_MS));
      setTimeout(() => { this.isPrePositioned = false; }, durationMs);
    },
    stop() {
      try { if (this.prePositionTimer) clearTimeout(this.prePositionTimer); } catch (_) {}
      this.prePositionTimer = 0;
      this.isPrePositioned = false;
    }
  };

  const fetchHook = {
    installed: false,
    origFetch: null,
    origXHROpen: null,
    origXHRSend: null,
    INTERESTING_URLS: [
      /routing/i,
      /queue/i,
      /incoming/i,
      /chat.*list/i,
      /visitor/i,
      /serve/i,
      /assignment/i,
    ],
    install() {
      if (this.installed || !CFG.FETCH_HOOK_ENABLE) return;
      const self = this;
      this.origFetch = window.fetch;
      if (typeof this.origFetch === "function") {
        window.fetch = function(...args) {
          const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
          const promise = self.origFetch.apply(this, args);
          if (self.isInteresting(url) && promise && typeof promise.then === "function") {
            promise.then((response) => {
              try {
                const clone = response.clone();
                clone.text().then((body) => self.onResponse(url, body)).catch(() => {});
              } catch (_) {}
              return response;
            }).catch(() => {});
          }
          return promise;
        };
      }
      this.origXHROpen = XMLHttpRequest.prototype.open;
      this.origXHRSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._abUrl = url;
        return self.origXHROpen.call(this, method, url, ...rest);
      };
      XMLHttpRequest.prototype.send = function(...args) {
        const xhr = this;
        if (self.isInteresting(xhr._abUrl || "")) {
          xhr.addEventListener("load", () => {
            try { self.onResponse(xhr._abUrl, xhr.responseText); } catch (_) {}
          }, { passive: true, once: true });
        }
        return self.origXHRSend.apply(this, args);
      };
      this.installed = true;
    },
    isInteresting(url) {
      if (!url) return false;
      for (const re of this.INTERESTING_URLS) if (re.test(url)) return true;
      return false;
    },
    onResponse(url, body) {
      try {
        if (!on || !body) return;
        const hasQueue = /queue|pending|incoming|waiting/i.test(body);
        const hasCount = /"count"\s*:\s*[1-9]/i.test(body);
        if (hasQueue || hasCount) {
          STATS.fetchHookHits += 1;
          health.lastActivityAt = now();
          scheduleBurst(CFG.BURST_MS);
          try { if (CFG.TURBO_CLICK_ENABLE) turboClick.warmAll(); } catch (_) {}
        }
      } catch (_) {}
    },
    uninstall() {
      try { if (this.origFetch) window.fetch = this.origFetch; } catch (_) {}
      try { if (this.origXHROpen) XMLHttpRequest.prototype.open = this.origXHROpen; } catch (_) {}
      try { if (this.origXHRSend) XMLHttpRequest.prototype.send = this.origXHRSend; } catch (_) {}
      this.installed = false;
    }
  };

  const visibilityTracker = {
    installed: false,
    observer: null,
    visible: new WeakSet(),
    install() {
      if (this.installed || !CFG.INTERSECT_ENABLE || typeof IntersectionObserver === "undefined") return;
      this.observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0) this.visible.add(entry.target);
          else this.visible.delete(entry.target);
        }
      }, { threshold: [0, 0.1] });
      this.installed = true;
    },
    track(el) {
      try { if (this.observer && el && el.nodeType === 1) this.observer.observe(el); } catch (_) {}
    },
    untrack(el) {
      try { if (this.observer && el) this.observer.unobserve(el); } catch (_) {}
    },
    isVisible(el) {
      try { return this.visible.has(el); } catch (_) { return false; }
    },
    uninstall() {
      try { this.observer?.disconnect(); } catch (_) {}
      this.observer = null;
      this.visible = new WeakSet();
      this.installed = false;
    }
  };

  const turboClick = {
    cache: new WeakMap(),
    CACHE_TTL_MS: 500,
    warm(el) {
      try {
        if (!el || el.nodeType !== 1 || !el.isConnected) return;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        this.cache.set(el, { cx: r.left + r.width * 0.5, cy: r.top + r.height * 0.5, at: now() });
      } catch (_) {}
    },
    warmAll() {
      try {
        for (let i = 0; i < wrapsList.length; i++) {
          const w = wrapsList[i];
          if (!w || !w.isConnected) continue;
          this.warm(w);
          const tgt = getClickableTarget(w);
          if (tgt && tgt !== w) this.warm(tgt);
        }
      } catch (_) {}
    },
    get(el) {
      const c = this.cache.get(el);
      if (!c) return null;
      if ((now() - c.at) > this.CACHE_TTL_MS) {
        this.cache.delete(el);
        return null;
      }
      return c;
    },
    fireWithCache(target) {
      const cached = this.get(target);
      if (!cached) return fireSequence(target);
      try {
        const w = target.ownerDocument?.defaultView || window;
        const pt = ("ontouchstart" in w) ? "touch" : "mouse";
        const { cx, cy } = cached;
        const base = { bubbles:true, cancelable:true, view:w, clientX:cx, clientY:cy, composed:true };
        const down = { ...base, button:0, buttons:1 };
        const up = { ...base, button:0, buttons:0 };
        try { target.focus({ preventScroll: true }); } catch (_) {}
        dispatchMouseLike(target, "pointerover",  { ...base, pointerType:pt, isPrimary:true, pointerId:1 });
        dispatchMouseLike(target, "pointerenter", { ...base, pointerType:pt, isPrimary:true, pointerId:1 });
        dispatchMouseLike(target, "mouseover", base);
        dispatchMouseLike(target, "mouseenter", base);
        dispatchMouseLike(target, "pointerdown", { ...down, pointerType:pt, isPrimary:true, pointerId:1 });
        dispatchMouseLike(target, "mousedown", down);
        dispatchMouseLike(target, "pointerup", { ...up, pointerType:pt, isPrimary:true, pointerId:1 });
        dispatchMouseLike(target, "mouseup", up);
        dispatchMouseLike(target, "click", { ...base, button:0 });
        STATS.turboClickHits += 1;
        return true;
      } catch (_) {
        return fireSequence(target);
      }
    }
  };

  const audio = {
    enabled: true,
    ctx: null,
    SERVE_FREQ: 880,
    ERROR_FREQ: 220,
    lastPlayAt: 0,
    MIN_INTERVAL_MS: 800,
    getCtx() {
      if (this.ctx) return this.ctx;
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
      return this.ctx;
    },
    playTone(freq, duration = 0.08, vol = 0.15) {
      if (!CFG.AUDIO_ENABLE || !this.enabled) return;
      const t = now();
      if ((t - this.lastPlayAt) < this.MIN_INTERVAL_MS) return;
      this.lastPlayAt = t;
      try {
        const ctx = this.getCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = vol;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration + 0.01);
      } catch (_) {}
    },
    onServe() { this.playTone(this.SERVE_FREQ, 0.08, CFG.AUDIO_VOLUME || 0.12); },
    onError() { this.playTone(this.ERROR_FREQ, 0.15, 0.08); },
    uninstall() {
      try { this.ctx?.close(); } catch (_) {}
      this.ctx = null;
    }
  };

  const perfWatcher = {
    installed: false,
    observer: null,
    INTERESTING_RES: [
      /routing/i, /queue/i, /incoming/i, /chat/i,
      /visitor/i, /serve/i, /websocket/i, /socket/i
    ],
    install() {
      if (this.installed || !CFG.PERF_WATCH_ENABLE || typeof PerformanceObserver === "undefined") return;
      try {
        this.observer = new PerformanceObserver((list) => {
          if (!on) return;
          const entries = list.getEntries();
          for (const entry of entries) {
            const name = entry.name || "";
            for (const re of this.INTERESTING_RES) {
              if (re.test(name)) {
                STATS.perfWatcherHits += 1;
                health.lastActivityAt = now();
                scheduleBurst(800);
                return;
              }
            }
          }
        });
        this.observer.observe({ type: "resource", buffered: false });
        this.installed = true;
      } catch (_) {}
    },
    uninstall() {
      try { this.observer?.disconnect(); } catch (_) {}
      this.observer = null;
      this.installed = false;
    }
  };

  const smartRetry = {
    getDelay(attempt, baseMs = 50) {
      const exp = Math.min(500, baseMs * Math.pow(1.5, Math.max(0, attempt || 0)));
      const jitter = exp * 0.25 * (Math.random() * 2 - 1);
      return Math.max(10, Math.round(exp + jitter));
    }
  };

  const selfHeal = {
    installed: false,
    lastDOMSignature: "",
    CHECK_MS: 3000,
    timer: 0,
    getDOMSignature() {
      try {
        const body = document.body;
        if (!body) return "";
        const navBar = document.querySelector(".react_meshim_dashboard_components_navBar") || document.querySelector("[class*='navBar']");
        const chatBar = document.querySelector(CFG.CB_ITEM_SEL);
        const panel = document.querySelector(CFG.AS_ACTIVE_PANEL_SEL);
        return [
          navBar ? "nav:1" : "nav:0",
          chatBar ? "cb:1" : "cb:0",
          panel ? "panel:1" : "panel:0",
          body.children.length,
        ].join("|");
      } catch (_) { return ""; }
    },
    check() {
      if (!this.installed || !on) return;
      const sig = this.getDOMSignature();
      if (this.lastDOMSignature && sig !== this.lastDOMSignature) {
        STATS.selfHealTriggers += 1;
        this.heal();
      }
      this.lastDOMSignature = sig;
    },
    heal() {
      try {
        resyncWraps(true);
        cbUnwire();
        cbWire();
        visUnwire();
        visWire();
        try { document.querySelectorAll("iframe").forEach(wireFrame); } catch (_) {}
        scheduleBurst(CFG.BURST_MS);
        cbKick();
        visKick(true);
        asKick("heal");
      } catch (_) {}
    },
    install() {
      if (this.installed || !CFG.SELF_HEAL_ENABLE) return;
      this.lastDOMSignature = this.getDOMSignature();
      this.timer = setInterval(() => this.check(), this.CHECK_MS);
      this.installed = true;
    },
    uninstall() {
      try { if (this.timer) clearInterval(this.timer); } catch (_) {}
      this.timer = 0;
      this.installed = false;
    }
  };

  const smartSchedule = (fn, priority = "user-blocking") => {
    try {
      if (typeof scheduler !== "undefined" && scheduler.postTask) return scheduler.postTask(fn, { priority });
    } catch (_) {}
    fastMicrotask(fn);
  };

  const idleDetect = {
    detector: null,
    isIdle: false,
    async install() {
      if (!CFG.IDLE_DETECT_ENABLE || typeof IdleDetector === "undefined") return;
      try {
        const perm = await IdleDetector.requestPermission();
        if (perm !== "granted") return;
        this.detector = new IdleDetector();
        this.detector.addEventListener("change", () => {
          const userIdle = this.detector.userState === "idle";
          const screenLocked = this.detector.screenState === "locked";
          this.isIdle = userIdle || screenLocked;
          if (this.isIdle) {
            CFG.POLL_FAST_MS = 8;
            CFG.BG_WORKER_TICK_MS = 15;
          } else {
            CFG.POLL_FAST_MS = 16;
            CFG.BG_WORKER_TICK_MS = 30;
          }
        });
        await this.detector.start({ threshold: 30000 });
      } catch (_) {}
    },
    uninstall() {
      try { this.detector?.stop?.(); } catch (_) {}
      this.detector = null;
      this.isIdle = false;
    }
  };

  const startAllConcepts = () => {
    try { wsIntercept.install(); } catch (_) {}
    try { fetchHook.install(); } catch (_) {}
    try { multiTab.install(); } catch (_) {}
    try { visibilityTracker.install(); } catch (_) {}
    try { perfWatcher.install(); } catch (_) {}
    try { selfHeal.install(); } catch (_) {}
    try { idleDetect.install(); } catch (_) {}
    if (CFG.TURBO_CLICK_ENABLE) {
      try { turboClick.warmAll(); } catch (_) {}
    }
    audio.enabled = !!CFG.AUDIO_ENABLE;
  };

  const stopAllConcepts = () => {
    try { wsIntercept.uninstall(); } catch (_) {}
    try { fetchHook.uninstall(); } catch (_) {}
    try { multiTab.uninstall(); } catch (_) {}
    try { visibilityTracker.uninstall(); } catch (_) {}
    try { perfWatcher.uninstall(); } catch (_) {}
    try { selfHeal.uninstall(); } catch (_) {}
    try { idleDetect.uninstall(); } catch (_) {}
    try { audio.uninstall(); } catch (_) {}
    try { predict.stop(); } catch (_) {}
  };

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

    READY_COOLDOWN_MS: 4,
    ZERO_COOLDOWN_MS: 80,

    GLOBAL_COOLDOWN_MS: 2,
    GLOBAL_WINDOW_MS: 5000,
    GLOBAL_MAX_CLICKS_PER_WINDOW: 200,

    BURST_MS: 4000,
    HOT_BURST_FIRST_MS: 1400,
    MO_BURST_THROTTLE_MS: 0,

    WRAP_RESYNC_MS: 800,
    WRAP_PRUNE_EVERY_MS: 1200,
    MAX_SCAN: 60,
    STOP_SCAN_AFTER_CLICK: false,
    IDLE_STOP_AFTER_FRAMES: 30,

    POLL_FAST_MS: 16,
    POLL_SLOW_MS: 120,

    VERIFY_READY_DELAY_MS: 16,
    VERIFY_ZERO_DELAY_MS: 60,
    RETRY_READY_MAX: 6,
    RETRY_ZERO_MAX: 2,
    RETRY_BURST_MS: 80,

    USER_GRACE_ON_DOWN_MS: 400,
    USER_GRACE_AFTER_UP_MS: 40,
    USER_GRACE_ON_WHEEL_MS: 120,
    USER_GRACE_ON_KEY_MS: 160,

    VIS_ENABLE: true,
    VIS_INCOMING_SEL: '[data-test-id="incomingList"]',
    VIS_GENERAL_SEL: '[data-test-id="generalVisitorList"]',
    VIS_ROW_SEL: '[data-test-id="visitorRow"]',
    VIS_GROUP_COUNT_SEL: '[data-test-id="groupCount"]',
    VIS_ROW_NAME_SEL: '[data-test-id="nameCell"]',
    VIS_ROW_TIME_SEL: '[data-test-id="timeCell"]',
    VIS_ROW_SERVED_SEL: '[data-test-id="servedByCell"]',
    VIS_ROW_VIEWING_SEL: '[data-test-id="viewingPage"]',
    VIS_ROW_SCAN_LIMIT: 300,
    VIS_WAKE_BURST_MS: 600,
    VIS_HARD_WAKE_BURST_MS: 1000,
    VIS_SCAN_MS: 160,
    VIS_RESYNC_MS: 200,
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
    CB_CLOSE_COOLDOWN_MS: 800,
    CB_CLOSE_WINDOW_MS: 8000,
    CB_CLOSE_MAX_PER_WINDOW: 8,

    CB_IDLE_REQUIRED_MS: 30,
    CB_OPEN_COOLDOWN_MS: 60,
    CB_ITEM_OPEN_COOLDOWN_MS: 300,
    CB_POST_CLICK_LOCK_MS: 80,

    CB_OPEN_IGNORE_IDLE_ON_UNREAD: true,

    CB_SCAN_LIMIT: 300,
    CB_FAST_SCAN_MS: 40,
    CB_SLOW_SCAN_MS: 400,
    CB_IDLE_TO_SLOW_AFTER_MS: 1600,
    CB_FORCE_RESCAN_AFTER_MS: 2800,

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
    AS_SCAN_MS: 30,
    AS_OPEN_SETTLE_MS: 80,
    AS_EXPAND_WAIT_MS: 600,
    AS_SEND_LOCK_MS: 800,
    AS_MAX_TRIES_PER_CHAT: 3,
    AS_MEMORY_SENT_LIMIT: 400,
    AS_MEMORY_TRY_LIMIT: 600,
    AS_ACTIVE_ITEM_SEL: ".meshim_dashboard_components_chatBar_Renderer.chat_bar_renderer.active, .meshim_dashboard_components_chatBar_Renderer.chat_bar_renderer[aria-selected='true']",
    AS_COMPOSER_SEL: "[data-test-id='chatActionsComposer']",
    AS_NO_MATCH_SEL: ".textfieldlist_container > .no_matches",
    AS_SHORTCUT_LIST_BOX_SEL: ".textfieldlist_list_container",
    AS_SHORTCUT_OPTION_SEL: ".meshim_dashboard_components_chatPanel_ShortcutItem.textfieldlist_list_option",
    AS_GHOST_TEXT_SEL: ".meshim_dashboard_components_chatPanel_GhostChatArea .text_container",
    AS_ROOT_SEL: ".meshim_dashboard_components_chatPanel_ChatTextArea",
    AS_ACTIVE_PANEL_SEL: ".meshim_dashboard_components_ChatPanel.chat_panel.active",
    AS_PANEL_TITLE_SEL: "[data-test-id='displayNameTitleBar']",
    AS_SEND_VERIFY_MS: 400,
    AS_REQUIRE_LATEST_SERVE_ONLY: true,
    AS_SERVE_BIND_SETTLE_MS: 80,
    AS_SERVE_BIND_FALLBACK_MS: 500,
    AS_SELECT_WAIT_MS: 80,
    AS_ONE_SEND_PER_SERVE: true,
    AS_MAX_SEND_PRESSES: 2,
    AS_TYPE_CHAR_DELAY_MS: 8,
    AS_AFTER_TYPE_SETTLE_MS: 40,
    AS_REQUIRE_EXPAND_BEFORE_SEND: true,
    AS_SERVE_TOKEN_TTL_MS: 15000,
    AS_CHATLOG_ROW_SEL: ".meshim_dashboard_components_widgets_ChatLogRenderer.chat_log_line",
    AS_CHATLOG_NAME_SEL: ".header_container .name",
    AS_CHATLOG_MSG_SEL: ".message_container .message",
    AS_CHATLOG_SCAN_LIMIT: 120,
    AS_PROOF_MIN_LEN: 6,
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
    BG_WORKER_TICK_MS: 30,
    BG_WORKER_HIDDEN_TICK_MS: 120,

    ACTION_ARB_ENABLE: true,
    ACTION_ARB_DEBOUNCE_MS: 0,
    ACTION_ARB_EXEC_LOCK_MS: 2,
    ACTION_ARB_CB_LOCK_MS: 16,
    ACTION_ARB_TTL_MS: 100,

    S1_NATIVE_CLICK_FIRST: true,
    S1_STRICT_TOPMOST_CHECK: true,
    S1_CLICK_X_RATIO: 0.50,
    S1_CLICK_Y_RATIO: 0.50,

    CB_NATIVE_CLICK_FIRST: true,
    CB_STRICT_TOPMOST_CHECK: true,

    ADAPTIVE_ENABLE: true,
    ADAPTIVE_FAST_STREAK_THRESHOLD: 3,
    ADAPTIVE_ULTRA_COOLDOWN_MS: 1,
    ADAPTIVE_STREAK_DECAY_MS: 8000,

    PREDICT_ENABLE: true,
    PREDICT_ZERO_WATCH_MS: 200,
    PREDICT_PREFETCH_INTERVAL_MS: 50,

    HEALTH_ENABLE: true,
    HEALTH_CHECK_MS: 5000,
    HEALTH_STALE_THRESHOLD_MS: 15000,
    HEALTH_MAX_RECOVER_ATTEMPTS: 3,

    JANK_THRESHOLD_MS: 100,
    JANK_SCORE_LIMIT: 8,
    JANK_ECO_DURATION_MS: 3000,
    JANK_DECAY_RATE: 2,

    WS_INTERCEPT_ENABLE: true,
    FETCH_HOOK_ENABLE: true,
    MULTI_TAB_ENABLE: true,
    AUDIO_ENABLE: true,
    AUDIO_ON_SERVE: true,
    AUDIO_VOLUME: 0.12,
    INTERSECT_ENABLE: true,
    PERF_WATCH_ENABLE: true,
    SELF_HEAL_ENABLE: true,
    IDLE_DETECT_ENABLE: true,
    TURBO_CLICK_ENABLE: true,
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
    serveTopmostBypass: 0,
    cbOpenQueued: 0,
    cbOpenClicked: 0,
    cbCloseQueued: 0,
    cbCloseClicked: 0,
    arbExecuted: 0,
    arbDropped: 0,

    adaptiveUltraActivations: 0,
    healthRecoveries: 0,
    predictiveHits: 0,
    totalBursts: 0,
    avgServeLatencyMs: 0,
    _serveLatencySum: 0,
    _serveLatencyCount: 0,
    wsInterceptHits: 0,
    fetchHookHits: 0,
    perfWatcherHits: 0,
    turboClickHits: 0,
    predictPrePositions: 0,
    predictIntervals: 0,
    predictEmaMs: 0,
    predictStdDevMs: 0,
    multiTabSkips: 0,
    selfHealTriggers: 0,
    multiTabPeers: 0,
    isLeader: false,
    predictNextServeIn: "unknown",
    lastServeAt: 0,
    uptime: 0,
    startedAt: 0,
  };

  const ROOTS = new WeakSet();
  const rootMOs = [];
  const IFRS = new WeakSet();
  const shortcutBinds = [];

  const CLICK_RING_SIZE = 512;
  const clickRing = new Float64Array(CLICK_RING_SIZE);
  let clickRingHead = 0;
  let clickRingTail = 0;
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

  const adaptive = {
    streak: 0,
    lastServeAt: 0,
    ultraUntil: 0,
  };

  const health = {
    lastActivityAt: 0,
    lastCheckAt: 0,
    recoverAttempts: 0,
    timer: 0,
  };

  let serveDetectedAt = 0;

  let visRootMO = null;
  let visScanTimer = 0;
  let visLastScanAt = 0;
  let visLastMutAt = 0;
  let visLastWakeAt = 0;
  let visLastVisitorSignalAt = 0;
  const visRowState = new WeakMap();

  let asTimer = 0;
  const asFlow = {
    key: "", step: "", stepAt: 0, openUntil: 0,
    ghostBase: "", proofText: "", lastSendAt: 0,
    sendPresses: 0, typedValue: ""
  };
  const asServe = {
    armed: false, armedAt: 0, anchorKey: "", targetKey: "",
    sendKey: "", sendAt: 0, tokenSeq: 0
  };
  const asSentKeys = new Set();
  const asTryCount = new Map();
  const asProofByKey = new Map();

  const uiRM = { resize: null };

  const ORIG = {
    attachShadow: Element.prototype.attachShadow,
    pushState: history.pushState,
    replaceState: history.replaceState,
  };

  let onFocus = null, onVis = null, onPop = null;

  const now = performance.now.bind(performance);
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

  const markUserBusy = (ms) => {
    lastUserAt = now();
    const t = lastUserAt + ms;
    if (t > userBusyUntil) userBusyUntil = t;
  };

  const isDisabledish = (el) => {
    if (!el || el.nodeType !== 1) return true;
    if (el.disabled) return true;
    const ad = safeAttr(el, "aria-disabled");
    return ad === "true";
  };

  const _visCache = new WeakMap();
  let _visCacheGen = 0;

  const isVisible = (el) => {
    try {
      if (!el || el.nodeType !== 1 || !el.isConnected) return false;
      if (isDisabledish(el)) return false;
      if (CFG.INTERSECT_ENABLE && visibilityTracker.isVisible(el)) return true;

      const cached = _visCache.get(el);
      if (cached && cached.gen === _visCacheGen) return cached.val;

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

      _visCache.set(el, { gen: _visCacheGen, val: true });
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
        try { el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" }); } catch (_) {}
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
      if ((t - composerCacheAt) < 60) return composerCacheVal;

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

  const ringCount = () => {
    if (clickRingTail >= clickRingHead) return clickRingTail - clickRingHead;
    return CLICK_RING_SIZE - clickRingHead + clickRingTail;
  };

  const ringPush = (t) => {
    clickRing[clickRingTail] = t;
    clickRingTail = (clickRingTail + 1) % CLICK_RING_SIZE;
    if (clickRingTail === clickRingHead) {
      clickRingHead = (clickRingHead + 1) % CLICK_RING_SIZE;
    }
  };

  const ringPrune = (t) => {
    while (clickRingHead !== clickRingTail && (t - clickRing[clickRingHead]) > CFG.GLOBAL_WINDOW_MS) {
      clickRingHead = (clickRingHead + 1) % CLICK_RING_SIZE;
    }
  };

  const globalThrottleOK = (t) => {
    ringPrune(t);
    if (ringCount() >= CFG.GLOBAL_MAX_CLICKS_PER_WINDOW) return false;
    if ((t - lastGlobalClickAt) < getEffectiveCooldown()) return false;
    return true;
  };

  const getEffectiveCooldown = () => {
    if (!CFG.ADAPTIVE_ENABLE) return CFG.GLOBAL_COOLDOWN_MS;
    const t = now();
    if (t < adaptive.ultraUntil) return CFG.ADAPTIVE_ULTRA_COOLDOWN_MS;
    return CFG.GLOBAL_COOLDOWN_MS;
  };

  const adaptiveOnServe = () => {
    if (!CFG.ADAPTIVE_ENABLE) return;
    const t = now();
    const gap = t - adaptive.lastServeAt;

    if (gap < CFG.ADAPTIVE_STREAK_DECAY_MS) {
      adaptive.streak++;
    } else {
      adaptive.streak = 1;
    }

    adaptive.lastServeAt = t;

    if (adaptive.streak >= CFG.ADAPTIVE_FAST_STREAK_THRESHOLD) {
      adaptive.ultraUntil = t + CFG.ADAPTIVE_STREAK_DECAY_MS;
      STATS.adaptiveUltraActivations++;
    }
  };

  const recordServeLatency = () => {
    if (serveDetectedAt > 0) {
      const latency = now() - serveDetectedAt;
      STATS._serveLatencySum += latency;
      STATS._serveLatencyCount++;
      STATS.avgServeLatencyMs = Math.round(STATS._serveLatencySum / STATS._serveLatencyCount);
      serveDetectedAt = 0;
    }
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

    if (delay <= 0) {
      actArb.timer = -1;
      fastMicrotask(() => {
        actArb.timer = 0;
        actArbDrain();
      });
    } else {
      actArb.timer = setTimeout(() => {
        actArb.timer = 0;
        actArbDrain();
      }, delay);
    }
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
      actArbSchedule(Math.max(1, actArb.busyUntil - t));
      return;
    }

    if (!actArb.q.length) return;

    actArb.q.sort((a, b) => (b.priority - a.priority) || (a.createdAt - b.createdAt));

    let drained = 0;
    const maxDrain = 3;

    while (actArb.q.length && drained < maxDrain) {
      const item = actArb.q.shift();
      if (!item) continue;

      if (actArb.byKey.get(item.key) === item) actArb.byKey.delete(item.key);
      if (item.cancelled || item.expiresAt <= now()) {
        STATS.arbDropped += 1;
        continue;
      }

      let ok = false;
      try { ok = !!item.run(); } catch (_) {}
      STATS.arbExecuted += ok ? 1 : 0;
      if (!ok) STATS.arbDropped += 1;

      actArb.busyUntil = now() + Math.max(0, item.lockMs || 0);
      drained++;

      if (item.lockMs > 1) break;
    }

    if (actArb.q.length) actArbSchedule();
  };

  const actArbClear = () => {
    try {
      actArb.q.length = 0;
      actArb.byKey.clear();
      if (actArb.timer && actArb.timer !== -1) clearTimeout(actArb.timer);
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

      if (CFG.RE_READY.test(a) || CFG.RE_READY.test(b)) return "ready";
      if (CFG.RE_ZERO.test(a)  || CFG.RE_ZERO.test(b))  return "zero";
      if (textLooksLike(a, CFG.TOK_READY) || textLooksLike(b, CFG.TOK_READY)) return "ready";
      if (textLooksLike(a, CFG.TOK_ZERO)  || textLooksLike(b, CFG.TOK_ZERO))  return "zero";
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
      if (btn && isVisible(btn)) {
        if (CFG.INTERSECT_ENABLE) visibilityTracker.track(btn);
        if (CFG.TURBO_CLICK_ENABLE) turboClick.warm(btn);
        return btn;
      }
      const sp = wrap.querySelector?.(CFG.READY_SPAN_SEL);
      if (sp && isVisible(sp)) {
        if (CFG.INTERSECT_ENABLE) visibilityTracker.track(sp);
        if (CFG.TURBO_CLICK_ENABLE) turboClick.warm(sp);
        return sp;
      }
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

      try { target.focus({ preventScroll: true }); } catch (_) {}

      dispatchMouseLike(target, "pointerover",  { ...base, pointerType:pt, isPrimary:true, pointerId:1 });
      dispatchMouseLike(target, "pointerenter", { ...base, pointerType:pt, isPrimary:true, pointerId:1 });
      dispatchMouseLike(target, "mouseover", base);
      dispatchMouseLike(target, "mouseenter", base);
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
      if (okFallback) {
        if (statFallbackKey) STATS[statFallbackKey] = (STATS[statFallbackKey] || 0) + 1;
        return true;
      }

      try { target.click(); return true; } catch (__) {}
      return false;
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

      const ok = elementFromPointOK(el, cx, cy);
      if (!ok) {

        if (CFG.ADAPTIVE_ENABLE && now() < adaptive.ultraUntil) {
          STATS.serveTopmostBypass++;
          return true;
        }
      }
      return ok;
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

      if (st === "ready") { resetAttempts(wrap, "ready"); serveDetectedAt = now(); }
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

        scheduleBurst(smartRetry.getDelay(attempts, CFG.RETRY_BURST_MS));
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

    if (t < serveClaimLockUntil) return false;
    if (CFG.MULTI_TAB_ENABLE && !multiTab.canServe()) return false;

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
    ringPush(t);
    lastGlobalClickAt = t;

    if (st === "ready") armedReady.set(wrap, false);
    if (st === "zero")  armedZero.set(wrap, false);

    bumpAttempt(wrap, st);
    STATS.serveClicked += 1;
    STATS.lastServeAt = t;
    health.lastActivityAt = t;

    if (st === "ready") {
      recordServeLatency();
      adaptiveOnServe();
    }

    let ok = false;
    if (CFG.TURBO_CLICK_ENABLE) {
      try { ok = turboClick.fireWithCache(tgt); } catch (_) {}
    }
    if (!ok) {
      ok = runClickPipeline(tgt, CFG.S1_NATIVE_CLICK_FIRST, "serveNativeClick", "serveFallbackClick");
    }

    if (ok && st === "ready") {
      try { asArmServeToken(); } catch (_) {}
      try { if (CFG.MULTI_TAB_ENABLE) multiTab.claimServe(); } catch (_) {}
      try { if (CFG.PREDICT_ENABLE) predict.onServe(); } catch (_) {}
      try { if (CFG.AUDIO_ON_SERVE) audio.onServe(); } catch (_) {}
    }

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
        if (CFG.MO_BURST_THROTTLE_MS > 0 && (t - lastMoBurstAt) < CFG.MO_BURST_THROTTLE_MS) return;
        lastMoBurstAt = t;

        const st = getWrapState(wrap);
        rearmIfNeeded(wrap, st);

        if (st === "ready" && canAct("ready")) {
          smartClickExec(wrap, st);
        } else if (st !== "none") {
          smartClick(wrap, st);
        }

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
    try { if (st !== "none") clicked = !!smartClick(wrap, st); } catch (_) {}

    return { st, clicked };
  };

  const addWrap = (wrap) => {
    try {
      if (!wrap || wrap.nodeType !== 1) return;
      if (wrapsSet.has(wrap)) return;
      wrapsSet.add(wrap);
      wrapsList.push(wrap);
      if (CFG.INTERSECT_ENABLE) visibilityTracker.track(wrap);
      if (CFG.TURBO_CLICK_ENABLE) turboClick.warm(wrap);
      registerWrap(wrap);
    } catch (_) {}
  };

  const pruneWrapsList = (force = false) => {
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

      try { const mo = wrapLocalMO.get(w); if (mo) mo.disconnect(); } catch (_) {}
      try { wrapLocalMO.delete(w); } catch (_) {}
      try { lastState.delete(w); } catch (_) {}
      try { armedReady.delete(w); } catch (_) {}
      try { armedZero.delete(w); } catch (_) {}
      try { clickedAtReady.delete(w); } catch (_) {}
      try { clickedAtZero.delete(w); } catch (_) {}
      try { readyAttempts.delete(w); } catch (_) {}
      try { zeroAttempts.delete(w); } catch (_) {}
      try { wrapsSet.delete(w); } catch (_) {}
      try { if (CFG.INTERSECT_ENABLE) visibilityTracker.untrack(w); } catch (_) {}
    }

    wrapsList.length = write;
  };

  const resyncWraps = (force = false) => {
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
      return cs.display !== "none" && cs.visibility !== "hidden";
    } catch (_) { return false; }
  };

  const visSignal = (ms = CFG.VIS_WAKE_BURST_MS, hard = false) => {
    const t = now();
    visLastVisitorSignalAt = t;
    if ((t - visLastWakeAt) < 20 && !hard) return;
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
    fastMicrotask(() => {
      try { if (on) visScanAll(hard); } catch (_) {}
    });
    visPlanNext();
  };

  const scanAndRegister = () => {
    if (!on) return { found: false, clicked: false };

    _visCacheGen++;

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
      if (r.clicked) {
        clicked = true;
        if (CFG.STOP_SCAN_AFTER_CLICK) return { found, clicked };
      }
    }

    if (CFG.CLICK_ON_ZERO) {
      for (let i = 0; i < hardLim; i++) {
        const w = wrapsList[i];
        if (!w || !w.isConnected) continue;
        const st = getWrapState(w);
        if (st !== "none") found = true;
        if (st !== "zero") continue;
        const r = registerWrap(w, st);
        if (r.clicked) {
          clicked = true;
          if (CFG.STOP_SCAN_AFTER_CLICK) break;
        }
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
      if (dt > CFG.JANK_THRESHOLD_MS) jankScore++;
      else jankScore = Math.max(0, jankScore - CFG.JANK_DECAY_RATE);

      if (jankScore >= CFG.JANK_SCORE_LIMIT) {
        ecoUntil = t + CFG.JANK_ECO_DURATION_MS;
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
        scheduleBurst(300);
      }
    }, 80);
  }

  function scheduleBurst(ms = CFG.BURST_MS) {
    if (!on) return;

    STATS.totalBursts++;
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
      scheduleBurst(600);
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
          scheduleBurst(600);
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

  const healthCheck = () => {
    if (!CFG.HEALTH_ENABLE || !on) return;

    const t = now();
    health.lastCheckAt = t;

    const sinceActivity = t - health.lastActivityAt;
    if (sinceActivity > CFG.HEALTH_STALE_THRESHOLD_MS && health.recoverAttempts < CFG.HEALTH_MAX_RECOVER_ATTEMPTS) {
      health.recoverAttempts++;
      STATS.healthRecoveries++;

      resyncWraps(true);
      scheduleBurst(CFG.BURST_MS);
      cbKick();
      visKick(true);
      asKick("health");
    }

    if (sinceActivity < 3000) {
      health.recoverAttempts = 0;
    }
  };

  const healthStart = () => {
    if (!CFG.HEALTH_ENABLE) return;
    health.lastActivityAt = now();
    if (health.timer) clearInterval(health.timer);
    health.timer = setInterval(healthCheck, CFG.HEALTH_CHECK_MS);
  };

  const healthStop = () => {
    if (health.timer) clearInterval(health.timer);
    health.timer = 0;
  };

  const cbState = new WeakMap();
  const cbManual = { holdUntil: 0, stickyUntil: 0, targetKey: "", lastUserAt: 0 };
  let cbRootMO = null;

  let cbScanTimer = 0;
  let cbLastMutAt = 0;
  let cbLastScanAt = 0;
  let cbLastOpenAt = 0;

  const CB_CLOSE_RING_SIZE = 64;
  const cbCloseRing = new Float64Array(CB_CLOSE_RING_SIZE);
  let cbCloseRingHead = 0;
  let cbCloseRingTail = 0;
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
      return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity !== 0;
    } catch (_) {
      const st = (el.getAttribute("style") || "").toLowerCase();
      return st.includes("visibility: visible") || st.includes("visibility:visible");
    }
  };

  const cbGetActive = (item) => {
    try {
      if (item.classList?.contains("active")) return true;
      const aria = safeAttr(item, "aria-selected");
      return aria === "true";
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

  function asHasPriorityLock() {
    try {
      if (!CFG.AS_ENABLE) return false;
      const t = now();
      if (asFlow.key) return true;
      if (asServe.armed && !asServeTokenExpired()) return true;
      if (asFlow.lastSendAt && (t - asFlow.lastSendAt) < Math.max(CFG.AS_SEND_LOCK_MS, CFG.AS_SEND_VERIFY_MS)) return true;
      if (asServe.sendAt && (t - asServe.sendAt) < Math.max(CFG.AS_SEND_VERIFY_MS, 450)) return true;
      return false;
    } catch (_) { return false; }
  }

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
        try { el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" }); } catch (_) {}
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

  const cbCloseRingCount = () => {
    if (cbCloseRingTail >= cbCloseRingHead) return cbCloseRingTail - cbCloseRingHead;
    return CB_CLOSE_RING_SIZE - cbCloseRingHead + cbCloseRingTail;
  };

  const cbCloseThrottleOK = (t) => {

    while (cbCloseRingHead !== cbCloseRingTail && (t - cbCloseRing[cbCloseRingHead]) > CFG.CB_CLOSE_WINDOW_MS) {
      cbCloseRingHead = (cbCloseRingHead + 1) % CB_CLOSE_RING_SIZE;
    }
    if (cbCloseRingCount() >= CFG.CB_CLOSE_MAX_PER_WINDOW) return false;
    if ((t - cbLastCloseAt) < CFG.CB_CLOSE_COOLDOWN_MS) return false;
    return true;
  };

  const cbOpenThrottleOK = (t) => {
    return (t - cbLastOpenAt) >= CFG.CB_OPEN_COOLDOWN_MS;
  };

  const cbScheduleOpen = (item, reason) => {
    try {
      const t = now();
      const p = cbPendingOpen.get(item) || 0;
      if ((t - p) < 20) return;
      cbPendingOpen.set(item, t);
      fastMicrotask(() => {
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
    health.lastActivityAt = t;
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
    cbCloseRing[cbCloseRingTail] = t;
    cbCloseRingTail = (cbCloseRingTail + 1) % CB_CLOSE_RING_SIZE;

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

      const becameUnread = prev.unread === 0 && unread > 0;
      const unreadUp = unread > prev.unread;
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
        if (cbGetUnread(it) > 0) return true;
      }
      return false;
    } catch (_) { return true; }
  };

  const cbPlanNextScan = () => {
    try {
      if (!on) return;
      if (cbScanTimer) return;

      if (userDown || isComposerBusy()) {
        cbScanTimer = setTimeout(() => { cbScanTimer = 0; cbPlanNextScan(); }, 160);
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
      fastMicrotask(() => {
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
        ta.dispatchEvent(new w.InputEvent("beforeinput", {
          bubbles: true, cancelable: true, composed: true,
          data: next.slice(-1) || null, inputType: "insertText"
        }));
      } catch (_) {}

      try {
        ta.dispatchEvent(new w.InputEvent("input", {
          bubbles: true, composed: true,
          data: next.slice(-1) || null, inputType: "insertText"
        }));
      } catch (_) {
        ta.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      }

      ta.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

      try {
        const reactKey = Object.keys(ta).find(k => k.startsWith("__reactProps$") || k.startsWith("__reactEventHandlers$"));
        if (reactKey && ta[reactKey]?.onChange) {
          ta[reactKey].onChange({ target: ta, currentTarget: ta });
        }
      } catch (_) {}

      return true;
    } catch (_) {
      try {
        ta.value = String(value || "");
        ta.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        return true;
      } catch (__) { return false; }
    }
  };

  const asDispatchKey = (el, key, code) => {
    try {
      const w = el.ownerDocument?.defaultView || window;
      const kc = key === "Enter" ? 13 : (typeof key === "string" && key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0);
      const init = {
        key, code, bubbles: true, cancelable: true, composed: true,
        keyCode: kc || undefined, which: kc || undefined, charCode: kc || undefined
      };
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
          ta.dispatchEvent(new w.KeyboardEvent("keyup", {
            key: meta.key, code: meta.code,
            bubbles: true, cancelable: true, composed: true
          }));
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

  const pruneOrderedSet = (set, max) => {
    try {
      if (!set || set.size <= max) return;
      const iter = set.values();
      while (set.size > max) {
        const first = iter.next();
        if (first?.done) break;
        set.delete(first.value);
      }
    } catch (_) {}
  };

  const pruneOrderedMap = (map, max) => {
    try {
      if (!map || map.size <= max) return;
      const iter = map.keys();
      while (map.size > max) {
        const first = iter.next();
        if (first?.done) break;
        map.delete(first.value);
      }
    } catch (_) {}
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
      ta.dispatchEvent(new w.KeyboardEvent("keyup", {
        key: "Enter", code: "Enter",
        bubbles: true, cancelable: true, composed: true,
        keyCode: 13, which: 13, charCode: 13
      }));
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
        }, 15);
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
    const onBlur = () => { try { userDown = false; markUserBusy(80); } catch (_) {} };

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
    history.pushState = function () { const ret = ORIG.pushState.apply(this, arguments); if (on) { resyncWraps(true); scheduleBurst(500); cbKick(); visKick(true); asKick("nav"); } return ret; };
    history.replaceState = function () { const ret = ORIG.replaceState.apply(this, arguments); if (on) { resyncWraps(true); scheduleBurst(500); cbKick(); visKick(true); asKick("nav"); } return ret; };

    onPop = () => { if (on) { resyncWraps(true); scheduleBurst(500); cbKick(); visKick(true); asKick("nav"); } };
    addEventListener("popstate", onPop, true);

    onFocus = () => { if (on) { resyncWraps(true); scheduleBurst(400); cbKick(); visKick(true); asKick("focus"); } };
    addEventListener("focus", onFocus, false);

    onVis = () => {
      if (!on) return;
      const hidden = !!(document.visibilityState && document.visibilityState !== "visible");
      try { if (bgWorker) bgWorker.postMessage({ type: hidden ? "hidden" : "visible" }); } catch (_) {}
      if (!hidden) {
        ecoUntil = 0;
        resyncWraps(true);
        scheduleBurst(500);
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
      pollMs = Math.min(CFG.POLL_SLOW_MS, pollMs + 12);
      pollTimer = setTimeout(() => pollLoop(g), Math.max(CFG.POLL_FAST_MS, pollMs));
      return;
    }

    const r = scanAndRegister();
    if (r.found || r.clicked) pollMs = CFG.POLL_FAST_MS;
    else pollMs = Math.min(CFG.POLL_SLOW_MS, pollMs + 8);

    pollTimer = setTimeout(() => pollLoop(g), pollMs);
  };

  let bgWorker = null;
  let bgWorkerLastAt = 0;

  const bgWorkerStart = () => {
    if (!CFG.BG_WORKER_ENABLE || bgWorker) return;
    try {
      const src = `
        let fg = ${CFG.BG_WORKER_TICK_MS};
        let bg = ${CFG.BG_WORKER_HIDDEN_TICK_MS};
        let timer = 0;
        const restart = (ms) => {
          try { if (timer) clearInterval(timer); } catch (_) {}
          timer = setInterval(() => postMessage({ type: "tick" }), Math.max(15, ms || fg));
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
          if ((t - bgWorkerLastAt) < 10) return;
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

  const POS_KEY = "s1_puck_pos_v1";

  const updateUI = () => {
    const d = document.getElementById(UI.PANEL_ID);
    if (!d) return;
    d.classList.toggle("off", !on);

    const uptimeSec = Math.round((now() - STATS.startedAt) / 1000);
    d.title = `${META.NAME} ${META.VERSION}\n` +
      `${on ? "⚡ ACTIVE" : "⏸ OFF"}\n` +
      `Served: ${STATS.serveClicked} | Avg: ${STATS.avgServeLatencyMs}ms\n` +
      `CB Open: ${STATS.cbOpenClicked} | Close: ${STATS.cbCloseClicked}\n` +
      `Uptime: ${uptimeSec}s\n` +
      `Ctrl+Enter: On/Off | Shift+Tap: Remove`;
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
        return [
          Math.min(Math.max(pad, vx), Math.max(pad, vw - w - pad)),
          Math.min(Math.max(pad, vy), Math.max(pad, vh - h - pad))
        ];
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

  const startWatchers = () => {
    startAllConcepts();
    wireRoot(document.documentElement || document);
    try { document.querySelectorAll("iframe").forEach(wireFrame); } catch (_) {}
    bindShortcut(window);

    resyncWraps(true);
    cbWire();
    visWire();
    visKick(true);
    asStart();
    scheduleBurst(600);
    bgWorkerStart();
    healthStart();

    if (!pollTimer) {
      pollMs = CFG.POLL_FAST_MS;
      pollLoop(GEN);
    }

    setInterval(() => { try { if (on) updateUI(); } catch (_) {} }, 5000);
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
    healthStop();
    stopAllConcepts();
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
      stopAllConcepts();
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
  window._s1panelStats = () => {
    STATS.uptime = Math.round((now() - STATS.startedAt) / 1000);
    STATS.multiTabPeers = multiTab.peers.size;
    STATS.isLeader = multiTab.isLeader;
    STATS.predictNextServeIn = predict.ema > 0
      ? Math.max(0, Math.round(predict.ema - (now() - predict.lastServeAt)))
      : "unknown";
    return JSON.parse(JSON.stringify(STATS));
  };

  window._s1panelCfg = () => JSON.parse(JSON.stringify(CFG));
  window._s1panelSet = (key, val) => {
    if (key in CFG) { CFG[key] = val; return true; }
    return false;
  };

  STATS.startedAt = now();
  lastUserAt = now();
  health.lastActivityAt = now();
  buildUI();
  installUserGuard();
  installNavHooks();
  installShadowPatch();
  startWatchers();

  console.log(
    `%c⚡ ${META.NAME} ${META.VERSION} — LOADED`,
    "color:#00ff88;font-weight:bold;font-size:14px;",
    "\nCtrl+Enter = Toggle | Shift+Click Puck = Remove",
    "\nWS Intercept: " + (CFG.WS_INTERCEPT_ENABLE ? "ON" : "OFF") +
      " | Fetch Hook: " + (CFG.FETCH_HOOK_ENABLE ? "ON" : "OFF") +
      " | Multi-Tab: " + (CFG.MULTI_TAB_ENABLE ? "ON" : "OFF"),
    "\nTurbo Click: " + (CFG.TURBO_CLICK_ENABLE ? "ON" : "OFF") +
      " | Audio: " + (CFG.AUDIO_ENABLE ? "ON" : "OFF") +
      " | Self-Heal: " + (CFG.SELF_HEAL_ENABLE ? "ON" : "OFF"),
    "\nwindow._s1panelStats() = View stats",
    "\nwindow._s1panelSet(key, val) = Runtime config"
  );
})();
