document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = !mobileMenu.hidden;
      mobileMenu.hidden = isOpen;
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.hidden = true;
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger children within the same section slightly
          const delay = index % 3 * 80;
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach(el => revealObserver.observe(el));

  // Showcase carousel
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const dotsWrap = carousel.querySelector('.carousel-dots');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0;
    let timer = null;

    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `第 ${i + 1} 张截图`);
      dot.addEventListener('click', () => { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((dot, di) => {
        dot.classList.toggle('is-active', di === current);
        dot.setAttribute('aria-selected', String(di === current));
      });
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (reduceMotion || timer || document.hidden) return;
      timer = setInterval(() => goTo(current + 1), 5000);
    }

    function restart() {
      stop();
      start();
    }

    prevBtn.addEventListener('click', () => { goTo(current - 1); restart(); });
    nextBtn.addEventListener('click', () => { goTo(current + 1); restart(); });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { goTo(current - 1); restart(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); restart(); }
    });

    // Touch swipe (tap with small movement still opens the image link)
    let touchX = null;
    track.addEventListener('touchstart', (e) => {
      touchX = e.touches[0].clientX;
      stop();
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) {
        goTo(current + (dx < 0 ? 1 : -1));
      }
      touchX = null;
      start();
    }, { passive: true });

    goTo(0);
    start();
  }

  // Typing animation for hero SQL editor
  const codeElement = document.querySelector('.editor-content code');
  if (codeElement && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const originalHTML = codeElement.innerHTML;
    const lines = [
      { text: 'SELECT ', class: 'sql-keyword' },
      { text: '* ', class: 'sql-operator' },
      { text: 'FROM ', class: 'sql-keyword' },
      { text: 'users', class: 'sql-table' },
      { text: '\n', class: '' },
      { text: 'WHERE ', class: 'sql-keyword' },
      { text: 'status ', class: 'sql-column' },
      { text: '= ', class: 'sql-operator' },
      { text: "'active'", class: 'sql-string' },
      { text: '\n', class: '' },
      { text: 'LIMIT ', class: 'sql-keyword' },
      { text: '100', class: 'sql-number' },
    ];

    codeElement.innerHTML = '<span class="cursor">|</span>';
    const cursor = codeElement.querySelector('.cursor');

    let lineIndex = 0;
    let charIndex = 0;

    function typeNextChar() {
      if (lineIndex >= lines.length) {
        return;
      }

      const current = lines[lineIndex];
      if (current.text === '\n') {
        codeElement.insertBefore(document.createTextNode('\n'), cursor);
        lineIndex++;
        charIndex = 0;
        setTimeout(typeNextChar, 120);
        return;
      }

      if (charIndex === 0) {
        const span = document.createElement('span');
        span.className = current.class;
        span.dataset.text = current.text;
        codeElement.insertBefore(span, cursor);
      }

      const span = codeElement.querySelector(`span.${current.class}[data-text="${CSS.escape(current.text)}"]`);
      if (span) {
        span.textContent = current.text.slice(0, charIndex + 1);
      }

      charIndex++;

      if (charIndex >= current.text.length) {
        lineIndex++;
        charIndex = 0;
        setTimeout(typeNextChar, 80);
      } else {
        setTimeout(typeNextChar, Math.random() * 60 + 30);
      }
    }

    // Start typing after a short delay
    setTimeout(typeNextChar, 600);
  }

  // OS detection for download emphasis (Windows only for now)
  const os = navigator.platform.toLowerCase();
  const detectedOS = os.includes('win') ? 'win' : null;

  if (detectedOS) {
    const cards = document.querySelectorAll('.download-card');
    cards.forEach(card => {
      if (card.dataset.os === detectedOS && !card.classList.contains('download-card-soon')) {
        card.style.borderColor = 'var(--color-primary)';
        card.style.boxShadow = 'var(--shadow-glow)';
      }
    });
  }

  // Header shadow on scroll
  const header = document.querySelector('.site-header');
  let lastScrollY = 0;

  function updateHeader() {
    const scrollY = window.scrollY;
    if (scrollY > 10) {
      header.style.boxShadow = '0 1px 0 rgba(224, 235, 228, 0.8), 0 4px 20px rgba(15, 28, 23, 0.06)';
    } else {
      header.style.boxShadow = 'none';
    }
    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });
});
