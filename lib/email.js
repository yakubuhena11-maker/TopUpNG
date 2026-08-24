import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to, code) {
  await resend.emails.send({
    from: "TopUpNG <onboarding@resend.dev>",
    to,
    subject: "Your TopUpNG verification code",
    html: `<p>Your verification code is:</p><h2>${code}</h2><p>This code expires in 5 minutes.</p>`,
  });
}