/* ============================================================
   WELLNESS — MAIN RUNTIME (shared by every page)
   Header behaviour, navigation, page transitions, reveals,
   testimonial slider, image fallbacks, per-page modules.
   ============================================================ */

import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/blocks.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = !prefersReduced; // degrade gracefully without motion

/* ------------------------------------------------------------
   Motion availability probe
   GSAP `from()` tweens pre-hide their targets the moment they are
   created, so the reveal system must never run in an environment
   where requestAnimationFrame is throttled or frozen — occluded
   windows, Chrome preview panes, background tabs — or every
   photo (clip reveals) and heading (word reveals) would stay
   invisible with no way in.
   Probe: a healthy display produces 30+ rAF ticks in 600 ms;
   a frozen one produces zero.
   ------------------------------------------------------------ */
let motionOK = !prefersReduced;

function probeMotion() {
  return new Promise((resolve) => {
    if (prefersReduced || typeof requestAnimationFrame !== 'function') {
      resolve(false);
      return;
    }
    let ticks = 0;
    const start = performance.now();
    const loop = () => {
      ticks += 1;
      if (performance.now() - start < 600) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    setTimeout(() => resolve(ticks >= 12), 900);
  });
}

/* Static fallback: lift the intro curtain, mark the page booted, and
   stand everything down — all animated elements keep CSS-visible
   defaults, so the page renders complete without any motion. */
function skipMotion() {
  document.documentElement.classList.add('no-motion');
  const curtain = document.querySelector('.curtain');
  if (curtain) {
    curtain.classList.remove('is-intro');
    curtain.style.display = 'none';
    curtain.style.pointerEvents = 'none';
  }
  document.body.dataset.booted = '1';
}

/* Failsafe for the opposite failure: rAF is healthy at boot but stalls
   mid-session (window covered, background tab). Any pre-hidden target
   whose tween can no longer advance is force-completed so content can
   never be stranded invisible. */
let watchdogDone = false;

function forceReveal() {
  if (watchdogDone || prefersReduced) return;
  watchdogDone = true;
  skipMotion();
  const selectors = [
    '[data-reveal]',
    '[data-reveal-group] > *',
    '[data-cue]',
    '[data-clip]',
    '[data-clip] img',
    '[data-words]',
    '[data-words] .w',
    '.hero-title .line > span',
    '[data-sticky-story] .story-img',
  ];
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.style.opacity = '';
      el.style.visibility = '';
      el.style.transform = '';
      el.style.clipPath = '';
    });
  });
}

function armStallWatchdog() {
  if (prefersReduced) return;
  let lastTick = performance.now();
  const loop = () => {
    lastTick = performance.now();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const iv = setInterval(() => {
    if (document.hidden) return;
    if (performance.now() - lastTick > 1500) {
      forceReveal();
      clearInterval(iv);
    }
  }, 1500);
}

/* ------------------------------------------------------------
   Header
   ------------------------------------------------------------ */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 40);
    if (y > lastY && y > 420 && !document.body.dataset.menuOpen) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ------------------------------------------------------------
   Mobile menu
   ------------------------------------------------------------ */
function initMobileMenu() {
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.mobile-menu');
  if (!burger || !menu) return;

  const links = menu.querySelectorAll('nav a');
  let open = false;

  const setState = (state) => {
    open = state;
    document.body.dataset.menuOpen = open ? '1' : '';
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    document.querySelector('.site-header')?.classList.remove('is-hidden');
  };

  burger.addEventListener('click', () => setState(!open));

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setState(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setState(false);
  });

  if (hasGSAP && links.length) {
    burger.addEventListener('click', () => {
      if (open) {
        gsap.fromTo(links, { y: 0, opacity: 1 }, { y: 26, opacity: 0, duration: 0.3, stagger: 0.03, ease: 'power2.in' });
      } else {
        gsap.fromTo(links,
          { y: 34, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, stagger: 0.06, delay: 0.12, ease: 'power3.out', clearProps: 'all' });
        const foot = menu.querySelector('.menu-foot');
        foot && gsap.fromTo(foot, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.45 });
      }
    });
  }
}

/* ------------------------------------------------------------
   Page transitions (curtain)
   ------------------------------------------------------------ */
function initCurtain() {
  const curtain = document.querySelector('.curtain');
  if (!curtain || prefersReduced) return;

  const brand = curtain.querySelector('.curtain-brand');

  // Intro: curtain is covering (see HTML), lift it to reveal the page.
  curtain.classList.add('is-intro');
  document.body.dataset.booted = '1';

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    onComplete: () => {
      curtain.classList.remove('is-intro');
      curtain.style.pointerEvents = 'none';
    },
  });

  tl.fromTo(brand, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.4, delay: 1.15, ease: 'power2.in' })
    .to(curtain, { scaleY: 0, transformOrigin: 'top', duration: 0.9 }, '-=0.16');

  /* Failsafe: if the timeline can't run (hidden tab, throttled rAF),
     lift the curtain manually so the page is never left covered. */
  const liftCurtain = () => {
    if (curtain.classList.contains('is-intro')) {
      curtain.classList.remove('is-intro');
      curtain.style.transform = 'none';
      curtain.style.pointerEvents = 'none';
    }
  };
  window.addEventListener('load', () => setTimeout(liftCurtain, 2600));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(liftCurtain, 2600);
  });

  /* Outgoing: cover before navigating to an internal page */
  const isInternal = (a) =>
    a.hostname === location.hostname &&
    !a.hash &&
    (a.target !== '_blank');

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    if (link.dataset.noTransition !== undefined) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) return; // in-page anchors scroll natively
    const samePage = href === location.pathname.split('/').pop() ||
                     (href === 'index.html' && (location.pathname.endsWith('/') || location.pathname.endsWith('index.html')));
    if (!isInternal(link) || (samePage && !link.hash)) return;
    e.preventDefault();
    /* navigate from the timeline *and* a timeout — the timeline is
       primary, the timer guarantees navigation can never wedge. */
    let navigated = false;
    const go = () => { if (!navigated) { navigated = true; window.location.href = link.href; } };
    gsap.timeline({ defaults: { ease: 'power3.inOut' } })
      .to(curtain, { scaleY: 1, transformOrigin: 'bottom', duration: 0.55 })
      .call(go);
    setTimeout(go, 1800);
  });
}

/* ------------------------------------------------------------
   Word splitting for headings
   ------------------------------------------------------------ */
function splitWords(el) {
  if (el.dataset.split === 'done') return;
  const walk = (node) => {
    const childNodes = [...node.childNodes];
    childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        const words = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        words.forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(w); return; }
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = w;
          span.style.display = 'inline-block';
          frag.append(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
  el.dataset.split = 'done';
}

/* ------------------------------------------------------------
   Cinematic hero entrance + scroll parallax (home)
   ------------------------------------------------------------ */
function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero || prefersReduced) return;

  const lines = hero.querySelectorAll('.hero-title .line > span');
  const cues = hero.querySelectorAll('[data-cue]');
  const cue = hero.querySelector('.scroll-cue');
  const img = hero.querySelector('.hero-media img');

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 1.2 });

  tl.from(img, { scale: 1.22, autoAlpha: 0.6, duration: 2.6, ease: 'power2.out' }, 0)
    .from(lines, { yPercent: 112, duration: 1.5, stagger: 0.12 }, 0.25)
    .from(cues, { y: 30, autoAlpha: 0, duration: 1.1, stagger: 0.14 }, 0.8)
    .from(cue, { autoAlpha: 0, duration: 1.2 }, 1.4);

  /* slow drift + fade as the hero scrolls away */
  gsap.to(img, {
    scale: 1.08,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to(hero.querySelector('.hero-content'), {
    yPercent: -12,
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'bottom 90%', end: 'bottom 40%', scrub: true },
  });
}

/* ------------------------------------------------------------
   Inner-page entrance (page hero title + cue labels)
   ------------------------------------------------------------ */
function initPageIntro() {
  if (prefersReduced || document.querySelector('.hero')) return;
  const title = document.querySelector('.page-title');
  const cues = document.querySelectorAll('[data-cue]');
  if (!title && !cues.length) return;

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 1.15 });
  if (title) tl.from(title.querySelectorAll('.line > span'), { yPercent: 112, duration: 1.4, stagger: 0.1 }, 0);
  if (cues.length) tl.from(cues, { y: 26, autoAlpha: 0, duration: 1, stagger: 0.12 }, 0.35);
}

/* ------------------------------------------------------------
   Scroll reveal system
   Each animated element keeps a CSS-visible default; motion is
   applied by GSAP so nothing is lost without JavaScript.
   ------------------------------------------------------------ */
function initReveals() {
  if (prefersReduced) return;

  /* Headings — word-level rise */
  document.querySelectorAll('[data-words]').forEach((el) => {
    splitWords(el);
    gsap.from(el.querySelectorAll('.w'), {
      yPercent: 108,
      opacity: 0.001,
      rotate: 0.7,
      duration: 1.05,
      stagger: 0.045,
      ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  });

  /* Generic reveal: fade + rise */
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 44,
      autoAlpha: 0,
      duration: 1.15,
      delay: parseFloat(el.dataset.revealDelay || 0),
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* Group stagger */
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    const kids = group.querySelectorAll(':scope > *');
    if (!kids.length) return;
    gsap.from(kids, {
      y: 30,
      autoAlpha: 0,
      duration: 0.95,
      stagger: 0.14,
      ease: 'power3.out',
      scrollTrigger: { trigger: group, start: 'top 84%', once: true },
    });
  });

  /* Image clip reveal (curtain wipe over media) */
  document.querySelectorAll('[data-clip]').forEach((frame) => {
    const img = frame.querySelector('img');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: frame, start: 'top 85%', once: true },
      defaults: { ease: 'power3.out' },
    });
    tl.fromTo(frame,
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 1.35 });
    if (img) tl.from(img, { scale: 1.28, duration: 1.75, ease: 'power2.out' }, 0);
  });
}

/* ------------------------------------------------------------
   Parallax photography
   ------------------------------------------------------------ */
function initParallax() {
  if (prefersReduced) return;
  document.querySelectorAll('[data-parallax]').forEach((wrap) => {
    const media = wrap.querySelector('img');
    if (!media) return;
    const strength = parseFloat(wrap.dataset.parallax || 10);
    /* guarantee head-room so the crop never runs out */
    gsap.fromTo(media,
      { yPercent: -strength / 2, scale: 1.02 },
      {
        yPercent: strength / 2,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
  });
}

/* ------------------------------------------------------------
   Horizontal cinematic sequence (desktop only)
   ------------------------------------------------------------ */
function initHorizontalSequence() {
  if (prefersReduced) return;
  if (window.matchMedia('(max-width: 899px)').matches) return;

  document.querySelectorAll('[data-h-seq]').forEach((section) => {
    const track = section.querySelector('.h-seq-track');
    if (!track) return;

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  });
}

/* ------------------------------------------------------------
   Sticky image + stepped storytelling
   ------------------------------------------------------------ */
function initStickyStory() {
  const story = document.querySelector('[data-sticky-story]');
  if (!story) return;
  if (window.matchMedia('(max-width: 820px)').matches || prefersReduced) return;

  const imgs = story.querySelectorAll('.story-img');
  const steps = story.querySelectorAll('.story-step .step-card');
  if (!imgs.length || steps.length < 2) return;

  /* every image but the first starts hidden */
  gsap.set(imgs, { autoAlpha: 0 });
  gsap.set(imgs[0], { autoAlpha: 1 });

  const swap = (i) => {
    imgs.forEach((img, k) => {
      if (k === i) {
        gsap.to(img, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power2.out' });
      } else {
        gsap.to(img, { autoAlpha: 0, scale: 1.04, duration: 0.8, ease: 'power2.out' });
      }
    });
  };

  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step.parentElement,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => { if (self.isActive) swap(i); },
    });

    gsap.from(step, {
      y: 48,
      autoAlpha: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: step, start: 'top 70%', once: true },
    });
  });
}

/* ------------------------------------------------------------
   Testimonial stage (placeholder content, auto-rotating)
   ------------------------------------------------------------ */
function initTestimonials() {
  document.querySelectorAll('[data-testimonials]').forEach((stage) => {
    const slides = stage.querySelectorAll('.t-slide');
    if (slides.length < 2) return;
    const dotsBox = stage.parentElement.querySelector('.t-dots');
    const count = stage.parentElement.querySelector('.t-count');
    let index = 0;
    let timer = null;

    dotsBox?.querySelectorAll('.t-dot').forEach((dot, i) => {
      dot.addEventListener('click', () => show(i));
    });

    const activate = (i) => {
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      dotsBox?.querySelectorAll('.t-dot').forEach((d, k) => d.classList.toggle('is-active', k === i));
      if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };

    const show = (i) => {
      index = (i + slides.length) % slides.length;
      activate(index);
      restart();
    };

    const restart = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => show(index + 1), 8000);
    };

    stage.parentElement.querySelector('.t-prev')?.addEventListener('click', () => show(index - 1));
    stage.parentElement.querySelector('.t-next')?.addEventListener('click', () => show(index + 1));

    stage.addEventListener('pointerenter', () => timer && clearInterval(timer));
    stage.addEventListener('pointerleave', restart);

    activate(0);
    if (!prefersReduced) restart();
  });
}

/* ------------------------------------------------------------
   Image fallback: broken/removed photos degrade gracefully
   ------------------------------------------------------------ */
function initImageFallbacks() {
  document.querySelectorAll('img').forEach((img) => {
    const wrap = () => img.closest('.frame, .hero-media, .page-hero-media, .bleed-media');
    const fail = () => wrap()?.classList.add('is-missing');
    img.addEventListener('error', () => fail());
    /* Lazy-loaded frames are not `complete` at boot, so the one-shot
       early check would miss them either way — re-check when each
       image settles, and clear any flag set while it was mid-flight. */
    if (img.complete) {
      if (img.naturalWidth === 0) fail();
    } else {
      img.addEventListener('load', () => wrap()?.classList.remove('is-missing'));
    }
  });
}

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || '';

  initHeader();
  initMobileMenu();
  initTestimonials();
  initImageFallbacks();

  /* Never pre-hide content before we know animations can actually
     run (see probeMotion). */
  probeMotion().then((ok) => {
    motionOK = ok;
    if (!ok) {
      skipMotion();
      return;
    }
    initCurtain();
    initHero();
    initPageIntro();
    initReveals();
    initParallax();
    initHorizontalSequence();
    initStickyStory();
    armStallWatchdog();
  });

  /* dynamic per-page modules */
  if (page === 'gallery') import('./lightbox.js').then((m) => m.initLightbox());
  if (page === 'contact' || page === 'booking') import('./forms.js').then((m) => m.initForms());
  if (page === 'booking') import('./booking.js').then((m) => m.initBooking());

  /* refresh triggers after images settle */
  window.addEventListener('load', () => {
    if (motionOK) ScrollTrigger?.refresh();
    setTimeout(() => motionOK && ScrollTrigger?.refresh(), 800);
  });

  document.querySelector('.footer-year')?.append(new Date().getFullYear());
});

export { splitWords, prefersReduced, hasGSAP };
