"use server";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendBookingConfirmation(data: {
  email: string;
  name: string;
  bookingId: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  attendees: { name: string; seat: string; price: number }[];
  total: number;
  qrData: string;
}) {
  if (!process.env.SMTP_USER) {
    console.log("SMTP not configured, skipping email");
    return { success: false, error: "Email not configured" };
  }

  const attendeeRows = data.attendees
    .map((a) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${a.name}</td><td style="padding:8px;border-bottom:1px solid #eee">${a.seat}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${a.price === 0 ? "Free" : `₹${a.price.toFixed(2)}`}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#0d9488;color:white;padding:30px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="margin:0;font-size:24px">Booking Confirmed!</h1>
        <p style="margin:8px 0 0;opacity:0.9">Rajasthan International Center</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:30px">
        <p style="color:#374151">Dear <strong>${data.name}</strong>,</p>
        <p style="color:#6b7280">Your booking for the following event has been confirmed.</p>

        <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0">
          <h2 style="margin:0 0 12px;font-size:18px;color:#111827">${data.eventName}</h2>
          <p style="margin:4px 0;color:#6b7280">📅 ${data.eventDate}</p>
          <p style="margin:4px 0;color:#6b7280">📍 ${data.eventVenue}</p>
          <p style="margin:4px 0;color:#6b7280">🎫 Booking ID: <strong>${data.bookingId}</strong></p>
        </div>

        <h3 style="color:#111827;margin:20px 0 8px">Attendees</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Name</th><th style="padding:8px;text-align:left">Seat</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
          <tbody>${attendeeRows}</tbody>
        </table>

        <div style="border-top:2px solid #e5e7eb;padding:12px 0;margin-top:12px;text-align:right;font-size:18px;font-weight:bold">
          Total: ₹${data.total.toFixed(2)}
        </div>

        <div style="text-align:center;margin:24px 0">
          <p style="color:#6b7280;font-size:14px">Show this QR code at the entry</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.qrData)}" alt="QR Code" style="border-radius:8px" />
        </div>

        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px">
          Rajasthan International Centre, Jhalana Institutional Area, Jaipur
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"RIC Jaipur" <${process.env.SMTP_USER}>`,
      to: data.email,
      subject: `Booking Confirmed - ${data.eventName}`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}
