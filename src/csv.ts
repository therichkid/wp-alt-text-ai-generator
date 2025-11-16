import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { WordPressImage } from './wordpress';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_PATH = resolve(__dirname, '../image_alt_texts.csv');
const HEADER = 'id,url,altText\n';

export const logAltText = async (image: WordPressImage, altText = image.altText): Promise<void> => {
  try {
    await fs.access(CSV_PATH);
  } catch {
    await fs.writeFile(CSV_PATH, HEADER, 'utf8');
  }

  const data = await fs.readFile(CSV_PATH, 'utf8');
  const lines = data.split('\n').filter(Boolean);

  const exists = lines.some((line) => {
    const [id] = line.split(',');
    return id === image.id.toString();
  });

  if (!exists) {
    const newLine = `${image.id},"=HYPERLINK(""${image.url}"";""${image.title}"")","${altText.replace(/"/g, '""')}"\n`;
    await fs.appendFile(CSV_PATH, newLine, 'utf8');
  }
};
