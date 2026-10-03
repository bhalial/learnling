# Magister: what the agenda data looks like

Observed in October 2026 in the Magister web app (agenda screen), read-only, over four
weeks of one secondary-school timetable. No official API exists; this is what the
web app itself requests. Nothing here is written back to Magister, ever.

## Requests

| Purpose | Request |
| --- | --- |
| Who is logged in | `GET /api/account` → `Persoon.Id` |
| Children of a parent account | `GET /api/personen/{parentId}/kinderen` → `Items[].{Id, Roepnaam}` |
| Lessons + homework + tests | `GET /api/personen/{personId}/afspraken?status=1&van=YYYY-MM-DD&tot=YYYY-MM-DD` |

All on `https://<school>.magister.net`, with `Authorization: Bearer <access_token>`.

## Login

- OIDC via `accounts.magister.net`; the web app keeps the user object in
  `sessionStorage` under `oidc.user:https://accounts.magister.net:M6-<school>.magister.net`.
- The access token lives about an hour and there is **no refresh token**. The web app
  renews silently through its session cookie on `accounts.magister.net`.
- Plan for the app: a persistent Electron session; load the school page in a hidden window,
  let Magister's own code renew the token, read it from `sessionStorage`. Only when that
  fails, show the real login window. No password is ever stored.

## An appointment (`Items[]`)

| Field | Seen | Use in Learnling |
| --- | --- | --- |
| `Id` | stable number | `Task.externalId` (sync key) |
| `Start`, `Einde` | UTC timestamps | lesson date → `given.due` |
| `LesuurVan`, `LesuurTotMet` | lesson hour (always equal so far) | timetable order |
| `Type` | always `13` (lesson) | only lessons so far |
| `Status` | `1` (52×), `7` (20×, mostly lessons with content), `3` (3×) | meaning of 3 still unknown |
| `InfoType` | `0` nothing (50×), `1` homework (20×), `2` test (5×) | `1` → homework, `2` → test |
| `Inhoud` | HTML or `null` | the text; **sanitise to plain text, never render** |
| `Vakken[]` | `{ Id, Naam }` | subject; `Id` is stable |
| `Omschrijving` | `"<code> - <teacher> - <class>"` | not needed |
| `Afgerond` | always `false` | ignored; we never write back |
| `HeeftBijlagen` | always `false` here | maybe later |

`InfoType` values not seen yet (unofficial sources): 3 exam, 4 quiz (SO), 5 oral, 6 info.
Map 4 → quiz and treat unknown values as homework until we see them.

## What the content is really like

- **Every homework item had text** in these four weeks. The problem is not empty items,
  it is items that do not say *what* to do:
  - half have no page, chapter or exercise reference at all (16–39 characters);
  - a handful point elsewhere ("in Teams opdrachten");
  - a few are long (up to ~800 characters, several paragraphs).
- **Tests come with their material** in the text (chapter/§ references in 4 of 5) — the
  future test card can show it straight from Magister.
- Homework sits on the lesson it is due for, which matches `given.due`.
- A whole week without lessons appeared (autumn holiday): the book should show that calmly
  ("no lessons") instead of looking like nothing is known.

## Subjects

Names are inconsistent (`Nederlands_`, `English_`, `mathematics_`, `music`, …). On the first sync:
match on `Vakken[].Id`, clean the name (trailing `_`, capital), and allow renaming and
recolouring; keep the Magister id on the subject so renaming never breaks the match.

## Consequences for the sync phase

1. Show the first sentence of a teacher's text, the rest behind "read the whole scroll".
2. A *mystery scroll* from Magister means: no text, no concrete reference, or "see Teams".
   It can always be written down in one's own words (`own.note`).
3. The timetable can come from Magister's lessons instead of the hand-made template.
4. Sanitise `Inhoud` (it is HTML from teachers) before it goes anywhere near the DOM.
