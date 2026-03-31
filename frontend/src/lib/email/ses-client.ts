import { SESClient } from '@aws-sdk/client-ses';

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('[SES] AWS credentials not fully configured — emails will be skipped');
}

export const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID     || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export const SES_FROM = process.env.SES_FROM_EMAIL || 'alerts@zentinel.dev';
