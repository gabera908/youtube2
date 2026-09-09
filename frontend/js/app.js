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
  setupAutocomplete();
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
  } else if (path.includes('playlists.html')) {
    loadPlaylistsPage();
  } else if (path.includes('playlist.html')) {
    loadPlaylistPage();
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

  const platform = video.platform || detectPlatform(video.video_url || video.url);
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
          <button class="btn-action" onclick="openSaveToPlaylist(${video.id})">💾 حفظ</button>
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

/* ===== PLAYLISTS PAGES ===== */
async function loadPlaylistsPage() {
  const grid = document.getElementById('playlistsGrid');
  if (!grid) return;

  const result = await fetchPlaylists();
  if (!result || !result.success) {
    grid.innerHTML =
      '<div class="empty-state"><div class="icon">📚</div><p>تعذر تحميل قوائم التشغيل</p><button class="btn-retry" onclick="loadPlaylistsPage()">إعادة المحاولة</button></div>';
    return;
  }

  const playlists = result.data || [];
  if (playlists.length === 0) {
    grid.innerHTML =
      '<div class="empty-state"><div class="icon">📚</div><p>لا توجد قوائم تشغيل بعد — أنشئ أول قائمة من الأعلى</p></div>';
    return;
  }

  grid.innerHTML = playlists
    .map((pl) => {
      const cover = pl.cover_thumbnail
        ? `<img src="${pl.cover_thumbnail}" alt="" loading="lazy" onerror="this.remove()">`
        : '📚';
      const count = pl.video_count || 0;
      return `<div class="playlist-card" onclick="window.location.href='playlist.html?id=${pl.id}'">
      <div class="playlist-cover">${cover}<span class="playlist-count">🎬 ${count}</span></div>
      <div class="playlist-body">
        <div class="playlist-title">${escapeHtml(pl.name || 'بدون اسم')}</div>
        <div class="playlist-meta">${count} فيديو · ${timeAgo(pl.created_at)}</div>
      </div>
    </div>`;
    })
    .join('');
}

async function handleCreatePlaylist() {
  const nameInput = document.getElementById('playlistName');
  const descInput = document.getElementById('playlistDesc');
  const btn = document.getElementById('btnCreatePlaylist');
  const name = (nameInput.value || '').trim();
  if (!name) {
    showToast('أدخل اسم القائمة');
    nameInput.focus();
    return;
  }
  btn.disabled = true;
  btn.textContent = 'جاري الإنشاء...';
  const result = await createPlaylist({ name, description: (descInput.value || '').trim() });
  btn.disabled = false;
  btn.textContent = 'إنشاء القائمة';
  if (result && result.success) {
    showToast('تم إنشاء القائمة بنجاح');
    nameInput.value = '';
    descInput.value = '';
    loadPlaylistsPage();
  } else {
    showToast((result && result.error && result.error.message) || 'حدث خطأ', 'error');
  }
}

async function loadPlaylistPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    window.location.href = 'playlists.html';
    return;
  }

  const headerEl = document.getElementById('playlistHeader');
  const videosEl = document.getElementById('playlistVideos');
  if (videosEl)
    videosEl.innerHTML =
      '<div style="text-align:center;color:var(--text-secondary);padding:24px;">جاري التحميل...</div>';

  const result = await fetchPlaylist(id);
  if (!result || !result.success || !result.data) {
    if (headerEl) headerEl.innerHTML = '<h1>القائمة غير موجودة</h1>';
    if (videosEl) videosEl.innerHTML = '';
    return;
  }

  const pl = result.data;
  const videos = pl.videos || [];
  document.title = `${pl.name} - فيديو بلس`;

  if (headerEl) {
    const firstId = videos.length > 0 ? videos[0].id : null;
    headerEl.innerHTML = `
      <h1>📚 ${escapeHtml(pl.name || 'بدون اسم')}</h1>
      ${pl.description ? `<p>${escapeHtml(pl.description)}</p>` : ''}
      <div class="playlist-meta" style="font-size:.8rem;color:var(--text-secondary);margin-bottom:12px;">${videos.length} فيديو</div>
      <div class="playlist-actions">
        ${firstId ? `<a class="btn-play-all" href="watch.html?id=${firstId}&list=${pl.id}">▶ تشغيل الكل</a>` : ''}
        <button class="btn-danger-outline" onclick="handleDeletePlaylist(${pl.id})">🗑 حذف القائمة</button>
      </div>`;
  }

  if (!videosEl) return;
  if (videos.length === 0) {
    videosEl.innerHTML =
      '<div class="empty-state"><div class="icon">🎬</div><p>القائمة فارغة — أضف فيديوهات من زر الحفظ في صفحة المشاهدة</p></div>';
    return;
  }

  videosEl.innerHTML = videos
    .map((video) => {
      const thumbnail = getThumbnailUrl(video);
      const title = video.title || 'بدون عنوان';
      const channelName = video.channel_name || '';
      const views = formatViews(video.views || 0);
      return `<div class="playlist-item">
      <img src="${thumbnail}" alt="${escapeHtml(title)}" loading="lazy" onclick="window.location.href='watch.html?id=${video.id}&list=${pl.id}'" onerror="this.src='https://via.placeholder.com/160x90?text=Video'">
      <div class="playlist-item-info">
        <div class="playlist-item-title" onclick="window.location.href='watch.html?id=${video.id}&list=${pl.id}'">${escapeHtml(title)}</div>
        <div class="playlist-item-meta">${escapeHtml(channelName)} · ${views} مشاهدة</div>
      </div>
      <button class="btn-remove" onclick="handleRemoveFromPlaylist(${pl.id}, ${video.id})">إزالة</button>
    </div>`;
    })
    .join('');
}

async function handleRemoveFromPlaylist(playlistId, videoId) {
  if (!confirm('إزالة هذا الفيديو من القائمة؟')) return;
  const result = await removeVideoFromPlaylist(playlistId, videoId);
  if (result && result.success) {
    showToast('تمت الإزالة من القائمة');
    loadPlaylistPage();
  } else {
    showToast((result && result.error && result.error.message) || 'حدث خطأ', 'error');
  }
}

async function handleDeletePlaylist(playlistId) {
  if (!confirm('حذف هذه القائمة نهائياً؟')) return;
  const result = await deletePlaylist(playlistId);
  if (result && result.success) {
    showToast('تم حذف القائمة');
    window.location.href = 'playlists.html';
  } else {
    showToast((result && result.error && result.error.message) || 'حدث خطأ', 'error');
  }
}

/* ===== SAVE TO PLAYLIST MODAL ===== */
let saveToPlaylistVideoId = null;

async function openSaveToPlaylist(videoId) {
  saveToPlaylistVideoId = videoId;
  let modal = document.getElementById('savePlaylistModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'savePlaylistModal';
    modal.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:20px;width:100%;max-width:420px;max-height:80vh;overflow-y:auto;">
        <h3 style="font-weight:700;margin-bottom:12px;color:var(--text-primary);">💾 حفظ في قائمة تشغيل</h3>
        <div id="savePlaylistList" style="margin-bottom:12px;color:var(--text-secondary);font-size:.85rem;">جاري التحميل...</div>
        <div style="display:flex;gap:8px;">
          <input id="savePlaylistNewName" placeholder="قائمة جديدة..." maxlength="255" style="flex:1;background:var(--bg-main);border:1px solid var(--border-color);border-radius:8px;padding:8px 12px;color:var(--text-primary);font-size:.85rem;">
          <button onclick="handleQuickCreatePlaylist()" style="background:#ff0000;color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:.85rem;">إنشاء</button>
        </div>
        <button onclick="closeSaveToPlaylist()" style="margin-top:12px;width:100%;background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);border-radius:8px;padding:8px;cursor:pointer;">إغلاق</button>
      </div>`;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSaveToPlaylist();
    });
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  await refreshSaveToPlaylistList();
}

function closeSaveToPlaylist() {
  const modal = document.getElementById('savePlaylistModal');
  if (modal) modal.style.display = 'none';
  saveToPlaylistVideoId = null;
}

async function refreshSaveToPlaylistList() {
  const listEl = document.getElementById('savePlaylistList');
  if (!listEl) return;
  const result = await fetchPlaylists();
  const playlists = (result && result.success && result.data) || [];
  if (playlists.length === 0) {
    listEl.innerHTML = 'لا توجد قوائم بعد — أنشئ واحدة بالأسفل';
    return;
  }
  listEl.innerHTML = playlists
    .map(
      (pl) =>
        `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color);">
      <span style="color:var(--text-primary);font-size:.9rem;">📚 ${escapeHtml(pl.name || 'بدون اسم')} <span style="color:var(--text-secondary);font-size:.75rem;">(${pl.video_count || 0})</span></span>
      <button onclick="handleAddToPlaylist(${pl.id})" style="background:var(--bg-hover);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:.8rem;">حفظ</button>
    </div>`
    )
    .join('');
}

async function handleAddToPlaylist(playlistId) {
  if (!saveToPlaylistVideoId) return;
  const result = await addVideoToPlaylist(playlistId, saveToPlaylistVideoId);
  if (result && result.success) {
    showToast('تمت الإضافة إلى القائمة');
    closeSaveToPlaylist();
  } else {
    showToast((result && result.error && result.error.message) || 'حدث خطأ', 'error');
  }
}

async function handleQuickCreatePlaylist() {
  const input = document.getElementById('savePlaylistNewName');
  const name = (input.value || '').trim();
  if (!name) {
    showToast('أدخل اسم القائمة');
    return;
  }
  const result = await createPlaylist({ name });
  if (result && result.success) {
    input.value = '';
    await refreshSaveToPlaylistList();
    showToast('تم إنشاء القائمة');
  } else {
    showToast((result && result.error && result.error.message) || 'حدث خطأ', 'error');
  }
}

/* ===== SEARCH PAGE ===== */
function getSearchFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get('q') || '',
    platform: params.get('platform') || '',
    category: params.get('category') || '',
    sort: params.get('sort') || 'newest',
  };
}

async function loadSearchPage() {
  const filters = getSearchFiltersFromUrl();
  if (!filters.q) {
    window.location.href = '../index.html';
    return;
  }

  document.title = `نتائج البحث: ${filters.q} - فيديو بلس`;

  document.querySelectorAll('.search-input').forEach((el) => {
    el.value = filters.q;
  });

  const platformSel = document.getElementById('filterPlatform');
  const categorySel = document.getElementById('filterCategory');
  const sortSel = document.getElementById('filterSort');

  if (categorySel && categorySel.options.length <= 1) {
    const res = await fetchCategories();
    const list = (res && res.data) || (Array.isArray(res) ? res : []);
    list.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.slug;
      opt.textContent = c.name;
      categorySel.appendChild(opt);
    });
  }

  if (platformSel) platformSel.value = filters.platform;
  if (categorySel) categorySel.value = filters.category;
  if (sortSel) sortSel.value = filters.sort;

  [platformSel, categorySel, sortSel].forEach((sel) => {
    if (sel && !sel.dataset.bound) {
      sel.dataset.bound = '1';
      sel.addEventListener('change', applySearchFilters);
    }
  });

  await runSearchWithFilters();
}

function applySearchFilters() {
  const params = new URLSearchParams(window.location.search);
  const platform = document.getElementById('filterPlatform');
  const category = document.getElementById('filterCategory');
  const sort = document.getElementById('filterSort');
  if (platform) {
    if (platform.value) params.set('platform', platform.value);
    else params.delete('platform');
  }
  if (category) {
    if (category.value) params.set('category', category.value);
    else params.delete('category');
  }
  if (sort) params.set('sort', sort.value);
  window.location.search = params.toString();
}

async function runSearchWithFilters() {
  const filters = getSearchFiltersFromUrl();
  const infoEl = document.querySelector('.search-results-info');
  const grid = document.querySelector('.video-grid');

  if (grid) showSkeleton(grid, 8);

  const result = await searchVideos(filters.q, {
    platform: filters.platform,
    category: filters.category,
    sort: filters.sort,
    limit: 24,
  });
  hideSkeleton(grid);

  if (!result || !result.data) {
    if (grid)
      grid.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>لا توجد نتائج لـ "${escapeHtml(filters.q)}"</p><button class="btn-retry" onclick="loadSearchPage()">إعادة المحاولة</button></div>`;
    if (infoEl) infoEl.textContent = '';
    return;
  }

  const total = result.pagination ? result.pagination.total : result.data.length;
  if (infoEl) infoEl.textContent = `تم العثور على ${total} نتيجة لـ "${filters.q}"`;

  renderVideoGrid(grid, result.data);
}

/* ===== SEARCH AUTOCOMPLETE ===== */
function setupAutocomplete() {
  document.querySelectorAll('.search-input').forEach((input) => {
    if (input.dataset.autocompleteBound) return;
    input.dataset.autocompleteBound = '1';

    const form = input.closest('form');
    if (form && getComputedStyle(form).position === 'static') {
      form.style.position = 'relative';
    }

    const box = document.createElement('div');
    box.className = 'search-suggest';
    box.style.display = 'none';
    form ? form.appendChild(box) : input.parentNode.appendChild(box);

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      const q = input.value.trim();
      if (q.length < 2) {
        box.style.display = 'none';
        return;
      }
      debounce = setTimeout(async () => {
        const res = await fetchSuggestions(q, 8);
        const items = (res && res.success && res.data) || [];
        if (items.length === 0) {
          box.style.display = 'none';
          return;
        }
        const inPages = window.location.pathname.includes('/pages/');
        const prefix = inPages ? '' : 'pages/';
        box.innerHTML = items
          .map(
            (v) => `<div class="search-suggest-item" data-id="${v.id}">
            ${v.thumbnail_url ? `<img src="${v.thumbnail_url}" alt="" loading="lazy" onerror="this.remove()">` : '<span>🎬</span>'}
            <span class="search-suggest-title">${escapeHtml(v.title || 'بدون عنوان')}</span>
          </div>`
          )
          .join('');
        box.style.display = 'block';
        box.querySelectorAll('.search-suggest-item').forEach((el) => {
          el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            window.location.href = `${prefix}watch.html?id=${el.dataset.id}`;
          });
        });
      }, 300);
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        box.style.display = 'none';
      }, 200);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') box.style.display = 'none';
    });
  });
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
