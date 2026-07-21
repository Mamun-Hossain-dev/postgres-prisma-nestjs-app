import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WELCOME_BANNER_CID = 'welcome-banner@nestjs-learning';
const welcomeBanner = readFileSync(
  join(__dirname, '../assets/welcome-banner.png'),
);

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export interface WelcomeEmailTemplate {
  subject: string;
  text: string;
  html: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
    cid: string;
  }>;
}

export function buildWelcomeEmail(name: string): WelcomeEmailTemplate {
  const safeName = escapeHtml(name);

  return {
    subject: 'Welcome to NestJS Learning API',
    text: `Hi ${name}, welcome! Your account has been created successfully.`,
    html: `
      <!doctype html>
      <html lang="en">
        <body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#f4f4f5">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">
                  <tr><td><img src="cid:${WELCOME_BANNER_CID}" width="600" alt="Welcome ${safeName}" style="display:block;width:100%;height:auto" /></td></tr>
                  <tr>
                    <td style="padding:32px">
                      <h1 style="margin:0 0 16px;font-size:26px">Hi ${safeName},</h1>
                      <p style="margin:0;line-height:1.7;color:#52525b">Your account has been created successfully. We are happy to have you with us.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `.trim(),
    attachments: [
      {
        filename: 'welcome-banner.png',
        content: welcomeBanner,
        contentType: 'image/png',
        cid: WELCOME_BANNER_CID,
      },
    ],
  };
}
