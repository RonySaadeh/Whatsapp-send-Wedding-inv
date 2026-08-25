# WhatsApp Wedding Invitations

Sends a personalized wedding invitation to guests over WhatsApp, from your
own phone number. Two ways to use it:

- **`docs/` — static, GitHub Pages version.** Fill in Name / Phone / Message,
  click **Open in WhatsApp**, and it opens WhatsApp Web (or the app on
  mobile) with the chat and message pre-filled. You tap **Send** yourself.
  No install, no server — this is what runs at your GitHub Pages URL.
- **Root — local, automatic version.** A Node.js app using
  [`whatsapp-web.js`](https://wwebjs.dev/) that drives a real, logged-in
  WhatsApp Web session and sends messages for you (single message, or the
  full `contacts.csv` list) with one click — no manual tap needed. Must run
  on your own machine (or a server you control); GitHub Pages can't run it
  since it needs a persistent Node process holding your session.

## GitHub Pages version (docs/)

1. In the repo on GitHub: **Settings → Pages → Build and deployment → Source:
   Deploy from a branch**, branch `main`, folder `/docs`. Save.
2. GitHub gives you a URL like `https://<username>.github.io/<repo>/`. Open
   it, fill in Name / Phone / Message, click **Open in WhatsApp**, then tap
   Send inside WhatsApp.
3. Nothing here can send automatically — a static page hosted on GitHub
   Pages has no way to hold your logged-in session, so the manual tap is
   unavoidable with this approach.

## Local automatic version (Node app)

## 1. Install

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install
```

## 2. Edit your guest list

Open `contacts.csv` and replace the sample rows with your real guests.
Phone numbers must include the country code, digits only (no `+`, spaces,
or dashes), e.g. for Lebanon: `9613xxxxxxx`.

```csv
Name,Phone
Rony Saadeh,9613xxxxxxx
Reve Ghorayeb,9613xxxxxxx
```

## 3. Edit your message

Open `message-template.txt` and write your invitation. Use `{{Name}}`
anywhere you want the guest's name inserted:

```
Dear {{Name}},

With hearts full of joy, we invite you to celebrate our wedding!
...
```

## 4. Run it

```bash
npm start
```

The first time you run it, a QR code will print in the terminal. Open
WhatsApp on your phone → **Settings → Linked Devices → Link a Device**, and
scan it. Your session is saved locally in `.wwebjs_auth/` so you won't need
to scan again on future runs.

Once connected, open **http://localhost:3000** in your browser. You'll see
a preview of the message and a **Send Invitations** button. Click it to
send the personalized message to everyone in `contacts.csv`, one at a time,
with a short randomized delay between each (to keep sending safe and
natural rather than instant bulk-blasting).

## Notes

- This automates your personal WhatsApp Web session — it's not the
  official WhatsApp Business API, so use it responsibly and only for
  contacts who expect to hear from you (your actual guest list).
- Keep the guest list to real invitees. Sending to a large number of people
  who don't know you, or sending too fast, can get an account flagged by
  WhatsApp.
- `.wwebjs_auth/` contains your logged-in session — don't share or commit it
  (already in `.gitignore`).
