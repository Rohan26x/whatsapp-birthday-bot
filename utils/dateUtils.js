/**
 * Date Utility Functions
 * ----------------------
 * Helpers for parsing, formatting, and comparing dates
 * used throughout the birthday bot.
 */

/**
 * Parse a date string in DD-MM-YYYY format to a Date object.
 * @param {string} dateStr - Date string in DD-MM-YYYY format
 * @returns {Date|null} Parsed Date object, or null if invalid
 */
function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);

  // Basic validation
  if (
    isNaN(day) || isNaN(month) || isNaN(year) ||
    day < 1 || day > 31 ||
    month < 1 || month > 12 ||
    year < 1900 || year > 2100
  ) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  // Verify the date is valid (catches things like Feb 30)
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date;
}

/**
 * Format a Date object to DD-MM-YYYY string.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Check if a DD-MM-YYYY date string matches today's date (ignoring year).
 * @param {string} dateStr - Date in DD-MM-YYYY format
 * @returns {boolean}
 */
function isToday(dateStr) {
  const parsed = parseDate(dateStr);
  if (!parsed) return false;

  const today = new Date();
  return (
    parsed.getDate() === today.getDate() &&
    parsed.getMonth() === today.getMonth()
  );
}

/**
 * Calculate the number of days until the next occurrence of a birthday.
 * @param {string} dateStr - Date in DD-MM-YYYY format
 * @returns {number} Days until next birthday (0 = today)
 */
function daysUntilBirthday(dateStr) {
  const parsed = parseDate(dateStr);
  if (!parsed) return Infinity;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build this year's birthday
  let nextBirthday = new Date(today.getFullYear(), parsed.getMonth(), parsed.getDate());
  nextBirthday.setHours(0, 0, 0, 0);

  // If the birthday has already passed this year, use next year
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, parsed.getMonth(), parsed.getDate());
    nextBirthday.setHours(0, 0, 0, 0);
  }

  const diffMs = nextBirthday - today;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate age from a DD-MM-YYYY date string.
 * @param {string} dateStr
 * @returns {number|null}
 */
function calculateAge(dateStr) {
  const parsed = parseDate(dateStr);
  if (!parsed) return null;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age--;
  }

  return age;
}

/**
 * Validate a date string is in DD-MM-YYYY format.
 * @param {string} dateStr
 * @returns {{ valid: boolean, error?: string }}
 */
function validateDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, error: 'Date is required.' };
  }

  const trimmed = dateStr.trim();

  if (!/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return { valid: false, error: 'Date must be in DD-MM-YYYY format (e.g., 15-08-1995).' };
  }

  const parsed = parseDate(trimmed);
  if (!parsed) {
    return { valid: false, error: 'Invalid date. Please check the day/month values.' };
  }

  if (parsed > new Date()) {
    return { valid: false, error: 'Birthday cannot be in the future.' };
  }

  return { valid: true };
}

module.exports = {
  parseDate,
  formatDate,
  isToday,
  daysUntilBirthday,
  calculateAge,
  validateDateString,
};
