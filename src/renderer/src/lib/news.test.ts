import { describe, expect, it } from 'vitest'
import { NEWS, newer, newsFor, type News } from './news'

const item = (version: string): News => ({ version, text: { en: `en ${version}`, nl: `nl ${version}` } })
const LIST = [item('0.7.0'), item('0.6.0'), item('0.5.1')]

describe('newer', () => {
  it('compares versions number by number', () => {
    expect(newer('0.5.10', '0.5.9')).toBe(true)
    expect(newer('0.6.0', '0.5.12')).toBe(true)
    expect(newer('0.5.1', '0.5.1')).toBe(false)
    expect(newer('0.5.0', '0.5.1')).toBe(false)
  })
})

describe('newsFor', () => {
  it('tells a book from before there was news the newest it can', () => {
    expect(newsFor(undefined, '0.6.0', LIST)?.version).toBe('0.6.0')
  })

  it('stays quiet once heard, and for a new book', () => {
    expect(newsFor('0.6.0', '0.6.0', LIST)).toBeNull()
    expect(newsFor('0.6.2', '0.6.2', LIST)).toBeNull()
  })

  it('tells what a later version brought, only the newest after skipping some', () => {
    expect(newsFor('0.6.0', '0.7.0', LIST)?.version).toBe('0.7.0')
    expect(newsFor('0.5.0', '0.7.3', LIST)?.version).toBe('0.7.0')
  })

  it('never tells about a version the app does not have yet', () => {
    expect(newsFor('0.5.0', '0.5.0', LIST)).toBeNull()
  })

  it('keeps its own list newest first, in both languages', () => {
    for (let i = 1; i < NEWS.length; i++) expect(newer(NEWS[i - 1].version, NEWS[i].version)).toBe(true)
    for (const news of NEWS) expect(news.text.en && news.text.nl).toBeTruthy()
  })
})
