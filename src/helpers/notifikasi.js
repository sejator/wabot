const nodemailer = require("nodemailer");

async function sendMail(to, subject, message, html = true) {
  try {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: JSON.parse(process.env.SMTP_SECURE),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: JSON.parse(process.env.SMTP_TLS),
      },
    };
    const params = {
      from: `${process.env.APP_NAME} <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
    };
    if (html) {
      params.html = message;
    } else {
      params.text = message;
    }

    let transporter = nodemailer.createTransport(config);
    let info = await transporter.sendMail(params);
    return {
      ok: true,
      errors: null,
      data: {
        messageId: info.messageId,
      },
    };
  } catch (e) {
    console.info(e);
    return {
      ok: false,
      errors: e.message,
      data: null,
    };
  }
}

async function sendNotifWhatsapp(data) {
  console.log(data);
}

module.exports = { sendMail, sendNotifWhatsapp };
