export interface WordPressImage {
  id: number;
  url: string;
  mimeType: string;
  title: string;
  altText: string;
}

export interface FetchImagesResponse {
  images: WordPressImage[];
  page: number;
  totalPages: number;
}

const WP_URL = `${process.env.WP_BASE_URL}/wp-json/wp/v2`;
const AUTH_HEADER =
  'Basic ' + Buffer.from(`${process.env.WP_USER}:${process.env.WP_APPLICATION_PASSWORD}`).toString('base64');

export const fetchImages = async (page: number): Promise<FetchImagesResponse> => {
  const url = `${WP_URL}/media?page=${page}&per_page=100&media_type=image&_fields=id,source_url,mime_type,title,alt_text`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch images from WordPress: ${response.statusText}`);
  }

  const images = await response.json();
  return {
    images: images.map((item: any) => ({
      id: item.id,
      url: item.source_url,
      mimeType: item.mime_type,
      title: item.title?.rendered ?? '',
      altText: item.alt_text,
    })),
    page: parseInt(response.headers.get('x-wp-page') ?? '1'),
    totalPages: parseInt(response.headers.get('x-wp-totalpages') ?? '1'),
  };
};

export const updateImageAltText = async (id: number, altText: string): Promise<void> => {
  const url = `${WP_URL}/media/${id}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ alt_text: altText }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update alt text for image #${id}: ${response.statusText}`);
  }
};
