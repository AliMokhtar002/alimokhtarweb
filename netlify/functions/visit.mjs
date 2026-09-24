import crypto from 'node:crypto';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
  body: JSON.stringify(body)
});

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });
  const ip = request.headers.get('x-nf-client-connection-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const country = request.headers.get('x-country') || request.headers.get('x-nf-geo-country') || 'unknown';
  const device = /Mobi|Android|iPhone|iPad/i.test(userAgent) ? 'mobile' : 'desktop';
  const ipHash = crypto.createHash('sha256').update(`${ip}:${process.env.ANALYTICS_SALT || 'site'}`).digest('hex').slice(0, 16);
  const event = { country, device, ipHash, visitedAt: new Date().toISOString() };

  if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_ANALYTICS_CHANNEL_ID) {
    await fetch(`https://discord.com/api/v10/channels/${process.env.DISCORD_ANALYTICS_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      body: JSON.stringify({ content: `زيارة جديدة | الدولة: ${country} | الجهاز: ${device} | معرف IP مجزأ: ${ipHash} | الوقت: ${event.visitedAt}` })
    });
  }
  return json(204, {});
};
