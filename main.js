/**
 * NOCTIS — Scrollytelling Engine
 * Vanilla JavaScript (ES6+), Zero frameworks, 60fps canvas scrubbing,
 * responsive cover/contain drawing, film grain, and interactive HUD & accordion.
 */

(function () {
  'use strict';

  // Ensure config is loaded
  const CFG = window.NOCTIS_CONFIG;
  if (!CFG) {
    console.error('NOCTIS: config.js must be loaded before main.js');
    return;
  }

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ==========================================================================
     GLOBAL STATE & REFS
     ========================================================================== */

  const state = {
    isMobile: window.innerWidth < 768,
    heroLoadedCount: 0,
    heroFullyLoaded: false,
    dismantleLoadedCount: 0,
    dismantleFullyLoaded: false,
    
    // Scrubbing lerp state
    hero: {
      targetFrame: 0,
      currentFrame: 0,
      lastDrawnFrame: -1,
      progress: 0,
      frames: [] // Image cache
    },
    dismantle: {
      targetFrame: 0,
      currentFrame: 0,
      lastDrawnFrame: -1,
      progress: 0,
      frames: [] // Image cache
    },

    // Navigation & Scroll
    lastScrollY: 0,
    activeLineupIndex: CFG.lineup.defaultActiveIndex || 0,
    hoverDebounceTimer: null,

    // Cursor
    cursor: {
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      currentX: window.innerWidth / 2,
      currentY: window.innerHeight / 2,
      label: 'VIEW',
      isBar: false,
      isActive: false
    }
  };

  /* ==========================================================================
     DOM ELEMENTS
     ========================================================================== */

  const DOM = {
    // Grain
    grainCanvas: document.getElementById('grain-canvas'),

    // Cursor
    customCursor: document.getElementById('custom-cursor'),
    cursorLabel: document.getElementById('cursor-label'),

    // Preloader
    preloader: document.getElementById('preloader'),
    preloaderBar: document.getElementById('preloader-bar'),
    preloaderCounter: document.getElementById('preloader-counter'),

    // Nav
    mainNav: document.getElementById('main-nav'),

    // Hero
    heroWrapper: document.getElementById('hero-wrapper'),
    heroStage: document.getElementById('hero-stage'),
    heroCanvas: document.getElementById('hero-canvas'),
    heroProgress: document.getElementById('hero-progress'),
    hudChapterText: document.getElementById('hud-chapter-text'),
    hudSpeedVal: document.getElementById('hud-speed-val'),
    hudDistanceVal: document.getElementById('hud-distance-val'),
    heroChapters: [
      document.getElementById('hero-ch-1'),
      document.getElementById('hero-ch-2'),
      document.getElementById('hero-ch-3'),
      document.getElementById('hero-ch-4')
    ],

    // Statement
    statementSection: document.getElementById('statement'),
    statementQuote: document.getElementById('statement-quote'),

    // Dismantle
    dismantleWrapper: document.getElementById('dismantle'),
    dismantleStage: document.getElementById('dismantle-stage'),
    dismantleCanvas: document.getElementById('dismantle-canvas'),
    dismantleProgress: document.getElementById('dismantle-progress'),
    calloutsSvg: document.getElementById('callouts-svg'),
    calloutsContainer: document.getElementById('callouts-container'),

    // Lineup
    lineupSection: document.getElementById('lineup'),
    lineupAccordion: document.getElementById('lineup-accordion'),

    // Reserve
    reserveCta: document.getElementById('reserve-cta')
  };

  /* Apply configured section heights */
  if (!isReducedMotion) {
    if (DOM.heroWrapper) DOM.heroWrapper.style.height = CFG.hero.wrapperHeight;
    if (DOM.dismantleWrapper) DOM.dismantleWrapper.style.height = CFG.dismantle.wrapperHeight;
  }

  /* ==========================================================================
     FILM-GRAIN PROCEDURAL NOISE
     Shifted randomly ~8 times per second (125ms), 3.5% opacity, no vignette.
     ========================================================================== */

  function initFilmGrain() {
    if (!DOM.grainCanvas) return;
    const ctx = DOM.grainCanvas.getContext('2d');
    const tileSize = 160;

    // Offscreen noise tile
    const offCanvas = document.createElement('canvas');
    offCanvas.width = tileSize;
    offCanvas.height = tileSize;
    const offCtx = offCanvas.getContext('2d');
    const imgData = offCtx.createImageData(tileSize, tileSize);
    const buffer32 = new Uint32Array(imgData.data.buffer);
    const len = buffer32.length;

    for (let i = 0; i < len; i++) {
      // Random monochrome noise with varied alpha
      const val = Math.floor(Math.random() * 255);
      buffer32[i] = (40 << 24) | (val << 16) | (val << 8) | val;
    }
    offCtx.putImageData(imgData, 0, 0);

    // Pattern
    let pattern = null;
    try {
      pattern = ctx.createPattern(offCanvas, 'repeat');
    } catch (e) {
      console.warn('Pattern creation note:', e);
    }

    function resizeGrain() {
      DOM.grainCanvas.width = window.innerWidth;
      DOM.grainCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeGrain, { passive: true });
    resizeGrain();

    let lastShift = 0;
    function renderGrain(now) {
      if (now - lastShift > 125) { // 8 times per sec
        lastShift = now;
        ctx.clearRect(0, 0, DOM.grainCanvas.width, DOM.grainCanvas.height);
        if (pattern) {
          ctx.save();
          // Random offset translation to shift grain pattern
          const offsetX = Math.floor(Math.random() * tileSize);
          const offsetY = Math.floor(Math.random() * tileSize);
          ctx.translate(offsetX, offsetY);
          ctx.fillStyle = pattern;
          ctx.fillRect(-offsetX, -offsetY, DOM.grainCanvas.width + tileSize, DOM.grainCanvas.height + tileSize);
          ctx.restore();
        }
      }
      requestAnimationFrame(renderGrain);
    }
    requestAnimationFrame(renderGrain);
  }

  /* ==========================================================================
     CUSTOM HEADLIGHT CURSOR (Desktop only)
     Lerp 0.18, 44x2px light bar morph, label updates, mousedown pulse.
     ========================================================================== */

  function initCustomCursor() {
    if (!DOM.customCursor || !isFinePointer || isReducedMotion) return;

    window.addEventListener('mousemove', (e) => {
      state.cursor.targetX = e.clientX;
      state.cursor.targetY = e.clientY;
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      DOM.customCursor.classList.add('active');
      setTimeout(() => {
        DOM.customCursor.classList.remove('active');
      }, 120);
    });

    // Delegated hover detection
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('a, button, [data-cursor-label], .lineup-slide');
      if (target) {
        DOM.customCursor.classList.add('morph-bar');

        if (target.classList.contains('lineup-slide')) {
          const isOpen = target.classList.contains('is-open');
          DOM.cursorLabel.textContent = isOpen ? 'CONFIGURE' : 'OPEN';
        } else {
          const label = target.getAttribute('data-cursor-label') || 'VIEW';
          DOM.cursorLabel.textContent = label;
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('a, button, [data-cursor-label], .lineup-slide');
      if (target && !e.relatedTarget?.closest('a, button, [data-cursor-label], .lineup-slide')) {
        DOM.customCursor.classList.remove('morph-bar');
        DOM.cursorLabel.textContent = '';
      }
    });
  }

  function updateCursorLoop() {
    if (!DOM.customCursor || !isFinePointer || isReducedMotion) return;
    const c = state.cursor;
    c.currentX += (c.targetX - c.currentX) * 0.18;
    c.currentY += (c.targetY - c.currentY) * 0.18;
    DOM.customCursor.style.transform = `translate3d(${c.currentX}px, ${c.currentY}px, 0)`;
  }

  /* ==========================================================================
     FRAME PRELOADER & IMAGE CACHING
     Preloads hero 1–40 first, then reveals page; continues loading hero and
     dismantle frames sequentially. Fallback to nearest loaded frame.
     ========================================================================== */

  function getFramePath(basePattern, index) {
    const padded = String(index).padStart(4, '0');
    return basePattern.replace('{index}', padded);
  }

  function loadSingleFrame(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if ('decode' in img) {
          img.decode().then(() => resolve(img)).catch(() => resolve(img));
        } else {
          resolve(img);
        }
      };
      img.onerror = () => {
        console.warn('Failed to load frame:', src);
        resolve(null);
      };
    });
  }

  async function initPreloaderAndFrames() {
    const heroPattern = state.isMobile ? CFG.hero.mobilePath : CFG.hero.desktopPath;
    const dismantlePattern = state.isMobile ? CFG.dismantle.mobilePath : CFG.dismantle.desktopPath;

    state.hero.frames = new Array(CFG.hero.frameCount).fill(null);
    state.dismantle.frames = new Array(CFG.dismantle.frameCount).fill(null);

    // 1. Initial critical batch: Hero frames 1 to 40
    const initialCount = Math.min(CFG.preloader.initialHeroFramesToLoad, CFG.hero.frameCount);
    let loadedInitial = 0;

    const initialPromises = [];
    for (let i = 1; i <= initialCount; i++) {
      const frameIdx = i - 1;
      const path = getFramePath(heroPattern, i);
      const promise = loadSingleFrame(path).then((img) => {
        state.hero.frames[frameIdx] = img;
        loadedInitial++;
        const pct = Math.min(100, Math.round((loadedInitial / initialCount) * 100));
        if (DOM.preloaderBar) DOM.preloaderBar.style.transform = `scaleX(${pct / 100})`;
        if (DOM.preloaderCounter) DOM.preloaderCounter.textContent = String(pct).padStart(3, '0');
      });
      initialPromises.push(promise);
    }

    await Promise.all(initialPromises);

    // Initial batch ready: flash preloader line brighter, then reveal page
    if (DOM.preloaderBar) DOM.preloaderBar.classList.add('bright');
    setTimeout(() => {
      if (DOM.preloader) {
        DOM.preloader.classList.add('fade-out');
        setTimeout(() => {
          DOM.preloader.style.display = 'none';
        }, 800);
      }
    }, CFG.preloader.exitFlashMs || 140);

    // Initial render of first hero frame
    renderHeroFrame(0, 0);

    // 2. Background queue: remaining hero frames (41 to end)
    loadRemainingHeroFrames(heroPattern, initialCount + 1);

    // 3. Background queue: dismantle frames
    loadDismantleFrames(dismantlePattern);
  }

  async function loadRemainingHeroFrames(heroPattern, startIdx) {
    const batchSize = 6;
    for (let i = startIdx; i <= CFG.hero.frameCount; i += batchSize) {
      const batch = [];
      for (let j = i; j < i + batchSize && j <= CFG.hero.frameCount; j++) {
        const frameIdx = j - 1;
        const path = getFramePath(heroPattern, j);
        batch.push(
          loadSingleFrame(path).then((img) => {
            state.hero.frames[frameIdx] = img;
          })
        );
      }
      await Promise.all(batch);
    }
    state.heroFullyLoaded = true;
  }

  async function loadDismantleFrames(dismantlePattern) {
    // Load first dismantle frame promptly so it is ready for preview
    const firstFrame = await loadSingleFrame(getFramePath(dismantlePattern, 1));
    state.dismantle.frames[0] = firstFrame;
    renderDismantleFrame(0, 0);

    const batchSize = 6;
    for (let i = 2; i <= CFG.dismantle.frameCount; i += batchSize) {
      const batch = [];
      for (let j = i; j < i + batchSize && j <= CFG.dismantle.frameCount; j++) {
        const frameIdx = j - 1;
        const path = getFramePath(dismantlePattern, j);
        batch.push(
          loadSingleFrame(path).then((img) => {
            state.dismantle.frames[frameIdx] = img;
          })
        );
      }
      await Promise.all(batch);
    }
    state.dismantleFullyLoaded = true;
  }

  function getNearestLoadedFrame(framesArray, targetIdx) {
    if (framesArray[targetIdx]) return framesArray[targetIdx];
    // Search outwards for nearest loaded frame
    for (let offset = 1; offset < framesArray.length; offset++) {
      if (targetIdx - offset >= 0 && framesArray[targetIdx - offset]) {
        return framesArray[targetIdx - offset];
      }
      if (targetIdx + offset < framesArray.length && framesArray[targetIdx + offset]) {
        return framesArray[targetIdx + offset];
      }
    }
    return null;
  }

  /* ==========================================================================
     CANVAS DRAWING ENGINE
     - DevicePixelRatio scaled (capped at 2)
     - Cover-fit on landscape
     - Contain-fit on portrait, vertically centered on --asphalt (#07080A)
     ========================================================================== */

  function drawFitFrame(ctx, canvas, img) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = CFG.tokens.asphalt;
    ctx.fillRect(0, 0, w, h);

    if (!img) {
      ctx.restore();
      return;
    }

    const isPortrait = h > w;
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    const imgRatio = imgW / imgH;
    const screenRatio = w / h;

    let dw, dh, dx, dy;

    if (isPortrait) {
      // Contain-fit, vertically centered on --asphalt, car is never cropped
      dw = w;
      dh = w / imgRatio;
      if (dh > h) {
        dh = h;
        dw = h * imgRatio;
      }
      dx = (w - dw) / 2;
      dy = (h - dh) / 2;
    } else {
      // Cover-fit on landscape
      if (screenRatio > imgRatio) {
        dw = w;
        dh = w / imgRatio;
        dx = 0;
        dy = (h - dh) / 2;
      } else {
        dh = h;
        dw = h * imgRatio;
        dx = (w - dw) / 2;
        dy = 0;
      }
    }

    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  /* ==========================================================================
     HERO SCROLLYTELLING
     Scrubbing frames, HUD metric counters, sky narrative reveals, 1px bottom bar,
     and solid asphalt fade in the last 5%.
     ========================================================================== */

  function renderHeroFrame(frameIdx, progress) {
    if (!DOM.heroCanvas) return;
    const ctx = DOM.heroCanvas.getContext('2d');
    const img = getNearestLoadedFrame(state.hero.frames, frameIdx);
    drawFitFrame(ctx, DOM.heroCanvas, img);

    // Over last 5% of scroll (progress >= 0.95), canvas fades to solid black (#07080A)
    if (progress >= CFG.hero.fadeToBlackStart) {
      const fadeAlpha = (progress - CFG.hero.fadeToBlackStart) / (1 - CFG.hero.fadeToBlackStart);
      ctx.save();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.scale(dpr, dpr);
      ctx.fillStyle = `rgba(7, 8, 10, ${Math.min(1, fadeAlpha)})`;
      ctx.fillRect(0, 0, DOM.heroCanvas.clientWidth, DOM.heroCanvas.clientHeight);
      ctx.restore();
    }
  }

  function updateHeroScrollytelling() {
    if (!DOM.heroWrapper) return;

    if (isReducedMotion) {
      // Static display for reduced motion
      const currentScroll = window.scrollY;
      const hH = DOM.heroWrapper.offsetHeight;
      const prog = Math.min(1, Math.max(0, currentScroll / hH));
      const staticFrames = [0, Math.floor(CFG.hero.frameCount * 0.35), Math.floor(CFG.hero.frameCount * 0.65), CFG.hero.frameCount - 1];
      const selected = staticFrames[Math.min(staticFrames.length - 1, Math.floor(prog * staticFrames.length))];
      renderHeroFrame(selected, prog);
      return;
    }

    const rect = DOM.heroWrapper.getBoundingClientRect();
    const scrollDistance = DOM.heroWrapper.offsetHeight - window.innerHeight;
    const rawProgress = scrollDistance > 0 ? -rect.top / scrollDistance : 0;
    const progress = Math.max(0, Math.min(1, rawProgress));
    state.hero.progress = progress;

    // Target frame
    state.hero.targetFrame = Math.round(progress * (CFG.hero.frameCount - 1));

    // Smooth scrub lerp
    state.hero.currentFrame += (state.hero.targetFrame - state.hero.currentFrame) * CFG.hero.lerp;
    const rounded = Math.round(state.hero.currentFrame);

    if (rounded !== state.hero.lastDrawnFrame || progress >= CFG.hero.fadeToBlackStart) {
      renderHeroFrame(rounded, progress);
      state.hero.lastDrawnFrame = rounded;
    }

    // 1px Bottom Progress Line
    if (DOM.heroProgress) {
      DOM.heroProgress.style.transform = `scaleX(${progress})`;
    }

    // Telemetry HUD
    const speed = Math.round(progress * CFG.hero.hud.maxSpeed);
    const dist = (progress * CFG.hero.hud.maxDistance).toFixed(1);
    if (DOM.hudSpeedVal) DOM.hudSpeedVal.textContent = String(speed).padStart(3, '0');
    if (DOM.hudDistanceVal) DOM.hudDistanceVal.textContent = dist;

    // HUD Chapter Number
    let chText = '01/04';
    if (progress >= 0.72) chText = '04/04';
    else if (progress >= 0.44) chText = '03/04';
    else if (progress >= 0.16) chText = '02/04';
    if (DOM.hudChapterText) DOM.hudChapterText.textContent = chText;

    // Chapters Text Reveal / Fade
    const chs = CFG.hero.chapters;
    DOM.heroChapters.forEach((chEl, idx) => {
      if (!chEl) return;
      const c = chs[idx];
      let isActive = false;
      if (idx === 0) {
        isActive = progress <= (c.fadeOut || 0.16);
      } else if (idx === chs.length - 1) {
        isActive = progress >= (c.fadeIn || 0.78);
      } else {
        isActive = progress >= (c.fadeIn || c.start - 0.04) && progress <= (c.fadeOut || c.end + 0.04);
      }

      if (isActive) {
        chEl.classList.add('active');
      } else {
        chEl.classList.remove('active');
      }
    });
  }

  /* ==========================================================================
     SECTION 2 — STATEMENT (Word-by-word scroll reveal)
     Words transition from 15% to 100% opacity as the section scrolls into view.
     ========================================================================== */

  function initStatementWords() {
    if (!DOM.statementQuote) return;
    const sentence = CFG.statement.text;
    const words = sentence.split(' ');
    DOM.statementQuote.innerHTML = words
      .map((word) => `<span class="statement-word">${word}</span>`)
      .join(' ');
  }

  function updateStatementScroll() {
    if (!DOM.statementSection || !DOM.statementQuote) return;
    const rect = DOM.statementSection.getBoundingClientRect();
    const vh = window.innerHeight;
    const sH = DOM.statementSection.offsetHeight;

    // Normalized progress across viewing window
    const enter = vh - rect.top;
    const total = vh + sH;
    const progress = Math.max(0, Math.min(1, (enter - vh * 0.25) / (total * 0.55)));

    const wordEls = DOM.statementQuote.querySelectorAll('.statement-word');
    const wordCount = wordEls.length;

    wordEls.forEach((el, idx) => {
      const wordThreshold = idx / wordCount;
      const wordProgress = Math.max(0, Math.min(1, (progress - wordThreshold) * wordCount));
      // Opacity from 0.15 to 1.0
      const opacity = 0.15 + 0.85 * wordProgress;
      el.style.opacity = opacity.toFixed(3);
    });
  }

  /* ==========================================================================
     SECTION 3 — DISMANTLE (Pinned Scrollytelling Architecture)
     Scrubbing explode sequence + 1px hairline callouts to component locations.
     ========================================================================== */

  function initDismantleCallouts() {
    if (!DOM.calloutsContainer) return;
    DOM.calloutsContainer.innerHTML = '';

    CFG.dismantle.callouts.forEach((c) => {
      const card = document.createElement('div');
      card.className = 'callout-card';
      card.id = `callout-${c.id}`;
      card.style.left = `${c.labelPos.x}%`;
      card.style.top = `${c.labelPos.y}%`;
      card.innerHTML = `
        <div class="callout-code font-mono">${c.code}</div>
        <div class="callout-name font-body">${c.name}</div>
      `;
      DOM.calloutsContainer.appendChild(card);
    });
  }

  function renderDismantleFrame(frameIdx, progress) {
    if (!DOM.dismantleCanvas) return;
    const ctx = DOM.dismantleCanvas.getContext('2d');
    const img = getNearestLoadedFrame(state.dismantle.frames, frameIdx);
    drawFitFrame(ctx, DOM.dismantleCanvas, img);
  }

  function updateDismantleScrollytelling() {
    if (!DOM.dismantleWrapper) return;

    if (isReducedMotion) {
      const currentScroll = window.scrollY;
      const dH = DOM.dismantleWrapper.offsetHeight;
      const prog = Math.min(1, Math.max(0, currentScroll / dH));
      const target = prog > 0.5 ? CFG.dismantle.frameCount - 1 : 0;
      renderDismantleFrame(target, prog);
      return;
    }

    const rect = DOM.dismantleWrapper.getBoundingClientRect();
    const scrollDistance = DOM.dismantleWrapper.offsetHeight - window.innerHeight;
    const rawProgress = scrollDistance > 0 ? -rect.top / scrollDistance : 0;
    const progress = Math.max(0, Math.min(1, rawProgress));
    state.dismantle.progress = progress;

    state.dismantle.targetFrame = Math.round(progress * (CFG.dismantle.frameCount - 1));
    state.dismantle.currentFrame += (state.dismantle.targetFrame - state.dismantle.currentFrame) * CFG.dismantle.lerp;
    const rounded = Math.round(state.dismantle.currentFrame);

    if (rounded !== state.dismantle.lastDrawnFrame) {
      renderDismantleFrame(rounded, progress);
      state.dismantle.lastDrawnFrame = rounded;
    }

    // 1px Progress Line
    if (DOM.dismantleProgress) {
      DOM.dismantleProgress.style.transform = `scaleX(${progress})`;
    }

    // Callouts & SVG hairlines after 70% progress
    updateCallouts(progress);
  }

  function updateCallouts(progress) {
    if (!DOM.calloutsSvg || !DOM.calloutsContainer) return;
    const svgW = DOM.calloutsSvg.clientWidth;
    const svgH = DOM.calloutsSvg.clientHeight;

    let svgLinesHtml = '';

    CFG.dismantle.callouts.forEach((c) => {
      const card = document.getElementById(`callout-${c.id}`);
      const isActive = progress >= c.trigger;

      if (card) {
        if (isActive) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      }

      if (isActive && !state.isMobile) {
        const dotX = (c.dot.x / 100) * svgW;
        const dotY = (c.dot.y / 100) * svgH;
        const labelX = (c.labelPos.x / 100) * svgW;
        const labelY = (c.labelPos.y / 100) * svgH + 10;

        // 1px hairline line and 3px xenon dot
        svgLinesHtml += `
          <line x1="${dotX}" y1="${dotY}" x2="${labelX}" y2="${labelY}" stroke="rgba(237, 234, 228, 0.22)" stroke-width="1" />
          <circle cx="${dotX}" cy="${dotY}" r="3" fill="#CFE3FF" />
        `;
      }
    });

    DOM.calloutsSvg.innerHTML = svgLinesHtml;
  }

  /* ==========================================================================
     SECTION 4 — LINEUP (Hover Accordion)
     5 slides side-by-side, 80ms debounced hover, keyboard arrows, 6% slide-in,
     and 4 solid color swatches.
     ========================================================================== */

  function initLineupAccordion() {
    if (!DOM.lineupAccordion) return;
    DOM.lineupAccordion.innerHTML = '';

    CFG.lineup.models.forEach((m, idx) => {
      const isOpen = idx === state.activeLineupIndex;
      const slide = document.createElement('div');
      slide.className = `lineup-slide stagger-init ${isOpen ? 'is-open' : ''}`;
      slide.setAttribute('role', 'tab');
      slide.setAttribute('tabindex', '0');
      slide.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      slide.setAttribute('aria-label', `${m.number} ${m.name} ${m.tagline}`);
      slide.dataset.index = idx;

      // Swatches markup
      const swatchesHtml = m.colors
        .map(
          (c, cIdx) =>
            `<button type="button" class="color-swatch ${cIdx === 0 ? 'active' : ''}" style="background-color: ${c.hex};" data-color-name="${c.name}" title="${c.name}" aria-label="${c.name}"></button>`
        )
        .join('');

      slide.innerHTML = `
        <!-- Closed Slide Header -->
        <div class="slide-closed-header">
          <span class="slide-num font-mono">${m.number}</span>
          <span class="slide-rot-name font-mono">${m.name}</span>
        </div>

        <!-- Car Image -->
        <div class="slide-car-wrap">
          <img class="slide-car-img" src="${m.image}" alt="${m.alt}" loading="lazy" />
        </div>

        <!-- Open Slide Content -->
        <div class="slide-open-content">
          <div class="slide-open-header">
            <div>
              <div class="slide-num font-mono" style="margin-bottom: 8px;">${m.number}</div>
              <h3 class="slide-model-name font-display">${m.name}</h3>
            </div>
          </div>

          <div class="slide-open-details">
            <p class="slide-tagline font-body">${m.tagline}</p>
            <div class="slide-specs-grid font-mono">
              <div class="slide-spec-item">
                <span class="slide-spec-label">RANGE</span>
                <span class="slide-spec-value">${m.range}</span>
              </div>
              <div class="slide-spec-item">
                <span class="slide-spec-label">0–100 KM/H</span>
                <span class="slide-spec-value">${m.accel}</span>
              </div>
              <div class="slide-spec-item">
                <span class="slide-spec-label">POWER</span>
                <span class="slide-spec-value">${m.power}</span>
              </div>
            </div>

            <div class="slide-swatches">
              ${swatchesHtml}
            </div>

            <a href="#reserve" class="slide-cta-link font-mono" data-cursor-label="CONFIGURE">
              <span>Configure →</span>
            </a>
          </div>
        </div>
      `;

      // Event Listeners: Hover with debounce
      slide.addEventListener('mouseenter', () => {
        clearTimeout(state.hoverDebounceTimer);
        state.hoverDebounceTimer = setTimeout(() => {
          setActiveSlide(idx);
        }, CFG.lineup.hoverDebounceMs || 80);
      });

      slide.addEventListener('click', (e) => {
        // Handle swatch click
        const swatch = e.target.closest('.color-swatch');
        if (swatch) {
          e.stopPropagation();
          slide.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'));
          swatch.classList.add('active');
          return;
        }
        setActiveSlide(idx);
      });

      // Keyboard navigation
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveSlide(idx);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (idx + 1) % CFG.lineup.models.length;
          setActiveSlide(next);
          const nextEl = DOM.lineupAccordion.children[next];
          if (nextEl) nextEl.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (idx - 1 + CFG.lineup.models.length) % CFG.lineup.models.length;
          setActiveSlide(prev);
          const prevEl = DOM.lineupAccordion.children[prev];
          if (prevEl) prevEl.focus();
        }
      });

      DOM.lineupAccordion.appendChild(slide);
    });

    // Section entry reveal stagger (rise 40px and fade in)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slides = DOM.lineupAccordion.querySelectorAll('.lineup-slide');
            slides.forEach((sl, i) => {
              setTimeout(() => {
                sl.classList.add('stagger-in');
              }, i * 80);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(DOM.lineupSection);
  }

  function setActiveSlide(targetIdx) {
    if (targetIdx === state.activeLineupIndex) return;
    state.activeLineupIndex = targetIdx;

    const slides = DOM.lineupAccordion.querySelectorAll('.lineup-slide');
    slides.forEach((slide, idx) => {
      const isTarget = idx === targetIdx;
      if (isTarget) {
        slide.classList.add('is-open');
        slide.setAttribute('aria-expanded', 'true');
      } else {
        slide.classList.remove('is-open');
        slide.setAttribute('aria-expanded', 'false');
      }
    });

    // Update cursor label if currently hovering over slide
    if (DOM.customCursor && DOM.customCursor.classList.contains('morph-bar')) {
      DOM.cursorLabel.textContent = 'CONFIGURE';
    }
  }

  /* ==========================================================================
     NAV AUTO-HIDE ON SCROLL DOWN, SHOW ON SCROLL UP
     ========================================================================== */

  function updateNav() {
    if (!DOM.mainNav) return;
    const currentY = window.scrollY;
    if (currentY > state.lastScrollY && currentY > 120) {
      DOM.mainNav.classList.add('nav-hidden');
    } else {
      DOM.mainNav.classList.remove('nav-hidden');
    }
    state.lastScrollY = currentY;
  }

  /* ==========================================================================
     RESERVE CTA INTERACTION
     ========================================================================== */

  function initReserveButton() {
    if (!DOM.reserveCta) return;
    DOM.reserveCta.addEventListener('click', () => {
      const activeModel = CFG.lineup.models[state.activeLineupIndex] || CFG.lineup.models[0];
      const origText = DOM.reserveCta.querySelector('span:not(.reserve-tick)').textContent;
      DOM.reserveCta.querySelector('span:not(.reserve-tick)').textContent = `ALLOCATION REQUESTED — ${activeModel.name}`;
      setTimeout(() => {
        DOM.reserveCta.querySelector('span:not(.reserve-tick)').textContent = origText;
      }, 3000);
    });
  }

  /* ==========================================================================
     RESIZE & ORIENTATION HANDLER
     ========================================================================== */

  function handleResize() {
    const isMobileNow = window.innerWidth < 768;
    if (isMobileNow !== state.isMobile) {
      state.isMobile = isMobileNow;
      // Reload frames for new screen tier if changed
      const heroPattern = state.isMobile ? CFG.hero.mobilePath : CFG.hero.desktopPath;
      const dismantlePattern = state.isMobile ? CFG.dismantle.mobilePath : CFG.dismantle.desktopPath;
      loadRemainingHeroFrames(heroPattern, 1);
      loadDismantleFrames(dismantlePattern);
    }

    renderHeroFrame(state.hero.lastDrawnFrame, state.hero.progress);
    renderDismantleFrame(state.dismantle.lastDrawnFrame, state.dismantle.progress);
    updateCallouts(state.dismantle.progress);
  }

  /* ==========================================================================
     MAIN ANIMATION RAF LOOP (60fps)
     ========================================================================== */

  function mainLoop() {
    updateCursorLoop();
    updateHeroScrollytelling();
    updateStatementScroll();
    updateDismantleScrollytelling();

    requestAnimationFrame(mainLoop);
  }

  /* ==========================================================================
     INITIALIZATION
     ========================================================================== */

  function init() {
    initFilmGrain();
    initCustomCursor();
    initStatementWords();
    initDismantleCallouts();
    initLineupAccordion();
    initReserveButton();

    window.addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Kick off image preloading & main loop
    initPreloaderAndFrames();
    requestAnimationFrame(mainLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

