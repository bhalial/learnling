# Chrome Web Store listing

What goes into the Chrome Web Store dashboard for the extension. Upload
`Learnling-extension-<version>.zip` from the GitHub release (or zip `extension/out` yourself: the
manifest must sit at the root of the zip).

## Store listing

**Name:** Learnling

**Summary** (manifest description, at most 132 characters):
A two-week homework planner with a study buddy. Works with Magister.

**Category:** Education · **Languages:** Dutch, English

**Description (NL):**

> Learnling zet je huiswerk en toetsen van twee weken op één plek, met een pixelmaatje dat je helpt
> onthouden wat er moet gebeuren.
>
> • Twee weken in één boek: deze week en volgende week, met de lessen van elke dag erboven.
> • Koppel Magister en je lessen, huiswerk en toetsen komen er vanzelf in. Learnling leest alleen en
>   verandert nooit iets. Geen Magister? Typ het zelf in.
> • Staat er alleen "zie Teams"? Dan schrijf je in je eigen woorden op wat je moet doen.
> • Oefenrondes voor toetsen, vanzelf gepland in de dagen ervoor.
> • Na school vertelt je maatje wat er nog wacht.
> • Zes thema's: een toverboek, een moestuin, een duik in de oceaan, een ruimtemissie, een questlog
>   of een gewoon schrift. Kies een kat, hond, papegaai, walvis of robot en geef hem een naam.
>
> Gratis, zonder account, zonder reclame en zonder trackers. Alles blijft op je eigen apparaat.
> Magister is een merk van Iddink; Learnling is daar niet aan verbonden.

**Description (EN):**

> Learnling puts two weeks of homework and tests in one place, with a pixel buddy who helps you
> remember what needs doing.
>
> • Two weeks in one book: this week and next, with each day's lessons on top.
> • Connect Magister and your lessons, homework and tests come in by themselves. Learnling only
>   reads and never changes a thing. No Magister? Type it in yourself.
> • Does it just say "see Teams"? Write down in your own words what you need to do.
> • Training rounds for tests, planned in the days before them all by themselves.
> • After school your buddy tells you what's still waiting.
> • Six themes: a spellbook, a vegetable garden, an ocean dive, a space mission, a questlog or a
>   plain notebook. Pick a cat, dog, parrot, whale or robot and give it a name.
>
> Free, with no account, no ads and no trackers. Everything stays on your own device.
> Magister is a trademark of Iddink; Learnling is not affiliated with it.

**Screenshots** (1280 × 800): the demo book in three themes, made with the extension's demo
switch (`app.html?demo=1&today=2026-09-30&theme=…&lang=…`).

**Website:** https://bhalial.github.io/learnling/ · **Privacy policy:**
https://bhalial.github.io/learnling/privacy.html

**Visibility:** Unlisted (only reachable through the link on the website).

## Privacy practices

**Single purpose:** Plan homework and tests for two weeks, optionally filled from the student's
own Magister agenda.

**Permissions:**

| Permission | Why |
| --- | --- |
| `storage` | The homework book is kept on the device, in the extension's storage. |
| `alarms` | Once a minute it checks whether the after-school reminder is due, also when the book is closed. |
| `notifications` | The after-school reminder. |
| `scripting` | Puts a small script on the school's Magister pages, only after the user connects Magister, to hand over the login token Magister itself keeps. |
| `https://*.magister.net/*` (optional) | Asked for only when the user connects Magister: reading their lessons, homework and tests. Taken back on Disconnect. |

**Remote code:** No, all code is in the package.

**Data usage:** the extension handles *authentication information* (Magister's access token, kept
in memory and sent only to Magister itself) and *personally identifiable information* (the
student's first name from Magister, shown in Settings and kept on the device). Nothing is sent
to the developer or anyone else. Tick the three certifications: not sold, not used for anything
unrelated to the single purpose, not used for creditworthiness or lending.
