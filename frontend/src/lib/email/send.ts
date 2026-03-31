import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, SES_FROM } from './ses-client';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.warn(`[EMAIL SKIP] No AWS credentials. Would send: "${subject}" to ${to}`);
        return false;
    }

    try {
        await sesClient.send(new SendEmailCommand({
            Source: `Zentinel Security <${SES_FROM}>`,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: { Html: { Data: html, Charset: 'UTF-8' } },
            },
        }));
        console.log(`[EMAIL SENT] "${subject}" → ${to}`);
        return true;
    } catch (err: any) {
        console.error(`[EMAIL FAILED] "${subject}" → ${to} | ${err.message}`);
        return false;
    }
}
