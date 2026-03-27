# AI Compendium — conversation handoff (fallback context)

This file records what was implemented across recent sessions so you (or an assistant) can resume without re-deriving context. **Safe to delete** once no longer needed; it is not required for the app to run.

## User intent (high level)

- Improve the **Add tool or resource** modal: field order, tag entry UX, visual consistency with the rest of the app, and **OpenAI-powered tag suggestions** on the server.
- User may ask to **revert** specific UX (e.g. composite tag box) via git history; see “Revert” below.

## Configuration (secrets)

- **OpenAI**: Set `OPENAI_API_KEY` in `ai-compendium/.env` (file is **gitignored**). Copy from `.env.example`.
- Optional: `OPENAI_SUGGEST_MODEL` (default `gpt-4o-mini` in server).
- Server loads env via `require('dotenv').config({ path: path.join(__dirname, '.env') })` in `server.js`.
- If the key is missing, the suggest-tags API returns `unavailableReason: 'no_api_key'` and the UI shows a short message; manual tags still work.

## Add-resource modal — form order

1. **Title** (required)  
2. **Link** (optional)  
3. **Tags** (optional)  
4. Description, Examples, Save  

Helper copy under tags: comma-separated tags; suggestions when there is enough **title or link** (and related server logic).

## Tag entry UX (composite “chip” field)

- **Markup**: `#addTagsComposite` wraps `#addTagChips` + `#addTagInput` (`public/index.html`).
- **Behavior** (`public/app.js`):
  - Typing a **comma** completes a segment into a pill; remainder stays in the input.
  - **Enter** or **blur** commits the current input as a pill if non-empty.
  - **Duplicate tags**: `addTagReplacingDuplicate()` removes any existing pill with the same normalized token and **pushes the new one at the end** (user-entered instance “wins”).
  - **Suggestions**: `fetchSuggestTagsForAddForm()` POSTs to `/api/resources/suggest-tags` with title, url, description, `currentTags`; debounced on title/url/description input.
  - Clicking the composite (not the ×) **focuses** the tag input.
- **Styling** (`public/styles.css`):
  - Composite uses same **padding** as other modal inputs (`10px 12px`), same **blue-tint** background/border as `#addForm input`/`textarea`, same **focus** ring via `#addForm .add-tags-composite:focus-within`.
  - **Gap** between pills: `8px` (aligned with `.chips` in sidebar).
  - `.add-tag-chips` uses `display: contents` so pills sit in the same flex row as the inline input.
- **Revert**: To go back to “pills above a full-width input”, restore prior versions of `index.html`, `app.js`, and `styles.css` from git before the composite-chip changes.

## Tag pills — visual consistency (“everywhere”)

- **Shared** `.tag-pill`: `inline-flex`, `align-items: center`, `font-size: 12px`, `line-height: 1.25`, `font-weight: 400`, same padding/border/radius as before; `button.tag-pill` and `span.tag-pill` use `font-family: inherit`.
- **Sidebar** (`#tagList`): `button.tag-pill` with inline `--tag-bg` / `--tag-border` / `--tag-fg` from `tagPillStyleVars()` in `app.js`.
- **Add form**: `span.tag-pill.add-form-tag-chip` + `.add-form-tag-text` + remove button; **same** pill chrome as sidebar; remove control sized to match pill text (`12px` ×).
- Removed the rule that disabled hover **filter** on add-form chips so hover matches other pills.
- **Theme colors** still come from `getTagThemeStyle` / `TAG_THEME_RULES` / `pastelTagColors` in `app.js`.

## Server — suggest tags

- Endpoints and logic live in `server.js` (search `OPENAI_API_KEY`, `suggest-tags`).
- Client message when `no_api_key` is set in `app.js` (`fetchSuggestTagsForAddForm`).

## Files touched in this work (typical)

| Area | Files |
|------|--------|
| UI structure | `public/index.html` |
| Client logic | `public/app.js` |
| Styles | `public/styles.css` |
| API / OpenAI | `server.js` |
| Env template | `.env.example` |
| Data | `data/resources.json` (content changes as user adds resources) |

## Next change (queued by user)

User indicated they will **change something later**; no spec yet. When resuming, read this file plus `git log -p` for the latest commit on `main`.

## Git

- Branch: **main** (as of handoff).
- After edits: `git add -A`, commit with a clear message, `git push origin main`.

---
*Written for session handoff on 2026-03-27.*
