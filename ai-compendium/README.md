# AI Compendium (MVP)

Local, file-backed web compendium for AI tools/resources.

## Run it locally
```bash
cd misc/ai-compendium
npm install
npm start
```

Then open:
```text
http://localhost:3000
```

## Data model (for now)
Resources are stored in:
`data/resources.json`

Each resource has:
- `id`
- `title`
- `category` (optional legacy field; UI is tag-only)
- `tags` (array of strings)
- `url` (optional)
- `description`
- `examples` (optional text)
- `votes` (integer)
- `createdAt`, `updatedAt`

## API
- `GET /api/resources` (optional `tag`, `q`; `category` still supported for API/filter scripts)
- `GET /api/resources/:id`
- `POST /api/resources` (create)
- `POST /api/resources/:id/vote` with `{ delta: 1 | -1 }`

