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
