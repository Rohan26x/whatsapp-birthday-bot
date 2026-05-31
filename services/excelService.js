/**
 * Excel Service
 * -------------
 * Import birthdays from Excel files and export them back.
 * Uses the SheetJS (xlsx) library.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { validateDateString } = require('../utils/dateUtils');

/**
 * Normalize an Excel date value to DD-MM-YYYY string.
 * Handles: Date objects, serial numbers, and string formats.
 * @param {*} value - Raw cell value from Excel
 * @returns {string|null}
 */
function normalizeDate(value) {
  if (!value) return null;

  // If it's already a string in DD-MM-YYYY format
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed.replace(/\//g, '-');
    }

    // YYYY-MM-DD (ISO format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return `${d}-${m}-${y}`;
    }

    // Try parsing as a date string
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}-${month}-${year}`;
    }

    return null;
  }

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const day = String(date.d).padStart(2, '0');
      const month = String(date.m).padStart(2, '0');
      const year = date.y;
      return `${day}-${month}-${year}`;
    }
  }

  // If it's a Date object
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return null;
}

/**
 * Find a column header by checking common variations.
 * @param {object} row - A row from the Excel sheet
 * @param {string[]} possibleNames - Possible header names
 * @returns {*} The value found, or undefined
 */
function findColumn(row, possibleNames) {
  for (const name of possibleNames) {
    // Check exact match and case-insensitive
    for (const key of Object.keys(row)) {
      if (key.toLowerCase().trim() === name.toLowerCase()) {
        return row[key];
      }
    }
  }
  return undefined;
}

/**
 * Import birthdays from an Excel file.
 * Expects columns: Name, Phone (optional), Birthday/Date/DOB
 * @param {string} filePath - Path to the .xlsx file
 * @returns {{ entries: Array, errors: string[] }}
 */
function importFromExcel(filePath) {
  const entries = [];
  const errors = [];

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return { entries: [], errors: ['Excel file has no sheets.'] };
    }

    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      return { entries: [], errors: ['Excel file is empty or has no data rows.'] };
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because row 1 is headers, and array is 0-indexed

      // Find name column
      const name = findColumn(row, ['Name', 'Full Name', 'Person', 'Member']);
      if (!name) {
        errors.push(`Row ${rowNum}: Missing name`);
        continue;
      }

      // Find birthday column
      const rawDate = findColumn(row, ['Birthday', 'Date', 'DOB', 'Date of Birth', 'Birth Date', 'Birthdate']);
      if (!rawDate) {
        errors.push(`Row ${rowNum} (${name}): Missing birthday date`);
        continue;
      }

      // Normalize the date
      const normalizedDate = normalizeDate(rawDate);
      if (!normalizedDate) {
        errors.push(`Row ${rowNum} (${name}): Could not parse date "${rawDate}"`);
        continue;
      }

      // Validate the normalized date
      const validation = validateDateString(normalizedDate);
      if (!validation.valid) {
        errors.push(`Row ${rowNum} (${name}): ${validation.error}`);
        continue;
      }

      entries.push({
        name: String(name).trim(),
        date: normalizedDate,
      });
    }
  } catch (err) {
    errors.push(`Failed to read Excel file: ${err.message}`);
  }

  return { entries, errors };
}

/**
 * Export birthdays to an Excel file.
 * @param {Array} birthdays - Array of birthday objects
 * @param {string} outputPath - Where to save the .xlsx file
 * @returns {string} Path to the created file
 */
function exportToExcel(birthdays, outputPath) {
  const data = birthdays.map((b) => ({
    Name: b.name,
    Birthday: b.date,
    'Added By': b.addedBy || '',
    'Added On': b.addedAt ? new Date(b.addedAt).toLocaleDateString() : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 20 }, // Name
    { wch: 15 }, // Birthday
    { wch: 15 }, // Added By
    { wch: 15 }, // Added On
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');

  XLSX.writeFile(workbook, outputPath);
  return outputPath;
}

/**
 * Create a sample Excel template with example data.
 * @param {string} [outputPath] - Where to save (defaults to config.TEMPLATE_FILE)
 * @returns {string} Path to the created template
 */
function createTemplate(outputPath) {
  const filePath = outputPath || path.resolve(config.TEMPLATE_FILE);

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sampleData = [
    { Name: 'Rahul Sharma', Birthday: '15-08-1995' },
    { Name: 'Priya Patel', Birthday: '25-12-1998' },
    { Name: 'Amit Kumar', Birthday: '01-01-2000' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Name
    { wch: 15 }, // Birthday
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');

  XLSX.writeFile(workbook, filePath);
  console.log(`📄 Sample template created: ${filePath}`);
  return filePath;
}

module.exports = {
  importFromExcel,
  exportToExcel,
  createTemplate,
  normalizeDate,
};
