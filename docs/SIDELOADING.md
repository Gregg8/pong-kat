# Installing Pong on your iPhone (Windows, no paid dev account)

This is the **Route A** workflow: a cloud macOS runner builds an **unsigned**
`.ipa`, and your Windows PC re-signs + installs it with your **free** Apple ID.

> Free Apple ID limits: up to **3 sideloaded apps** at once, and each app's
> certificate **expires after 7 days** — just re-install to refresh it. (These
> are Apple's limits for free accounts; a paid $99/yr account removes them. The
> EU-only AltStore PAL also removes them, but that's not available in Australia.)

## One-time setup on the Windows PC

1. Install **iTunes** and **iCloud** — get the versions from **apple.com**, not
   the Microsoft Store (the Store versions don't expose the drivers Sideloadly
   needs).
2. Download **Sideloadly** from <https://sideloadly.io> and install it.
3. Plug the iPhone into the PC with a cable and tap **Trust** on the phone.

## Each time you want the latest build

1. **Get the `.ipa`:** in this GitHub repo, open the **Actions** tab → the
   **"Build unsigned iOS IPA"** run → download the **`Pong-unsigned-ipa`**
   artifact (a `.zip`) and unzip it to get `Pong-unsigned.ipa`.
   - You can also start a build on demand: Actions → *Build unsigned iOS IPA* →
     **Run workflow**.
2. **Sideload it:**
   - Open Sideloadly, make sure the iPhone is selected.
   - Drag `Pong-unsigned.ipa` into the Sideloadly window.
   - Enter your **Apple ID** (a free one is fine; an app-specific password is
     recommended if you use 2FA).
   - Click **Start**. Sideloadly signs and installs it.
3. **Trust the developer cert on the phone (first install only):**
   Settings → General → **VPN & Device Management** → tap your Apple ID →
   **Trust**.
4. Launch **Pong** from the home screen. 🏓

## Refreshing before 7 days

The app stops launching once the 7-day cert expires. Just repeat the "Each time"
steps with the same `.ipa` to re-sign for another 7 days. (Apps like
**SideStore** can auto-refresh over Wi-Fi without re-plugging — a later option
if the weekly step gets annoying.)

## When the Mac Mini arrives

Nothing here gets thrown away. The same `ios/` Capacitor project opens in Xcode;
you just build + install directly from the Mac (free 7-day provisioning, or a
paid account to ship on the App Store). The cloud build stays useful for making
`.ipa`s without tying up the Mac.

## Troubleshooting

- **"App not found in archive" / build fails in Actions** — open the failed run
  logs; it's almost always a transient runner or Xcode version issue. Re-run.
- **Sideloadly "provisioning" errors** — sign out/in of the Apple ID in
  Sideloadly; ensure iTunes + iCloud are the apple.com (not Store) versions.
- **App won't open after a week** — that's the expected 7-day expiry; re-sideload.
