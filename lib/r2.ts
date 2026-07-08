/**
 * Cloudflare R2 client sozlamasi.
 * R2 S3-compatible API ishlatadi — endpoint account ID ga bog'liq.
 */
import { S3Client } from '@aws-sdk/client-s3'

if (
  !process.env.R2_ENDPOINT ||
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY ||
  !process.env.R2_BUCKET_NAME
) {
  throw new Error('R2 environment variables mavjud emas. .env.local faylini tekshiring.')
}

export const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET_NAME
