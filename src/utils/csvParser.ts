import { RawCsvRow } from '../types';

/**
 * Robust CSV string parser supporting quoted cells with embedded commas, line breaks, and whitespace.
 */
export function parseCsv(csvText: string): RawCsvRow[] {
  // Strip BOM if present
  const text = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
  const lines = splitCsvLines(text);

  if (lines.length < 2) {
    return [];
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const rows: RawCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCsvLine(line);
    const row: RawCsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index].trim() : '';
    });

    // Check if the row has any non-empty data
    const hasData = Object.values(row).some((val) => val.length > 0);
    if (hasData) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parse a single CSV line respecting quotes
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Split text into CSV lines while respecting multi-line quoted fields
 */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of \r\n
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Parse number safely handling currency symbols, commas, negative values, and empty strings.
 */
export function parseAmount(val: string | undefined | null): number | null {
  if (!val) return null;
  const clean = val.replace(/[£$€,\s]/g, '').trim();
  if (!clean || isNaN(Number(clean))) return null;
  const num = parseFloat(clean);
  return Math.abs(num); // Standardize to positive number, debit/credit flags indicate direction
}

/**
 * Convert DD/MM/YYYY (Bank of Scotland standard) or variations into ISO YYYY-MM-DD for sorting.
 */
export function parseDate(dateStr: string | undefined | null): { isoDate: string; displayDate: string } {
  if (!dateStr) {
    const today = new Date().toISOString().slice(0, 10);
    return { isoDate: today, displayDate: today };
  }

  const clean = dateStr.trim().replace(/^["']|["']$/g, '');

  // Match DD/MM/YYYY or DD-MM-YYYY
  const ukMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (ukMatch) {
    const day = ukMatch[1].padStart(2, '0');
    const month = ukMatch[2].padStart(2, '0');
    const year = ukMatch[3];
    return {
      isoDate: `${year}-${month}-${day}`,
      displayDate: `${day}/${month}/${year}`,
    };
  }

  // Match YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return {
      isoDate: `${year}-${month}-${day}`,
      displayDate: `${day}/${month}/${year}`,
    };
  }

  // Fallback try Date.parse
  const timestamp = Date.parse(clean);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return {
      isoDate: `${year}-${month}-${day}`,
      displayDate: `${day}/${month}/${year}`,
    };
  }

  return { isoDate: clean, displayDate: clean };
}
