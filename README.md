# فيديو بلس - منصة فيديو عربية

منصة مشاهدة فيديوهات عربية بدون استضافة - تدعم ربط فيديوهات من أكثر من 12 منصة بما في ذلك YouTube, Vimeo, TikTok, Facebook, Instagram, Telegram, Google Drive, Dailymotion, Twitch, Streamable, Reddit, وروابط MP4 مباشرة.

## 🌐 روابط الموقع

| الخدمة | الرابط |
|--------|--------|
| 🌐 الموقع | http://100.84.254.18:61 |
| 🔧 لوحة التحكم | http://100.84.254.18:61/pages/admin.html |
| 🔌 API | http://100.84.254.18:3030 |
| 🏠 CasaOS | http://100.84.254.18 |

## ✨ المميزات

### الموقع
- 📱 تصميم متجاوب (موبايل + تابلت + كمبيوتر)
- 🌙/☀️ سيم ليلي ونهاري مع حفظ التفضيل
- 🇸🇦 دعم كامل للعربية (RTL)
- 🔍 بحث في الفيديوهات
- 🏷️ تصنيفات الفيديوهات
- 📺 صفحات القنوات
- 🎬 صفحة مشاهدة مع فيديوهات ذات صلة
- 📊 عرض عدد المشاهدات
- ⏰ عرض "منذ وقت"

### لوحة التحكم
- ➕ إضافة فيديوهات جديدة عبر الرابط
- 🎬 إدارة الفيديوهات (عرض، بحث، حذف)
- 📊 إحصائيات الموقع

### الدعم
- 🎥 12+ منصة فيديو
- 🖥️ تطبيق سطح مكتب Electron
- 🐳 Docker + Nginx
- ⚡ Cache + Compression

## 🛠️ التقنيات

| الجزء | التقنية |
|-------|---------|
| Backend | Node.js + Express |
| Database | MySQL 8 |
| Frontend | HTML + CSS + Tailwind |
| Desktop | Electron |
| Server | Nginx + Docker |
| Cache | Redis |

## 📁 هيكل المشروع

```
video-platform/
├── backend/                # API Backend
│   ├── app.js              # Express app
│   ├── index.js            # Server entry
│   ├── config/             # Database config
│   ├── routes/             # API routes
│   │   ├── videos.js       # CRUD فيديوهات
│   │   ├── categories.js   # التصنيفات
│   │   └── channels.js     # القنوات
│   ├── middleware/          # Rate limiter, Error handler
│   ├── utils/              # Platform detector
│   ├── seeds/              # بيانات تجريبية
│   └── __tests__/          # اختبارات Backend
├── frontend/               # الموقع
│   ├── index.html          # الصفحة الرئيسية
│   ├── css/style.css       # الأنماط + Responsive + Dark/Light
│   ├── js/
│   │   ├── api.js          # الاتصال بالـ API
│   │   ├── app.js          # الصفحة الرئيسية + المشاهدة
│   │   ├── player.js       # تشغيل الفيديو
│   │   └── admin.js        # لوحة التحكم
│   ├── pages/              # الصفحات الفرعية
│   │   ├── watch.html      # صفحة المشاهدة
│   │   ├── category.html   # صفحة التصنيف
│   │   ├── channel.html    # صفحة القناة
│   │   ├── search.html     # صفحة البحث
│   │   └── admin.html      # لوحة التحكم
│   └── __tests__/          # اختبارات Frontend
├── desktop/                # تطبيق Electron
├── docker/                 # Docker Compose
├── scripts/                # Build scripts
└── dist/                   # نسخة الإنتاج
```

## 🚀 التشغيل المحلي

### المتطلبات
- Node.js v18+
- MySQL 8
- Redis (اختياري)

### 1. تثبيت الاعتماديات
```bash
# Backend
cd backend
npm install

# Frontend (للتطوير فقط)
cd frontend
npm install
```

### 2. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE video_platform"

# استيراد Schema
mysql -u root -p video_platform < backend/seeds/schema.sql

# استيراد البيانات التجريبية
mysql -u root -p video_platform < backend/seeds/seed.sql
```

### 3. إعداد ملف .env
```bash
# backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=video_platform
PORT=3030
```

### 4. تشغيل المشروع
```bash
# Backend
cd backend
npm start

# الموقع يعمل على http://localhost:3030
```

## 🐳 التشغيل بـ Docker

```bash
# تشغيل الإنتاج
docker-compose -f docker/docker-compose.prod.yml up -d

# أو التشغيل المحلي
docker-compose up -d
```

## 📡 API Endpoints

### الفيديوهات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/videos` | قائمة الفيديوهات (مع pagination, search, filter) |
| GET | `/api/videos/:id` | فيديو واحد |
| POST | `/api/videos` | إضافة فيديو |
| PUT | `/api/videos/:id` | تعديل فيديو |
| DELETE | `/api/videos/:id` | حذف فيديو (soft delete) |
| GET | `/api/videos/stats/overview` | إحصائيات عامة |

### التصنيفات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/categories` | قائمة التصنيفات |
| GET | `/api/categories/:slug` | فيديوهات التصنيف |

### القنوات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/channels` | قائمة القنوات |
| GET | `/api/channels/:slug` | فيديوهات القناة |

### أمثلة
```bash
# جلب فيديوهات الصفحة الأولى
curl http://localhost:3030/api/videos?page=1&limit=12

# بحث
curl http://localhost:3030/api/videos?search=tech

# فيديو مميز
curl http://localhost:3030/api/videos?featured=true

# إضافة فيديو
curl -X POST http://localhost:3030/api/videos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "عنوان الفيديو",
    "video_url": "https://youtu.be/VIDEO_ID",
    "description": "وصف الفيديو",
    "category_id": 1,
    "channel_id": 1
  }'
```

## 🧪 الاختبارات

```bash
# اختبارات Backend
cd backend
npm test

# اختبارات Frontend
cd frontend
npm test

# فحص الكود
npm run lint

# تنسيق الكود
npm run format
```

## 🎨 المنصات المدعومة

| المنصة | الكود | مثال |
|--------|-------|------|
| YouTube | `youtube` | `https://youtu.be/ID` |
| Vimeo | `vimeo` | `https://vimeo.com/123456` |
| TikTok | `tiktok` | `https://tiktok.com/@user/video/ID` |
| Facebook | `facebook` | `https://facebook.com/watch?v=ID` |
| Instagram | `instagram` | `https://instagram.com/reel/ID` |
| Telegram | `telegram` | `https://t.me/channel/123` |
| Google Drive | `google_drive` | `https://drive.google.com/file/d/ID` |
| Dailymotion | `dailymotion` | `https://dailymotion.com/video/ID` |
| Twitch | `twitch` | `https://twitch.tv/videos/123456` |
| Streamable | `streamable` | `https://streamable.com/abc123` |
| Reddit | `reddit` | `https://reddit.com/r/sub/abc123` |
| MP4 مباشر | `direct` | `https://example.com/video.mp4` |

## 📄 التراخيص

مشروع مفتوح المصدر - استخدمه كما تشاء.
