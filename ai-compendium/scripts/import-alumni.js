#!/usr/bin/env node
/**
 * Reads data/alumni/MSAI_Alumni_Database.xlsx and writes data/alumni.json
 * Run: node scripts/import-alumni.js
 */
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'alumni', 'MSAI_Alumni_Database.xlsx');
const OUT = path.join(ROOT, 'data', 'alumni.json');

if (!fs.existsSync(SRC)) {
  console.error('Missing:', SRC);
  process.exit(1);
}

const wb = XLSX.readFile(SRC);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

function norm(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

const outRows = rows.map((row, idx) => {
  const keys = Object.keys(row);
  const get = (k) => row[k];
  return {
    id: `alumni-${idx + 1}`,
    graduationTerm: norm(get('Graduation Term')),
    last: norm(get('Last')),
    first: norm(get('First')),
    company: norm(get('Company')),
    title: norm(get('Title')),
    industry: norm(get('Industry')),
    personalEmail: norm(get('Personal Email')),
    linkedinUrl: norm(get('LinkedIn Profile')),
    dateOfLastContact: norm(get('Date of Last Contact')),
    notes: norm(get('Notes')),
    storyPublishedDate: norm(get('Story Published Date')),
    capstone: norm(get('Capstone')),
    internship: norm(get('Internship')),
    practicum: norm(get('Practicum')),
  };
});

const payload = {
  importedAt: new Date().toISOString(),
  sourceSheet: sheetName,
  rowCount: outRows.length,
  rows: outRows,
};

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
console.log('Wrote', OUT, '(' + outRows.length + ' rows)');
