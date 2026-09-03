import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execFileAsync = promisify(execFile)
const FFMPEG = '/opt/homebrew/bin/ffmpeg'
const FFPROBE = '/opt/homebrew/bin/ffprobe'
const TMP_DIR = '/private/tmp/claude-501/-Users-muhamad-Desktop-Developer-ilmhub/ac7734e5-c08b-4682-9c1c-dd95b96ad6c5/scratchpad'

const env = fs.readFileSync('.env.local', 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim()

const r2 = new S3Client({
  region: 'auto',
  endpoint: get('R2_ENDPOINT'),
  credentials: {
    accessKeyId: get('R2_ACCESS_KEY_ID'),
    secretAccessKey: get('R2_SECRET_ACCESS_KEY'),
  },
})
const Bucket = get('R2_BUCKET_NAME')

const KEYS = [
  'courses/142b9c11-e5bb-4dbc-b69c-445eead7b956/00592900-c125-4d74-a1ac-a1829f28776c.mp4',
  'courses/142b9c11-e5bb-4dbc-b69c-445eead7b956/190e7173-bb45-4c00-be3e-4fefe7ef493a.mp4',
  'courses/142b9c11-e5bb-4dbc-b69c-445eead7b956/46baeea7-42fb-408c-82dc-f52b57fdbf75.mp4',
  'courses/142b9c11-e5bb-4dbc-b69c-445eead7b956/c721e422-2ba1-47cb-b3b2-dceffdbda583.mp4',
  'courses/142b9c11-e5bb-4dbc-b69c-445eead7b956/d0d6f68f-b9e3-4916-8739-d299431adeea.mp4',
  'courses/142b9c11-e5bb-4dbc-b69c-445eead7b956/d192932e-0aaf-4235-87be-b074726abc77.mp4',
  'courses/142b9c11-e5bb-4dbc-b69c-445eead7b956/ff55fd72-bd65-42e2-8ae3-71eaecfcb467.mp4',
  'courses/4b86d8d0-b08b-4da4-a5bd-b9264b0cb30c/810e35d9-bb16-4cc1-9a13-3f67a3540ef3.mp4',
  'intro/intro-video.mp4',
]

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  fs.appendFileSync(path.join(TMP_DIR, 'transcode.log'), line + '\n')
}

async function getSourceUrl(key) {
  const cmd = new GetObjectCommand({ Bucket, Key: key })
  return getSignedUrl(r2, cmd, { expiresIn: 7200 })
}

async function probeCodec(input) {
  const { stdout } = await execFileAsync(FFPROBE, [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height',
    '-show_entries', 'format=duration',
    '-of', 'json', input,
  ])
  return JSON.parse(stdout)
}

async function transcodeOne(key, idx, total) {
  const safeName = key.replace(/[\/]/g, '__')
  const outPath = path.join(TMP_DIR, `out-${safeName}`)
  log(`[${idx}/${total}] START ${key}`)

  const srcUrl = await getSourceUrl(key)

  const srcInfo = await probeCodec(srcUrl)
  const srcDuration = parseFloat(srcInfo.format?.duration ?? '0')
  log(`[${idx}/${total}] source codec=${srcInfo.streams?.[0]?.codec_name} ${srcInfo.streams?.[0]?.width}x${srcInfo.streams?.[0]?.height} duration=${srcDuration.toFixed(1)}s`)

  const args = [
    '-y', '-hide_banner', '-loglevel', 'error', '-stats',
    '-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '10',
    '-i', srcUrl,
    '-vf', 'scale=-2:1080',
    '-c:v', 'h264_videotoolbox',
    '-b:v', '6M', '-maxrate', '8M', '-bufsize', '12M',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k',
    '-movflags', '+faststart',
    outPath,
  ]

  const start = Date.now()
  await execFileAsync(FFMPEG, args, { maxBuffer: 1024 * 1024 * 50 })
  const elapsed = ((Date.now() - start) / 1000).toFixed(0)
  log(`[${idx}/${total}] transcode done in ${elapsed}s`)

  // Verify output
  const outInfo = await probeCodec(outPath)
  const outDuration = parseFloat(outInfo.format?.duration ?? '0')
  const outCodec = outInfo.streams?.[0]?.codec_name
  const outStat = fs.statSync(outPath)
  log(`[${idx}/${total}] verify codec=${outCodec} duration=${outDuration.toFixed(1)}s size=${(outStat.size / 1e6).toFixed(1)}MB`)

  if (outCodec !== 'h264') throw new Error(`Output codec mismatch: ${outCodec}`)
  if (outStat.size < 1000) throw new Error('Output file too small')
  if (Math.abs(outDuration - srcDuration) > Math.max(5, srcDuration * 0.03)) {
    throw new Error(`Duration mismatch: src=${srcDuration} out=${outDuration}`)
  }

  // Upload back to R2, same key, overwrite
  const body = fs.createReadStream(outPath)
  await r2.send(new PutObjectCommand({
    Bucket, Key: key, Body: body, ContentType: 'video/mp4', ContentLength: outStat.size,
  }))
  log(`[${idx}/${total}] uploaded -> ${key}`)

  // Confirm via HEAD
  const head = await r2.send(new HeadObjectCommand({ Bucket, Key: key }))
  if (head.ContentLength !== outStat.size) throw new Error('Uploaded size mismatch')
  log(`[${idx}/${total}] confirmed on R2, contentType=${head.ContentType} size=${head.ContentLength}`)

  fs.unlinkSync(outPath)
  log(`[${idx}/${total}] DONE ${key}`)
}

async function main() {
  log(`=== Transcode job starting, ${KEYS.length} files ===`)
  const results = []
  for (let i = 0; i < KEYS.length; i++) {
    const key = KEYS[i]
    try {
      await transcodeOne(key, i + 1, KEYS.length)
      results.push({ key, ok: true })
    } catch (err) {
      log(`[${i + 1}/${KEYS.length}] ERROR ${key}: ${err?.message ?? err}`)
      results.push({ key, ok: false, error: String(err?.message ?? err) })
    }
  }
  log('=== SUMMARY ===')
  for (const r of results) {
    log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.key}${r.error ? ' :: ' + r.error : ''}`)
  }
  log('=== Transcode job finished ===')
}

main().catch((e) => { log(`FATAL: ${e?.stack ?? e}`); process.exit(1) })
