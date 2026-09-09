function detectPlatform(url) {
  if (!url) return 'direct';
  const lower = url.toLowerCase();
  if (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('youtube-nocookie.com')
  )
    return 'youtube';
  if (lower.includes('vimeo.com') || lower.includes('player.vimeo.com')) return 'vimeo';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fbcdn'))
    return 'facebook';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('t.me') || lower.includes('telegram.me') || lower.includes('telegram.org'))
    return 'telegram';
  if (lower.includes('drive.google.com')) return 'google-drive';
  if (lower.includes('dailymotion.com') || lower.includes('dai.ly')) return 'dailymotion';
  if (lower.includes('twitch.tv') || lower.includes('clips.twitch.tv')) return 'twitch';
  if (lower.includes('streamable.com')) return 'streamable';
  if (lower.includes('v.redd.it') || lower.includes('reddit.com')) return 'reddit';
  return 'direct';
}

function extractVideoId(url, platform) {
  if (!url) return null;
  try {
    switch (platform) {
      case 'youtube': {
        const match = url.match(
          /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        return match ? match[1] : url;
      }
      case 'vimeo': {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : url;
      }
      case 'tiktok': {
        return url;
      }
      default:
        return url;
    }
  } catch {
    return url;
  }
}

function getEmbedHtml(video) {
  const url = video.url || video.video_url || '';
  const rawPlatform = video.platform || detectPlatform(url);
  const platform = rawPlatform === 'google_drive' ? 'google-drive' : rawPlatform;
  const videoId = video.external_id || extractVideoId(url, platform);

  try {
    switch (platform) {
      case 'youtube':
        return `<iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      case 'vimeo':
        return `<iframe src="https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      case 'tiktok':
        return `<iframe src="https://www.tiktok.com/embed/v2/${videoId}" frameborder="0" allowfullscreen style="width:100%;height:100%;"></iframe>`;
      case 'facebook':
        return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
      case 'instagram':
        return `<iframe src="https://www.instagram.com/p/${videoId}/embed/" frameborder="0" allowfullscreen style="width:100%;"></iframe>`;
      case 'telegram':
        return `<iframe src="${url}" frameborder="0" allowfullscreen style="width:100%;min-height:500px;"></iframe>`;
      case 'google-drive':
        const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        const fileId = driveMatch ? driveMatch[1] : (openMatch ? openMatch[1] : videoId);
        return `<iframe src="https://drive.google.com/file/d/${fileId}/preview" frameborder="0" allowfullscreen></iframe>`;
      case 'dailymotion':
        const dmId = url.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/);
        return `<iframe src="https://www.dailymotion.com/embed/video/${dmId ? dmId[1] : videoId}" frameborder="0" allowfullscreen></iframe>`;
      case 'twitch':
        return `<iframe src="https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
      case 'streamable':
        return `<iframe src="https://streamable.com/e/${videoId}" frameborder="0" allowfullscreen style="width:100%;height:100%;"></iframe>`;
      case 'reddit':
        return `<iframe src="https://www.redditmedia.com/mediaembed/${videoId}?responsive=true" frameborder="0" allowfullscreen style="width:100%;height:100%;"></iframe>`;
      case 'direct':
      default:
        return `<video controls preload="metadata" style="width:100%;height:100%;background:#000;"><source src="${url}" type="video/mp4">متصفحك لا يدعم تشغيل الفيديو</video>`;
    }
  } catch (error) {
    console.error('Embed error:', error);
    return `<div style="padding:40px;text-align:center;color:#999;">خطأ في تحميل الفيديو</div>`;
  }
}

function getThumbnailUrl(video) {
  if (video.thumbnail) return video.thumbnail;
  const url = video.url || video.video_url || '';
  const rawPlatform = video.platform || detectPlatform(url);
  const platform = rawPlatform === 'google_drive' ? 'google-drive' : rawPlatform;
  const id = video.external_id || extractVideoId(url, platform);

  switch (platform) {
    case 'youtube':
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    case 'vimeo':
      return video.thumbnail || 'https://via.placeholder.com/480x270?text=Vimeo';
    default:
      return 'https://via.placeholder.com/480x270?text=Video';
  }
}

function formatViews(n) {
  if (n === null || n === undefined) return '0';
  if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + ' مليار';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + ' مليون';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + ' ألف';
  return n.toString();
}

function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return 'الآن';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} ${months === 1 ? 'شهر' : 'أشهر'}`;
  const years = Math.floor(days / 365);
  return `منذ ${years} ${years === 1 ? 'سنة' : 'سنوات'}`;
}

function getPlatformBadgeClass(platform) {
  const classes = {
    youtube: 'badge-youtube',
    tiktok: 'badge-tiktok',
    facebook: 'badge-facebook',
    instagram: 'badge-instagram',
    vimeo: 'badge-vimeo',
    telegram: 'badge-telegram',
    'google-drive': 'badge-gdrive',
    google_drive: 'badge-gdrive',
    dailymotion: 'badge-dailymotion',
    twitch: 'badge-twitch',
    streamable: 'badge-streamable',
    reddit: 'badge-reddit',
    direct: 'badge-direct',
  };
  return classes[platform] || 'badge-direct';
}

function getPlatformLabel(platform) {
  const labels = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    instagram: 'Instagram',
    vimeo: 'Vimeo',
    telegram: 'Telegram',
    'google-drive': 'Google Drive',
    google_drive: 'Google Drive',
    dailymotion: 'Dailymotion',
    twitch: 'Twitch',
    streamable: 'Streamable',
    reddit: 'Reddit',
    direct: 'مباشر',
  };
  return labels[platform] || platform;
}
