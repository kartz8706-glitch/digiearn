import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const adminEmail = "hsha55403@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requests = Array.isArray(body?.requests) ? body.requests : [];

    if (requests.length === 0) {
      return NextResponse.json({ ok: false, message: "No pending requests to email." }, { status: 400 });
    }

    const summary = requests
      .map((request: { type?: string; user?: string; amount?: number }) => {
        const type = request.type ?? "Request";
        const user = request.user ?? "Unknown user";
        const amount = typeof request.amount === "number" ? `UGX ${request.amount.toLocaleString("en-UG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "UGX 0.00";
        return `${type} · ${user} · ${amount}`;
      })
      .join("\n");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: "Pending review: admin approval required",
      text: `Hello,\n\nThe following requests are currently pending review in the admin dashboard:\n\n${summary}\n\nPlease review them as soon as possible.\n\nRegards,\nDigi.earn Admin System`,
      html: `<p>Hello,</p><p>The following requests are currently pending review in the admin dashboard:</p><pre>${summary.replace(/</g, "&lt;")}</pre><p>Please review them as soon as possible.</p><p>Regards,<br />Digi.earn Admin System</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin reminder email failed:", error);
    return NextResponse.json({ ok: false, message: "Email failed to send." }, { status: 500 });
  }
}
