export async function sendTelegram(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) { console.warn('[telegram] env vars not set — skipping'); return }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    if (!r.ok) console.error('[telegram] failed:', await r.text())
    else       console.log('[telegram] notification sent')
  } catch (e) {
    console.error('[telegram] error:', e)
  }
}
