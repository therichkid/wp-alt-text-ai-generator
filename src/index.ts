import { formatDuration, intervalToDuration } from 'date-fns';
import { generateAltText } from './ai.ts';
import { logAltText } from './csv.ts';
import { fetchImages, updateImageAltText } from './wordpress.ts';

const STOP_AFTER_ERRORS = 2;

class Statistics {
  totalImages = 0;
  skippedImages = 0;
  processedImages = 0;
  failedImages = 0;

  private startDate: Date;

  constructor() {
    this.startDate = new Date();
  }

  log() {
    const endDate = new Date();
    const duration = intervalToDuration({ start: this.startDate, end: endDate });
    const formattedDuration = formatDuration(duration);

    console.log('Processing statistics:');
    console.log(`  Total images: ${this.totalImages}`);
    console.log(`  Skipped images (with alt text): ${this.skippedImages}`);
    console.log(`  Processed images (alt text generated): ${this.processedImages}`);
    console.log(`  Failed images (errors during processing): ${this.failedImages}`);
    console.log(`  Total time taken: ${formattedDuration} seconds`);
  }
}

const processMedia = async (options: { dryRun: boolean; limit?: number }) => {
  const stats = new Statistics();

  let page = 1;
  let totalPages = 1;

  console.log('Start processing WordPress media library...');

  while (page <= totalPages && (!options.limit || stats.processedImages < options.limit)) {
    const response = await fetchImages(page);
    totalPages = response.totalPages;
    stats.totalImages += response.images.length;

    console.log(`Processing page ${page} of ${totalPages}. ${response.images.length} images found.`);

    for (const image of response.images) {
      if (options.limit && stats.processedImages >= options.limit) {
        break;
      }

      if (image.altText && image.altText !== '') {
        stats.skippedImages++;
        logAltText(image).catch(console.error);
        continue;
      }

      if (options.dryRun) {
        console.log(`  > DRY RUN: Would generate alt text for image #${image.id} (${image.url})`);
        stats.processedImages++;
        continue;
      }

      try {
        const generatedAltText = await generateAltText(image);
        if (generatedAltText) {
          await updateImageAltText(image.id, generatedAltText);
          stats.processedImages++;
          logAltText(image, generatedAltText).catch(console.error);
          console.log(`  > SUCCESS: Alt text for #${image.id} set: "${generatedAltText}"`);
        }
      } catch (error) {
        stats.failedImages++;
        console.error(`  > ERROR: Could not process image #${image.id}:`, error);

        if (stats.failedImages >= STOP_AFTER_ERRORS) {
          console.error(`Exceeded maximum error limit of ${STOP_AFTER_ERRORS}. Stopping processing.`);
          page = totalPages + 1;
          break;
        }
      }
    }

    page++;
  }

  console.log('Processing completed.');
  stats.log();
};

const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
const limitIndex = process.argv.findIndex((arg) => arg === '--limit' || arg === '-l');
const limit = limitIndex !== -1 ? parseInt(process.argv[limitIndex + 1]) : undefined;

processMedia({ dryRun, limit }).catch(console.error);
