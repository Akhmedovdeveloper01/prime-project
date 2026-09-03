/**
 * Ba'zi videolar Apple QuickTime (.mov) konteynerida bo'ladi, lekin admin
 * ularni .mp4 kengaytmasi bilan yuklaydi. QuickTime konteynerini faqat
 * Safari (Mac/iPhone) native o'qiy oladi — Chrome/Firefox/Edge (Windows,
 * Android) buni "format qo'llab-quvvatlanmaydi" deb rad etadi.
 * Fayl boshidagi ftyp box'dan major brand'ni o'qib shu holatni oldindan aniqlaymiz.
 */
export async function isQuickTimeContainer(file: File): Promise<boolean> {
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
