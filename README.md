# 🎂 WhatsApp Birthday Bot

A WhatsApp group bot that manages birthdays and **automatically sends birthday wishes** every day. Built with Node.js and [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js).

---

## ✨ Features

- **🎂 Automatic Birthday Wishes** — Sends a randomized wish to your group every day at midnight
- **📊 Excel Import/Export** — Bulk import birthdays from `.xlsx` files
- **➕ Add/Update/Delete** — Manage birthdays via simple chat commands
- **📅 View Upcoming** — See today's birthdays and upcoming ones
- **📄 Template Generator** — Get a pre-formatted Excel template to fill in
- **💾 Persistent Session** — Scan QR code only once; session is saved

---

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Node.js v18 or higher** — [Download here](https://nodejs.org/)
2. **A WhatsApp account** — Use a **secondary/spare phone number** (recommended)
3. **A WhatsApp group** where the bot will operate

> ⚠️ **Important:** `whatsapp-web.js` is an unofficial library. Using it carries a small risk of your number being banned by WhatsApp. Always use a secondary number and avoid spamming.

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd whatsapp-birthday-bot
npm install
```

### Step 2: Start the Bot

```bash
npm start
```

### Step 3: Scan the QR Code

1. A QR code will appear in your terminal
2. Open **WhatsApp** on your phone
3. Go to **Settings → Linked Devices → Link a Device**
4. Scan the QR code
5. The bot will print: `🟢 Bot is READY and connected to WhatsApp!`

### Step 4: Find Your Group ID

1. After the bot connects, send **any message** in your target WhatsApp group
2. Check the terminal — the bot logs the Group ID:
   ```
   📨 Group: "Family Group" | ID: 120363012345678901@g.us
   ```
3. Copy the Group ID

### Step 5: Configure the Group

1. Open `config.js`
2. Replace `YOUR_GROUP_ID@g.us` with your actual Group ID:
   ```javascript
   TARGET_GROUP_ID: '120363012345678901@g.us',
   ```
3. Restart the bot: `npm start`

**🎉 You're all set!** The bot is now active in your group.

---

## 💬 Bot Commands

Send these commands in your WhatsApp group:

| Command | Description | Example |
|---|---|---|
| `!help` | Show all commands | `!help` |
| `!add <name> <date>` | Add a birthday | `!add Rohan 15-08-1995` |
| `!update <name> <date>` | Update a birthday | `!update Rohan 20-08-1995` |
| `!delete <name>` | Remove a birthday | `!delete Rohan` |
| `!list` | List all birthdays | `!list` |
| `!today` | Show today's birthdays | `!today` |
| `!upcoming` | Next 7 days' birthdays | `!upcoming` |
| `!upcoming <N>` | Next N days' birthdays | `!upcoming 30` |
| `!import` | Import from Excel (attach file) | Send `.xlsx` with caption `!import` |
| `!export` | Export to Excel | `!export` |
| `!template` | Get sample Excel template | `!template` |

> 📌 **Date format:** Always use `DD-MM-YYYY` (e.g., `15-08-1995`)

---

## 📊 Excel Import

### How to bulk import birthdays:

1. Send `!template` in the group to get a sample Excel file
2. Fill it in with your data:

   | Name | Birthday |
   |---|---|
   | Rahul Sharma | 15-08-1995 |
   | Priya Patel | 25-12-1998 |

3. Send the filled `.xlsx` file in the group with the caption `!import`
4. The bot will import all valid entries and report results

### Supported date formats in Excel:
- `DD-MM-YYYY` (e.g., `15-08-1995`) — **recommended**
- `DD/MM/YYYY` (e.g., `15/08/1995`)
- `YYYY-MM-DD` (e.g., `1995-08-15`)
- Excel date format (auto-detected)

---

## ⚙️ Configuration

Edit `config.js` to customize:

```javascript
module.exports = {
  TARGET_GROUP_ID: '120363XXXXXXXXXX@g.us',  // Your group ID
  RESPOND_IN_ALL_GROUPS: false,               // true = respond in all groups
  WISH_CRON: '0 8 * * *',                    // When to check (8:00 AM)
  COMMAND_PREFIX: '!',                        // Command prefix
  WISH_MESSAGES: [                            // Customize wish messages
    '🎂 Happy Birthday, {name}! 🎉',
    // ... add more
  ],
};
```

### Cron Schedule Examples

| Expression | Schedule |
|---|---|
| `0 8 * * *` | Every day at 8:00 AM (default) |
| `0 9 * * *` | Every day at 9:00 AM |
| `0 0 * * *` | Every day at midnight |
| `*/1 * * * *` | Every minute (testing only!) |

---

## 🌐 Deployment (Keep Bot Running 24/7)

### Deploy on Render (Recommended)

Render is a modern cloud provider that is great for hosting Node.js apps. We use a `Dockerfile` to automatically handle all the complex browser dependencies required by the bot.

**Prerequisites:**
1. Push your project code (including the provided `Dockerfile`) to a GitHub repository.
2. Sign up for a [Render account](https://render.com/).

**Step-by-step Setup:**
1. In your Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub account and select your bot's repository.
3. Render will automatically detect the `Dockerfile`. Ensure the **Environment** is set to **Docker**.
4. **Persistent Disk (Crucial for WhatsApp Session):**
   - Scroll down to **Advanced** settings.
   - Click **Add Disk**.
   - **Name:** `bot-data` (or anything you prefer).
   - **Mount Path:** `/app/data`
   - *Why?* This prevents you from having to scan the QR code every time Render restarts the server.
5. Click **Create Web Service**.

**Connecting to WhatsApp (First Run):**
1. Once the service deploys, click on the **Logs** tab in Render.
2. You will see a QR code generated in the logs.
3. Open WhatsApp on your phone → Settings → Linked Devices → Link a Device.
4. Scan the QR code shown on your computer screen.
5. The session is now saved to the persistent disk, and the bot is online!

> ⚠️ **Note on Render Free Tier:** Render's free Web Services "sleep" after 15 minutes of inactivity. If the bot sleeps, it won't be able to run the 8:00 AM cron job. To keep it running 24/7 without sleeping, you can upgrade to a **Background Worker** or the lowest paid Web Service tier ($7/month).

---

## 📁 Project Structure

```
whatsapp-birthday-bot/
├── index.js                  # Main entry point
├── config.js                 # Bot configuration
├── package.json
├── .gitignore
├── handlers/
│   ├── commandHandler.js     # Chat command routing
│   └── birthdayChecker.js    # Daily birthday cron job
├── services/
│   ├── birthdayService.js    # Birthday CRUD operations
│   └── excelService.js       # Excel import/export
├── utils/
│   └── dateUtils.js          # Date helpers
├── data/
│   ├── birthdays.json        # Birthday data (auto-created)
│   └── sample.xlsx           # Excel template (auto-created)
└── README.md
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|---|---|
| QR code not appearing | Make sure no other WhatsApp Web session is active |
| "Auth failure" error | Delete the `.wwebjs_auth` folder and restart |
| Bot not responding in group | Check that `TARGET_GROUP_ID` is correctly set in `config.js` |
| Bot not sending wishes | Verify the cron expression in `config.js` and that the group ID is set |
| Excel import fails | Ensure columns are named `Name` and `Birthday`; use `DD-MM-YYYY` format |
| "Execution context was destroyed" | The bot lost connection; PM2 will auto-restart it |

---

## 📜 License

MIT License — feel free to use and modify!
