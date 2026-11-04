const messageFor = ({ orderId, transactionId, amount }) =>
  `Your order ${orderId} is confirmed. Transaction ID: ${transactionId}. Amount ₹${amount}.`;

const sendEmail = async ({ to, subject, text }) => {
  if (!to || !process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return "not_configured";
  }
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || "",
      },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return "sent";
  } catch (error) {
    console.error("Order email was not sent:", error.message);
    return "failed";
  }
};

const sendSms = async ({ phone, text }) => {
  if (!phone || !process.env.SMS_API_URL) return "not_configured";
  try {
    const response = await fetch(process.env.SMS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.SMS_API_KEY
          ? { Authorization: `Bearer ${process.env.SMS_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ phone, message: text }),
    });
    return response.ok ? "sent" : "failed";
  } catch (error) {
    console.error("Order SMS was not sent:", error.message);
    return "failed";
  }
};

export const notifyOrderPlaced = async (details) => {
  const text = messageFor(details);
  const [email, sms] = await Promise.all([
    sendEmail({
      to: details.email,
      subject: `Order ${details.orderId} confirmed`,
      text,
    }),
    sendSms({ phone: details.phone, text }),
  ]);
  return { email, sms };
};
