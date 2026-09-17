export async function sendEmailDigest(
  recipients: string[],
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; status: number; message: string }> {
  try {
    // Standard SMTP / Resend Email Dispatcher Mock
    console.log(`[Email Dispatcher] Sending email digest to ${recipients.join(", ")}: ${subject}`);
    return {
      success: true,
      status: 200,
      message: `ส่งอีเมลรายงานถึง ${recipients.join(", ")} เรียบร้อยแล้ว`,
    };
  } catch (error: any) {
    return {
      success: false,
      status: 500,
      message: error.message || "ไม่สามารถส่งอีเมลรายงานได้",
    };
  }
}
