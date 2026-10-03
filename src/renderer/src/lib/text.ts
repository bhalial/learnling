const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/**
 * Teacher-written HTML to plain text: paragraphs and list items become lines,
 * every tag disappears. The result is only ever shown as text, never as HTML.
 */
export function plainText(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\s*\/\s*(p|div|li|ul|ol|h\d|tr)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] === '#') {
        const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
        return Number.isFinite(n) ? String.fromCodePoint(n) : entity
      }
      return ENTITIES[code.toLowerCase()] ?? entity
    })
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

/** Drops a bare "Huiswerk" / "Homework" heading line that says nothing by itself. */
export function withoutLabel(text: string): string {
  return text.replace(/^(huiswerk|homework|hw)\s*:?\s*(\n|$)/i, '').trim()
}

/** The first line, for a card. */
export const firstLine = (text: string): string => text.split('\n')[0] ?? ''

/** The assignment lives somewhere else, e.g. in Teams. */
export const pointsElsewhere = (text: string): boolean => /\b(teams|classroom|studiewijzer|onedrive|elo)\b/i.test(text)

/**
 * Text from Magister that does not say what to do: nothing at all, or a
 * short line that only points somewhere else.
 */
export const isVague = (text: string): boolean => !text.trim() || (pointsElsewhere(text) && text.length < 80)
