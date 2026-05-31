/**
 * Birthday Service
 * ----------------
 * CRUD operations for managing birthday data.
 * All data is persisted in a JSON file.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { isToday, daysUntilBirthday, validateDateString, calculateAge } = require('../utils/dateUtils');

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.resolve(config.DATA_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load all birthdays from the JSON file.
 * @returns {Array} Array of birthday objects
 */
function loadBirthdays() {
  ensureDataDir();
  const filePath = path.resolve(config.BIRTHDAYS_FILE);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading birthdays file:', err.message);
    return [];
  }
}

/**
 * Save birthdays array to the JSON file.
 * @param {Array} birthdays
 */
function saveBirthdays(birthdays) {
  ensureDataDir();
  const filePath = path.resolve(config.BIRTHDAYS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(birthdays, null, 2), 'utf-8');
}

/**
 * Get all birthdays.
 * @returns {Array}
 */
function getAll() {
  return loadBirthdays();
}

/**
 * Find a birthday by name (case-insensitive).
 * @param {string} name
 * @returns {object|null}
 */
function getByName(name) {
  const birthdays = loadBirthdays();
  return birthdays.find((b) => b.name.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Add a new birthday.
 * @param {string} name - Person's name
 * @param {string} date - Date in DD-MM-YYYY format
 * @param {string} [addedBy] - Who added this entry
 * @returns {{ success: boolean, message: string }}
 */
function add(name, date, addedBy = null) {
  // Validate date
  const validation = validateDateString(date);
  if (!validation.valid) {
    return { success: false, message: validation.error };
  }

  // Check for duplicates
  const existing = getByName(name);
  if (existing) {
    return {
      success: false,
      message: `❌ "${name}" already exists with birthday ${existing.date}. Use *!update* to change it.`,
    };
  }

  const birthdays = loadBirthdays();
  birthdays.push({
    name: name.trim(),
    date: date.trim(),
    addedBy: addedBy || 'Unknown',
    addedAt: new Date().toISOString(),
  });

  saveBirthdays(birthdays);
  const age = calculateAge(date);
  const ageText = age !== null ? ` (turns ${age + 1} next birthday)` : '';
  return {
    success: true,
    message: `✅ Added *${name.trim()}*'s birthday: *${date.trim()}*${ageText}`,
  };
}

/**
 * Update an existing birthday's date.
 * @param {string} name
 * @param {string} newDate - New date in DD-MM-YYYY format
 * @returns {{ success: boolean, message: string }}
 */
function update(name, newDate) {
  const validation = validateDateString(newDate);
  if (!validation.valid) {
    return { success: false, message: validation.error };
  }

  const birthdays = loadBirthdays();
  const index = birthdays.findIndex((b) => b.name.toLowerCase() === name.toLowerCase());

  if (index === -1) {
    return {
      success: false,
      message: `❌ "${name}" not found. Use *!add* to create a new entry.`,
    };
  }

  const oldDate = birthdays[index].date;
  birthdays[index].date = newDate.trim();
  birthdays[index].updatedAt = new Date().toISOString();

  saveBirthdays(birthdays);
  return {
    success: true,
    message: `✅ Updated *${birthdays[index].name}*'s birthday: ${oldDate} → *${newDate.trim()}*`,
  };
}

/**
 * Delete a birthday by name.
 * @param {string} name
 * @returns {{ success: boolean, message: string }}
 */
function remove(name) {
  const birthdays = loadBirthdays();
  const index = birthdays.findIndex((b) => b.name.toLowerCase() === name.toLowerCase());

  if (index === -1) {
    return {
      success: false,
      message: `❌ "${name}" not found in the birthday list.`,
    };
  }

  const removed = birthdays.splice(index, 1)[0];
  saveBirthdays(birthdays);
  return {
    success: true,
    message: `🗑️ Removed *${removed.name}*'s birthday (${removed.date}) from the list.`,
  };
}

/**
 * Get all birthdays that match today's date.
 * @returns {Array}
 */
function getTodayBirthdays() {
  const birthdays = loadBirthdays();
  return birthdays.filter((b) => isToday(b.date));
}

/**
 * Get upcoming birthdays within the next N days.
 * @param {number} [days=7] - Number of days to look ahead
 * @returns {Array} Sorted by days until birthday
 */
function getUpcoming(days = 7) {
  const birthdays = loadBirthdays();

  return birthdays
    .map((b) => ({
      ...b,
      daysUntil: daysUntilBirthday(b.date),
      age: calculateAge(b.date),
    }))
    .filter((b) => b.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Bulk add birthdays (from Excel import).
 * Skips duplicates and invalid entries.
 * @param {Array} entries - Array of { name, date, phone? }
 * @returns {{ added: number, skipped: number, errors: string[] }}
 */
function bulkAdd(entries) {
  let added = 0;
  let skipped = 0;
  const errors = [];

  for (const entry of entries) {
    if (!entry.name || !entry.date) {
      skipped++;
      errors.push(`Skipped row: missing name or date`);
      continue;
    }

    const result = add(entry.name, entry.date, 'Excel Import');
    if (result.success) {
      added++;
    } else {
      skipped++;
      errors.push(`${entry.name}: ${result.message}`);
    }
  }

  return { added, skipped, errors };
}

/**
 * Get total count of birthdays.
 * @returns {number}
 */
function getCount() {
  return loadBirthdays().length;
}

module.exports = {
  getAll,
  getByName,
  add,
  update,
  remove,
  getTodayBirthdays,
  getUpcoming,
  bulkAdd,
  getCount,
  loadBirthdays,
  saveBirthdays,
};
