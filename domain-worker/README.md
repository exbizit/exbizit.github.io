# Mary's White Lie domain

This Worker serves the current hoster.band build on maryswhitelie.com.
The app detects that hostname, opens Mary's White Lie, and defaults new visitors
to the alternative desktop layout. A visitor can still choose the primary view.
Other content pages switch to hoster.band; wallpaper settings stay on the desktop.

## Connect the domain

1. In Cloudflare, add `maryswhitelie.com` as a domain and select the Free plan.
2. Review imported DNS records; preserve any email records in use.
3. Copy the two nameservers Cloudflare assigns.
4. At Namecheap: Domain List → Manage → Nameservers → Custom DNS. Enter those
   two nameservers and save. The domain remains registered at Namecheap.
5. Wait until Cloudflare marks the domain Active, then deploy from the repo root:

   ```sh
   worker/node_modules/.bin/wrangler deploy --config domain-worker/wrangler.toml
   ```

Custom Domains provision the Worker DNS records and HTTPS certificates.
Do not replace hoster.band in the GitHub Pages settings or public/CNAME.

Verify the Mary's homepage opens its desktop window, other band/booking links
switch to hoster.band, and hoster.band keeps its existing default view.
