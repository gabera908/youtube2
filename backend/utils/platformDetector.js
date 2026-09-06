const fetch = require('node-fetch');

function detectPlatform(url) {
  if (!url || typeof url !== 'string') return 'other';
  const lower = url.toLowerCase();

  if (/youtube\.com\/(watch|shorts|embed|live)/.test(lower) || /youtu\.be\//.test(lower))
    return 'youtube';
  if (/facebook\.com\/(watch|reel|video)/.test(lower) || /fb\.watch/.test(lower)) return 'facebook';
  if (/instagram\.com\/(reel|p|tv)/.test(lower)) return 'instagram';
  if (/tiktok\.com/.test(lower)) return 'tiktok';
  if (/vimeo\.com/.test(lower)) return 'vimeo';
  if (/t\.me\//.test(lower) || /telegram\.me\//.test(lower) || /telegram\.dog\//.test(lower))
    return 'telegram';
  if (/drive\.google\.com/.test(lower)) return 'google_drive';
  if (/dailymotion\.com|dai\.ly/.test(lower)) return 'dailymotion';
  if (/twitch\.tv/.test(lower)) return 'twitch';
  if (/streamable\.com/.test(lower)) return 'streamable';
  if (/v\.redd\.it|reddit\.com/.test(lower)) return 'reddit';
  if (/\.(mp4|webm|ogg|mkv)(\?|$)/i.test(lower)) return 'direct';
  return 'other';
}

function getEmbedUrl(url, platform) {
  if (!url) return null;

  switch (platform) {
    case 'youtube': {
      const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/
      );
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
      return url;
    }
    case 'vimeo': {
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
      return url;
    }
    case 'facebook': {
      const match = url.match(/facebook\.com\/.*?\/videos\/(\d+)/);
      if (match)
        return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/video/${match[1]}`;
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
    }
    case 'tiktok': {
      return url;
    }
    case 'instagram': {
      return url;
    }
    case 'telegram': {
      return url;
    }
    case 'google_drive': {
      const match = url.match(/\/d\/([\w-]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
      return url;
    }
    case 'direct': {
      return url;
    }
    default:
      return url;
  }
}

async function fetchOEmbedData(url) {
  const lower = url.toLowerCase();
  let oembedUrl = null;

  if (/youtube\.com|youtu\.be/.test(lower)) {
    oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  } else if (/vimeo\.com/.test(lower)) {
    oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
  } else if (/tiktok\.com/.test(lower)) {
    oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  }

  if (!oembedUrl) return { title: null, thumbnail: null };

  try {
    const response = await fetch(oembedUrl, {
      timeout: 5000,
      headers: { 'User-Agent': 'VideoPlatform/1.0' },
    });
    if (!response.ok) {
      console.warn(`oEmbed fetch failed for ${url}: ${response.status}`);
      return { title: null, thumbnail: null };
    }
    const data = await response.json();
    return {
      title: data.title || null,
      thumbnail: data.thumbnail_url || null,
    };
  } catch (err) {
    console.warn(`oEmbed error for ${url}: ${err.message}`);
    return { title: null, thumbnail: null };
  }
}

module.exports = { detectPlatform, getEmbedUrl, fetchOEmbedData };
