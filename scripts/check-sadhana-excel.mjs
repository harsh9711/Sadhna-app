// Run: node scripts/check-sadhana-excel.mjs
import assert from 'node:assert/strict';

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(value) {
  if (value === null || value === undefined || value === '') {
    return '<Cell><Data ss:Type="String"></Data></Cell>';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(String(value))}</Data></Cell>`;
}

assert.equal(cell(16), '<Cell><Data ss:Type="Number">16</Data></Cell>');
assert.equal(cell(''), '<Cell><Data ss:Type="String"></Data></Cell>');
assert.match(cell('SB canto 1 & 2 <notes>'), /&amp;|&lt;/);
assert.doesNotMatch(cell('SB canto 1 & 2 <notes>'), /<notes>/);

const xml = `<?xml version="1.0" encoding="UTF-8"?><Workbook><Worksheet ss:Name="Sadhana"><Table><Row>${cell('Date')}</Row></Table></Worksheet></Workbook>`;
assert.match(xml, /ss:Name="Sadhana"/);

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

assert.equal(csvCell(16), '16');
assert.equal(csvCell(undefined), '');
assert.equal(csvCell('SB 1.7, canto 1'), '"SB 1.7, canto 1"');
assert.equal(csvCell('HG "VCP" Prabhu'), '"HG ""VCP"" Prabhu"');
assert.equal(csvCell('line1\nline2'), '"line1\nline2"');

console.log('sadhana export checks passed');
