import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import type { RoutineEntry } from '@/types';

const HEADERS = [
  'Date',
  'Status',
  'Chant B4 MA',
  'Till 7:30 am',
  'Last Round',
  'Total Rounds',
  'Read (min)',
  'Book',
  'Hear (min)',
  'Speaker',
  'Topic',
  'Slept At',
  'Wake Up',
  'Day Rest',
  'Submitted At',
] as const;

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function restLabel(minutes?: number) {
  if (minutes == null) return '';
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

function cell(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '<Cell><Data ss:Type="String"></Data></Cell>';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(String(value))}</Data></Cell>`;
}

export function buildSadhanaExcel(entries: RoutineEntry[]): string {
  const rows = entries.map((e) =>
    [
      e.date,
      e.status,
      e.chant_before_ma,
      e.rounds_till_730,
      e.last_round_time,
      e.total_rounds,
      e.read_minutes,
      e.book,
      e.hear_minutes,
      e.speaker,
      e.topic,
      e.slept_at,
      e.wake_time,
      restLabel(e.day_rest_minutes),
      e.submitted_at,
    ]
      .map(cell)
      .join('')
  );

  const headerRow = HEADERS.map((h) => cell(h)).join('');
  const table = [`<Row>${headerRow}</Row>`, ...rows.map((r) => `<Row>${r}</Row>`)].join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Sadhana">
<Table>${table}</Table>
</Worksheet>
</Workbook>`;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function buildSadhanaCsv(entries: RoutineEntry[]): string {
  const rows = entries.map((e) =>
    [
      e.date,
      e.status,
      e.chant_before_ma,
      e.rounds_till_730,
      e.last_round_time,
      e.total_rounds,
      e.read_minutes,
      e.book,
      e.hear_minutes,
      e.speaker,
      e.topic,
      e.slept_at,
      e.wake_time,
      restLabel(e.day_rest_minutes),
      e.submitted_at,
    ]
      .map(csvCell)
      .join(',')
  );
  return [HEADERS.join(','), ...rows].join('\r\n');
}

function slugify(slug: string | undefined, fallback = 'sadhana') {
  const safe = (slug ?? fallback)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return safe || fallback;
}

export function sadhanaExcelFilename(slug?: string) {
  return `${slugify(slug)}-${format(new Date(), 'yyyy-MM-dd')}.xls`;
}

export function sadhanaCsvFilename(slug?: string) {
  return `${slugify(slug)}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
}

function isCancel(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel|dismiss|picker/i.test(message);
}

const FORMATS = {
  xls: { mimeType: 'application/vnd.ms-excel', uti: 'com.microsoft.excel.xls' },
  csv: { mimeType: 'text/csv', uti: 'public.comma-separated-values-text' },
} as const;

/** Writes the file into a folder the user picks (Downloads on Android, Files on iOS). */
export async function saveSadhanaFile(
  content: string,
  filename: string
): Promise<'saved' | 'shared' | 'cancelled'> {
  const ext = filename.toLowerCase().endsWith('.csv') ? 'csv' : 'xls';
  const { mimeType, uti } = FORMATS[ext];

  try {
    const picked = await Directory.pickDirectoryAsync();
    const dest = new Directory(picked.uri).createFile(
      filename.replace(/\.(csv|xls)$/i, ''),
      mimeType
    );
    dest.write(content);
    return 'saved';
  } catch (error) {
    if (isCancel(error)) return 'cancelled';
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Could not open a folder picker or share sheet on this device.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType,
    UTI: uti,
    dialogTitle: Platform.OS === 'android' ? 'Save to Downloads' : `Save sadhana ${ext.toUpperCase()}`,
  });
  return 'shared';
}

export const saveSadhanaExcel = saveSadhanaFile;
