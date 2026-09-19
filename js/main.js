// Loader
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hide'), 400);
});

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Sticky nav state
const nav = document.getElementById('nav');
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 40;
  nav.classList.toggle('scrolled', scrolled);
  backToTop.classList.toggle('show', window.scrollY > 600);
}, { passive: true });

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 0.08}s`;
  revealObserver.observe(el);
});

// Animated stat counters
const statEls = document.querySelectorAll('.stat-num');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseFloat(el.dataset.count);
    const isDecimal = target % 1 !== 0;
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = isDecimal ? value.toFixed(1) : Math.round(value);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = isDecimal ? target.toFixed(1) : target;
    }
    requestAnimationFrame(tick);
    countObserver.unobserve(el);
  });
}, { threshold: 0.5 });
statEls.forEach(el => countObserver.observe(el));

// Cursor glow (desktop only)
const cursorGlow = document.getElementById('cursorGlow');
if (matchMedia('(hover: hover)').matches) {
  window.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  });
}

// Contact form (static demo submission)
const form = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"] span');
  const originalText = btn.textContent;
  btn.textContent = 'Sending...';
  setTimeout(() => {
    btn.textContent = originalText;
    formNote.textContent = "Thanks — we'll be in touch within one business day.";
    form.reset();
  }, 900);
});
