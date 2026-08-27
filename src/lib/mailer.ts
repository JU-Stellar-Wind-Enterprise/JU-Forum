import nodemailer from "nodemailer";

/** Sends a ten-minute verification code through the configured Gmail account. */
export async function sendOtpEmail(email: string, code: string) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user || !pass)
    throw new Error("SMTP_USER and SMTP_APP_PASSWORD are not configured.");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: `"JU Forum" <${user}>`,
    to: email,
    subject: "JU Forum verification code",
    text: `Your JU Forum OTP is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 1.25rem; line-height: 1.6; color: #111827;">
        <p style="margin: 0 0 12px; font-weight: 700;">Your JU Forum OTP is:</p>
        <div style="font-size: 2.5rem; font-weight: 800; letter-spacing: 0.08em; color: #111827; margin: 8px 0 12px;">${code}</div>
        <p style="margin: 0; font-weight: 700;">It expires in 10 minutes.</p>
      </div>
    `,
  });
}
