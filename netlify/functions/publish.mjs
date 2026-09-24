import { getStore } from '@netlify/blobs';

const store = getStore('site-content');
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
});

export default async (request) => {
  try {
    const providedSecret = request.headers.get('x-site-secret');
    const providedAdminPassword = request.headers.get('x-admin-password');
    const authorized = (process.env.SITE_API_SECRET && providedSecret === process.env.SITE_API_SECRET) ||
      providedAdminPassword === (process.env.ADMIN_PASSWORD || 'baba1234MAMA');

    if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });
    if (!authorized) return json(401, { error: 'كلمة المرور غير صحيحة.' });

    const payload = await request.json().catch(() => null);
    if (!payload || !['post', 'news'].includes(payload.type)) return json(400, { error: 'بيانات النشر غير مكتملة.' });

    if (payload.type === 'post') {
      if (!payload.title || !payload.imageUrl) return json(400, { error: 'العنوان والصورة مطلوبان.' });
      if (!String(payload.imageUrl).startsWith('data:image/')) return json(400, { error: 'ملف الصورة غير صالح.' });
      if (String(payload.imageUrl).length > 5_500_000) return json(413, { error: 'الصورة كبيرة جدًا. اختر صورة أقل من 3MB.' });
      const storedWorks = await store.get('works', { type: 'json' });
      const current = Array.isArray(storedWorks) ? storedWorks : [];
      const work = {
        id: crypto.randomUUID(),
        title: String(payload.title).slice(0, 120),
        description: String(payload.description || '').slice(0, 500),
        imageUrl: payload.imageUrl,
        createdAt: new Date().toISOString()
      };
      await store.setJSON('works', [work, ...current].slice(0, 50));
      return json(201, work);
    }

    if (!payload.message) return json(400, { error: 'الرسالة مطلوبة.' });
    const news = { message: String(payload.message).slice(0, 500), expiresAt: Date.now() + 30 * 60 * 1000 };
    await store.setJSON('news', news);
    return json(201, news);
  } catch (error) {
    console.error('Publish failed:', error);
    const message = error instanceof Error ? error.message : '';
    const storageError = /blob|store|site|token|credential/i.test(message);
    return json(500, {
      error: storageError
        ? 'تعذر الوصول إلى التخزين. فعّل Netlify Blobs على الموقع ثم أعد النشر.'
        : 'حدث خطأ أثناء النشر. راجع بيانات العمل وحاول مرة أخرى.'
    });
  }
};
