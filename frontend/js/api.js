const API_BASE = '/api';
const API_TIMEOUT = 5000;
const MAX_RETRIES = 1;

async function apiRequest(endpoint, params = {}) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value);
        }
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      const response = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText || 'Server Error'}`);
      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error;
      if (error.name === 'AbortError') {
        lastError = 'Request timed out';
      } else if (!navigator.onLine) {
        lastError = 'No internet connection';
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
    }
  }
  console.error(`API Error [${endpoint}]:`, lastError);
  return null;
}

function fetchVideos(params = {}) {
  return apiRequest('/videos', params);
}

function fetchVideo(id) {
  return apiRequest(`/videos/${id}`);
}

function fetchCategories() {
  return apiRequest('/categories');
}

function fetchCategory(slug) {
  return apiRequest(`/categories/${slug}`);
}

function fetchChannels() {
  return apiRequest('/channels');
}

function fetchChannel(slug) {
  return apiRequest(`/channels/${slug}`);
}

function searchVideos(query, filters = {}) {
  return apiRequest('/videos', {
    search: query,
    platform: filters.platform,
    category: filters.category,
    channel: filters.channel,
    sort: filters.sort,
    limit: filters.limit || 24,
    page: filters.page || 1,
  });
}

function fetchSuggestions(query, limit = 8) {
  return apiRequest('/videos/suggestions', { q: query, limit });
}

async function apiMutate(method, endpoint, body) {
  try {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    const response = await fetch(url.toString(), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return data || { success: false, error: { message: `HTTP ${response.status}` } };
    }
    return data;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    return { success: false, error: { message: 'خطأ في الاتصال بالخادم' } };
  }
}

/* ===== Playlists ===== */
function fetchPlaylists() {
  return apiRequest('/playlists');
}

function fetchPlaylist(id) {
  return apiRequest(`/playlists/${id}`);
}

function createPlaylist(payload) {
  return apiMutate('POST', '/playlists', payload);
}

function updatePlaylist(id, payload) {
  return apiMutate('PUT', `/playlists/${id}`, payload);
}

function deletePlaylist(id) {
  return apiMutate('DELETE', `/playlists/${id}`);
}

function addVideoToPlaylist(playlistId, videoId) {
  return apiMutate('POST', `/playlists/${playlistId}/videos`, { video_id: videoId });
}

function removeVideoFromPlaylist(playlistId, videoId) {
  return apiMutate('DELETE', `/playlists/${playlistId}/videos/${videoId}`);
}
