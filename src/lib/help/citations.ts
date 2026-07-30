/** Split an AI answer into display text and cited article slugs.
 *  The model is instructed to end with "Sources: [[slug]] [[slug]]". */
export function extractSources(answer: string): { text: string; slugs: string[] } {
  const slugs: string[] = []
  for (const m of answer.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
    if (!slugs.includes(m[1])) slugs.push(m[1])
  }
  const text = answer
    .replace(/^\s*Sources?:.*$/gim, '')
    .replace(/\[\[([a-z0-9-]+)\]\]/g, '')
    .trim()
  return { text, slugs }
}
