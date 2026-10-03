import { describe, expect, it } from 'vitest'
import { firstLine, isVague, plainText, pointsElsewhere, withoutLabel } from './text'

describe('plainText', () => {
  it('turns paragraphs and list items into lines', () => {
    expect(plainText('<p>Huiswerk</p><p>Maak opgave 4 van les 26.</p>')).toBe('Huiswerk\nMaak opgave 4 van les 26.')
    expect(plainText('<ul><li>blz 24</li><li>blz 25</li></ul>')).toBe('• blz 24\n• blz 25')
  })

  it('decodes entities and drops every tag', () => {
    expect(plainText('Maak tekening af&nbsp;')).toBe('Maak tekening af')
    expect(plainText('A &amp; B &#233;&#x20AC;')).toBe('A & B é€')
    expect(plainText('<script>alert(1)</script><b>vet</b>')).toBe('alert(1)vet')
  })

  it('handles nothing', () => {
    expect(plainText(null)).toBe('')
  })
})

describe('labels and vagueness', () => {
  it('drops a bare homework heading', () => {
    expect(withoutLabel('Huiswerk\nLees blz 20')).toBe('Lees blz 20')
    expect(withoutLabel('Huiswerk')).toBe('')
    expect(withoutLabel('Huiswerkopdracht maken')).toBe('Huiswerkopdracht maken')
  })

  it('spots work that lives elsewhere', () => {
    expect(pointsElsewhere('Lever in via Teams opdrachten')).toBe(true)
    expect(pointsElsewhere('Maak opgave 4')).toBe(false)
  })

  it('calls short pointers vague, real instructions not', () => {
    expect(isVague('')).toBe(true)
    expect(isVague('Zie Teams')).toBe(true)
    expect(isVague('Maak tekening af')).toBe(false)
    expect(isVague('Vul je formulier zo volledig mogelijk in en lever het in via Teams opdrachten. Je vindt de opdracht ook daar.')).toBe(false)
  })

  it('takes the first line for a card', () => {
    expect(firstLine('one\ntwo')).toBe('one')
  })
})
