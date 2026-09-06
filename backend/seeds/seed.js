require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const categories = [
  { name: 'تكنولوجيا', slug: 'technology' },
  { name: 'ترفيه', slug: 'entertainment' },
  { name: 'تعليم', slug: 'education' },
  { name: 'رياضة', slug: 'sports' },
  { name: 'موسيقى', slug: 'music' },
  { name: 'أخبار', slug: 'news' },
  { name: 'وثائقيات', slug: 'documentaries' },
  { name: 'طبخ', slug: 'cooking' },
];

const channels = [
  {
    name: 'tech_explorer',
    slug: 'tech_explorer',
    description: 'استكشاف أحدث التقنيات والأجهزة الذكية',
    avatar_url: 'https://ui-avatars.com/api/?name=TE&background=3498db&color=fff',
  },
  {
    name: 'fun_world',
    slug: 'fun_world',
    description: 'عالم الترفيه والمرح اليومي',
    avatar_url: 'https://ui-avatars.com/api/?name=FW&background=e74c3c&color=fff',
  },
  {
    name: 'learn_hub',
    slug: 'learn_hub',
    description: 'محتوى تعليمي للعقول الفضولية',
    avatar_url: 'https://ui-avatars.com/api/?name=LH&background=2ecc71&color=fff',
  },
  {
    name: 'sports_live',
    slug: 'sports_live',
    description: 'أبرز أحداث وتحليلات الرياضية المباشرة',
    avatar_url: 'https://ui-avatars.com/api/?name=SL&background=f39c12&color=fff',
  },
  {
    name: 'music_vibes',
    slug: 'music_vibes',
    description: 'أفضل المقطوعات الموسيقية والتعلّم على الآلات',
    avatar_url: 'https://ui-avatars.com/api/?name=MV&background=9b59b6&color=fff',
  },
  {
    name: 'news_center',
    slug: 'news_center',
    description: 'آخر الأخبار والتطورات على مدار الساعة',
    avatar_url: 'https://ui-avatars.com/api/?name=NC&background=1abc9c&color=fff',
  },
];

const videos = [
  {
    title: 'مقدمة في وحدات معالجة التنسورات',
    description: 'شرح مفصل لوحدات Google TPU وكيف تعمل على تسريع نماذج الذكاء الاصطناعي',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'technology',
    channel: 'tech_explorer',
  },
  {
    title: 'مستقبل الحوسبة الكمية',
    description: 'استكشاف تفوق الحوسبة الكمية وتأثيرها على أمن المعلومات',
    video_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    category: 'technology',
    channel: 'tech_explorer',
  },
  {
    title: 'أفضل 10 إعلانات أفلام لعام 2024',
    description: 'أكثر الأفلام المنتظرة هذا العام مع تشويق وإثارة',
    video_url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    category: 'entertainment',
    channel: 'fun_world',
  },
  {
    title: 'خلف الكواليس: كوميديا مصغرة',
    description: 'كيف صنعنا أضحك مشهد كوميدي من الصفر حتى الإنتاج النهائي',
    video_url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    category: 'entertainment',
    channel: 'fun_world',
  },
  {
    title: 'التعلم الآلي في 10 دقائق',
    description: 'مقدمة سريعة لمفاهيم التعلم الآلي والشبكات العصبية',
    video_url: 'https://www.youtube.com/watch?v=aircAruvnKk',
    category: 'education',
    channel: 'learn_hub',
  },
  {
    title: 'تاريخ الرياضيات من العصور القديمة',
    description: 'رحلة عبر العصور من اكتشاف الأرقام إلى الحسابات المعقدة',
    video_url: 'https://www.youtube.com/watch?v=PyMpy5KzbBE',
    category: 'education',
    channel: 'learn_hub',
  },
  {
    title: 'أفضل أهداف كأس العالم لكرة القدم',
    description: 'compilation من أجمل الأهداف في تاريخ كأس العالم',
    video_url: 'https://www.youtube.com/watch?v=3CynRJ1Bmj8',
    category: 'sports',
    channel: 'sports_live',
  },
  {
    title: 'أبرز لحظات الأولمبياد 2024',
    description: 'أروع اللحظات الرياضية من دورة الألعاب الأولمبية',
    video_url: 'https://www.youtube.com/watch?v=RgKAFK5djSk',
    category: 'sports',
    channel: 'sports_live',
  },
  {
    title: 'أفضل 100 أغنية على مر العصور',
    description: 'compilation من أشهر الأغاني والروائع الموسيقية عبر التاريخ',
    video_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    category: 'music',
    channel: 'music_vibes',
  },
  {
    title: 'دورة إنتاج الموسيقى الاحترافية',
    description: 'تعلم إنتاج الموسيقى مثل المحترفين باستخدام البرامج الحديثة',
    video_url: 'https://www.youtube.com/watch?v=8gwTU0FUIM4',
    category: 'music',
    channel: 'music_vibes',
  },
  {
    title: 'أخبار عاجلة: تحديث صناعة التكنولوجيا',
    description: 'آخر التطورات في عالم التكنولوجيا والشركات التقنية الكبرى',
    video_url: 'https://www.youtube.com/watch?v=VDW7AeXGZnI',
    category: 'news',
    channel: 'news_center',
  },
  {
    title: 'التقرير العالمي المناخي لعام 2024',
    description: 'ملخص أخبار البيئة والتغيرات المناخية حول العالم',
    video_url: 'https://www.youtube.com/watch?v=n8djlUfWFMk',
    category: 'news',
    channel: 'news_center',
  },
  {
    title: 'دورة تعلم البرمجة بلغة Python',
    description: 'دليل شامل للمبتدئين لتعلم أساسيات لغة بايثون',
    video_url: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
    category: 'education',
    channel: 'learn_hub',
  },
  {
    title: 'أفضل لحظات كأس آسيا',
    description: 'أروع الأهداف واللعب في بطولة كأس آسيا',
    video_url: 'https://www.youtube.com/watch?v=YjA2VS9bMCQ',
    category: 'sports',
    channel: 'sports_live',
  },
];

async function seed() {
  let connection;
  try {
    console.log('Starting seed process...');
    connection = await pool.getConnection();
    console.log('Connected to database successfully');

    console.log('Applying schema from models/schema.sql...');
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter((s) => s.trim().length > 0);
    let stmtCount = 0;
    for (const stmt of statements) {
      await connection.query(stmt);
      stmtCount++;
    }
    console.log(`Schema applied: ${stmtCount} statements executed`);

    console.log('Clearing existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tablesToTruncate = [
      'watch_history',
      'playlist_items',
      'playlists',
      'likes',
      'comments',
      'subscriptions',
      'users',
      'videos',
      'categories',
      'channels',
    ];
    for (const table of tablesToTruncate) {
      await connection.query(`TRUNCATE TABLE ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('All tables cleared');

    console.log(`Seeding ${categories.length} categories...`);
    for (const cat of categories) {
      await connection.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [
        cat.name,
        cat.slug,
      ]);
    }
    console.log('Categories seeded successfully');

    console.log(`Seeding ${channels.length} channels...`);
    for (const ch of channels) {
      await connection.query(
        'INSERT INTO channels (name, slug, avatar_url, description) VALUES (?, ?, ?, ?)',
        [ch.name, ch.slug, ch.avatar_url, ch.description]
      );
    }
    console.log('Channels seeded successfully');

    const [catRows] = await connection.query('SELECT id, slug FROM categories');
    const catMap = {};
    catRows.forEach((r) => {
      catMap[r.slug] = r.id;
    });

    const [chRows] = await connection.query('SELECT id, slug FROM channels');
    const chMap = {};
    chRows.forEach((r) => {
      chMap[r.slug] = r.id;
    });

    console.log(`Seeding ${videos.length} videos...`);
    for (const vid of videos) {
      await connection.query(
        'INSERT INTO videos (title, description, video_url, platform, category_id, channel_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          vid.title,
          vid.description,
          vid.video_url,
          'youtube',
          catMap[vid.category],
          chMap[vid.channel],
        ]
      );
    }
    console.log('Videos seeded successfully');

    console.log('');
    console.log('=== Seed Summary ===');
    console.log(`Categories: ${categories.length}`);
    console.log(`Channels:   ${channels.length}`);
    console.log(`Videos:     ${videos.length}`);
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

seed();
