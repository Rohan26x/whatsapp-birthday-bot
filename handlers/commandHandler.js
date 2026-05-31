/**
 * Command Handler
 * ---------------
 * Parses incoming group messages and routes them to the
 * appropriate birthday service functions.
 */

const path = require('path');
const fs = require('fs');
const config = require('../config');
const birthdayService = require('../services/birthdayService');
const excelService = require('../services/excelService');
const { daysUntilBirthday, calculateAge } = require('../utils/dateUtils');

/**
 * Handle an incoming WhatsApp message.
 * @param {object} msg - whatsapp-web.js Message object
 * @param {object} client - whatsapp-web.js Client object
 */
async function handleMessage(msg, client) {
  try {
    const chat = await msg.getChat();

    // Only respond in groups
    if (!chat.isGroup) return;

    // If restricted to a specific group, check the ID
    if (
      !config.RESPOND_IN_ALL_GROUPS &&
      config.TARGET_GROUP_ID !== 'YOUR_GROUP_ID@g.us' &&
      chat.id._serialized !== config.TARGET_GROUP_ID
    ) {
      return;
    }

    const body = msg.body.trim();

    // Must start with the command prefix
    if (!body.startsWith(config.COMMAND_PREFIX)) return;

    // Parse command and arguments
    const parts = body.slice(config.COMMAND_PREFIX.length).trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Log the command for debugging
    const contact = await msg.getContact();
    const senderName = contact.pushname || contact.name || msg.author || 'Unknown';
    console.log(`📩 Command: !${command} | From: ${senderName} | Group: ${chat.name}`);

    // Route commands
    switch (command) {
      case 'help':
        await handleHelp(msg);
        break;

      case 'add':
        await handleAdd(msg, args, senderName);
        break;

      case 'update':
        await handleUpdate(msg, args);
        break;

      case 'delete':
      case 'remove':
        await handleDelete(msg, args);
        break;

      case 'list':
      case 'all':
        await handleList(msg);
        break;

      case 'today':
        await handleToday(msg);
        break;

      case 'upcoming':
        await handleUpcoming(msg, args);
        break;

      case 'import':
        await handleImport(msg, client);
        break;

      case 'export':
        await handleExport(msg, client);
        break;

      case 'template':
        await handleTemplate(msg, client);
        break;

      default:
        await msg.reply(
          `❓ Unknown command: *!${command}*\nType *!help* to see all available commands.`
        );
    }
  } catch (err) {
    console.error('Error handling message:', err);
    await msg.reply('⚠️ Something went wrong. Please try again.');
  }
}

// ─── Command Handlers ──────────────────────────────────────────────

async function handleHelp(msg) {
  const helpText = `🤖 *Birthday Bot Commands*

📋 *Manage Birthdays:*
• *!add <name> <DD-MM-YYYY>*
  Add a new birthday
  _Example: !add Rohan 15-08-1995_

• *!update <name> <DD-MM-YYYY>*
  Update an existing birthday
  _Example: !update Rohan 20-08-1995_

• *!delete <name>*
  Remove a birthday
  _Example: !delete Rohan_

📅 *View Birthdays:*
• *!list* — Show all saved birthdays
• *!today* — Show today's birthdays
• *!upcoming* — Birthdays in the next 7 days
• *!upcoming <days>* — Birthdays in next N days

📊 *Excel Import/Export:*
• *!import* — Send an Excel file with this caption to bulk import
• *!export* — Download all birthdays as Excel
• *!template* — Get a sample Excel template

ℹ️ _Dates must be in DD-MM-YYYY format_
🎂 _Birthday wishes are sent automatically every day!_`;

  await msg.reply(helpText);
}

async function handleAdd(msg, args, senderName) {
  if (args.length < 2) {
    await msg.reply(
      '❌ *Usage:* !add <name> <DD-MM-YYYY>\n_Example: !add Rohan 15-08-1995_'
    );
    return;
  }

  // Last argument is the date, everything before is the name
  const date = args[args.length - 1];
  const name = args.slice(0, -1).join(' ');

  const result = birthdayService.add(name, date, null, senderName);
  await msg.reply(result.message);
}

async function handleUpdate(msg, args) {
  if (args.length < 2) {
    await msg.reply(
      '❌ *Usage:* !update <name> <DD-MM-YYYY>\n_Example: !update Rohan 20-08-1995_'
    );
    return;
  }

  const date = args[args.length - 1];
  const name = args.slice(0, -1).join(' ');

  const result = birthdayService.update(name, date);
  await msg.reply(result.message);
}

async function handleDelete(msg, args) {
  if (args.length === 0) {
    await msg.reply('❌ *Usage:* !delete <name>\n_Example: !delete Rohan_');
    return;
  }

  const name = args.join(' ');
  const result = birthdayService.remove(name);
  await msg.reply(result.message);
}

async function handleList(msg) {
  const birthdays = birthdayService.getAll();

  if (birthdays.length === 0) {
    await msg.reply(
      '📋 No birthdays saved yet!\nUse *!add <name> <DD-MM-YYYY>* to add one.'
    );
    return;
  }

  // Sort by upcoming
  const sorted = birthdays
    .map((b) => ({
      ...b,
      daysUntil: daysUntilBirthday(b.date),
      age: calculateAge(b.date),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  let text = `📋 *All Birthdays (${sorted.length}):*\n\n`;

  sorted.forEach((b, i) => {
    const ageText = b.age !== null ? ` (Age: ${b.age})` : '';
    const daysText =
      b.daysUntil === 0
        ? '🎂 *TODAY!*'
        : b.daysUntil === 1
        ? '⏰ Tomorrow'
        : `📅 in ${b.daysUntil} days`;

    text += `${i + 1}. *${b.name}* — ${b.date}${ageText}\n   ${daysText}\n`;
  });

  await msg.reply(text);
}

async function handleToday(msg) {
  const todayBirthdays = birthdayService.getTodayBirthdays();

  if (todayBirthdays.length === 0) {
    await msg.reply('📅 No birthdays today!');
    return;
  }

  let text = `🎂 *Today's Birthdays:*\n\n`;
  todayBirthdays.forEach((b) => {
    const age = calculateAge(b.date);
    const ageText = age !== null ? ` (turning ${age})` : '';
    text += `🎉 *${b.name}*${ageText} — ${b.date}\n`;
  });

  await msg.reply(text);
}

async function handleUpcoming(msg, args) {
  const days = args[0] ? parseInt(args[0], 10) : 7;

  if (isNaN(days) || days < 1 || days > 365) {
    await msg.reply('❌ Please provide a valid number of days (1-365).');
    return;
  }

  const upcoming = birthdayService.getUpcoming(days);

  if (upcoming.length === 0) {
    await msg.reply(`📅 No birthdays in the next ${days} days.`);
    return;
  }

  let text = `📅 *Upcoming Birthdays (next ${days} days):*\n\n`;
  upcoming.forEach((b) => {
    const ageText = b.age !== null ? ` (Age: ${b.age})` : '';
    const daysText =
      b.daysUntil === 0
        ? '🎂 *TODAY!*'
        : b.daysUntil === 1
        ? '⏰ Tomorrow'
        : `in ${b.daysUntil} days`;

    text += `• *${b.name}* — ${b.date}${ageText} — ${daysText}\n`;
  });

  await msg.reply(text);
}

async function handleImport(msg, client) {
  // Check if message has media (Excel file)
  if (!msg.hasMedia) {
    await msg.reply(
      '📊 *How to import:*\n' +
        '1. Open an Excel file (.xlsx) with columns: *Name* and *Birthday* (DD-MM-YYYY)\n' +
        '2. Send the file in this group with the caption *!import*\n\n' +
        'Type *!template* to get a sample Excel template.'
    );
    return;
  }

  await msg.reply('⏳ Importing birthdays from Excel...');

  try {
    // Download the media
    const media = await msg.downloadMedia();

    if (!media || !media.mimetype.includes('spreadsheet') && !media.mimetype.includes('excel') && !media.filename?.endsWith('.xlsx')) {
      // Be lenient - try to process anyway if it has data
      if (!media || !media.data) {
        await msg.reply('❌ Could not download the file. Please try again.');
        return;
      }
    }

    // Save to temp file
    const tempDir = path.resolve(config.DATA_DIR);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `import_${Date.now()}.xlsx`);
    fs.writeFileSync(tempFile, Buffer.from(media.data, 'base64'));

    // Import
    const { entries, errors } = excelService.importFromExcel(tempFile);

    if (entries.length === 0) {
      let errorText = '❌ No valid entries found in the Excel file.';
      if (errors.length > 0) {
        errorText += '\n\n*Errors:*\n' + errors.slice(0, 5).join('\n');
      }
      await msg.reply(errorText);
    } else {
      // Bulk add to database
      const result = birthdayService.bulkAdd(entries);

      let responseText = `✅ *Import Complete!*\n\n`;
      responseText += `• Added: *${result.added}*\n`;
      responseText += `• Skipped: *${result.skipped}* (duplicates or errors)\n`;
      responseText += `• Total in database: *${birthdayService.getCount()}*`;

      if (result.errors.length > 0 && result.errors.length <= 5) {
        responseText += '\n\n⚠️ *Issues:*\n' + result.errors.join('\n');
      } else if (result.errors.length > 5) {
        responseText +=
          `\n\n⚠️ *${result.errors.length} issues found.* Showing first 5:\n` +
          result.errors.slice(0, 5).join('\n');
      }

      await msg.reply(responseText);
    }

    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  } catch (err) {
    console.error('Import error:', err);
    await msg.reply('❌ Failed to import Excel file. Make sure it\'s a valid .xlsx file.');
  }
}

async function handleExport(msg, client) {
  const birthdays = birthdayService.getAll();

  if (birthdays.length === 0) {
    await msg.reply('📋 No birthdays to export. Add some first with *!add*.');
    return;
  }

  try {
    const exportDir = path.resolve(config.DATA_DIR);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportPath = path.join(exportDir, `birthdays_export_${Date.now()}.xlsx`);
    excelService.exportToExcel(birthdays, exportPath);

    // Send the file
    const { MessageMedia } = require('whatsapp-web.js');
    const media = MessageMedia.fromFilePath(exportPath);
    const chat = await msg.getChat();

    await chat.sendMessage(media, {
      caption: `📊 *Birthday List Export*\nTotal: ${birthdays.length} birthdays\nExported on: ${new Date().toLocaleDateString()}`,
    });

    // Clean up
    try {
      fs.unlinkSync(exportPath);
    } catch (e) {
      // Ignore
    }
  } catch (err) {
    console.error('Export error:', err);
    await msg.reply('❌ Failed to export. Please try again.');
  }
}

async function handleTemplate(msg, client) {
  try {
    const templatePath = path.resolve(config.TEMPLATE_FILE);
    excelService.createTemplate(templatePath);

    const { MessageMedia } = require('whatsapp-web.js');
    const media = MessageMedia.fromFilePath(templatePath);
    const chat = await msg.getChat();

    await chat.sendMessage(media, {
      caption:
        '📄 *Sample Birthday Template*\n\n' +
        'Fill in your data with these columns:\n' +
        '• *Name* — Person\'s name\n' +
        '• *Birthday* — Date in DD-MM-YYYY format\n\n' +
        'Then send the filled file back with caption *!import*',
    });
  } catch (err) {
    console.error('Template error:', err);
    await msg.reply('❌ Failed to generate template. Please try again.');
  }
}

module.exports = { handleMessage };
