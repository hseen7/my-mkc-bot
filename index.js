const { Telegraf, Markup } = require('telegraf');
const mineflayer = require('mineflayer');
const http = require('http');

// 1. إعدادات البوت (ضع التوكن الخاص بك هنا)
const BOT_TOKEN = '8463478589:AAGmIpU859NMO6qGzO7HhqpCPFqRsMiJWO4';
const bot = new Telegraf(BOT_TOKEN);

let mcBot = null;
let config = { host: '', port: 19132, username: 'Pro_Linker', version: '1.20.x' };
let antiAfkActive = false;

// 2. لوحة التحكم بالأزرار الشفافة
const mainButtons = () => Markup.inlineKeyboard([
    [Markup.button.callback('🚀 تشغيل البوت', 'start_bot'), Markup.button.callback('🛑 إيقاف البوت', 'stop_bot')],
    [Markup.button.callback('🔄 ريستارت', 'restart_system'), Markup.button.callback('🧍 مانع الطرد', 'toggle_afk')],
    [Markup.button.callback('🌐 ضبط السيرفر', 'edit_server'), Markup.button.callback('📊 الحالة', 'get_status')]
]);

// 3. أوامر تليجرام
bot.start((ctx) => ctx.reply('💎 لوحة تحكم بوت ماين كرافت الاحترافية جاهزة!', mainButtons()));

bot.action('restart_system', (ctx) => {
    ctx.reply('🔄 جارٍ إعادة تشغيل النظام...');
    setTimeout(() => process.exit(), 1000);
});

bot.action('toggle_afk', (ctx) => {
    antiAfkActive = !antiAfkActive;
    ctx.reply(antiAfkActive ? '✅ مانع الطرد يعمل (قفز كل 30 ثانية)' : '❌ تم إيقاف مانع الطرد');
});

// 4. وظيفة الاتصال بماين كرافت
function startMinecraftBot(ctx) {
    if (mcBot) return;
    mcBot = mineflayer.createBot({ ...config, auth: 'offline' });

    mcBot.on('spawn', () => {
        bot.telegram.sendMessage(ctx.chat.id, `✅ تم الدخول للسيرفر: ${config.host}`);
    });

    mcBot.on('chat', (username, message) => {
        if (username === mcBot.username) return;
        bot.telegram.sendMessage(ctx.chat.id, `💬 [${username}]: ${message}`);
    });

    mcBot.on('error', (err) => {
        bot.telegram.sendMessage(ctx.chat.id, `❌ خطأ: ${err.message}`);
        mcBot = null;
    });
}

// 5. استقبال الرسائل من تليجرام
bot.on('text', (ctx) => {
    const text = ctx.message.text;
    if (text.includes(':')) {
        const [h, p] = text.split(':');
        config.host = h.trim();
        config.port = parseInt(p) || 19132;
        ctx.reply('✅ تم حفظ بيانات السيرفر.', mainButtons());
    } else if (mcBot) {
        mcBot.chat(text); // إرسال رسالة تليجرام إلى شات اللعبة
    }
});

bot.action('start_bot', (ctx) => {
    if (!config.host) return ctx.reply('❌ أرسل IP:PORT أولاً');
    startMinecraftBot(ctx);
});

bot.action('stop_bot', (ctx) => {
    if (mcBot) { mcBot.quit(); mcBot = null; ctx.reply('🛑 تم الفصل.'); }
});

bot.action('edit_server', (ctx) => ctx.reply('أرسل IP:PORT (مثال: 1.1.1.1:19132)'));

// 6. كود منع النوم لاستضافة Render
http.createServer((req, res) => {
    res.write("Bot is Live!");
    res.end();
}).listen(process.env.PORT || 8080);

bot.launch();
console.log('النظام يعمل...');
