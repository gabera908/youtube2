# دليل الاختبار والتنظيف - منصة فيديو بلس

## الأدوات المستخدمة

| الأداة | الغرض | الملفات |
|--------|-------|---------|
| **Jest** | اختبار الوحدات | `backend/__tests__/*.test.js`, `frontend/__tests__/*.test.js` |
| **ESLint** | اكتشاف الأخطاء | `.eslintrc.json` في كل مجلد |
| **Prettier** | تنسيق الكود | `.prettierrc` في كل مجلد |
| **Husky** | فحص قبل Git | `.husky/pre-commit`, `.husky/pre-push` |
| **lint-staged** | فحص الملفات المعدّلة | `package.json` (root) |

## أوامر الاختبار

### تشغيل اختبارات Backend
```bash
cd backend
npm install
npm test
```

### تشغيل اختبارات Frontend
```bash
cd ..
npx jest frontend/__tests__/ --passWithNoTests
```

### اختبار الكل
```bash
npm test
```

## أوامر التنظيف

### فحص الأخطاء (بدون إصلاح)
```bash
npm run lint
```

### إصلاح الأخطاء تلقائيًا
```bash
npm run lint:fix
```

### تنسيق الكود
```bash
npm run format
```

### فحص التنسيق (بدون تعديل)
```bash
npm run format:check
```

## هيكل ملفات الاختبار

```
backend/
  __tests__/
    videos.test.js         # اختبار كشف المنصات
    categories.test.js     # اختبار إنشاء Slug
    errorHandler.test.js   # اختبار معالج الأخطاء
    rateLimiter.test.js    # اختبار تقييد الطلبات

frontend/
  __tests__/
    player.test.js         # اختبار دوال المشغل
```

## Git Hooks (Husky)

- **pre-commit**: يشغّل lint-staged على الملفات المعدّلة فقط
- **pre-push**: يشغّل اختبارات Backend قبل رفع الكود

## معايير الجودة

- لا أخطاء ESLint (errors)
- تحذيرات ESLint أقل من 10
- تغطية الاختبارات > 80% للدوال المنطقية
- كل الملفات مُنسّقة بـ Prettier
