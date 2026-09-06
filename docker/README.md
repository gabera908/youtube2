# تكوين Docker لمنصة الفيديو

## بدء تشغيل الخدمات

```bash
docker-compose up -d
```

## إيقاف الخدمات

```bash
docker-compose down
```

## عرض السجلات

```bash
docker-compose logs -f
```

## إعادة تعيين قاعدة البيانات

```bash
docker-compose down -v
docker-compose up -d
```

## بيانات الاعتماد الافتراضية

| الخدمة | اسم المستخدم | كلمة المرور | المنفذ |
|--------|--------------|-------------|--------|
| MySQL | appuser | apppassword | 3306 |
| MySQL (root) | root | rootpassword | 3306 |
| Backend API | - | - | 3000 |
| Frontend | - | - | 80 |

## الروابط

- الواجهة الأمامية: http://localhost
- API الخادم الخلفي: http://localhost:3000/api
- قاعدة البيانات: localhost:3306
