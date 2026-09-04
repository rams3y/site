import * as fs from 'fs';

interface ScrapedRaw {
  prodId: string;
  name: string;
  rawPrice: number;
  operatorStr: string;
  catSlug: string;
}

function parseProducts(html: string, catSlug: string): ScrapedRaw[] {
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
    const operatorStr = opMatch ? opMatch[1].trim() : '';

    if (name) {
      items.push({
        prodId,
        name,
        rawPrice,
        operatorStr,
        catSlug
      });
    }
  }

  return items;
}

async function scrapeOperator(catSlug: string): Promise<ScrapedRaw[]> {
  let start = 0;
  const items: ScrapedRaw[] = [];
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
      const pageItems = parseProducts(html, catSlug);
      
      let newCount = 0;
      for (const item of pageItems) {
        if (!seenIds.has(item.prodId)) {
          seenIds.add(item.prodId);
          items.push(item);
          newCount++;
        }
      }

      console.log(`[${catSlug}] page ${(start/24)+1} (start=${start}): ${pageItems.length} items (${newCount} new). Total: ${items.length}`);

      // If page is empty or no new items found, reached end of pagination
      if (pageItems.length === 0 || newCount === 0) {
        break;
      }

      start += 24;
      await new Promise(r => setTimeout(r, 40));
    } catch (e) {
      console.error(`Error scraping ${url}:`, e);
      break;
    }
  }
  return items;
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
function determineOperator(digits: string, opStr: string, catSlug: string): { op: 'lifecell' | 'kyivstar' | 'vodafone'; opTitle: string; code: string } {
  let code = digits.slice(0, 3);
  if (digits.startsWith('380')) {
    code = digits.slice(2, 5);
  }

  const kyivstarCodes = ['067', '068', '096', '097', '098', '077'];
  const vodafoneCodes = ['050', '066', '095', '099', '075'];
  const lifecellCodes = ['063', '073', '093'];

  if (catSlug === 'kievstar' || kyivstarCodes.includes(code)) {
    return { op: 'kyivstar', opTitle: 'Київстар', code };
  }
  if (catSlug === 'mts' || vodafoneCodes.includes(code)) {
    return { op: 'vodafone', opTitle: 'Vodafone', code };
  }
  if (catSlug === 'life' || lifecellCodes.includes(code)) {
    return { op: 'lifecell', opTitle: 'Lifecell', code };
  }

  // Fallback by operator text
  if (opStr.toLowerCase().includes('киев') || opStr.toLowerCase().includes('kyiv')) return { op: 'kyivstar', opTitle: 'Київстар', code };
  if (opStr.toLowerCase().includes('vodafone') || opStr.toLowerCase().includes('мтс')) return { op: 'vodafone', opTitle: 'Vodafone', code };
  return { op: 'lifecell', opTitle: 'Lifecell', code };
}

// Pattern detector
function detectPattern(formatted: string, rawNumber: string, price: number) {
  const digits = rawNumber.replace(/\D/g, '');
  const last7 = digits.length >= 7 ? digits.slice(-7) : digits;

  if (/(\d)\1{5}/.test(last7)) {
    return { category: 'vip' as const, categoryName: 'VIP / Діамантовий', memorability: 10, pattern: '6 однакових цифр' };
  }
  if (/(\d)\1{4}/.test(last7)) {
    return { category: 'platinum' as const, categoryName: 'Платиновий', memorability: 9, pattern: '5 однакових цифр' };
  }
  if (/(\d)\1{3}/.test(last7)) {
    return { category: 'gold' as const, categoryName: 'Золотий', memorability: 8, pattern: '4 однакові цифри підряд' };
  }
  if (/(\d)\1{2}/.test(last7)) {
    return { category: 'gold' as const, categoryName: 'Золотий', memorability: 8, pattern: 'Трійка однакових цифр' };
  }

  if (last7.length === 7) {
    const d6 = last7.slice(1);
    if (d6.slice(0, 2) === d6.slice(2, 4) && d6.slice(2, 4) === d6.slice(4, 6)) {
      return { category: 'platinum' as const, categoryName: 'Платиновий', memorability: 9, pattern: `Три пари ${d6.slice(0,2)}-${d6.slice(2,4)}-${d6.slice(4,6)}` };
    }
  }

  if (/000$/.test(last7)) {
    return { category: 'gold' as const, categoryName: 'Золотий', memorability: 8, pattern: 'Закінчення на Тисячі (000)' };
  }

  if (price >= 40000) {
    return { category: 'vip' as const, categoryName: 'VIP / Діамантовий', memorability: 10, pattern: `VIP номер: ${formatted}` };
  } else if (price >= 10000) {
    return { category: 'platinum' as const, categoryName: 'Платиновий', memorability: 9, pattern: `Платиновий номер: ${formatted}` };
  } else if (price >= 3000) {
    return { category: 'gold' as const, categoryName: 'Золотий', memorability: 8, pattern: `Золотий номер: ${formatted}` };
  } else if (price >= 1500) {
    return { category: 'silver' as const, categoryName: 'Срібний', memorability: 7, pattern: `Срібний номер: ${formatted}` };
  } else {
    return { category: 'bronze' as const, categoryName: 'Бюджетний', memorability: 6, pattern: `Легкий номер: ${formatted}` };
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

async function main() {
  console.log('=== SCRAPING KYIVSTAR ===');
  const ksRaw = await scrapeOperator('kievstar');
  console.log(`Kyivstar count: ${ksRaw.length}`);

  console.log('\n=== SCRAPING VODAFONE ===');
  const vfRaw = await scrapeOperator('mts');
  console.log(`Vodafone count: ${vfRaw.length}`);

  console.log('\n=== SCRAPING LIFECELL ===');
  const lifeRaw = await scrapeOperator('life');
  console.log(`Lifecell count: ${lifeRaw.length}`);

  const allRaw = [...ksRaw, ...vfRaw, ...lifeRaw];
  console.log(`\nTotal items scraped across 3 operators: ${allRaw.length}`);

  const catalog: any[] = [];
  const seenNumbers = new Set<string>();

  for (let idx = 0; idx < allRaw.length; idx++) {
    const item = allRaw[idx];
    const formatted = item.name.trim();
    let digits = formatted.replace(/\D/g, '');
    if (digits.startsWith('380')) {
      digits = digits.slice(2);
    }
    if (digits.length === 9) {
      digits = '0' + digits;
    }
    if (digits.length !== 10) {
      continue;
    }

    if (seenNumbers.has(digits)) {
      continue;
    }
    seenNumbers.add(digits);

    const opInfo = determineOperator(digits, item.operatorStr, item.catSlug);
    const finalPrice = calculateAdjustedPrice(item.rawPrice);
    const patternInfo = detectPattern(formatted, digits, finalPrice);
    const badge = assignBadge(finalPrice, patternInfo.category);

    catalog.push({
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
      viewsCount: Math.floor(120 + Math.random() * 750)
    });
  }

  console.log(`\nFinal unique catalog items: ${catalog.length}`);
  console.log(`- Kyivstar: ${catalog.filter(n => n.operator === 'kyivstar').length}`);
  console.log(`- Vodafone: ${catalog.filter(n => n.operator === 'vodafone').length}`);
  console.log(`- Lifecell: ${catalog.filter(n => n.operator === 'lifecell').length}`);

  fs.writeFileSync('src/data/all_numbers.json', JSON.stringify(catalog, null, 2));
  fs.writeFileSync('data/catalog.json', JSON.stringify(catalog, null, 2));
  console.log('Saved to src/data/all_numbers.json and data/catalog.json successfully!');
}

main();
