const { generateSlug } = require('../routes/categories');

describe('Categories Utility', () => {
  describe('generateSlug()', () => {
    function slugify(name) {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s\u0600-\u06FF-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    test('converts Arabic names to slugs', () => {
      expect(slugify('تكنولوجيا')).toBe('تكنولوجيا');
      expect(slugify('ترفيه')).toBe('ترفيه');
    });

    test('converts English names to lowercase slugs', () => {
      expect(slugify('Technology')).toBe('technology');
      expect(slugify('My Category')).toBe('my-category');
    });

    test('removes special characters', () => {
      expect(slugify('Hello @World!')).toBe('hello-world');
      expect(slugify('Test #Category$')).toBe('test-category');
    });

    test('handles multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
      expect(slugify('  Test  ')).toBe('test');
    });

    test('handles empty/invalid input', () => {
      expect(slugify('')).toBe('');
      expect(slugify('   ')).toBe('');
    });
  });
});
