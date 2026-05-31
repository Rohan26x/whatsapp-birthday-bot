/**
 * Bot Configuration
 * -----------------
 * Edit these values to customize your birthday bot.
 */

module.exports = {
  // ─── Group Settings ──────────────────────────────────────────────
  // The WhatsApp Group ID where birthday wishes will be sent.
  // To find this: start the bot, send a message in your group,
  // and check the console log for the Group ID (format: 120363XXXXXXXXXX@g.us)
  TARGET_GROUP_ID: 'YOUR_GROUP_ID@g.us',

  // Set to true to allow the bot to respond to commands in ANY group it's in.
  // Set to false to restrict commands to only the TARGET_GROUP_ID.
  RESPOND_IN_ALL_GROUPS: false,

  // ─── Birthday Wish Schedule ──────────────────────────────────────
  // Cron expression for when to check & send birthday wishes.
  // Default: '0 0 * * *' = every day at midnight (00:00)
  // Examples:
  //   '0 8 * * *'  = every day at 8:00 AM
  //   '0 0 * * *'  = every day at midnight
  //   '*/1 * * * *' = every minute (for testing only!)
  WISH_CRON: '0 8 * * *',

  // ─── Birthday Wish Messages ──────────────────────────────────────
  // The bot picks a random message from this list each time.
  // Use {name} as a placeholder — it will be replaced with the person's name.
  WISH_MESSAGES: [
    '🎂🎉 *Happy Birthday, {name}!* 🎉🎂\nWishing you a day filled with love, laughter, and all your favorite things! 🥳🎁',
    '🌟 *Happy Birthday, {name}!* 🌟\nMay this year bring you endless joy and amazing adventures! 🎈🎊',
    '🎁 *It\'s {name}\'s Birthday today!* 🎁\nLet\'s all wish them the happiest birthday ever! 🥳🎂🎉',
    '🥳 *Happiest Birthday to {name}!* 🥳\nHope your special day is as wonderful as you are! 💖🎈',
    '🎊 *Birthday Alert!* 🎊\n*{name}* is celebrating their birthday today! Wishing you all the best! 🎂🎁🌟',
  ],

  // ─── Command Settings ────────────────────────────────────────────
  // The prefix for bot commands (e.g., !help, !add)
  COMMAND_PREFIX: '!',

  // ─── File Paths ──────────────────────────────────────────────────
  DATA_DIR: './data',
  BIRTHDAYS_FILE: './data/birthdays.json',
  TEMPLATE_FILE: './data/sample.xlsx',
};
