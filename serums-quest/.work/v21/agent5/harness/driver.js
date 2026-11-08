/* Agente 5 · driver del harness. Solo lectura del DOM; no toca el juego. */
(function () {
  'use strict';
  var errors = [];
  window.addEventListener('error', function (e) { errors.push('error: ' + (e.message || e.type)); });
  window.addEventListener('unhandledrejection', function (e) { errors.push('rejection: ' + (e.reason && (e.reason.message || e.reason))); });
  /* Medición estable: sin transiciones de entrada (las capturas muestran el
     estado final, que es el que se revisa). */
  try {
    var stable = document.createElement('style');
    stable.id = 'h5-stable';
    stable.textContent = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important}';
    document.head.appendChild(stable);
  } catch (e) { /* sin head todavía */ }

  function px(value) { return Math.round(Number(value) || 0); }
  function rect(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { x: Math.round(r.left * 10) / 10, y: Math.round(r.top * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, right: Math.round(r.right * 10) / 10, bottom: Math.round(r.bottom * 10) / 10 };
  }
  function style(el, prop) { if (!el) return ''; return getComputedStyle(el).getPropertyValue(prop); }
  function overlap(a, b) {
    if (!a || !b) return 0;
    var w = Math.min(a.right, b.right) - Math.max(a.x, b.x);
    var h = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
    return w > 0 && h > 0 ? Math.round(w * h) : 0;
  }
  function visibleWidth(el) {
    if (!el) return 0;
    var r = el.getBoundingClientRect();
    var left = Math.max(0, r.left);
    var right = Math.min(window.innerWidth, r.right);
    return Math.max(0, Math.round(right - left));
  }
  function hitSelf(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!(hit && (hit === el || el.contains(hit)));
  }
  function childrenOverflow(copy) {
    if (!copy) return [];
    var bounds = copy.getBoundingClientRect();
    var out = [];
    var children = copy.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child || !child.getBoundingClientRect) continue;
      var r = child.getBoundingClientRect();
      if (r.height < 1) continue;
      if (r.bottom > bounds.bottom + 0.6 || r.top < bounds.top - 0.6) {
        out.push((child.className || child.tagName) + ':' + Math.round(r.top - bounds.top) + '..' + Math.round(r.bottom - bounds.top) + '/' + Math.round(bounds.height));
      }
    }
    return out;
  }
  function canvasInfo(canvas) {
    if (!canvas) return null;
    var r = canvas.getBoundingClientRect();
    var signature = '';
    try { signature = canvas.toDataURL('image/png').length; } catch (e) { signature = 'err:' + (e.message || e); }
    return {
      w: px(canvas.getAttribute('width')), h: px(canvas.getAttribute('height')),
      cssW: Math.round(r.width), cssH: Math.round(r.height),
      cssClass: canvas.className,
      pngLength: signature
    };
  }

  function measure() {
    var q = function (sel) { return document.querySelector(sel); };
    var overlay = q('.v2-hero-overlay');
    var shell = q('.v2-hero-shell');
    var head = q('.v2-hero-head');
    var title = q('.v2-hero-title');
    var h1 = q('.v2-hero-title h1');
    var titleP = q('.v2-hero-title p');
    var wave = q('.v2-hero-wave');
    var headTop = q('.v2-hero-top');
    var owner = q('.v2-hero-owner');
    var carousel = q('.v2-carousel');
    var viewport = q('.v2-carousel-viewport');
    var deck = q('.v2-carousel-deck');
    var foot = q('.v2-carousel-foot');
    var note = q('.v2-hero-note');
    var center = q('.v2-carousel-card.is-center');
    var centerRect = center ? center.getBoundingClientRect() : null;
    var centerCard = center ? center.querySelector('.v2-hero-card') : null;
    var copy = center ? center.querySelector('.v2-hero-copy') : null;
    var media = center ? center.querySelector('.v2-hero-media') : null;
    var stage = center ? center.querySelector('.v2-hero-stage') : null;
    var name = q('.v2-carousel-card.is-center .v2-hero-name');
    var desc = q('.v2-carousel-card.is-center .v2-hero-desc');
    var badges = q('.v2-carousel-card.is-center .v2-hero-badges');
    var attrs = q('.v2-carousel-card.is-center .v2-hero-attrs');
    var actions = q('.v2-carousel-card.is-center .v2-hero-actions');
    var cta = q('.v2-carousel-card.is-center .v2-hero-cta');
    var prev = q('.v2-carousel-card.is-prev');
    var next = q('.v2-carousel-card.is-next');
    var prev2 = q('.v2-carousel-card.is-prev2');
    var next2 = q('.v2-carousel-card.is-next2');
    var prevName = q('.v2-carousel-card.is-prev .v2-hero-sideName');
    var nextName = q('.v2-carousel-card.is-next .v2-hero-sideName');
    var prevRect = prev ? prev.getBoundingClientRect() : null;
    var nextRect = next ? next.getBoundingClientRect() : null;
    var prev2Rect = prev2 ? prev2.getBoundingClientRect() : null;
    var next2Rect = next2 ? next2.getBoundingClientRect() : null;
    var prevNameRect = prevName ? prevName.getBoundingClientRect() : null;
    var nextNameRect = nextName ? nextName.getBoundingClientRect() : null;
    var ctaRect = cta ? cta.getBoundingClientRect() : null;
    var ctaHit = cta ? document.elementFromPoint(ctaRect.left + ctaRect.width / 2, ctaRect.top + ctaRect.height / 2) : null;
    var canvas = q('.v2-hero-stage canvas');
    var overlayRect = overlay ? overlay.getBoundingClientRect() : null;
    var out = {
      screen: {
        w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio,
        scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight,
        coarse: window.matchMedia('(pointer: coarse)').matches
      },
      overlay: {
        rect: rect(overlay), scrollH: overlay ? overlay.scrollHeight : 0, clientH: overlay ? overlay.clientHeight : 0,
        scrollW: overlay ? overlay.scrollWidth : 0, clientW: overlay ? overlay.clientWidth : 0,
        zIndex: style(overlay, 'z-index'), pad: style(overlay, 'padding')
      },
      shell: rect(shell),
      head: { rect: rect(head), title: rect(title), h1: rect(h1), h1Size: style(h1, 'font-size'), p: rect(titleP), wave: rect(wave), top: rect(headTop), owner: rect(owner) },
      carousel: { rect: rect(carousel), viewport: rect(viewport), deck: rect(deck), foot: rect(foot), note: rect(note), minHeight: style(carousel, 'min-height'), vars: { cardW: carousel ? carousel.style.getPropertyValue('--v2-card-w') : '', step: carousel ? carousel.style.getPropertyValue('--v2-step') : '', step2: carousel ? carousel.style.getPropertyValue('--v2-step2') : '' }, narrow: !!(carousel && carousel.classList.contains('is-narrow')) },
      center: { rect: rect(center), card: rect(centerCard), copy: rect(copy), copyOverflow: style(copy, 'overflow'), copyScrollH: copy ? copy.scrollHeight : 0, copyClientH: copy ? copy.clientHeight : 0, clippedChildren: childrenOverflow(copy), media: rect(media), stage: rect(stage), name: rect(name), nameSize: style(name, 'font-size'), desc: rect(desc), badges: rect(badges), attrs: rect(attrs), actions: rect(actions), cta: rect(cta), ctaText: cta ? cta.textContent.replace(/\s+/g, ' ').trim().slice(0, 70) : '', ctaAction: cta ? cta.getAttribute('data-action') : '', ctaVisible: !!cta && ctaRect.bottom <= (copy ? copy.getBoundingClientRect().bottom : 0) + 0.6 && ctaRect.top >= (copy ? copy.getBoundingClientRect().top : 0) - 0.6, ctaHit: !!(ctaHit && (ctaHit === cta || cta.contains(ctaHit))) },
      sides: {
        prev: rect(prev), next: rect(next), prev2: rect(prev2), next2: rect(next2),
        prevVisibleW: visibleWidth(prev), nextVisibleW: visibleWidth(next),
        prev2VisibleW: visibleWidth(prev2), next2VisibleW: visibleWidth(next2),
        prevBandW: prevRect && centerRect ? Math.max(0, Math.round(centerRect.left - Math.max(prevRect.left, 0))) : 0,
        nextBandW: nextRect && centerRect ? Math.max(0, Math.round(Math.min(nextRect.right, window.innerWidth) - centerRect.right)) : 0,
        prev2BandW: prev2Rect && centerRect ? Math.max(0, Math.round(centerRect.left - Math.max(prev2Rect.right, prevRect ? prevRect.right : 0, 0))) : 0,
        next2BandW: next2Rect && centerRect ? Math.max(0, Math.round(Math.min(next2Rect.right, window.innerWidth) - Math.max(next2Rect.left, centerRect.right, nextRect ? nextRect.right : 0))) : 0,
        prevName: rect(prevName), prevNameHit: hitSelf(prevName),
        nextName: rect(nextName), nextNameHit: hitSelf(nextName),
        prevLabelClear: !!(prevNameRect && centerRect) && prevNameRect.right <= centerRect.left + 0.5,
        nextLabelClear: !!(nextNameRect && centerRect) && nextNameRect.left >= centerRect.right - 0.5,
        prevLabelInside: !!(prevNameRect) && prevNameRect.left >= -0.5 && prevNameRect.right <= window.innerWidth + 0.5,
        nextLabelInside: !!(nextNameRect) && nextNameRect.left >= -0.5 && nextNameRect.right <= window.innerWidth + 0.5
      },
      canvas: canvasInfo(canvas),
      actions: Array.prototype.map.call(document.querySelectorAll('.v2-carousel-card.is-center [data-action]'), function (el) { return el.getAttribute('data-action'); }),
      counts: {
        cards: document.querySelectorAll('[data-v2-card]').length,
        dots: document.querySelectorAll('.v2-carousel-dot').length,
        stages: document.querySelectorAll('[data-v2-stage]').length,
        canvases: document.querySelectorAll('.v2-hero-stage canvas').length
      },
      stream: (function () { try { return (window.__SERUMS_V2__ && window.__SERUMS_V2__._errors || []).slice(-6).map(function (e) { return String(e && (e.tag || e.message) || e); }); } catch (e) { return []; } })(),
      errors: errors.slice(-8),
      checks: {}
    };
    var d = out;
    d.checks.noViewportOverflow = d.screen.scrollW <= d.screen.w + 1 && d.screen.scrollH <= d.screen.h + 1;
    d.checks.overlayFits = !!d.overlay.rect && d.overlay.rect.h <= d.screen.h + 1 && d.overlay.rect.w <= d.screen.w + 1;
    d.checks.headerAboveCarousel = !!(d.head.rect && d.carousel.viewport) && d.head.rect.bottom <= d.carousel.viewport.y + 1;
    d.checks.headDoesNotCoverCards = !!(d.head.rect && d.center.rect) && d.head.rect.bottom <= d.center.rect.y + 1;
    d.checks.cardInsideViewport = !!(d.center.rect) && d.center.rect.x >= -1 && d.center.rect.right <= d.screen.w + 1 && d.center.rect.y >= -1 && d.center.rect.bottom <= d.screen.h + 1;
    d.checks.copyNotClipped = !!(d.center.copy) && d.center.copyScrollH <= d.center.copyClientH + 1;
    d.checks.ctaVisible = d.center.ctaVisible;
    d.checks.ctaClickable = d.center.ctaHit;
    d.checks.sideVisible = d.sides.prevBandW > 80 || d.sides.nextBandW > 80;
    d.checks.sideLabelsVisible = (d.checks.sideVisible && (d.sides.prevBandW > 80 ? d.sides.prevLabelClear : true) && (d.sides.nextBandW > 80 ? d.sides.nextLabelClear : true));
    d.checks.sideLabelsInsideViewport = (!d.sides.prevName || d.sides.prevLabelInside) && (!d.sides.nextName || d.sides.nextLabelInside);
    d.checks.thirdCardNotDominant = d.sides.next2BandW < 120 && d.sides.prev2BandW < 120;
    d.checks.headerCompact = !!(d.head.rect) && d.head.rect.h <= 135;
    d.checks.titleOneLine = !!(d.head.h1) && d.head.h1.h <= parseFloat(d.head.h1Size) * 1.45;
    d.checks.canvasMatchesStage = !!(d.canvas && d.center.stage) && Math.abs(d.canvas.cssW - d.center.stage.w) <= 1.5 && Math.abs(d.canvas.cssH - d.center.stage.h) <= 1.5;
    d.checks.stageInsideCard = !!(d.center.stage && d.center.card) && d.center.stage.x >= d.center.card.x - 1 && d.center.stage.right <= d.center.card.right + 1 && d.center.stage.y >= d.center.card.y - 1 && d.center.stage.bottom <= d.center.card.bottom + 1;
    d.checks.stageNotBlank = !!(d.canvas && d.canvas.pngLength > 4000);
    return d;
  }

  function waitFor(fn, timeout) {
    return new Promise(function (resolve, reject) {
      var start = Date.now();
      (function poll() {
        var value;
        try { value = fn(); } catch (e) { value = null; }
        if (value) { resolve(value); return; }
        if (Date.now() - start > (timeout || 8000)) { reject(new Error('timeout')); return; }
        setTimeout(poll, 80);
      })();
    });
  }

  window.__H5 = {
    ready: function () { return waitFor(function () { return document.querySelector('.v2-carousel') ? true : null; }, 20000); },
    measure: measure,
    freeze: function () {
      if (window.__H5_FROZEN__) return true;
      window.__H5_FROZEN__ = true;
      var s = document.createElement('style');
      s.textContent = '*,*::before,*::after{animation-duration:1ms!important;animation-delay:0ms!important;transition-duration:1ms!important;transition-delay:0ms!important}';
      document.head.appendChild(s);
      return true;
    },
    next: function () {
      var btn = document.querySelector('[data-action="v2-hero-next"]');
      if (!btn) return false;
      btn.click();
      return true;
    },
    prev: function () {
      var btn = document.querySelector('[data-action="v2-hero-prev"]');
      if (!btn) return false;
      btn.click();
      return true;
    },
    goto: function (index) {
      var dot = document.querySelectorAll('.v2-carousel-dot')[index];
      if (!dot) return false;
      dot.click();
      return true;
    },
    key: function (code) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: code, key: code, bubbles: true }));
      return true;
    },
    click: function (sel) {
      var el = document.querySelector(sel);
      if (!el) return false;
      el.click();
      return true;
    },
    cardIds: function () { return Array.prototype.map.call(document.querySelectorAll('[data-v2-card]'), function (el) { return el.getAttribute('data-v2-id'); }); },
    url: function () { return location.href; }
  };
})();
