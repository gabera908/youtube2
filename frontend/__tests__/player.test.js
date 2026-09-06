// Frontend utility function tests
// These test the pure logic functions from player.js

describe('Player Utility Functions', () => {
  // Test formatViews logic
  describe('formatViews()', () => {
    function formatViews(n) {
      if (n === null || n === undefined) return '0';
      if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + ' مليار';
      if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + ' مليون';
      if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + ' ألف';
      return n.toString();
    }

    test('formats zero views', () => {
      expect(formatViews(0)).toBe('0');
    });

    test('formats null/undefined views', () => {
      expect(formatViews(null)).toBe('0');
      expect(formatViews(undefined)).toBe('0');
    });

    test('formats thousands', () => {
      expect(formatViews(1000)).toBe('1 ألف');
      expect(formatViews(1500)).toBe('1.5 ألف');
      expect(formatViews(999)).toBe('999');
    });

    test('formats millions', () => {
      expect(formatViews(1000000)).toBe('1 مليون');
      expect(formatViews(1500000)).toBe('1.5 مليون');
    });

    test('formats billions', () => {
      expect(formatViews(1000000000)).toBe('1 مليار');
      expect(formatViews(2500000000)).toBe('2.5 مليار');
    });
  });

  // Test timeAgo logic
  describe('timeAgo()', () => {
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
      return `منذ ${days} يوم`;
    }

    test('returns empty for null date', () => {
      expect(timeAgo(null)).toBe('');
      expect(timeAgo(undefined)).toBe('');
    });

    test('returns الآن for recent dates', () => {
      const now = new Date();
      expect(timeAgo(now)).toBe('الآن');
    });

    test('returns minutes ago', () => {
      const d = new Date(Date.now() - 5 * 60 * 1000);
      expect(timeAgo(d)).toBe('منذ 5 دقائق');
    });

    test('returns hours ago', () => {
      const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(timeAgo(d)).toBe('منذ 3 ساعات');
    });
  });

  // Test escapeHtml logic
  describe('escapeHtml()', () => {
    function escapeHtml(text) {
      if (!text) return '';
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    test('escapes HTML entities', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    test('handles null/empty', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    test('passes clean text unchanged', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
      expect(escapeHtml('فيديو بلس')).toBe('فيديو بلس');
    });
  });

  // Test platform detection (frontend version)
  describe('detectPlatform()', () => {
    function detectPlatform(url) {
      if (!url) return 'direct';
      const lower = url.toLowerCase();
      if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
      if (lower.includes('vimeo.com')) return 'vimeo';
      if (lower.includes('tiktok.com')) return 'tiktok';
      if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
      if (lower.includes('instagram.com')) return 'instagram';
      if (lower.includes('t.me') || lower.includes('telegram.me')) return 'telegram';
      if (lower.includes('drive.google.com')) return 'google-drive';
      if (lower.includes('dailymotion.com') || lower.includes('dai.ly')) return 'dailymotion';
      if (lower.includes('twitch.tv')) return 'twitch';
      return 'direct';
    }

    test('detects all major platforms', () => {
      expect(detectPlatform('https://youtube.com/watch?v=123')).toBe('youtube');
      expect(detectPlatform('https://vimeo.com/123')).toBe('vimeo');
      expect(detectPlatform('https://tiktok.com/@u/video/1')).toBe('tiktok');
      expect(detectPlatform('https://facebook.com/watch?v=1')).toBe('facebook');
      expect(detectPlatform('https://instagram.com/reel/1')).toBe('instagram');
      expect(detectPlatform('https://t.me/channel/1')).toBe('telegram');
      expect(detectPlatform('https://drive.google.com/file/d/1/view')).toBe('google-drive');
      expect(detectPlatform('https://dailymotion.com/video/1')).toBe('dailymotion');
      expect(detectPlatform('https://twitch.tv/videos/1')).toBe('twitch');
    });

    test('returns direct for unknown URLs', () => {
      expect(detectPlatform('https://example.com/video.mp4')).toBe('direct');
      expect(detectPlatform(null)).toBe('direct');
      expect(detectPlatform('')).toBe('direct');
    });
  });

  // Test formatDuration logic
  describe('formatDuration()', () => {
    function formatDuration(seconds) {
      if (!seconds || seconds <= 0) return '';
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    test('formats seconds only', () => {
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(5)).toBe('0:05');
    });

    test('formats minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(125)).toBe('2:05');
    });

    test('formats hours, minutes, seconds', () => {
      expect(formatDuration(3661)).toBe('1:01:01');
      expect(formatDuration(7200)).toBe('2:00:00');
    });

    test('handles zero/invalid', () => {
      expect(formatDuration(0)).toBe('');
      expect(formatDuration(null)).toBe('');
      expect(formatDuration(-1)).toBe('');
    });
  });

  // Test getPlatformBadgeClass logic
  describe('getPlatformBadgeClass()', () => {
    function getPlatformBadgeClass(platform) {
      const classes = {
        youtube: 'badge-youtube',
        tiktok: 'badge-tiktok',
        facebook: 'badge-facebook',
        instagram: 'badge-instagram',
        vimeo: 'badge-vimeo',
        telegram: 'badge-telegram',
        'google-drive': 'badge-gdrive',
        direct: 'badge-direct',
      };
      return classes[platform] || 'badge-direct';
    }

    test('returns correct badge classes', () => {
      expect(getPlatformBadgeClass('youtube')).toBe('badge-youtube');
      expect(getPlatformBadgeClass('tiktok')).toBe('badge-tiktok');
      expect(getPlatformBadgeClass('facebook')).toBe('badge-facebook');
    });

    test('returns default for unknown', () => {
      expect(getPlatformBadgeClass('unknown')).toBe('badge-direct');
    });
  });
});
