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

### Option 1: Your PC with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot with PM2
pm2 start index.js --name "birthday-bot"

# Save the process list
pm2 save

# Auto-start on PC boot (Windows)
pm2 startup
```

> ⚠️ Your PC must stay **on and connected** to the internet at all times.

### Option 2: Free VPS — Oracle Cloud (Recommended)

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) → "Always Free" tier
2. Create a compute instance (Ubuntu, Ampere A1 — 1 OCPU, 6GB RAM — **free forever**)
3. SSH into the server:
   ```bash
   ssh ubuntu@YOUR_SERVER_IP
   ```
4. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
5. Clone and setup:
   ```bash
   git clone YOUR_REPO_URL
   cd whatsapp-birthday-bot
   npm install
   ```
6. First run — scan QR:
   ```bash
   node index.js
   ```
7. After QR scan, stop and use PM2:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "birthday-bot"
   pm2 save
   pm2 startup
   ```

### Option 3: AWS EC2 Free Tier (12 Months Free)

AWS offers a free tier for 12 months that works well, but note that it **expires after 1 year**, unlike Oracle which is forever free.

1. Sign up for [Amazon Web Services (AWS)](https://aws.amazon.com/free/).
2. Launch an **EC2 Instance**:
   - Choose **Ubuntu** as the OS.
   - Choose **t2.micro** or **t3.micro** (these are eligible for the free tier).
3. Connect to your instance via SSH:
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_AWS_IP
   ```
4. Follow the same Node.js, Git, and PM2 setup steps as the Oracle guide (Step 4-7 above).

> ⚠️ **Note on RAM:** The AWS Free Tier (t2.micro) only gives 1GB of RAM. Since `whatsapp-web.js` runs a headless browser, it can use a lot of memory. If it crashes, you may need to add a swap file to your Ubuntu instance.

### Option 4: Google Cloud Platform (Always Free)

GCP offers an `e2-micro` instance completely free in specific US regions (like `us-central1`, `us-east1`, `us-west1`).

1. Sign up at [Google Cloud](https://cloud.google.com/free).
2. Create a Compute Engine VM instance.
3. Select **e2-micro** in one of the eligible US regions.
4. Follow the same setup steps using PM2.

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
