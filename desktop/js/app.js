let currentSection = 'dashboard';
let currentPage = 1;
let itemsPerPage = 10;
let searchQuery = '';
let editingId = null;
let editingType = null;
let categoriesCache = [];
let channelsCache = [];

function detectPlatform(url) {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('instagram.com')) return 'instagram';
  return 'other';
}

function getPlatformBadgeClass(platform) {
  const classes = {
    youtube: 'badge-youtube',
    tiktok: 'badge-tiktok',
    twitter: 'badge-twitter',
    instagram: 'badge-instagram',
    other: 'badge-default',
  };
  return classes[platform] || 'badge-default';
}

function getPlatformName(platform) {
  const names = {
    youtube: 'يوتيوب',
    tiktok: 'تيك توك',
    twitter: 'تويتر',
    instagram: 'إنستغرام',
    other: 'أخرى',
  };
  return names[platform] || 'غير معروف';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA');
}

function showToast(message, type) {
  if (!type) type = 'info';
  var container = document.getElementById('toastContainer');
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  var icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  toast.innerHTML =
    '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function () {
    toast.style.animation = 'toastSlide 0.3s ease reverse';
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 3000);
}

function showLoading() {
  document.getElementById('spinnerOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('spinnerOverlay').classList.remove('active');
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  editingId = null;
  editingType = null;
}

function navigateTo(section) {
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.classList.remove('active');
  });
  var el = document.querySelector('[data-section="' + section + '"]');
  if (el) el.classList.add('active');
  loadSection(section);
}

async function loadSection(section) {
  var content = document.getElementById('contentArea');
  var headerTitle = document.getElementById('headerTitle');
  switch (section) {
    case 'dashboard':
      headerTitle.textContent = 'لوحة التحكم';
      await loadDashboard(content);
      break;
    case 'videos':
      headerTitle.textContent = 'الفيديوهات';
      await loadVideos(content);
      break;
    case 'categories':
      headerTitle.textContent = 'التصنيفات';
      await loadCategories(content);
      break;
    case 'channels':
      headerTitle.textContent = 'القنوات';
      await loadChannels(content);
      break;
    case 'add-video':
      headerTitle.textContent = 'إضافة فيديو';
      await loadAddVideo(content);
      break;
  }
}

async function loadDashboard(container) {
  showLoading();
  var statsResult = await API.getAll('/videos/stats/overview');
  var videosResult = await API.getAll('/videos?limit=5&sort=created_at&order=desc');
  hideLoading();
  var stats = statsResult.success
    ? statsResult.data
    : { totalVideos: 0, totalViews: 0, totalCategories: 0, totalChannels: 0 };
  var recentVideos = videosResult.success
    ? videosResult.data.videos || videosResult.data || []
    : [];
  if (!Array.isArray(recentVideos)) recentVideos = [];

  var videosHtml = '';
  if (recentVideos.length > 0) {
    recentVideos.forEach(function (video) {
      videosHtml +=
        '<div class="recent-item">' +
        '<div class="thumbnail"><img src="' +
        (video.thumbnail || 'https://via.placeholder.com/80x45?text=No+Image') +
        '" alt="" onerror="this.src=\'https://via.placeholder.com/80x45?text=No+Image\'"></div>' +
        '<div class="info"><h4>' +
        escapeHtml(video.title) +
        '</h4>' +
        '<span><span class="badge ' +
        getPlatformBadgeClass(video.platform) +
        '">' +
        getPlatformName(video.platform) +
        '</span> &bull; ' +
        formatNumber(video.views || 0) +
        ' مشاهدة</span></div></div>';
    });
  } else {
    videosHtml =
      '<div class="empty-state"><i class="fas fa-video-slash"></i><h3>لا توجد فيديوهات</h3><p>ابدأ بإضافة فيديو جديد</p></div>';
  }

  container.innerHTML =
    '<div class="stats-grid">' +
    '<div class="stat-card"><div class="stat-icon videos"><i class="fas fa-video"></i></div><div class="stat-value">' +
    (stats.totalVideos || 0) +
    '</div><div class="stat-label">إجمالي الفيديوهات</div></div>' +
    '<div class="stat-card"><div class="stat-icon views"><i class="fas fa-eye"></i></div><div class="stat-value">' +
    formatNumber(stats.totalViews || 0) +
    '</div><div class="stat-label">إجمالي المشاهدات</div></div>' +
    '<div class="stat-card"><div class="stat-icon categories"><i class="fas fa-folder"></i></div><div class="stat-value">' +
    (stats.totalCategories || 0) +
    '</div><div class="stat-label">التصنيفات</div></div>' +
    '<div class="stat-card"><div class="stat-icon channels"><i class="fas fa-tv"></i></div><div class="stat-value">' +
    (stats.totalChannels || 0) +
    '</div><div class="stat-label">القنوات</div></div>' +
    '</div>' +
    '<div class="section-header"><h2>آخر الفيديوهات</h2>' +
    '<button class="btn btn-secondary btn-sm" onclick="navigateTo(\'videos\')"><i class="fas fa-arrow-left"></i> عرض الكل</button></div>' +
    '<div class="recent-list">' +
    videosHtml +
    '</div>' +
    '<div class="quick-actions">' +
    '<button class="btn btn-primary" onclick="navigateTo(\'add-video\')"><i class="fas fa-plus"></i> إضافة فيديو</button>' +
    '<button class="btn btn-secondary" onclick="loadSection(\'videos\')"><i class="fas fa-sync"></i> تحديث</button>' +
    '<button class="btn btn-secondary" onclick="navigateTo(\'categories\')"><i class="fas fa-folder"></i> إدارة التصنيفات</button>' +
    '<button class="btn btn-secondary" onclick="navigateTo(\'channels\')"><i class="fas fa-tv"></i> إدارة القنوات</button>' +
    '</div>';
}

async function loadVideos(container) {
  showLoading();
  var params = new URLSearchParams({ page: currentPage, limit: itemsPerPage, search: searchQuery });
  var result = await API.getAll('/videos?' + params.toString());
  hideLoading();
  var videos = result.success ? result.data.videos || result.data || [] : [];
  if (!Array.isArray(videos)) videos = [];
  var total = result.success ? result.data.total || videos.length : 0;
  var totalPages = Math.ceil(total / itemsPerPage);

  var rowsHtml = '';
  if (videos.length > 0) {
    videos.forEach(function (video) {
      var catName = (video.category && video.category.name) || video.categoryName || '-';
      var chName = (video.channel && video.channel.name) || video.channelName || '-';
      rowsHtml +=
        '<tr>' +
        '<td>' +
        video.id +
        '</td>' +
        '<td>' +
        escapeHtml(video.title) +
        '</td>' +
        '<td><span class="badge ' +
        getPlatformBadgeClass(video.platform) +
        '">' +
        getPlatformName(video.platform) +
        '</span></td>' +
        '<td>' +
        escapeHtml(catName) +
        '</td>' +
        '<td>' +
        escapeHtml(chName) +
        '</td>' +
        '<td>' +
        formatNumber(video.views || 0) +
        '</td>' +
        '<td>' +
        formatDate(video.created_at || video.createdAt) +
        '</td>' +
        '<td><div class="actions-group">' +
        '<button class="btn btn-secondary btn-icon" onclick="editVideo(' +
        video.id +
        ')" title="تعديل"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-danger btn-icon" onclick="confirmDelete(\'video\', ' +
        video.id +
        ", '" +
        escapeHtml(video.title).replace(/'/g, "\\'") +
        '\')" title="حذف"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    });
  } else {
    rowsHtml =
      '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-video-slash"></i><h3>لا توجد فيديوهات</h3></div></td></tr>';
  }

  var pagHtml = '';
  if (totalPages > 1) {
    pagHtml = '<div class="pagination">';
    pagHtml +=
      '<button ' +
      (currentPage === 1 ? 'disabled' : '') +
      ' onclick="changePage(' +
      (currentPage - 1) +
      ')"><i class="fas fa-chevron-right"></i></button>';
    pagHtml += generatePagination(currentPage, totalPages);
    pagHtml +=
      '<button ' +
      (currentPage === totalPages ? 'disabled' : '') +
      ' onclick="changePage(' +
      (currentPage + 1) +
      ')"><i class="fas fa-chevron-left"></i></button>';
    pagHtml += '</div>';
  }

  container.innerHTML =
    '<div class="table-container">' +
    '<div class="table-toolbar"><div class="search-box"><i class="fas fa-search"></i>' +
    '<input type="text" placeholder="بحث في الفيديوهات..." value="' +
    escapeHtml(searchQuery) +
    '" onkeyup="handleSearch(this.value)"></div>' +
    '<button class="btn btn-primary" onclick="navigateTo(\'add-video\')"><i class="fas fa-plus"></i> إضافة فيديو</button></div>' +
    '<table><thead><tr><th>ID</th><th>العنوان</th><th>المنصة</th><th>التصنيف</th><th>القناة</th><th>المشاهدات</th><th>التاريخ</th><th>الإجراءات</th></tr></thead>' +
    '<tbody>' +
    rowsHtml +
    '</tbody></table>' +
    pagHtml +
    '</div>';
}

async function loadCategories(container) {
  showLoading();
  var result = await API.getAll('/categories');
  hideLoading();
  var categories = result.success ? result.data.categories || result.data || [] : [];
  if (!Array.isArray(categories)) categories = [];
  categoriesCache = categories;

  var rowsHtml = '';
  if (categories.length > 0) {
    categories.forEach(function (cat) {
      rowsHtml +=
        '<tr><td>' +
        cat.id +
        '</td><td>' +
        escapeHtml(cat.name) +
        '</td><td>' +
        escapeHtml(cat.slug || '-') +
        '</td><td>' +
        (cat.videoCount || 0) +
        '</td>' +
        '<td><div class="actions-group">' +
        '<button class="btn btn-secondary btn-icon" onclick="editCategory(' +
        cat.id +
        ')" title="تعديل"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-danger btn-icon" onclick="confirmDelete(\'category\', ' +
        cat.id +
        ", '" +
        escapeHtml(cat.name).replace(/'/g, "\\'") +
        '\')" title="حذف"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    });
  } else {
    rowsHtml =
      '<tr><td colspan="5"><div class="empty-state"><i class="fas fa-folder-open"></i><h3>لا توجد تصنيفات</h3></div></td></tr>';
  }

  container.innerHTML =
    '<div class="section-header"><h2>التصنيفات</h2><button class="btn btn-primary" onclick="openCategoryModal()"><i class="fas fa-plus"></i> إضافة تصنيف</button></div>' +
    '<div class="table-container"><table><thead><tr><th>ID</th><th>الاسم</th><th>الرابط</th><th>عدد الفيديوهات</th><th>الإجراءات</th></tr></thead>' +
    '<tbody>' +
    rowsHtml +
    '</tbody></table></div>';
}

async function loadChannels(container) {
  showLoading();
  var result = await API.getAll('/channels');
  hideLoading();
  var channels = result.success ? result.data.channels || result.data || [] : [];
  if (!Array.isArray(channels)) channels = [];
  channelsCache = channels;

  var rowsHtml = '';
  if (channels.length > 0) {
    channels.forEach(function (ch) {
      rowsHtml +=
        '<tr><td>' +
        ch.id +
        '</td><td>' +
        escapeHtml(ch.name) +
        '</td><td>' +
        escapeHtml(ch.slug || '-') +
        '</td><td>' +
        (ch.videoCount || 0) +
        '</td>' +
        '<td><div class="actions-group">' +
        '<button class="btn btn-secondary btn-icon" onclick="editChannel(' +
        ch.id +
        ')" title="تعديل"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-danger btn-icon" onclick="confirmDelete(\'channel\', ' +
        ch.id +
        ", '" +
        escapeHtml(ch.name).replace(/'/g, "\\'") +
        '\')" title="حذف"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    });
  } else {
    rowsHtml =
      '<tr><td colspan="5"><div class="empty-state"><i class="fas fa-tv"></i><h3>لا توجد قنوات</h3></div></td></tr>';
  }

  container.innerHTML =
    '<div class="section-header"><h2>القنوات</h2><button class="btn btn-primary" onclick="openChannelModal()"><i class="fas fa-plus"></i> إضافة قناة</button></div>' +
    '<div class="table-container"><table><thead><tr><th>ID</th><th>الاسم</th><th>الرابط</th><th>عدد الفيديوهات</th><th>الإجراءات</th></tr></thead>' +
    '<tbody>' +
    rowsHtml +
    '</tbody></table></div>';
}

async function loadAddVideo(container, video) {
  showLoading();
  var results = await Promise.all([API.getAll('/categories'), API.getAll('/channels')]);
  hideLoading();
  var categories = results[0].success ? results[0].data.categories || results[0].data || [] : [];
  var channels = results[1].success ? results[1].data.channels || results[1].data || [] : [];
  if (!Array.isArray(categories)) categories = [];
  if (!Array.isArray(channels)) channels = [];

  var catOpts = '<option value="">اختر التصنيف</option>';
  categories.forEach(function (cat) {
    var sel = video && video.categoryId == cat.id ? ' selected' : '';
    catOpts += '<option value="' + cat.id + '"' + sel + '>' + escapeHtml(cat.name) + '</option>';
  });
  var chOpts = '<option value="">اختر القناة</option>';
  channels.forEach(function (ch) {
    var sel = video && video.channelId == ch.id ? ' selected' : '';
    chOpts += '<option value="' + ch.id + '"' + sel + '>' + escapeHtml(ch.name) + '</option>';
  });

  var vidId = video ? video.id : 'null';
  var titleVal = video ? escapeHtml(video.title) : '';
  var descVal = video ? escapeHtml(video.description || '') : '';
  var urlVal = video ? escapeHtml(video.url || '') : '';
  var thumbVal = video ? escapeHtml(video.thumbnail || '') : '';
  var platformVal = video ? video.platform || '' : '';
  var viewsVal = video ? video.views || 0 : 0;
  var thumbImg =
    video && video.thumbnail
      ? '<img src="' +
        video.thumbnail +
        '" alt="preview" onerror="this.parentElement.innerHTML=\'\'">'
      : '';
  var formTitle = video ? 'تعديل الفيديو' : 'إضافة فيديو جديد';
  var btnLabel = video ? 'حفظ التعديلات' : 'إضافة الفيديو';

  container.innerHTML =
    '<div class="table-container" style="max-width:800px"><div style="padding:20px">' +
    '<h2 style="margin-bottom:24px">' +
    formTitle +
    '</h2>' +
    '<form id="videoForm" onsubmit="saveVideo(event,' +
    vidId +
    ')">' +
    '<div class="form-group"><label>عنوان الفيديو *</label><input type="text" class="form-control" name="title" required value="' +
    titleVal +
    '"></div>' +
    '<div class="form-group"><label>وصف الفيديو</label><textarea class="form-control" name="description" rows="3">' +
    descVal +
    '</textarea></div>' +
    '<div class="form-group"><label>رابط الفيديو *</label><input type="url" class="form-control" name="url" required value="' +
    urlVal +
    '" onchange="handleVideoUrlChange(this.value)" placeholder="https://www.youtube.com/watch?v=..."><div id="platformBadge" style="margin-top:8px"></div></div>' +
    '<div class="form-group"><label>رابط الصورة المصغرة</label><input type="url" class="form-control" name="thumbnail" value="' +
    thumbVal +
    '" onchange="handleThumbnailChange(this.value)" placeholder="https://example.com/thumb.jpg"><div class="thumbnail-preview" id="thumbnailPreview">' +
    thumbImg +
    '</div></div>' +
    '<div class="form-row">' +
    '<div class="form-group"><label>التصنيف *</label><select class="form-control" name="categoryId" required>' +
    catOpts +
    '</select></div>' +
    '<div class="form-group"><label>القناة *</label><select class="form-control" name="channelId" required>' +
    chOpts +
    '</select></div></div>' +
    '<div class="form-row">' +
    '<div class="form-group"><label>المنصة</label><input type="text" class="form-control" name="platform" id="platformInput" value="' +
    platformVal +
    '" readonly></div>' +
    '<div class="form-group"><label>المشاهدات</label><input type="number" class="form-control" name="views" value="' +
    viewsVal +
    '"></div></div>' +
    '<div style="display:flex;gap:12px;margin-top:24px">' +
    '<button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ' +
    btnLabel +
    '</button>' +
    '<button type="button" class="btn btn-secondary" onclick="navigateTo(\'videos\')"><i class="fas fa-times"></i> إلغاء</button></div>' +
    '</form></div></div>';

  if (video && video.url) handleVideoUrlChange(video.url);
}

function handleVideoUrlChange(url) {
  var platform = detectPlatform(url);
  var badge = document.getElementById('platformBadge');
  var input = document.getElementById('platformInput');
  if (platform) {
    badge.innerHTML =
      '<span class="platform-badge"><span class="badge ' +
      getPlatformBadgeClass(platform) +
      '">' +
      getPlatformName(platform) +
      '</span> تم التعرف على المنصة</span>';
    if (input) input.value = platform;
  } else {
    badge.innerHTML = '';
    if (input) input.value = '';
  }
}

function handleThumbnailChange(url) {
  var preview = document.getElementById('thumbnailPreview');
  if (url) {
    preview.innerHTML =
      '<img src="' +
      url +
      '" alt="preview" onerror="this.parentElement.innerHTML=\'<p style=color:var(--error)>فشل تحميل الصورة</p>\'">';
  } else {
    preview.innerHTML = '';
  }
}

async function saveVideo(event, id) {
  event.preventDefault();
  var form = event.target;
  var formData = new FormData(form);
  var data = {};
  formData.forEach(function (val, key) {
    data[key] = val;
  });
  showLoading();
  var result;
  if (id) {
    result = await API.update('/videos', id, data);
  } else {
    result = await API.create('/videos', data);
  }
  hideLoading();
  if (result.success) {
    showToast(id ? 'تم تحديث الفيديو بنجاح' : 'تم إضافة الفيديو بنجاح', 'success');
    navigateTo('videos');
  } else {
    showToast(result.message || 'حدث خطأ أثناء الحفظ', 'error');
  }
}

async function editVideo(id) {
  showLoading();
  var result = await API.getOne('/videos', id);
  hideLoading();
  if (result.success) {
    var content = document.getElementById('contentArea');
    var headerTitle = document.getElementById('headerTitle');
    headerTitle.textContent = 'تعديل الفيديو';
    await loadAddVideo(content, result.data);
  } else {
    showToast('فشل تحميل بيانات الفيديو', 'error');
  }
}

function handleSearch(value) {
  searchQuery = value;
  currentPage = 1;
  if (currentSection === 'videos') {
    loadVideos(document.getElementById('contentArea'));
  }
}

function changePage(page) {
  currentPage = page;
  loadVideos(document.getElementById('contentArea'));
}

function generatePagination(current, total) {
  var html = '';
  var start = Math.max(1, current - 2);
  var end = Math.min(total, current + 2);
  for (var i = start; i <= end; i++) {
    html +=
      '<button class="' +
      (i === current ? 'active' : '') +
      '" onclick="changePage(' +
      i +
      ')">' +
      i +
      '</button>';
  }
  return html;
}

function confirmDelete(type, id, name) {
  deleteTarget = { type: type, id: id };
  var msg = document.getElementById('confirmMessage');
  if (type === 'video') msg.textContent = 'هل أنت متأكد من حذف الفيديو "' + name + '"؟';
  else if (type === 'category') msg.textContent = 'هل أنت متأكد من حذف التصنيف "' + name + '"؟';
  else if (type === 'channel') msg.textContent = 'هل أنت متأكد من حذف القناة "' + name + '"؟';
  openModal('confirmModal');
}

var deleteTarget = null;

async function executeDelete() {
  if (!deleteTarget) return;
  closeModal('confirmModal');
  showLoading();
  var endpoint = '/' + deleteTarget.type + 's';
  if (deleteTarget.type === 'category') endpoint = '/categories';
  else if (deleteTarget.type === 'channel') endpoint = '/channels';
  else if (deleteTarget.type === 'video') endpoint = '/videos';
  var result = await API.remove(endpoint, deleteTarget.id);
  hideLoading();
  if (result.success) {
    showToast('تم الحذف بنجاح', 'success');
    loadSection(currentSection);
  } else {
    showToast(result.message || 'حدث خطأ أثناء الحذف', 'error');
  }
  deleteTarget = null;
}

function openCategoryModal(cat) {
  var modal = document.getElementById('categoryModal');
  var title = document.getElementById('categoryModalTitle');
  var form = document.getElementById('categoryForm');
  form.reset();
  if (cat) {
    title.textContent = 'تعديل التصنيف';
    form.elements['id'].value = cat.id;
    form.elements['name'].value = cat.name;
    form.elements['slug'].value = cat.slug || '';
  } else {
    title.textContent = 'إضافة تصنيف جديد';
    form.elements['id'].value = '';
  }
  openModal('categoryModal');
}

async function editCategory(id) {
  showLoading();
  var result = await API.getOne('/categories', id);
  hideLoading();
  if (result.success) {
    openCategoryModal(result.data);
  } else {
    showToast('فشل تحميل بيانات التصنيف', 'error');
  }
}

async function saveCategory(event) {
  event.preventDefault();
  var form = event.target;
  var id = form.elements['id'].value;
  var data = { name: form.elements['name'].value, slug: form.elements['slug'].value };
  showLoading();
  var result;
  if (id) {
    result = await API.update('/categories', id, data);
  } else {
    result = await API.create('/categories', data);
  }
  hideLoading();
  if (result.success) {
    closeModal('categoryModal');
    showToast(id ? 'تم تحديث التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح', 'success');
    loadSection('categories');
  } else {
    showToast(result.message || 'حدث خطأ أثناء الحفظ', 'error');
  }
}

function openChannelModal(ch) {
  var title = document.getElementById('channelModalTitle');
  var form = document.getElementById('channelForm');
  form.reset();
  if (ch) {
    title.textContent = 'تعديل القناة';
    form.elements['id'].value = ch.id;
    form.elements['name'].value = ch.name;
    form.elements['slug'].value = ch.slug || '';
  } else {
    title.textContent = 'إضافة قناة جديدة';
    form.elements['id'].value = '';
  }
  openModal('channelModal');
}

async function editChannel(id) {
  showLoading();
  var result = await API.getOne('/channels', id);
  hideLoading();
  if (result.success) {
    openChannelModal(result.data);
  } else {
    showToast('فشل تحميل بيانات القناة', 'error');
  }
}

async function saveChannel(event) {
  event.preventDefault();
  var form = event.target;
  var id = form.elements['id'].value;
  var data = { name: form.elements['name'].value, slug: form.elements['slug'].value };
  showLoading();
  var result;
  if (id) {
    result = await API.update('/channels', id, data);
  } else {
    result = await API.create('/channels', data);
  }
  hideLoading();
  if (result.success) {
    closeModal('channelModal');
    showToast(id ? 'تم تحديث القناة بنجاح' : 'تم إضافة القناة بنجاح', 'success');
    loadSection('channels');
  } else {
    showToast(result.message || 'حدث خطأ أثناء الحفظ', 'error');
  }
}

async function checkConnection() {
  var dot = document.getElementById('statusDot');
  var text = document.getElementById('statusText');
  try {
    var result = await API.getAll('/videos?limit=1');
    if (result.success) {
      dot.className = 'status-dot';
      text.textContent = 'متصل بالخادم';
    } else {
      dot.className = 'status-dot disconnected';
      text.textContent = 'غير متصل بالخادم';
    }
  } catch (e) {
    dot.className = 'status-dot disconnected';
    text.textContent = 'غير متصل بالخادم';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  loadSection('dashboard');
  checkConnection();
  setInterval(checkConnection, 30000);

  window.electronAPI.onMenuAction('menu-add-video', function () {
    navigateTo('add-video');
  });
  window.electronAPI.onMenuAction('menu-refresh', function () {
    loadSection(currentSection);
  });
});
