import * as fs from 'fs';
import * as path from 'path';

interface ScrapedRaw {
  id: string;
  prodId: string;
  name: string;
  rawPrice: number;
  operator: string;
  categorySlug: string;
}

function parseProducts(html: string, categorySlug: string): ScrapedRaw[] {
  const items: ScrapedRaw[] = [];
  const matches = [...html.matchAll(/class="product productitem_(\d+)"/g)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const prodId = match[1];
    const startIdx = match.index;
    const endIdx = i < matches.length - 1 ? matches[i + 1].index : html.length;
    const chunk = html.substring(startIdx, Math.min(endIdx, startIdx + 2500));

    const nameMatch = chunk.match(/<div class="name">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
    const name = nameMatch ? nameMatch[1].trim() : '';

    const priceMatch = chunk.match(/<div class="jshop_price">[\s\S]*?<span>([\d\s]+)\s*грн/);
    const priceStr = priceMatch ? priceMatch[1].replace(/\s+/g, '') : '0';
    const rawPrice = parseInt(priceStr, 10) || 0;

    const opMatch = chunk.match(/<div class="manufacturer_name">[\s\S]*?<span>([\s\S]*?)<\/span>/);
    const operator = opMatch ? opMatch[1].trim() : '';

    if (name) {
      items.push({
        id: `mn-${prodId}`,
        prodId,
        name,
        rawPrice,
        operator,
        categorySlug
      });
    }
  }

  return items;
}

async function scrapeCategoryFull(categorySlug: string): Promise<ScrapedRaw[]> {
  let start = 0;
  const allItems: ScrapedRaw[] = [];
  const seenIds = new Set<string>();

  while (true) {
    const url = start === 0 
      ? `https://meganomer.com.ua/${categorySlug}` 
      : `https://meganomer.com.ua/${categorySlug}?start=${start}`;
    
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
      const pageItems = parseProducts(html, categorySlug);
      
      let newCount = 0;
      for (const item of pageItems) {
        if (!seenIds.has(item.prodId)) {
          seenIds.add(item.prodId);
          allItems.push(item);
          newCount++;
        }
      }

      console.log(`[${categorySlug}] start=${start}: found ${pageItems.length} items (${newCount} new). Subtotal: ${allItems.length}`);

      if (pageItems.length === 0 || newCount === 0) {
        break;
      }

      start += 24;
      await new Promise(r => setTimeout(r, 60));
    } catch (e) {
      console.error(`Error scraping ${url}:`, e);
      break;
    }
  }
  return allItems;
}

// Calculate price with exact same formula as Lifecell
function calculateAdjustedPrice(rawPrice: number): number {
  if (rawPrice < 1500) {
    return rawPrice + 750;
  } else if (rawPrice < 5000) {
    return rawPrice + 1500;
  } else if (rawPrice < 10000) {
    return rawPrice + 2000;
  } else if (rawPrice < 20000) {
    return rawPrice + 2500;
  } else {
    return rawPrice + 3000;
  }
}

// Determine operator
function determineOperator(rawNumber: string, opName: string): { op: 'lifecell' | 'kyivstar' | 'vodafone'; opTitle: string; code: string } {
  const digits = rawNumber.replace(/\D/g, '');
  let code = digits.slice(0, 3);
  if (digits.startsWith('380')) {
    code = digits.slice(2, 5);
  }

  const kyivstarCodes = ['067', '068', '096', '097', '098', '077'];
  const vodafoneCodes = ['050', '066', '095', '099', '075'];
  const lifecellCodes = ['063', '073', '093'];

  if (kyivstarCodes.includes(code) || opName.toLowerCase().includes('киев') || opName.toLowerCase().includes('kyiv')) {
    return { op: 'kyivstar', opTitle: 'Київстар', code };
  }
  if (vodafoneCodes.includes(code) || opName.toLowerCase().includes('vodafone') || opName.toLowerCase().includes('мтс') || opName.toLowerCase().includes('mts')) {
    return { op: 'vodafone', opTitle: 'Vodafone', code };
  }
  if (lifecellCodes.includes(code) || opName.toLowerCase().includes('life')) {
    return { op: 'lifecell', opTitle: 'Lifecell', code };
  }

  // Fallback by operator text
  if (opName.toLowerCase().includes('киев') || opName.toLowerCase().includes('kyiv')) return { op: 'kyivstar', opTitle: 'Київстар', code };
  if (opName.toLowerCase().includes('vodafone') || opName.toLowerCase().includes('мтс')) return { op: 'vodafone', opTitle: 'Vodafone', code };
  return { op: 'lifecell', opTitle: 'Lifecell', code };
}

// Pattern detector
function detectPattern(formatted: string, rawNumber: string, price: number) {
  const digits = rawNumber.replace(/\D/g, '');
  const last7 = digits.length >= 7 ? digits.slice(-7) : digits;

  // Check 5 or 6 repeated digits
  if (/(\d)\1{5}/.test(last7)) {
    return { category: 'vip', categoryName: 'VIP / Діамантовий', memorability: 10, pattern: '6 однакових цифр' };
  }
  if (/(\d)\1{4}/.test(last7)) {
    return { category: 'platinum', categoryName: 'Платиновий', memorability: 9, pattern: '5 однакових цифр' };
  }
  if (/(\d)\1{3}/.test(last7)) {
    return { category: 'gold', categoryName: 'Золотий', memorability: 8, pattern: '4 однакові цифри підряд' };
  }
  if (/(\d)\1{2}/.test(last7)) {
    return { category: 'gold', categoryName: 'Золотий', memorability: 8, pattern: 'Трійка однакових цифр' };
  }

  // Triple pairs: AB-AB-AB
  if (last7.length === 7) {
    const d6 = last7.slice(1);
    if (d6.slice(0, 2) === d6.slice(2, 4) && d6.slice(2, 4) === d6.slice(4, 6)) {
      return { category: 'platinum', categoryName: 'Платиновий', memorability: 9, pattern: `Три пари ${d6.slice(0,2)}-${d6.slice(2,4)}-${d6.slice(4,6)}` };
    }
  }

  // Thousands ending (e.g. 000, 5000, 7000)
  if (/000$/.test(last7)) {
    return { category: 'gold', categoryName: 'Золотий', memorability: 8, pattern: 'Закінчення на Тисячі (000)' };
  }

  // Categories by price
  if (price >= 40000) {
    return { category: 'vip', categoryName: 'VIP / Діамантовий', memorability: 10, pattern: `Ексклюзивний VIP номер: ${formatted}` };
  } else if (price >= 10000) {
    return { category: 'platinum', categoryName: 'Платиновий', memorability: 9, pattern: `Платинова комбінація: ${formatted}` };
  } else if (price >= 3000) {
    return { category: 'gold', categoryName: 'Золотий', memorability: 8, pattern: `Золота комбінація: ${formatted}` };
  } else if (price >= 1500) {
    return { category: 'silver', categoryName: 'Срібний', memorability: 7, pattern: `Срібний номер: ${formatted}` };
  } else {
    return { category: 'bronze', categoryName: 'Бюджетний', memorability: 6, pattern: `Легкий номер: ${formatted}` };
  }
}

function assignBadge(price: number, category: string): 'TOP' | 'HOT' | 'HIT' | 'NEW' | 'EXCLUSIVE' | 'DISCOUNT' {
  if (category === 'vip' || price >= 50000) return 'EXCLUSIVE';
  if (category === 'platinum' || price >= 20000) return 'TOP';
  if (price >= 8000) return 'HOT';
  if (price >= 3000) return 'HIT';
  if (price >= 2000) return 'NEW';
  return 'DISCOUNT';
}

async function run() {
  console.log('Starting full scrape of meganomer.com.ua for Kyivstar, Vodafone, Lifecell...');

  // 1. Scrape Kyivstar
  console.log('\n--- CRAWLING KYIVSTAR ---');
  const ksCategories = ['kievstar', 'kievstar/silver', 'kievstar/gold', 'kievstar/platinum', 'kievstar/brilliant'];
  const allKsRaw: ScrapedRaw[] = [];
  const ksSeen = new Set<string>();
  for (const cat of ksCategories) {
    const res = await scrapeCategoryFull(cat);
    for (const item of res) {
      if (!ksSeen.has(item.prodId)) {
        ksSeen.add(item.prodId);
        allKsRaw.push(item);
      }
    }
  }
  console.log(`Kyivstar total unique items: ${allKsRaw.length}`);

  // 2. Scrape Vodafone
  console.log('\n--- CRAWLING VODAFONE ---');
  const vfCategories = ['mts', 'mts/silver', 'mts/gold', 'mts/platinum', 'mts/brilliant'];
  const allVfRaw: ScrapedRaw[] = [];
  const vfSeen = new Set<string>();
  for (const cat of vfCategories) {
    const res = await scrapeCategoryFull(cat);
    for (const item of res) {
      if (!vfSeen.has(item.prodId)) {
        vfSeen.add(item.prodId);
        allVfRaw.push(item);
      }
    }
  }
  console.log(`Vodafone total unique items: ${allVfRaw.length}`);

  // 3. Scrape Lifecell
  console.log('\n--- CRAWLING LIFECELL ---');
  const lifeCategories = ['life', 'life/silver', 'life/gold', 'life/platinum', 'life/brilliant'];
  const allLifeRaw: ScrapedRaw[] = [];
  const lifeSeen = new Set<string>();
  for (const cat of lifeCategories) {
    const res = await scrapeCategoryFull(cat);
    for (const item of res) {
      if (!lifeSeen.has(item.prodId)) {
        lifeSeen.add(item.prodId);
        allLifeRaw.push(item);
      }
    }
  }
  console.log(`Lifecell total unique items: ${allLifeRaw.length}`);

  // Merge and transform all into unified PhoneNumberItem format
  const allRaw = [...allKsRaw, ...allVfRaw, ...allLifeRaw];
  console.log(`\nGrand Total raw scraped items: ${allRaw.length}`);

  const processedList: any[] = [];
  const globalSeenNumbers = new Set<string>();

  for (let idx = 0; idx < allRaw.length; idx++) {
    const item = allRaw[idx];
    const formatted = item.name.trim();
    let digits = formatted.replace(/\D/g, '');
    if (digits.startsWith('380')) {
      digits = digits.slice(2);
    }
    if (digits.length < 10 && digits.length === 9) {
      digits = '0' + digits;
    }
    if (digits.length !== 10) {
      continue;
    }

    const uniqueKey = digits;
    if (globalSeenNumbers.has(uniqueKey)) {
      continue;
    }
    globalSeenNumbers.add(uniqueKey);

    const opInfo = determineOperator(digits, item.operator);
    const finalPrice = calculateAdjustedPrice(item.rawPrice);
    const patternInfo = detectPattern(formatted, digits, finalPrice);
    const badge = assignBadge(finalPrice, patternInfo.category);

    processedList.push({
      id: `mn-${digits}-${item.prodId || idx}`,
      rawNumber: digits,
      formatted: formatted,
      operator: opInfo.op,
      operatorName: opInfo.opTitle,
      code: opInfo.code,
      category: patternInfo.category,
      categoryName: patternInfo.categoryName,
      price: finalPrice,
      originalPrice: item.rawPrice,
      badge: badge,
      patternType: patternInfo.pattern,
      memorability: patternInfo.memorability,
      viewsCount: Math.floor(100 + Math.random() * 800)
    });
  }

  console.log(`\nSuccessfully processed and normalized: ${processedList.length} numbers.`);
  console.log(`- Kyivstar: ${processedList.filter(n => n.operator === 'kyivstar').length}`);
  console.log(`- Vodafone: ${processedList.filter(n => n.operator === 'vodafone').length}`);
  console.log(`- Lifecell: ${processedList.filter(n => n.operator === 'lifecell').length}`);

  // Save to src/data/all_numbers.json and data/catalog.json
  fs.writeFileSync('src/data/all_numbers.json', JSON.stringify(processedList, null, 2));
  fs.writeFileSync('data/catalog.json', JSON.stringify(processedList, null, 2));
  console.log('\nSaved full catalog to src/data/all_numbers.json and data/catalog.json!');
}

run();
