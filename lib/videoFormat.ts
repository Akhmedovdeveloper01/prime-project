/**
 * Ko'p qurilmalar (Windows, Android, Linux — Chrome/Firefox/Edge) faqat H.264 (avc1)
 * kodekli MP4'ni ishonchli o'ynata oladi. iPhone/Mac odatiy holda video'ni HEVC (H.265)
 * kodekda saqlaydi — bu faqat Safari (Mac/iPhone)da ishlaydi, boshqa brauzerlarda esa
 * "format qo'llab-quvvatlanmaydi" xatosi yoki tovush bor-u tasvir yo'q holatiga olib keladi.
 *
 * Buni fayl kengaytmasi yoki Content-Type orqali aniqlab bo'lmaydi — .mp4 deb nomlangan
 * fayl ham HEVC bo'lishi mumkin. Shuning uchun fayl ichidagi moov/stsd box'ini o'qib,
 * haqiqiy videokodek fourCC'sini tekshiramiz.
 */

type RangeReader = (start: number, length: number) => Promise<ArrayBuffer>

const UNSAFE_VIDEO_CODECS = new Set(['hvc1', 'hev1', 'dvh1', 'dvhe']) // HEVC / Dolby Vision

function readBoxHeader(view: DataView, offset: number): { type: string; size: number; headerLen: number } | null {
  if (offset + 8 > view.byteLength) return null
  let size = view.getUint32(offset)
  const type = String.fromCharCode(
    view.getUint8(offset + 4), view.getUint8(offset + 5),
    view.getUint8(offset + 6), view.getUint8(offset + 7)
  )
  let headerLen = 8
  if (size === 1) {
    if (offset + 16 > view.byteLength) return null
    const hi = view.getUint32(offset + 8)
    const lo = view.getUint32(offset + 12)
    size = hi * 2 ** 32 + lo
    headerLen = 16
  } else if (size === 0) {
    size = view.byteLength - offset
  }
  if (size < headerLen) return null
  return { type, size, headerLen }
}

interface Box { type: string; start: number; end: number; headerLen: number }

function parseBoxesIn(view: DataView, regionStart: number, regionEnd: number): Box[] {
  const boxes: Box[] = []
  let offset = regionStart
  while (offset + 8 <= regionEnd) {
    const header = readBoxHeader(view, offset)
    if (!header) break
    const end = Math.min(offset + header.size, regionEnd)
    boxes.push({ type: header.type, start: offset, end, headerLen: header.headerLen })
    if (header.size <= 0) break
    offset += header.size
  }
  return boxes
}

/** Ko'rsatilgan bufer ichidan (mos ravishda) 'moov' box'ini fayl boshidan qidiradi. */
function findTopLevelMoov(headView: DataView): { start: number; size: number } | null {
  const boxes = parseBoxesIn(headView, 0, headView.byteLength)
  const moov = boxes.find((b) => b.type === 'moov')
  if (!moov) return null
  return { start: moov.start, size: moov.end - moov.start }
}

/** moov fayl oxirida bo'lishi mumkin (streaming uchun optimallashtirilmagan export) — 'moov' belgisini xom qidiruv bilan topamiz. */
function scanForMoovSignature(tailView: DataView): number {
  for (let i = 0; i + 4 <= tailView.byteLength; i++) {
    if (
      tailView.getUint8(i) === 0x6d /* m */ &&
      tailView.getUint8(i + 1) === 0x6f /* o */ &&
      tailView.getUint8(i + 2) === 0x6f /* o */ &&
      tailView.getUint8(i + 3) === 0x76 /* v */
    ) {
      return i - 4 // box header (size field) starts 4 bytes before the type
    }
  }
  return -1
}

async function locateMoov(read: RangeReader, fileSize: number): Promise<{ start: number; size: number } | null> {
  const HEAD = Math.min(4 * 1024 * 1024, fileSize)
  const headBuf = await read(0, HEAD)
  const headView = new DataView(headBuf)
  const inHead = findTopLevelMoov(headView)
  if (inHead) return inHead

  const TAIL = Math.min(4 * 1024 * 1024, fileSize)
  const tailStartAbs = fileSize - TAIL
  const tailBuf = await read(tailStartAbs, TAIL)
  const tailView = new DataView(tailBuf)
  const localOffset = scanForMoovSignature(tailView)
  if (localOffset < 0) return null
  const header = readBoxHeader(tailView, localOffset)
  if (!header) return null
  return { start: tailStartAbs + localOffset, size: header.size }
}

function collectStsdFourCCs(moovView: DataView): string[] {
  const results: string[] = []
  const moov = parseBoxesIn(moovView, 0, moovView.byteLength)
  const moovBox = moov.find((b) => b.type === 'moov')
  if (!moovBox) return results

  for (const trak of parseBoxesIn(moovView, moovBox.start + moovBox.headerLen, moovBox.end)) {
    if (trak.type !== 'trak') continue
    const mdia = parseBoxesIn(moovView, trak.start + trak.headerLen, trak.end).find((b) => b.type === 'mdia')
    if (!mdia) continue
    const minf = parseBoxesIn(moovView, mdia.start + mdia.headerLen, mdia.end).find((b) => b.type === 'minf')
    if (!minf) continue
    const stbl = parseBoxesIn(moovView, minf.start + minf.headerLen, minf.end).find((b) => b.type === 'stbl')
    if (!stbl) continue
    const stsd = parseBoxesIn(moovView, stbl.start + stbl.headerLen, stbl.end).find((b) => b.type === 'stsd')
    if (!stsd) continue

    // stsd (full box): version(1)+flags(3) + entry_count(4), so first sample entry starts +8
    const entryOffset = stsd.start + stsd.headerLen + 8
    const entryHeader = readBoxHeader(moovView, entryOffset)
    if (entryHeader) results.push(entryHeader.type)
  }
  return results
}

async function findVideoCodecFourCCs(read: RangeReader, fileSize: number): Promise<string[]> {
  const moov = await locateMoov(read, fileSize)
  if (!moov) return []
  const moovBuf = await read(moov.start, moov.size)
  return collectStsdFourCCs(new DataView(moovBuf))
}

/** Faylning haqiqiy videokodekini tekshiradi. Xavfli bo'lsa fourCC qaytaradi (masalan 'hvc1'), aks holda null. */
export async function detectUnsafeVideoCodec(file: File): Promise<string | null> {
  try {
    const codecs = await findVideoCodecFourCCs(
      async (start, length) => file.slice(start, start + length).arrayBuffer(),
      file.size
    )
    return codecs.find((c) => UNSAFE_VIDEO_CODECS.has(c)) ?? null
  } catch {
    return null // fayl tuzilishini aniqlab bo'lmasa, yuklashni bloklamaymiz — server xato qaytarsa ko'rinadi
  }
}

/** Fayl kengaytmasi/nomidan qat'i nazar, konteyner brand'ini (ftyp) tekshiradi. */
async function isQuickTimeContainer(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (header.length < 12) return false
  const boxType = String.fromCharCode(...header.slice(4, 8))
  if (boxType !== 'ftyp') return false
  const majorBrand = String.fromCharCode(...header.slice(8, 12)).trim()
  return majorBrand === 'qt'
}

export const QUICKTIME_WARNING =
  'Bu video Apple QuickTime (.mov) formatida — Windows va Android qurilmalarida ochilmaydi. ' +
  'Iltimos, videoni avval H.264 MP4 formatiga o\'tkazib (masalan HandBrake yoki iMovie orqali "Most Compatible" eksport bilan), so\'ng qayta yuklang.'

export const HEVC_WARNING =
  'Bu video HEVC (H.265) kodekida — Windows va Android qurilmalaridagi ko\'pchilik brauzerlarda ochilmaydi ' +
  '(ovoz bo\'lib, tasvir chiqmasligi yoki umuman ochilmasligi mumkin). ' +
  'Iltimos, videoni H.264 kodekiga o\'tkazib (masalan HandBrake yoki iMovie orqali "Most Compatible" eksport bilan), so\'ng qayta yuklang.'

/** Video faylni tekshiradi va muammo bo'lsa ogohlantirish matnini qaytaradi, aks holda null. */
export async function getVideoFormatWarning(file: File): Promise<string | null> {
  if (await isQuickTimeContainer(file)) return QUICKTIME_WARNING
  if (await detectUnsafeVideoCodec(file)) return HEVC_WARNING
  return null
}
