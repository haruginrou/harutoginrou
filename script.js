const topbar = document.querySelector('.topbar');
const progressBar = document.querySelector('#progressBar');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
const liveSection = document.querySelector('#live-now');
const streamFrame = document.querySelector('#streamFrame');

const updateScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  topbar.classList.toggle('scrolled', y > 24);
  progressBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
};

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.reveal').forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  observer.observe(el);
});

window.addEventListener('scroll', updateScroll, { passive: true });
updateScroll();

const updateLiveStream = async () => {
  try {
    const response = await fetch('https://decapi.me/twitch/uptime/harutoginrou', { cache: 'no-store' });
    if (!response.ok) return;
    const status = (await response.text()).trim().toLowerCase();
    const isLive = status.length > 0 && !status.includes('offline');

    if (isLive) {
      if (!streamFrame.querySelector('iframe')) {
        const parent = location.hostname === '127.0.0.1' ? 'localhost' : location.hostname;
        const player = document.createElement('iframe');
        player.src = `https://player.twitch.tv/?channel=harutoginrou&parent=${encodeURIComponent(parent)}&autoplay=false`;
        player.allow = 'autoplay; fullscreen';
        player.allowFullscreen = true;
        player.title = 'Haruto Ginrou live on Twitch';
        streamFrame.appendChild(player);
      }
      liveSection.hidden = false;
    } else {
      liveSection.hidden = true;
      streamFrame.replaceChildren();
    }
  } catch {
    liveSection.hidden = true;
  }
};

updateLiveStream();
setInterval(updateLiveStream, 60_000);

const safeUrl = (value) => {
  try {
    const url = new URL(value, location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
  } catch {
    return '#';
  }
};

const setText = (key, value) => {
  const element = document.querySelector(`[data-content="${key}"]`);
  if (element && typeof value === 'string') element.textContent = value;
};

const setAboutHeading = (value) => {
  const element = document.querySelector('[data-content="aboutHeading"]');
  if (!element || typeof value !== 'string') return;
  const [first, ...rest] = value.split('\n');
  element.replaceChildren(document.createTextNode(first || ''));
  if (rest.length) {
    element.append(document.createElement('br'));
    const emphasis = document.createElement('em');
    emphasis.textContent = rest.join(' ');
    element.append(emphasis);
  }
};

const renderUpdates = (targetId, items, kind) => {
  const target = document.querySelector(`#${targetId}`);
  if (!target) return;
  target.replaceChildren();
  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'updates-empty';
    empty.textContent = kind === 'video' ? 'New videos are on the way.' : 'No new transmissions yet.';
    target.append(empty);
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement('a');
    card.className = 'update-card is-visible';
    card.href = safeUrl(item.url || '#');
    if (card.href !== '#') {
      card.target = '_blank';
      card.rel = 'noreferrer';
    }
    const number = document.createElement('span');
    number.className = 'update-index';
    number.textContent = String(index + 1).padStart(2, '0');
    const copy = document.createElement('div');
    if (kind === 'news' && item.date) {
      const time = document.createElement('time');
      time.textContent = item.date;
      copy.append(time);
    }
    const title = document.createElement('h3');
    title.textContent = item.title || (kind === 'video' ? 'New video' : 'Update');
    const description = document.createElement('p');
    description.textContent = item.description || item.excerpt || '';
    copy.append(title, description);
    const arrow = document.createElement('span');
    arrow.className = 'update-arrow';
    arrow.textContent = '↗';
    card.append(number, copy, arrow);
    target.append(card);
  });
};

const renderSchedule = (items) => {
  const target = document.querySelector('#scheduleList');
  if (!target || !Array.isArray(items)) return;
  target.replaceChildren();
  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = `schedule-row${index === 0 ? ' featured' : ''}`;
    const signal = document.createElement('span');
    signal.className = 'signal';
    if (index === 0) signal.append(document.createElement('i'));
    signal.append(document.createTextNode(item.label || 'EVENT'));
    const title = document.createElement('strong');
    title.textContent = item.title || 'STREAM';
    const timing = document.createElement('span');
    timing.textContent = item.timing || 'Announced soon';
    const link = document.createElement('a');
    link.href = safeUrl(item.url || 'https://x.com/HarutoGinrou');
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = `${item.linkLabel || 'See details'} ↗`;
    row.append(signal, title, timing, link);
    target.append(row);
  });
};

const renderSocials = (items) => {
  const target = document.querySelector('#socialGrid');
  if (!target || !Array.isArray(items)) return;
  target.replaceChildren();
  items.forEach((item, index) => {
    const card = document.createElement('a');
    card.className = 'social-card is-visible';
    card.href = safeUrl(item.url || '#');
    card.target = '_blank';
    card.rel = 'noreferrer';
    const number = document.createElement('span');
    number.className = 'social-num';
    number.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('span');
    name.className = 'social-name';
    name.textContent = item.label || 'LINK';
    const detail = document.createElement('small');
    detail.textContent = item.subtitle || '';
    name.append(detail);
    const arrow = document.createElement('span');
    arrow.className = 'social-arrow';
    arrow.textContent = '↗';
    card.append(number, name, arrow);
    target.append(card);
  });
};

const loadSiteContent = async () => {
  try {
    const response = await fetch('/api/content', { cache: 'no-store' });
    if (!response.ok) return;
    const content = await response.json();
    setText('heroEyebrow', content.general?.heroEyebrow);
    setText('heroTagline', content.general?.heroTagline);
    setAboutHeading(content.general?.aboutHeading);
    setText('aboutPrimary', content.general?.aboutPrimary);
    setText('aboutSecondary', content.general?.aboutSecondary);
    renderUpdates('videoList', content.videos, 'video');
    renderUpdates('newsList', content.news, 'news');
    renderSchedule(content.schedule);
    renderSocials(content.socials);
  } catch {
    // Static fallback content remains visible if the content service is unavailable.
  }
};

loadSiteContent();
