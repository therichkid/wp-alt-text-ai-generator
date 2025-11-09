import { GoogleGenAI } from '@google/genai';
import { type WordPressImage } from './wordpress.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateAltText = async (image: WordPressImage): Promise<string | undefined> => {
  const imageResponse = await fetch(image.url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image #${image.id} from WordPress: ${imageResponse.statusText}`);
  }

  const imageArrayBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageArrayBuffer).toString('base64');

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
              `Benutze, wenn möglich, den Titel des Bildes: "${image.title}"`,
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
};
