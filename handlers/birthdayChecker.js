/**
 * Birthday Checker
 * ----------------
 * Runs on a cron schedule to check for today's birthdays
 * and send automated wishes to the configured WhatsApp group.
 */

const cron = require('node-cron');
const config = require('../config');
const birthdayService = require('../services/birthdayService');

// Track sent wishes to avoid duplicates (resets on restart, which is fine
// since the cron runs once per day and we check the date)
const sentToday = new Set();

/**
 * Get a random birthday wish message with the name inserted.
 * @param {string} name - Birthday person's name
 * @returns {string}
 */
function getWishMessage(name) {
  const messages = config.WISH_MESSAGES;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex].replace(/\{name\}/g, name);
}

/**
 * Check for today's birthdays and send wishes.
 * @param {object} client - whatsapp-web.js Client object
 */
async function checkAndSendWishes(client) {
  console.log('🔍 Checking for birthdays today...');

  const todayBirthdays = birthdayService.getTodayBirthdays();

  if (todayBirthdays.length === 0) {
    console.log('📅 No birthdays today.');
    return;
  }

  console.log(`🎂 Found ${todayBirthdays.length} birthday(s) today!`);

  const groupId = config.TARGET_GROUP_ID;

  if (groupId === 'YOUR_GROUP_ID@g.us') {
    console.warn('⚠️ TARGET_GROUP_ID is not configured! Update config.js with your group ID.');
    console.warn('   Birthday wishes will NOT be sent until this is set.');
    return;
  }

  for (const birthday of todayBirthdays) {
    // Create a unique key for today's wish to avoid duplicates
    const today = new Date().toDateString();
    const wishKey = `${birthday.name}-${today}`;

    if (sentToday.has(wishKey)) {
      console.log(`⏭️ Already sent wish to ${birthday.name} today, skipping.`);
      continue;
    }

    try {
      const message = getWishMessage(birthday.name);

      await client.sendMessage(groupId, message);
      sentToday.add(wishKey);

      console.log(`🎉 Sent birthday wish to ${birthday.name}!`);

      // Add a small delay between messages to avoid rate limiting
      if (todayBirthdays.indexOf(birthday) < todayBirthdays.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error(`❌ Failed to send wish to ${birthday.name}:`, err.message);
    }
  }
}

/**
 * Start the birthday checker cron job.
 * @param {object} client - whatsapp-web.js Client object
 */
function startBirthdayChecker(client) {
  const cronExpression = config.WISH_CRON;

  if (!cron.validate(cronExpression)) {
    console.error(`❌ Invalid cron expression: "${cronExpression}". Check config.js`);
    return;
  }

  console.log(`⏰ Birthday checker scheduled: "${cronExpression}"`);
  console.log(`   (Default: every day at midnight)`);

  // Schedule the cron job
  cron.schedule(cronExpression, async () => {
    console.log(`\n🕐 [${new Date().toLocaleString()}] Cron triggered — checking birthdays...`);

    // Clear the sent-today set at the start of each day
    sentToday.clear();

    await checkAndSendWishes(client);
  });

  // Also check immediately on startup (in case the bot was down during the scheduled time)
  console.log('🔄 Running initial birthday check...');
  checkAndSendWishes(client);
}

module.exports = { startBirthdayChecker, checkAndSendWishes };
