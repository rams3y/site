import * as fs from 'fs';
import * as path from 'path';

interface RawItem {
  id: string;
  prodId: string;
  name: string;
  rawPrice: number;
  operator: string;
}

function parseProducts(html: string): RawItem[] {
  const items: RawItem[] = [];
  const itemMatches = html.matchAll(/<div class="product productitem_(\d+)">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g);

  for (const match of itemMatches) {
    const prodId = match[1];
    const block = match[2];

    const nameMatch = block.match(/<div class="name"><a[^>]*>([^<]+)<\/a>/);
    const name = nameMatch ? nameMatch[1].trim() : '';

    const priceMatch = block.match(/<div class="jshop_price">\s*<span>([\d\s]+)\s*грн/);
    const priceStr = priceMatch ? priceMatch[1].replace(/\s+/g, '') : '0';
    const rawPrice = parseInt(priceStr, 10) || 0;

    const opMatch = block.match(/<div class="manufacturer_name">Оператор:<span>([^<]+)<\/span>/);
    const operator = opMatch ? opMatch[1].trim() : '';

    if (name && prodId) {
      items.push({
        id: `mn-${prodId}`,
        prodId,
        name,
        rawPrice,
        operator
      });
    }
  }

  // Fallback looser parsing if matchAll didn't match
  if (items.length === 0) {
    const regex = /class="product productitem_(\d+)"/g;
    let m;
    const indices: { prodId: string; index: number }[] = [];
    while ((m = regex.exec(html)) !== null) {
      indices.push({ prodId: m[1], index: m.index });
    }

    for (let i = 0; i < indices.length; i++) {
      const cur = indices[i];
      const nextIdx = i < indices.length - 1 ? indices[i + 1].index : html.length;
      const chunk = html.substring(cur.index, Math.min(nextIdx, cur.index + 2000));

      const nameMatch = chunk.match(/<div class="name"><a[^>]*>([^<]+)<\/a>/);
      const name = nameMatch ? nameMatch[1].trim() : '';

      const priceMatch = chunk.match(/<div class="jshop_price">\s*<span>([\d\s]+)\s*грн/);
      const priceStr = priceMatch ? priceMatch[1].replace(/\s+/g, '') : '0';
      const rawPrice = parseInt(priceStr, 10) || 0;

      const opMatch = chunk.match(/<div class="manufacturer_name">Оператор:<span>([^<]+)<\/span>/);
      const operator = opMatch ? opMatch[1].trim() : '';

      if (name) {
        items.push({
          id: `mn-${cur.prodId}`,
          prodId: cur.prodId,
          name,
          rawPrice,
          operator
        });
      }
    }
  }

  return items;
}

async function scrapeCategory(catSlug: string) {
  let start = 0;
  const allItems: RawItem[] = [];
  const seenIds = new Set<string>();

  while (true) {
    const url = start === 0 
      ? `https://meganomer.com.ua/${catSlug}` 
      : `https://meganomer.com.ua/${catSlug}?start=${start}`;
    
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) {
        console.log(`Failed fetch ${url} (status: ${res.status})`);
        break;
      }
      const html = await res.text();
      const pageItems = parseProducts(html);
      
      let newCount = 0;
      for (const item of pageItems) {
        if (!seenIds.has(item.prodId)) {
          seenIds.add(item.prodId);
          allItems.push(item);
          newCount++;
        }
      }

      console.log(`[${catSlug}] start=${start}: found ${pageItems.length} items (${newCount} new). Total: ${allItems.length}`);

      if (pageItems.length === 0 || newCount === 0) {
        break;
      }

      start += 24;
      await new Promise(r => setTimeout(r, 80));
    } catch (e) {
      console.error(`Error scraping ${url}:`, e);
      break;
    }
  }
  return allItems;
}

async function main() {
  console.log('=== Scraping Kyivstar (kievstar) ===');
  const ksItems = await scrapeCategory('kievstar');
  console.log(`Kyivstar scraped: ${ksItems.length}`);

  console.log('=== Scraping Vodafone (mts) ===');
  const vodafoneItems = await scrapeCategory('mts');
  console.log(`Vodafone scraped: ${vodafoneItems.length}`);

  console.log('=== Scraping Lifecell (life) ===');
  const lifecellItems = await scrapeCategory('life');
  console.log(`Lifecell scraped: ${lifecellItems.length}`);

  const combined = {
    kyivstar: ksItems,
    vodafone: vodafoneItems,
    lifecell: lifecellItems,
    scrapedAt: new Date().toISOString()
  };

  fs.writeFileSync('scraped_all_operators_raw.json', JSON.stringify(combined, null, 2));
  console.log('Saved raw scrape to scraped_all_operators_raw.json');
}

main();
