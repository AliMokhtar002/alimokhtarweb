import { getStore } from '@netlify/blobs';

const store = getStore('site-content');
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  body: JSON.stringify(body)
});

export default async () => {
  const [works, news] = await Promise.all([
    store.get('works', { type: 'json' }),
    store.get('news', { type: 'json' })
  ]);
  return json(200, { works: works || [], news: news && news.expiresAt > Date.now() ? news : null });
};
