export async function sendLineNotify(
  token: string,
  message: string,
  imageUrl?: string
): Promise<{ success: boolean; status: number; message: string }> {
  try {
    const params = new URLSearchParams({ message });
    if (imageUrl) {
      params.append("imageThumbnail", imageUrl);
      params.append("imageFullsize", imageUrl);
    }

    const res = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (res.ok) {
      return { success: true, status: 200, message: "ส่งข้อความ LINE Notify สำเร็จ" };
    }

    const data = await res.json().catch(() => ({}));
    return {
      success: false,
      status: res.status,
      message: data.message || `LINE Notify error status ${res.status}`,
    };
  } catch (error: any) {
    return {
      success: false,
      status: 500,
      message: error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ LINE Notify ได้",
    };
  }
}
