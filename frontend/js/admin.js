const ADMIN_API = '/api';

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

function initAdmin() {
  setupTabs();
  loadStats();
  loadRecentVideos();
  loadFormOptions();
  setupAddForm();
  setupSearch();
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
    });
  });
}

function showToast(msg, type = 'success') {
  const el = document.getElementById(type === 'success' ? 'toastSuccess' : 'toastError');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

async function loadStats() {
  try {
    const res = await fetch(`${ADMIN_API}/videos/stats/overview`);
    const data = await res.json();
    if (data.success) {
      document.getElementById('statVideos').textContent = data.data.totalVideos;
      document.getElementById('statViews').textContent = data.data.totalViews.toLocaleString();
      document.getElementById('statCategories').textContent = data.data.totalCategories;
      document.getElementById('statChannels').textContent = data.data.totalChannels;
    }
  } catch (e) {
    console.error('Stats error:', e);
  }
}

async function loadRecentVideos() {
  try {
    const res = await fetch(`${ADMIN_API}/videos?limit=5`);
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      const html = data.data.map(v => `
        <div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-color);">
          <img src="${v.thumbnail_url || ''}" onerror="this.style.display='none'" style="width:80px;height:45px;object-fit:cover;border-radius:6px;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(v.title)}</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);">${v.platform || 'unknown'} · ${v.views || 0} مشاهدة</div>
          </div>
        </div>
      `).join('');
      document.getElementById('recentVideos').innerHTML = html;
    } else {
      document.getElementById('recentVideos').innerHTML = '<div class="empty-msg">لا توجد فيديوهات</div>';
    }
  } catch (e) {
    console.error('Recent videos error:', e);
  }
}

async function loadFormOptions() {
  try {
    const [catRes, chRes] = await Promise.all([
      fetch(`${ADMIN_API}/categories`),
      fetch(`${ADMIN_API}/channels`)
    ]);
    const catData = await catRes.json();
    const chData = await chRes.json();
    if (catData.success) {
      const sel = document.getElementById('videoCategory');
      catData.data.forEach(c => {
        sel.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
      });
    }
    if (chData.success) {
      const sel = document.getElementById('videoChannel');
      chData.data.forEach(ch => {
        sel.innerHTML += `<option value="${ch.id}">${escapeHtml(ch.name)}</option>`;
      });
    }
  } catch (e) {
    console.error('Options error:', e);
  }
}

function setupAddForm() {
  const urlInput = document.getElementById('videoUrl');
  const titleInput = document.getElementById('videoTitle');
  const descInput = document.getElementById('videoDesc');
  const previewEl = document.getElementById('videoPreview');

  // Auto-fetch video info when URL is pasted
  let fetchTimeout;
  urlInput.addEventListener('input', (e) => {
    clearTimeout(fetchTimeout);
    const url = e.target.value.trim();
    if (!url || url.length < 10) {
      if (previewEl) previewEl.innerHTML = '';
      return;
    }
    fetchTimeout = setTimeout(() => fetchVideoInfo(url), 500);
  });

  async function fetchVideoInfo(url) {
    if (previewEl) previewEl.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;">جاري جلب معلومات الفيديو...</div>';

    try {
      // Try YouTube oEmbed first
      const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
      if (ytMatch) {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytMatch[1]}&format=json`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.title && !titleInput.value) titleInput.value = data.title;
          if (data.thumbnail_url) {
            if (previewEl) {
              previewEl.innerHTML = `
                <div style="display:flex;gap:12px;margin-top:12px;padding:12px;background:var(--bg-main);border-radius:8px;">
                  <img src="${data.thumbnail_url}" style="width:160px;height:90px;object-fit:cover;border-radius:6px;">
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;">${escapeHtml(data.title)}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);">${escapeHtml(data.author_name || '')}</div>
                  </div>
                </div>`;
            }
            showToast('تم جلب معلومات الفيديو!');
            return;
          }
        }
      }

      // Try Vimeo oEmbed
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.title && !titleInput.value) titleInput.value = data.title;
          if (data.thumbnail_url) {
            if (previewEl) {
              previewEl.innerHTML = `
                <div style="display:flex;gap:12px;margin-top:12px;padding:12px;background:var(--bg-main);border-radius:8px;">
                  <img src="${data.thumbnail_url}" style="width:160px;height:90px;object-fit:cover;border-radius:6px;">
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;">${escapeHtml(data.title)}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);">${escapeHtml(data.author_name || '')}</div>
                  </div>
                </div>`;
            }
            showToast('تم جلب معلومات الفيديو!');
            return;
          }
        }
      }

      // Fallback: just extract ID and show thumbnail
      if (ytMatch) {
        const thumbUrl = `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        if (previewEl) {
          previewEl.innerHTML = `
            <div style="display:flex;gap:12px;margin-top:12px;padding:12px;background:var(--bg-main);border-radius:8px;">
              <img src="${thumbUrl}" style="width:160px;height:90px;object-fit:cover;border-radius:6px;">
              <div style="flex:1;">
                <div style="font-size:0.85rem;color:var(--text-secondary);">YouTube Video</div>
                <div style="font-size:0.78rem;color:var(--text-secondary);">ID: ${ytMatch[1]}</div>
              </div>
            </div>`;
        }
      } else {
        if (previewEl) previewEl.innerHTML = '';
      }

    } catch (err) {
      console.error('Fetch video info error:', err);
      if (previewEl) previewEl.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;">تعذر جلب المعلومات</div>';
    }
  }
    e.preventDefault();
    const btn = document.getElementById('btnAddVideo');
    btn.disabled = true;
    btn.textContent = 'جاري الإضافة...';

    const payload = {
      title: document.getElementById('videoTitle').value.trim(),
      video_url: document.getElementById('videoUrl').value.trim(),
      description: document.getElementById('videoDesc').value.trim(),
      category_id: document.getElementById('videoCategory').value || undefined,
      channel_id: document.getElementById('videoChannel').value || undefined,
      is_featured: document.getElementById('videoFeatured').checked,
    };

    if (!payload.category_id) delete payload.category_id;
    if (!payload.channel_id) delete payload.channel_id;

    try {
      const res = await fetch(`${ADMIN_API}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم إضافة الفيديو بنجاح!');
        document.getElementById('addVideoForm').reset();
        loadStats();
        loadRecentVideos();
      } else {
        showToast(data.error?.message || 'حدث خطأ', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'إضافة الفيديو';
  });
}

let allVideos = [];

async function loadManageVideos() {
  const container = document.getElementById('videosList');
  container.innerHTML = '<div class="empty-msg">جاري التحميل...</div>';
  try {
    const res = await fetch(`${ADMIN_API}/videos?limit=100`);
    const data = await res.json();
    if (data.success) {
      allVideos = data.data;
      renderVideosTable(allVideos);
    }
  } catch (e) {
    container.innerHTML = '<div class="empty-msg">خطأ في التحميل</div>';
  }
}

function renderVideosTable(videos) {
  const container = document.getElementById('videosList');
  if (videos.length === 0) {
    container.innerHTML = '<div class="empty-msg">لا توجد فيديوهات</div>';
    return;
  }
  const platformColors = {
    youtube: '#ff0000', facebook: '#1877f2', instagram: '#e1306c',
    tiktok: '#000', vimeo: '#1ab6eb', telegram: '#0088cc',
    google_drive: '#34a853', direct: '#808080', other: '#666',
  };
  const html = `
    <table class="videos-table">
      <thead>
        <tr><th>الصورة</th><th>العنوان</th><th>المنصة</th><th>المشاهدات</th><th>الحالة</th><th>إجراءات</th></tr>
      </thead>
      <tbody>
        ${videos.map(v => `
          <tr data-id="${v.id}">
            <td><img class="thumb" src="${v.thumbnail_url || ''}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 45%22><rect fill=%22%23333%22 width=%2280%22 height=%2245%22/></svg>'"></td>
            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;">${escapeHtml(v.title)}</td>
            <td><span class="platform-tag" style="background:${platformColors[v.platform] || '#666'}">${v.platform}</span></td>
            <td>${(v.views || 0).toLocaleString()}</td>
            <td><span class="status-badge ${v.is_active ? 'status-active' : 'status-inactive'}">${v.is_active ? 'نشط' : 'غير نشط'}</span></td>
            <td>
              <button class="btn-danger" onclick="deleteVideo(${v.id})">حذف</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  container.innerHTML = html;
}

function setupSearch() {
  document.getElementById('searchVideos').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return renderVideosTable(allVideos);
    const filtered = allVideos.filter(v =>
      v.title.toLowerCase().includes(q) || (v.platform || '').toLowerCase().includes(q)
    );
    renderVideosTable(filtered);
  });
}

async function deleteVideo(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
  try {
    const res = await fetch(`${ADMIN_API}/videos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('تم حذف الفيديو');
      allVideos = allVideos.filter(v => v.id !== id);
      renderVideosTable(allVideos);
      loadStats();
    } else {
      showToast(data.error?.message || 'حدث خطأ', 'error');
    }
  } catch (e) {
    showToast('خطأ في الحذف', 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
