const ADMIN_API = '/api';

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

function initAdmin() {
  setupTheme();
  setupTabs();
  loadStats();
  loadRecentVideos();
  loadFormOptions();
  setupAddForm();
  setupSearch();
  setupPlaylistForm();
}

function setupTheme() {
  const toggle = document.getElementById('themeToggle');
  const html = document.documentElement;
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

function setupTabs() {
  document.querySelectorAll('.admin-sidebar .sidebar-link[data-tab]').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.admin-sidebar .sidebar-link[data-tab]').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const tab = link.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
      if (tab === 'manage-videos') loadManageVideos();
      if (tab === 'playlists') loadAdminPlaylists();
    });
  });
}

function showToast(msg, type) {
  const el = document.getElementById(type === 'error' ? 'toastError' : 'toastSuccess');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===== Stats ===== */
async function loadStats() {
  try {
    const res = await fetch(ADMIN_API + '/videos/stats/overview');
    const data = await res.json();
    if (data.success) {
      document.getElementById('statVideos').textContent = data.data.totalVideos;
      document.getElementById('statViews').textContent = Number(data.data.totalViews).toLocaleString();
      document.getElementById('statCategories').textContent = data.data.totalCategories;
      document.getElementById('statChannels').textContent = data.data.totalChannels;
    }
  } catch (e) {
    console.error('Stats error:', e);
  }
}

/* ===== Recent Videos ===== */
async function loadRecentVideos() {
  try {
    const res = await fetch(ADMIN_API + '/videos?limit=5');
    const data = await res.json();
    const el = document.getElementById('recentVideos');
    if (data.success && data.data.length > 0) {
      el.innerHTML = data.data.map(v => '<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);">' +
        '<img src="' + (v.thumbnail_url || '') + '" onerror="this.style.display=\'none\'" style="width:80px;height:45px;object-fit:cover;border-radius:6px;">' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:600;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(v.title) + '</div>' +
        '<div style="font-size:0.78rem;color:var(--text-secondary);">' + (v.platform || 'unknown') + ' · ' + (v.views || 0) + ' مشاهدة</div>' +
        '</div></div>').join('');
    } else {
      el.innerHTML = '<div class="empty-msg">لا توجد فيديوهات</div>';
    }
  } catch (e) {
    console.error('Recent videos error:', e);
  }
}

/* ===== Form Options (Categories + Channels) ===== */
async function loadFormOptions() {
  try {
    var catRes = await fetch(ADMIN_API + '/categories');
    var catData = await catRes.json();
    if (catData.success) {
      var sel = document.getElementById('videoCategory');
      catData.data.forEach(function(c) {
        sel.innerHTML += '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>';
      });
    }
  } catch (e) {
    console.error('Categories error:', e);
  }

  try {
    var chRes = await fetch(ADMIN_API + '/channels');
    var chData = await chRes.json();
    if (chData.success) {
      var sel2 = document.getElementById('videoChannel');
      chData.data.forEach(function(ch) {
        sel2.innerHTML += '<option value="' + ch.id + '">' + escapeHtml(ch.name) + '</option>';
      });
    }
  } catch (e) {
    console.error('Channels error:', e);
  }
}

/* ===== Add Video Form ===== */
function setupAddForm() {
  var form = document.getElementById('addVideoForm');
  var urlInput = document.getElementById('videoUrl');
  var titleInput = document.getElementById('videoTitle');
  var previewEl = document.getElementById('videoPreview');
  var fetchTimeout;

  urlInput.addEventListener('input', function() {
    clearTimeout(fetchTimeout);
    var url = urlInput.value.trim();
    if (!url || url.length < 10) {
      if (previewEl) previewEl.innerHTML = '';
      return;
    }
    fetchTimeout = setTimeout(function() { fetchVideoInfo(url); }, 600);
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = document.getElementById('btnAddVideo');
    btn.disabled = true;
    btn.textContent = 'جاري الإضافة...';

    var payload = {
      title: document.getElementById('videoTitle').value.trim(),
      video_url: urlInput.value.trim(),
      description: document.getElementById('videoDesc').value.trim()
    };

    if (!payload.video_url) {
      showToast('أدخل رابط الفيديو', 'error');
      btn.disabled = false;
      btn.textContent = 'إضافة الفيديو';
      return;
    }
    if (!payload.title) {
      showToast('أدخل عنوان الفيديو (روابط Drive لا تجلب العنوان تلقائياً)', 'error');
      document.getElementById('videoTitle').focus();
      btn.disabled = false;
      btn.textContent = 'إضافة الفيديو';
      return;
    }
    var catVal = document.getElementById('videoCategory').value;
    var chVal = document.getElementById('videoChannel').value;
    if (catVal) payload.category_id = parseInt(catVal);
    if (chVal) payload.channel_id = parseInt(chVal);
    if (document.getElementById('videoFeatured').checked) payload.is_featured = true;

    try {
      var res = await fetch(ADMIN_API + '/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = await res.json();
      if (data.success) {
        showToast('تم إضافة الفيديو بنجاح!');
        form.reset();
        if (previewEl) previewEl.innerHTML = '';
        loadStats();
        loadRecentVideos();
      } else {
        showToast(data.error ? data.error.message : 'حدث خطأ', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'إضافة الفيديو';
  });
}

async function fetchVideoInfo(url) {
  var previewEl = document.getElementById('videoPreview');
  var titleInput = document.getElementById('videoTitle');
  if (previewEl) previewEl.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;">جاري جلب معلومات الفيديو...</div>';

  try {
    var ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    if (ytMatch) {
      var oembedUrl = 'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + ytMatch[1] + '&format=json';
      var res = await fetch(oembedUrl);
      if (res.ok) {
        var data = await res.json();
        if (data.title && !titleInput.value) titleInput.value = data.title;
        if (data.thumbnail_url && previewEl) {
          previewEl.innerHTML = '<div style="display:flex;gap:12px;margin-top:12px;padding:12px;background:var(--bg-main);border-radius:8px;">' +
            '<img src="' + data.thumbnail_url + '" style="width:160px;height:90px;object-fit:cover;border-radius:6px;">' +
            '<div style="flex:1;"><div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;">' + escapeHtml(data.title) + '</div>' +
            '<div style="font-size:0.78rem;color:var(--text-secondary);">' + escapeHtml(data.author_name || '') + '</div></div></div>';
          showToast('تم جلب معلومات الفيديو!');
          return;
        }
      }
    }
    if (ytMatch && previewEl) {
      var thumbUrl = 'https://i.ytimg.com/vi/' + ytMatch[1] + '/hqdefault.jpg';
      previewEl.innerHTML = '<div style="display:flex;gap:12px;margin-top:12px;padding:12px;background:var(--bg-main);border-radius:8px;">' +
        '<img src="' + thumbUrl + '" style="width:160px;height:90px;object-fit:cover;border-radius:6px;">' +
        '<div style="flex:1;"><div style="font-size:0.85rem;color:var(--text-secondary);">YouTube Video</div></div></div>';
    } else if (url.indexOf('drive.google.com') !== -1) {
      var driveIdMatch = url.match(/\/d\/([\w-]+)/);
      var openIdMatch = url.match(/[?&]id=([\w-]+)/);
      var gFileId = driveIdMatch ? driveIdMatch[1] : (openIdMatch ? openIdMatch[1] : '');
      if (previewEl) {
        previewEl.innerHTML = '<div style="display:flex;gap:12px;margin-top:12px;padding:12px;background:var(--bg-main);border-radius:8px;">' +
          '<div style="width:160px;height:90px;background:#34a853;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem;">📁</div>' +
          '<div style="flex:1;"><div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;">Google Drive Video</div>' +
          '<div style="font-size:0.78rem;color:var(--text-secondary);">' + escapeHtml(gFileId) + '</div></div></div>';
      }
      showToast('تم التعرف على رابط Google Drive!');
    } else if (previewEl) {
      previewEl.innerHTML = '';
    }
  } catch (err) {
    console.error('Fetch video info error:', err);
    if (previewEl) previewEl.innerHTML = '';
  }
}

/* ===== Admin Playlists ===== */
function setupPlaylistForm() {
  var form = document.getElementById('addPlaylistForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = document.getElementById('btnAddPlaylist');
    var name = document.getElementById('playlistName').value.trim();
    if (!name) {
      showToast('أدخل اسم القائمة', 'error');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'جاري الإنشاء...';
    var result = await createPlaylist({
      name: name,
      description: document.getElementById('playlistDesc').value.trim()
    });
    btn.disabled = false;
    btn.textContent = 'إنشاء القائمة';
    if (result && result.success) {
      showToast('تم إنشاء القائمة بنجاح!');
      form.reset();
      loadAdminPlaylists();
    } else {
      showToast((result && result.error && result.error.message) || 'حدث خطأ', 'error');
    }
  });
}

async function loadAdminPlaylists() {
  var container = document.getElementById('playlistsList');
  if (!container) return;
  container.innerHTML = '<div class="empty-msg">جاري التحميل...</div>';
  var result = await fetchPlaylists();
  var playlists = (result && result.success && result.data) || [];
  if (playlists.length === 0) {
    container.innerHTML = '<div class="empty-msg">لا توجد قوائم تشغيل بعد</div>';
    return;
  }
  container.innerHTML = `
    <table class="videos-table">
      <thead>
        <tr><th>الغلاف</th><th>الاسم</th><th>الفيديوهات</th><th>إجراءات</th></tr>
      </thead>
      <tbody>
        ${playlists.map(function(pl) {
          return `<tr data-id="${pl.id}">
            <td>${pl.cover_thumbnail ? `<img class="thumb" src="${pl.cover_thumbnail}" onerror="this.style.display='none'">` : '📚'}</td>
            <td style="font-weight:600;">${escapeHtml(pl.name || 'بدون اسم')}</td>
            <td>${pl.video_count || 0}</td>
            <td>
              <a href="playlist.html?id=${pl.id}" style="margin-left:8px;">عرض</a>
              <button class="btn-danger" onclick="handleAdminDeletePlaylist(${pl.id})">حذف</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

async function handleAdminDeletePlaylist(id) {
  if (!confirm('حذف هذه القائمة نهائياً؟')) return;
  var result = await deletePlaylist(id);
  if (result && result.success) {
    showToast('تم حذف القائمة');
    loadAdminPlaylists();
  } else {
    showToast((result && result.error && result.error.message) || 'حدث خطأ', 'error');
  }
}

/* ===== Manage Videos ===== */
var allVideos = [];

async function loadManageVideos() {
  var container = document.getElementById('videosList');
  container.innerHTML = '<div class="empty-msg">جاري التحميل...</div>';
  try {
    var res = await fetch(ADMIN_API + '/videos?limit=100');
    var data = await res.json();
    if (data.success) {
      allVideos = data.data;
      renderVideosTable(allVideos);
    }
  } catch (e) {
    container.innerHTML = '<div class="empty-msg">خطأ في التحميل</div>';
  }
}

function renderVideosTable(videos) {
  var container = document.getElementById('videosList');
  if (videos.length === 0) {
    container.innerHTML = '<div class="empty-msg">لا توجد فيديوهات</div>';
    return;
  }
  var colors = { youtube: '#ff0000', facebook: '#1877f2', instagram: '#e1306c', tiktok: '#000', vimeo: '#1ab6eb', telegram: '#0088cc', google_drive: '#34a853', direct: '#808080', other: '#666' };
  var rows = videos.map(function(v) {
    return '<tr data-id="' + v.id + '">' +
      '<td><img class="thumb" src="' + (v.thumbnail_url || '') + '" onerror="this.style.display=\'none\'"></td>' +
      '<td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;">' + escapeHtml(v.title) + '</td>' +
      '<td><span class="platform-tag" style="background:' + (colors[v.platform] || '#666') + '">' + v.platform + '</span></td>' +
      '<td>' + (v.views || 0).toLocaleString() + '</td>' +
      '<td><span class="status-badge ' + (v.is_active ? 'status-active' : 'status-inactive') + '">' + (v.is_active ? 'نشط' : 'غير نشط') + '</span></td>' +
      '<td><button class="btn-danger" onclick="deleteVideo(' + v.id + ')">حذف</button></td></tr>';
  }).join('');
  container.innerHTML = '<table class="videos-table"><thead><tr><th>الصورة</th><th>العنوان</th><th>المنصة</th><th>المشاهدات</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function setupSearch() {
  var input = document.getElementById('searchVideos');
  if (!input) return;
  input.addEventListener('input', function() {
    var q = input.value.trim().toLowerCase();
    if (!q) return renderVideosTable(allVideos);
    var filtered = allVideos.filter(function(v) {
      return v.title.toLowerCase().includes(q) || (v.platform || '').toLowerCase().includes(q);
    });
    renderVideosTable(filtered);
  });
}

async function deleteVideo(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
  try {
    var res = await fetch(ADMIN_API + '/videos/' + id, { method: 'DELETE' });
    var data = await res.json();
    if (data.success) {
      showToast('تم حذف الفيديو');
      allVideos = allVideos.filter(function(v) { return v.id !== id; });
      renderVideosTable(allVideos);
      loadStats();
    } else {
      showToast(data.error ? data.error.message : 'حدث خطأ', 'error');
    }
  } catch (e) {
    showToast('خطأ في الحذف', 'error');
  }
}
