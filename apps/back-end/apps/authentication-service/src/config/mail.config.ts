// src/config/mail.config.ts
export default () => ({
  host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.MAIL_PORT, 10) || 2525,
  user: process.env.MAIL_USER || '',
  password: process.env.MAIL_PASSWORD || '',
  from: process.env.MAIL_FROM || 'noreply@site.com',
  fromName: process.env.MAIL_FROM_NAME || 'Multi Vendor App',
});
