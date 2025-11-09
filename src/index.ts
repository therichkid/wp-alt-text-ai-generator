import { generateAltText } from './ai.ts';
import { fetchImages, updateImageAltText } from './wordpress.ts';

class Statistics {
  totalImages = 0;
  skippedImages = 0;
  processedImages = 0;
  failedImages = 0;

  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  log() {
    const endTime = performance.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);

    console.log('Processing statistics:');
    console.log(`  Total images: ${this.totalImages}`);
    console.log(`  Skipped images (with alt text): ${this.skippedImages}`);
    console.log(`  Processed images (alt text generated): ${this.processedImages}`);
    console.log(`  Failed images (errors during processing): ${this.failedImages}`);
    console.log(`  Total time taken: ${duration} seconds`);
  }
}

const processMedia = async (dryRun = false) => {
  const stats = new Statistics();

  let page = 1;
  let totalPages = 1;

  console.log('Start processing WordPress media library...');

  while (page <= totalPages) {
    const response = await fetchImages(page);
    totalPages = response.totalPages;
    stats.totalImages += response.images.length;

    console.log(`Processing page ${page} of ${totalPages}. ${response.images.length} images found.`);

    for (const image of response.images) {
      if (image.altText && image.altText !== '') {
        stats.skippedImages++;
        continue;
      }

      if (dryRun) {
        console.log(`  > DRY RUN: Would generate alt text for image #${image.id} (${image.url})`);
        stats.processedImages++;
        continue;
      }

      try {
        const generatedAltText = await generateAltText(image);
        if (generatedAltText) {
          await updateImageAltText(image.id, generatedAltText);
          stats.processedImages++;
          console.log(`  > SUCCESS: Alt text for #${image.id} set: "${generatedAltText.substring(0, 100)}..."`);
        }
      } catch (error) {
        stats.failedImages++;
        console.error(`  > ERROR: Could not process image #${image.id}:`, error);
      }
    }

    page++;
  }

  console.log('Processing completed.');
  stats.log();
};

const dryRun = process.argv.includes('--dry-run');

processMedia(dryRun).catch(console.error);
