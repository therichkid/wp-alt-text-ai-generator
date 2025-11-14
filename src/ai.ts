import { ApiError, GoogleGenAI } from '@google/genai';
import { type WordPressImage } from './wordpress.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const exponentialBackoff = async (attempt: number) => {
  const delayTime = RETRY_DELAY_MS * Math.pow(2, attempt);
  await delay(delayTime);
};

export const generateAltText = async (image: WordPressImage): Promise<string | undefined> => {
  const imageResponse = await fetch(image.url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image #${image.id} from WordPress: ${imageResponse.statusText}`);
  }

  const imageArrayBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageArrayBuffer).toString('base64');

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: [
                  'Analysiere dieses Bild.',
                  'Schreibe einen kurzen, beschreibenden, SEO-optimierten und barrierefreien Alt-Text in deutscher Sprache.',
                  'Die Website richtet sich an Nutzer von Cochlea-Implantaten und Menschen mit Hörbeeinträchtigung.',
                  `Benutze, wenn möglich, den Titel des Bildes: "${image.title}".`,
                  'Ignoriere den Bildtitel, falls er generisch oder bedeutungslos ist (z.B. "IMG_1234", "default.jpg", "image1.jpg", ...).',
                  'Falls der Bildtitel relevant und beschreibend ist, kannst du ihn einbeziehen, aber nur, wenn es sinnvoll ist.',
                  'Beginne direkt mit dem Text, ohne Anführungszeichen oder Einleitung.',
                  'Der Alt-Text sollte maximal 125 Zeichen lang sein.',
                ].join(' '),
              },
              {
                inlineData: {
                  mimeType: image.mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      return response.text?.trim();
    } catch (error: unknown) {
      const isOverloadError = error instanceof ApiError && error?.status === 503;
      if (isOverloadError) {
        console.warn(`Service overloaded. Retrying again in ${RETRY_DELAY_MS / 1000}s...`);
        await delay(RETRY_DELAY_MS);
        continue;
      }

      const isRateLimitError = error instanceof ApiError && error.status === 429;
      if (isRateLimitError && attempt < MAX_RETRIES) {
        console.warn(`Rate limit exceeded. Retrying attempt ${attempt + 1} of ${MAX_RETRIES}...`);
        attempt++;
        await exponentialBackoff(attempt);
        continue;
      }

      throw error;
    }
  }
};
