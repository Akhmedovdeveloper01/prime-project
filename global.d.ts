// CSS fayllarni TypeScript import qilishga ruxsat beradi
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
