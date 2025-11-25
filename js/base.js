// Handle mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close menu when clicking a link on mobile
  navLinks.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      navLinks.classList.remove('open');
    }
  });
}

// Simple testimonial slider (scroll snapping effect)
const track = document.querySelector('.testimonial-track');
const prevBtn = document.querySelector('.slider-btn.prev');
const nextBtn = document.querySelector('.slider-btn.next');

if (track && prevBtn && nextBtn) {
  let scrollIndex = 0;
  const cards = Array.from(track.children);

  const scrollToIndex = (index) => {
    if (!cards.length) return;
    const cardWidth = cards[0].offsetWidth + 24; // width + margin
    track.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth',
    });
  };

  const updateIndex = (direction) => {
    scrollIndex += direction;
    if (scrollIndex < 0) scrollIndex = cards.length - 1;
    if (scrollIndex > cards.length - 1) scrollIndex = 0;
    scrollToIndex(scrollIndex);
  };

  prevBtn.addEventListener('click', () => updateIndex(-1));
  nextBtn.addEventListener('click', () => updateIndex(1));

  // Auto-play slider every 6 seconds
  setInterval(() => updateIndex(1), 6000);
}

// Footer year stamp
const yearEl = document.querySelector('#year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Floating header hide/show on scroll
const header = document.querySelector('.site-header');
let lastScrollY = window.scrollY;
let headerHidden = false;

window.addEventListener('scroll', () => {
  if (!header) return;
  const currentScroll = window.scrollY;
  const isScrollingDown = currentScroll > lastScrollY;

  if (currentScroll <= 120) {
    header.classList.remove('hide');
    headerHidden = false;
  } else if (isScrollingDown && !headerHidden) {
    header.classList.add('hide');
    headerHidden = true;
  } else if (!isScrollingDown && headerHidden) {
    header.classList.remove('hide');
    headerHidden = false;
  }

  lastScrollY = Math.max(currentScroll, 0);
});

// Reveal-on-scroll animations
const animatedElements = document.querySelectorAll('[data-animate]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (animatedElements.length) {
  if (prefersReducedMotion) {
    animatedElements.forEach((el) => el.classList.add('in-view'));
  } else {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    animatedElements.forEach((el) => observer.observe(el));
  }
}

