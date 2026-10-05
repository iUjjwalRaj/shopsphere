import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, text, html }) => {
  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback using Ethereal test account or jsonTransport
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn('Could not create Ethereal test account, using fallback jsonTransport:', err.message);
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  const from = process.env.EMAIL_FROM || 'ShopSphere <no-reply@shopsphere.dev>';

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`✉️ Password reset email preview URL: ${previewUrl}`);
  }

  return { info, previewUrl };
};

export default sendEmail;
