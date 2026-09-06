let currentPage = 1;
let isLoading = false;
let allLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupTheme();
  setupMenuToggle();
  setupSearch();
  setupKeyboardNavigation();
  setupLazyLoading();
  await loadSidebar();
  initPage();
}

/* ===== THEME TOGGLE ===== */
function setupTheme() {
  const toggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  if (toggle) toggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      toggle.textContent = next === 'dark' ? '🌙' : '☀️';
    });
  }
}

function setupMenuToggle() {
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.getElementById('appSidebar') || document.querySelector('.app-sidebar');
  const main = document.querySelector('.app-main');
  const overlay = document.getElementById('sidebarOverlay');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.contains('open');
      if (isOpen) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        if (main) main.classList.remove('expanded');
      } else {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        if (main) main.classList.add('expanded');
      }
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        if (main) main.classList.remove('expanded');
      });
    }
  }
}

function setupSearch() {
  document.querySelectorAll('.search-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('.search-input');
      const q = input.value.trim();
      if (q) {
        const isMainPage = !window.location.pathname.includes('/pages/');
        const prefix = isMainPage ? 'pages/' : '';
        window.location.href = `${prefix}search.html?q=${encodeURIComponent(q)}`;
      }
    });
  });
}

function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isInput =
      activeEl &&
      (activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable);
    if (isInput) return;

    const cards = Array.from(document.querySelectorAll('.video-card'));
    const focused = document.querySelector('.video-card:focus');
    const idx = focused ? cards.indexOf(focused) : -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next =
        e.key === 'ArrowRight' ? Math.max(0, idx - 1) : Math.min(cards.length - 1, idx + 1);
      if (cards[next]) {
        cards[next].setAttribute('tabindex', '-1');
        cards[next].focus();
        cards[next].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'Enter' && focused) {
      focused.click();
    } else if (e.key === 'Home') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

function setupLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  if (!('IntersectionObserver' in window)) {
    images.forEach((img) => {
      if (img.dataset.src) img.src = img.dataset.src;
    });
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: '100px' }
  );
  images.forEach((img) => observer.observe(img));
}

async function loadSidebar() {
  const sidebarNav = document.querySelector('.sidebar-categories');
  if (!sidebarNav) return;

  const categories = await fetchCategories();
  if (!categories || !Array.isArray(categories)) {
    sidebarNav.innerHTML =
      '<div style="padding:12px 24px;color:#aaa;font-size:0.85rem;">لا توجد فئات</div>';
    return;
  }

  sidebarNav.innerHTML = categories
    .map((cat) => {
      const slug = cat.slug || cat.id;
      const name = cat.name || cat.title || '';
      const icon = cat.icon || getCategoryIcon(name);
      return `<a href="category.html?slug=${encodeURIComponent(slug)}" class="sidebar-link">
      <span class="icon">${icon}</span>
      <span>${name}</span>
    </a>`;
    })
    .join('');

  highlightActiveSidebar();
}

function getCategoryIcon(name) {
  const icons = {
    أخبار: '📰',
    رياضة: '⚽',
    ترفيه: '🎬',
    تقنية: '💻',
    موسيقى: '🎵',
    تعليم: '📚',
    كوميديا: '😂',
    طبخ: '🍳',
    سفر: '✈️',
    صحة: '🏥',
    أعمال: '💼',
    سيارات: '🚗',
    ألعاب: '🎮',
    علوم: '🔬',
    تاريخ: '📜',
    فن: '🎨',
    دين: '🕌',
    快讯: '⚡',
  };
  return icons[name] || '▶️';
}

function highlightActiveSidebar() {
  const currentSlug = new URLSearchParams(window.location.search).get('slug');
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (currentSlug && href && href.includes(`slug=${currentSlug}`)) {
      link.classList.add('active');
    } else if (currentPath.endsWith('index.html') && href === 'index.html') {
      link.classList.add('active');
    }
  });
}

function initPage() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const path = window.location.pathname;
  const isIndex = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('frontend');

  if (isIndex) {
    loadHomePage();
  } else if (path.includes('watch.html')) {
    loadWatchPage();
  } else if (path.includes('category.html')) {
    loadCategoryPage();
  } else if (path.includes('channel.html')) {
    loadChannelPage();
  } else if (path.includes('search.html')) {
    loadSearchPage();
  }
}

/* ===== HOME PAGE ===== */
async function loadHomePage() {
  const grid = document.querySelector('.video-grid');
  if (!grid) return;
  showSkeleton(grid, 8);
  currentPage = 1;
  allLoaded = false;

  const result = await fetchVideos({ page: 1, limit: 12 });
  hideSkeleton(grid);

  if (!result || !result.data) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">▶️</div><p>لا توجد فيديوهات حالياً</p><button class="btn-retry" onclick="loadHomePage()">إعادة المحاولة</button></div>`;
    return;
  }

  renderVideoGrid(grid, result.data);
  setupLoadMore(result.pagination);
}

function renderVideoGrid(container, videos) {
  if (!videos || videos.length === 0) {
    if (!container.querySelector('.video-card')) {
      container.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>لا توجد نتائج</p></div>`;
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  videos.forEach((video) => {
    fragment.appendChild(createVideoCard(video));
  });
  container.appendChild(fragment);
}

function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.onclick = () => {
    const isMainPage = !window.location.pathname.includes('/pages/');
    const prefix = isMainPage ? 'pages/' : '';
    window.location.href = `${prefix}watch.html?id=${video.id}`;
  };

  const platform = video.platform || detectPlatform(video.url);
  const thumbnail = getThumbnailUrl(video);
  const title = video.title || 'بدون عنوان';
  const channelName =
    video.channel_name || video.channelName || (video.channel ? video.channel.name : '');
  const views = formatViews(video.views || video.view_count || 0);
  const published = timeAgo(video.created_at || video.published_at || video.createdAt);
  const duration = video.duration ? formatDuration(video.duration) : '';

  card.innerHTML = `
    <div class="thumbnail-wrapper">
      <img src="${thumbnail}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/480x270?text=Video'">
      <span class="platform-badge ${getPlatformBadgeClass(platform)}">${getPlatformLabel(platform)}</span>
      ${duration ? `<span class="thumbnail-duration">${duration}</span>` : ''}
    </div>
    <div class="video-info">
      <div class="video-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
      <div class="video-channel">${escapeHtml(channelName)}</div>
      <div class="video-meta">${views} مشاهدة · ${published}</div>
    </div>
  `;
  return card;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function setupLoadMore(pagination) {
  const wrapper = document.querySelector('.load-more-wrapper');
  if (!wrapper) return;

  if (!pagination || pagination.currentPage >= pagination.totalPages) {
    wrapper.innerHTML = '';
    return;
  }

  wrapper.innerHTML = `<button class="btn-load-more" onclick="loadMoreVideos()">تحميل المزيد</button>`;
}

async function loadMoreVideos() {
  if (isLoading || allLoaded) return;
  isLoading = true;
  currentPage++;

  const btn = document.querySelector('.btn-load-more');
  if (btn) btn.disabled = true;

  const result = await fetchVideos({ page: currentPage, limit: 12 });
  isLoading = false;

  if (btn) btn.disabled = false;

  if (!result || !result.data || result.data.length === 0) {
    allLoaded = true;
    if (btn) btn.textContent = 'لا المزيد من الفيديوهات';
    return;
  }

  const grid = document.querySelector('.video-grid');
  renderVideoGrid(grid, result.data);

  if (result.pagination && result.pagination.currentPage >= result.pagination.totalPages) {
    allLoaded = true;
    if (btn) btn.textContent = 'تم عرض جميع الفيديوهات';
  }
}

/* ===== WATCH PAGE ===== */
async function loadWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    window.location.href = '../index.html';
    return;
  }

  const playerWrapper = document.querySelector('.video-player-wrapper');
  const detailsSection = document.querySelector('.video-details');
  const relatedGrid = document.querySelector('.related-videos-grid');

  if (playerWrapper) playerWrapper.innerHTML = showLoadingSpinner();

  const result = await fetchVideo(id);
  const video = result && result.data ? result.data : result;
  if (!video || !video.id) {
    if (playerWrapper)
      playerWrapper.innerHTML = '<div class="empty-state"><p>الفيديو غير موجود</p></div>';
    return;
  }

  const title = video.title || 'بدون عنوان';
  const channelName =
    video.channel_name || video.channelName || (video.channel ? video.channel.name : '');
  const channelSlug = video.channel_slug || (video.channel ? video.channel.slug : '');
  const channelAvatar = video.channel_avatar || (video.channel ? video.channel.avatar : '');
  const views = formatViews(video.views || video.view_count || 0);
  const published = timeAgo(video.created_at || video.published_at || video.createdAt);
  const description = video.description || '';

  document.title = `${title} - فيديو بلس`;

  if (playerWrapper) {
    playerWrapper.innerHTML = getEmbedHtml(video);
  }

  if (detailsSection) {
    const currentUrl = window.location.href;
    detailsSection.innerHTML = `
      <h1 class="video-details-title">${escapeHtml(title)}</h1>
      <div class="video-details-meta">
        <span class="video-views">${views} مشاهدة · ${published}</span>
        <div class="video-actions">
          <button class="btn-action" onclick="shareVideo('${currentUrl}')">🔗 مشاركة</button>
        </div>
      </div>
      <div class="channel-info-section">
        ${channelAvatar ? `<img src="${escapeHtml(channelAvatar)}" alt="" class="channel-avatar">` : `<div class="channel-avatar" style="background:var(--bg-hover);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">👤</div>`}
        <div>
          <a href="channel.html?slug=${encodeURIComponent(channelSlug || channelName)}" class="channel-name" style="color:var(--text-primary);text-decoration:none;">${escapeHtml(channelName)}</a>
        </div>
      </div>
      ${description ? `<div class="video-description">${escapeHtml(description)}</div>` : ''}
    `;
  }

  if (relatedGrid && video.category) {
    const catSlug = video.category_slug || video.category;
    const related = await fetchCategory(catSlug);
    if (related && related.videos) {
      const filtered = related.videos.filter((v) => v.id !== parseInt(id));
      renderRelatedVideos(relatedGrid, filtered.slice(0, 8));
    }
  }
}

function renderRelatedVideos(container, videos) {
  if (!videos || videos.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;color:var(--text-secondary);padding:16px;">لا توجد فيديوهات ذات صلة</div>';
    return;
  }

  container.innerHTML = videos
    .map((video) => {
      const thumbnail = getThumbnailUrl(video);
      const title = video.title || 'بدون عنوان';
      const channelName =
        video.channel_name || video.channelName || (video.channel ? video.channel.name : '');
      const views = formatViews(video.views || video.view_count || 0);
      const published = timeAgo(video.created_at || video.published_at || video.createdAt);

      return `<a href="watch.html?id=${video.id}" class="sidebar-video-card" style="text-decoration:none;color:inherit;">
      <div class="sidebar-thumbnail">
        <img src="${thumbnail}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/168x94?text=Video'">
      </div>
      <div class="sidebar-video-info">
        <div class="sidebar-video-title">${escapeHtml(title)}</div>
        <div class="sidebar-video-channel">${escapeHtml(channelName)}</div>
        <div class="sidebar-video-meta">${views} مشاهدة · ${published}</div>
      </div>
    </a>`;
    })
    .join('');
}

/* ===== CATEGORY PAGE ===== */
async function loadCategoryPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    window.location.href = '../index.html';
    return;
  }

  const grid = document.querySelector('.video-grid');
  const headerEl = document.querySelector('.category-header');
  if (grid) showSkeleton(grid, 8);

  const result = await fetchCategory(slug);
  hideSkeleton(grid);

  if (!result) {
    if (grid)
      grid.innerHTML =
        '<div class="empty-state"><p>القسم غير موجود</p><button class="btn-retry" onclick="loadCategoryPage()">إعادة المحاولة</button></div>';
    return;
  }

  const categoryName = result.name || result.title || slug;
  document.title = `${categoryName} - فيديو بلس`;

  if (headerEl) {
    headerEl.innerHTML = `<h1>${escapeHtml(categoryName)}</h1>`;
  }

  const videos = result.videos || result.data || [];
  if (grid) renderVideoGrid(grid, videos);
}

/* ===== CHANNEL PAGE ===== */
async function loadChannelPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    window.location.href = '../index.html';
    return;
  }

  const headerEl = document.querySelector('.channel-header');
  const grid = document.querySelector('.video-grid');

  if (grid) showSkeleton(grid, 8);

  const result = await fetchChannel(slug);
  hideSkeleton(grid);

  if (!result) {
    if (grid)
      grid.innerHTML =
        '<div class="empty-state"><p>القناة غير موجودة</p><button class="btn-retry" onclick="loadChannelPage()">إعادة المحاولة</button></div>';
    return;
  }

  const channelName = result.name || result.title || slug;
  const description = result.description || '';
  const avatar = result.avatar || '';

  document.title = `${channelName} - فيديو بلس`;

  if (headerEl) {
    headerEl.innerHTML = `
      ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" class="channel-header-avatar">` : `<div class="channel-header-avatar" style="display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:var(--bg-hover);">👤</div>`}
      <div class="channel-header-info">
        <h1>${escapeHtml(channelName)}</h1>
        ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      </div>
    `;
  }

  const videos = result.videos || result.data || [];
  if (grid) renderVideoGrid(grid, videos);
}

/* ===== SEARCH PAGE ===== */
async function loadSearchPage() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  if (!query) {
    window.location.href = '../index.html';
    return;
  }

  document.title = `نتائج البحث: ${query} - فيديو بلس`;

  const inputEl = document.querySelector('.search-input');
  if (inputEl) inputEl.value = query;

  const infoEl = document.querySelector('.search-results-info');
  const grid = document.querySelector('.video-grid');

  if (grid) showSkeleton(grid, 8);

  const result = await searchVideos(query);
  hideSkeleton(grid);

  if (!result || !result.data) {
    if (grid)
      grid.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>لا توجد نتائج لـ "${escapeHtml(query)}"</p><button class="btn-retry" onclick="loadSearchPage()">إعادة المحاولة</button></div>`;
    if (infoEl) infoEl.textContent = '';
    return;
  }

  const total = result.pagination ? result.pagination.total : result.data.length;
  if (infoEl) infoEl.textContent = `تم العثور على ${total} نتيجة لـ "${query}"`;

  renderVideoGrid(grid, result.data);
}

/* ===== UTILITIES ===== */
function showSkeleton(container, count) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton skeleton-thumb"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text-sm"></div>
    `;
    container.appendChild(skeleton);
  }
}

function hideSkeleton(container) {
  container.innerHTML = '';
}

function showLoadingSpinner() {
  return '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--text-secondary);font-size:1rem;">جاري التحميل...</div>';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function shareVideo(url) {
  const shareUrl = url || window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('تم نسخ الرابط');
    });
  } else {
    const input = document.createElement('input');
    input.value = shareUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('تم نسخ الرابط');
  }
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}
