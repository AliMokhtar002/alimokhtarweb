import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const siteUrl = process.env.SITE_URL?.replace(/\/$/, '');
const secret = process.env.SITE_API_SECRET;

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild || message.guild.id !== process.env.DISCORD_GUILD_ID || !message.content.startsWith('!')) return;
  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;
  const [command, ...args] = message.content.trim().split(/\s+/);

  try {
    if (command === '!news') {
      const text = args.join(' ').trim();
      if (!text) return message.reply('اكتب الرسالة بعد الأمر، مثال: !news الموقع متاح الآن');
      await publish({ type: 'news', message: text });
      return message.reply('تم نشر الخبر لمدة 30 دقيقة.');
    }

    if (command === '!post') {
      const title = args.join(' ').trim();
      const image = message.attachments.first();
      if (!title || !image?.contentType?.startsWith('image/')) return message.reply('استخدم: !post العنوان مع إرفاق صورة.');
      await publish({ type: 'post', title, imageUrl: image.url });
      return message.reply('تمت إضافة العمل إلى معرض الأعمال.');
    }
  } catch (error) {
    console.error(error);
    return message.reply('تعذر النشر من Netlify. تأكد من نشر Netlify Functions وأن SITE_API_SECRET مطابق.');
  }
});

async function publish(payload) {
  const response = await fetch(`${siteUrl}/.netlify/functions/publish`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-site-secret': secret }, body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Publish failed: ${response.status} ${details.slice(0, 200)}`);
  }
}

client.login(process.env.DISCORD_TOKEN);
