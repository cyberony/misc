# Continue tomorrow — conversation handoff

**Date saved:** 2026-03-28

## Last topic: test here, then replicate on Mac mini

**Q:** Can I test the setup on this computer and then replicate on a Mac mini?

**A (summary):** Yes. Same stack on both: Node, `npm install`, `npm start`, same `ai-compendium` tree. On the Mini: install Node (same major version if possible), clone/copy the project, recreate `.env` (don’t copy secrets insecurely). Data: fresh `data/resources.json` on the Mini is fine, or copy once if you want the same catalog/users (treat as sensitive). Change **`PUBLIC_BASE_URL`** (and anything URL-specific) for the Mini’s real hostname/tunnel. Document the exact commands you use here (start, tunnel, proxy) and repeat on the Mini; failures are usually **network** (ports, CGNAT), not laptop vs Mac mini.

## Earlier context (same thread, for reference)

- **Hosting outside school on a Mac mini:** Feasible. Home network: you may need public IP + port forwarding, or deal with CGNAT/ISP blocks; **Cloudflare Tunnel** avoids inbound ports. Mac mini is fine for this Node app; persist `data/`.
- **University network:** Often can’t rely on public IP + inbound; tunnel or VPN mesh for remote access; LAN IP may work for on-campus only.
- **Deployment recap:** Single Node process, `PORT`, persistent `data/resources.json`, `PUBLIC_BASE_URL`, SMTP for password reset, prefer one writer to the JSON file.

## Repo / code notes

- **Pushed:** `main` includes admin Account Roles fix (`fetchAdminUsers` after login), commit `059b7a1`.
- **`data/resources.json`:** Local session/runtime changes were intentionally **not** committed (avoid putting sessions in git).

When you return, say what you want next (e.g. Mac mini step-by-step, tunnel, `.gitignore` for `data/`, etc.).
