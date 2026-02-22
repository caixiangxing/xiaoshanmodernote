export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  const cjkChars = text.match(/[\u4e00-\u9fa5]/g) || [];

  const textWithoutCJK = text.replace(/[\u4e00-\u9fa5]/g, ' ');

  const englishWords = textWithoutCJK
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  return cjkChars.length + englishWords.length;
}

export function getPlainTextFromHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
