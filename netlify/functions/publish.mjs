import { getStore } from '@netlify/blobs';

const store = getStore('site-content');
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
});

export default async (request) => {
  if (request.method !== 'POST' || request.headers.get('x-site-secret') !== process.env.SITE_API_SECRET) {
    return json(401, { error: 'Unauthorized' });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || !['post', 'news'].includes(payload.type)) return json(400, { error: 'Invalid request' });

  if (payload.type === 'post') {
    if (!payload.title || !payload.imageUrl) return json(400, { error: 'title and imageUrl are required' });
    const current = (await store.get('works', { type: 'json' })) || [];
    const work = { id: crypto.randomUUID(), title: String(payload.title).slice(0, 120), imageUrl: payload.imageUrl, createdAt: new Date().toISOString() };
    await store.setJSON('works', [work, ...current].slice(0, 50));
    return json(201, work);
  }

  if (!payload.message) return json(400, { error: 'message is required' });
  const news = { message: String(payload.message).slice(0, 500), expiresAt: Date.now() + 30 * 60 * 1000 };
  await store.setJSON('news', news);
  return json(201, news);
};
