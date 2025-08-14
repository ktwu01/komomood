Manual and automated checks for komomood

1) API health via Nginx
- curl https://us-south.20011112.xyz/komomood/api/health
  Expect: {"status":"ok"}

2) API entries via Nginx
- curl https://us-south.20011112.xyz/komomood/api/entries
  Expect: JSON array (possibly empty [])

3) Frontend reachable
- curl -I https://us-south.20011112.xyz/komomood/
  Expect: HTTP/2 200

4) Frontend fetches backend
- Open https://us-south.20011112.xyz/komomood/ in browser
- Check console for: 成功通过 /komomood/api 加载 ... 条心情记录
  If API fails, fallback logs: 已使用本地 JSON 作为后备

5) pm2 process
- pm2 status | grep komomood-backend
  Expect: online

6) Minimal POST test (via Nginx)
- Ensure `jq` is installed (`sudo apt-get install -y jq`)
- Run test script:
  ```bash
  bash tests/post_entry.sh
  ```
  Accept: HTTP 201 (created) or HTTP 409 (duplicate date). Script prints debug info and a PASS/FAIL line.

7) Overwrite flow test (via Nginx)
- Description: Validates create → conflict → overwrite behavior.
- Run:
  ```bash
  bash tests/overwrite_flow.sh
  ```
  Expect:
  - First POST: 201 (or 409 if already existing)
  - Second POST same date: 409
  - Third POST with overwrite=true: 200

8) Production assets verification
- Open DevTools → Network on the site page:
  - Confirm `assets/tailwind.css` loads with 200
  - Confirm there is no request to `cdn.tailwindcss.com`
  - Confirm `assets/favicon.svg` loads with 200; no favicon 404 in Console

9) Process/port checks and troubleshooting
- Process:
  ```bash
  pm2 status | grep komomood-backend || pm2 status
  pm2 logs komomood-backend --lines 100
  pm2 restart komomood-backend
  ```
- Ports (expect only pm2-managed backend on 3002):
  ```bash
  ss -tulpn | grep ':3002'
  ```
  If a manual Node process is occupying 3002, terminate it cautiously:
  ```bash
  kill <PID> || true; sleep 1; kill -9 <PID> || true
  ```
  Note: Do not terminate services listening on 3000/3001 (reserved for `clip`).

10) Nginx validation
- Test and reload after changes:
  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```
- Health via Nginx should remain 200/ok.

11) Deployment convention (production web root)
- Sync only the following to `/var/www/komomood/`:
  - `index.html`
  - `app.js`
  - `assets/` (at minimum: `tailwind.css`, `favicon.svg`)
- Do NOT deploy the `data/` directory. The file `data/entries.json` remains in the repo for local/dev fallback only and is not used in production.

7) Overwrite flow test
- Run:
  ```bash
  bash tests/overwrite_flow.sh
  ```
  Expect:
  - First POST: 201
  - Second POST same date without overwrite: 409
  - Third POST same date with overwrite=true: 200
