export async function sendTelegramBotMessage(
  botToken: string,
  chatId: string,
  htmlText: string
): Promise<{ success: boolean; status: number; message: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      return { success: true, status: 200, message: "ส่งข้อความ Telegram สำเร็จ" };
    }

    return {
      success: false,
      status: res.status,
      message: data.description || "Telegram Bot Error",
    };
  } catch (error: any) {
    return {
      success: false,
      status: 500,
      message: error.message || "ไม่สามารถเชื่อมต่อ Telegram API ได้",
    };
  }
}
