const { detectPlatform, getEmbedUrl } = require('../utils/platformDetector');

describe('Platform Detector', () => {
  describe('detectPlatform()', () => {
    test('detects YouTube URLs', () => {
      expect(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
      expect(detectPlatform('https://youtu.be/jNQXAC9IVRw')).toBe('youtube');
      expect(detectPlatform('https://www.youtube.com/shorts/abc123')).toBe('youtube');
      expect(detectPlatform('https://www.youtube.com/embed/abc123')).toBe('youtube');
      expect(detectPlatform('https://m.youtube.com/watch?v=test')).toBe('youtube');
    });

    test('detects Vimeo URLs', () => {
      expect(detectPlatform('https://vimeo.com/123456')).toBe('vimeo');
      expect(detectPlatform('https://player.vimeo.com/video/123')).toBe('vimeo');
    });

    test('detects TikTok URLs', () => {
      expect(detectPlatform('https://www.tiktok.com/@user/video/123')).toBe('tiktok');
      expect(detectPlatform('https://vm.tiktok.com/abc123')).toBe('tiktok');
    });

    test('detects Facebook URLs', () => {
      expect(detectPlatform('https://www.facebook.com/watch?v=123')).toBe('facebook');
      expect(detectPlatform('https://fb.watch/abc123')).toBe('facebook');
      expect(detectPlatform('https://www.facebook.com/reel/123')).toBe('facebook');
    });

    test('detects Instagram URLs', () => {
      expect(detectPlatform('https://www.instagram.com/reel/ABC123')).toBe('instagram');
      expect(detectPlatform('https://www.instagram.com/p/ABC123')).toBe('instagram');
    });

    test('detects Telegram URLs', () => {
      expect(detectPlatform('https://t.me/channel/123')).toBe('telegram');
      expect(detectPlatform('https://telegram.me/channel/123')).toBe('telegram');
    });

    test('detects Google Drive URLs', () => {
      expect(detectPlatform('https://drive.google.com/file/d/ABC/view')).toBe('google_drive');
      expect(detectPlatform('https://drive.google.com/open?id=ABC')).toBe('google_drive');
    });

    test('detects Dailymotion URLs', () => {
      expect(detectPlatform('https://www.dailymotion.com/video/abc123')).toBe('dailymotion');
      expect(detectPlatform('https://dai.ly/abc123')).toBe('dailymotion');
    });

    test('detects Twitch URLs', () => {
      expect(detectPlatform('https://www.twitch.tv/videos/123456')).toBe('twitch');
      expect(detectPlatform('https://clips.twitch.tv/abc123')).toBe('twitch');
    });

    test('detects direct video URLs', () => {
      expect(detectPlatform('https://example.com/video.mp4')).toBe('direct');
      expect(detectPlatform('https://example.com/video.webm')).toBe('direct');
      expect(detectPlatform('https://example.com/video.ogg')).toBe('direct');
      expect(detectPlatform('https://example.com/video.mkv')).toBe('direct');
    });

    test('returns other for unknown URLs', () => {
      expect(detectPlatform('https://example.com/page')).toBe('other');
      expect(detectPlatform('https://example.com/video.avi')).toBe('other');
    });

    test('handles edge cases', () => {
      expect(detectPlatform(null)).toBe('other');
      expect(detectPlatform(undefined)).toBe('other');
      expect(detectPlatform('')).toBe('other');
      expect(detectPlatform(123)).toBe('other');
    });
  });

  describe('getEmbedUrl()', () => {
    test('generates YouTube embed URL', () => {
      const result = getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube');
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    test('generates Vimeo embed URL', () => {
      const result = getEmbedUrl('https://vimeo.com/123456', 'vimeo');
      expect(result).toBe('https://player.vimeo.com/video/123456');
    });

    test('generates Google Drive embed URL', () => {
      const result = getEmbedUrl('https://drive.google.com/file/d/ABC123/view', 'google_drive');
      expect(result).toBe('https://drive.google.com/file/d/ABC123/preview');
    });

    test('returns original URL for direct videos', () => {
      const url = 'https://example.com/video.mp4';
      expect(getEmbedUrl(url, 'direct')).toBe(url);
    });

    test('returns original URL for unknown platform', () => {
      const url = 'https://example.com/video';
      expect(getEmbedUrl(url, 'unknown')).toBe(url);
    });

    test('handles null/undefined URL', () => {
      expect(getEmbedUrl(null, 'youtube')).toBeNull();
      expect(getEmbedUrl(undefined, 'youtube')).toBeNull();
      expect(getEmbedUrl('', 'youtube')).toBeFalsy();
    });
  });
});
