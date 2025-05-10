import { Product } from '../types';

const STORES = [
  'armaniexchange.com',
  'ae.com',
  'hm.com',
  'target.com',
  'forever21.com',
  'shein.com',
  'uniqlo.com',
  'zara.com',
  'nordstrom.com',
  'asos.com',
  'fashionnova.com',
  'coach.com',
];

async function getUnsplashImage(query: string, imagePrompt?: string): Promise<string> {
  try {
    const searchQuery = imagePrompt
      ? `${imagePrompt} outfit`
      : `${query} fashion outfit style`;

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=portrait&per_page=5`,
      {
        headers: {
          'Authorization': `Client-ID ${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Unsplash');
    }

    const data = await response.json();
    if (data.results?.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
      return data.results[randomIndex].urls.regular;
    }

    throw new Error('No images found');
  } catch (error) {
    console.error('Unsplash API error:', error);
    const fallbackQuery = `${query} fashion outfit style ${Math.random()}`;
    return `https://source.unsplash.com/400x600/?${encodeURIComponent(fallbackQuery)}`;
  }
}

async function getFallbackProducts(outfit: any): Promise<Product[]> {
  const { searchQuery, imagePrompt, type } = outfit;
  const image = await getUnsplashImage(searchQuery, imagePrompt);

  return [
    {
      title: type || 'Style Suggestion',
      link: '#',
      image,
      price: '$29.99 - $99.99',
      store: 'Style',
      description: outfit.description || 'AI-curated style suggestion',
    },
  ];
}

export async function searchProducts(outfit: any): Promise<Product[]> {
  try {
    const siteRestriction = `(${STORES.map(site => `site:${site}`).join(' OR ')})`;
    const enhancedQuery = `${outfit.searchQuery} clothing ${siteRestriction}`;

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', import.meta.env.VITE_GOOGLE_API_KEY);
    url.searchParams.append('cx', import.meta.env.VITE_GOOGLE_CSE_ID);
    url.searchParams.append('q', enhancedQuery);
    url.searchParams.append('num', '10');
    url.searchParams.append('gl', 'us');

    const response = await fetch(url.toString());
    const contentType = response.headers.get('content-type');

    if (!response.ok || !contentType?.includes('application/json')) {
      console.log('Invalid response from Google API, falling back to Unsplash images');
      return getFallbackProducts(outfit);
    }

    const data = await response.json();
    if (!data.items) {
      return getFallbackProducts(outfit);
    }

    const seenStores = new Set<string>();
    const products: Product[] = [];

    for (const item of data.items) {
      const storeMatch = item.link.match(/(?:www\.)?([\w-]+)\.com/);
      const storeDomain = storeMatch ? storeMatch[1].toLowerCase() : '';

      if (seenStores.has(storeDomain)) continue;
      seenStores.add(storeDomain);

      const storeNames: Record<string, string> = {
        macys: 'Macys',
        target: 'Target',
        forever21: 'Forever 21',
        hm: 'H&M',
        zara: 'Zara',
        asos: 'ASOS',
        uniqlo: 'Uniqlo',
        shein: 'Shein',
        ae: 'AE',
        armaniexchange: 'AX',
        fashionnova: 'Fashion Nova',
        coach: 'Coach',
        nordstrom: 'Nordstrom',
      };
      const store = storeNames[storeDomain] || storeDomain || 'Shop';

      const priceMatch =
        item.pagemap?.offer?.[0]?.price ||
        item.pagemap?.product?.[0]?.price ||
        item.title.match(/\$\d+(?:\.\d{2})?/) ||
        item.snippet.match(/\$\d+(?:\.\d{2})?/);

      const price =
        typeof priceMatch === 'string'
          ? priceMatch
          : priceMatch
          ? `$${priceMatch}`
          : 'Price N/A';

      const image =
        item.pagemap?.cse_image?.[0]?.src ||
        item.pagemap?.cse_thumbnail?.[0]?.src ||
        item.pagemap?.product?.[0]?.image ||
        (await getUnsplashImage(outfit.searchQuery, outfit.imagePrompt));

      products.push({
        title: item.title.split(/[|\-]/)[0].trim(),
        link: item.link,
        image,
        price,
        store,
        description: item.snippet,
      });

      if (products.length >= 6) break;
    }

    return products.length > 0 ? products : getFallbackProducts(outfit);
  } catch (error: any) {
    console.error('Product search error:', error);
    return getFallbackProducts(outfit);
  }
}