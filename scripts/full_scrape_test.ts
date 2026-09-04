import fetch from 'node-fetch';

async function scanCategoryPages(catPath: string) {
  let start = 0;
  const items: any[] = [];
  const seenIds = new Set<string>();

  while (true) {
    const url = `https://meganomer.com.ua/${catPath}?start=${start}`;
    console.log(`Fetching ${url}...`);
    try {
      const res = await fetch(url);
      const text = await res.text();

      // Extract products
      // regex for product block
      const productRegex = /<div class="product productitem_(\d+)">[\s\S]*?<div class="name"><a href="([^"]*)">([^<]+)<\/a><\/div>[\s\S]*?<div class="jshop_price"><span>([\d\s]+)\s*грн[\s\S]*?<\/div>/g;
      
      let match;
      let countOnPage = 0;
      while ((match = productRegex.exec(text)) !== null) {
        const [_, prodId, link, name, priceStr] = match;
        if (!seenIds.has(prodId)) {
          seenIds.add(prodId);
          const rawPrice = parseInt(priceStr.replace(/\s+/g, ''), 10);
          items.push({
            prodId,
            link,
            name: name.trim(),
            rawPrice
          });
          countOnPage++;
        }
      }

      console.log(`Page start=${start}: found ${countOnPage} new items (total unique: ${items.length})`);
      if (countOnPage === 0) {
        break;
      }
      start += 24;
      // Sleep a tiny bit to be gentle
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`Error on ${url}:`, e);
      break;
    }
  }

  return items;
}

async function run() {
  console.log('Testing scan on kievstar:');
  const ks = await scanCategoryPages('kievstar');
  console.log(`Total Kyivstar numbers scraped: ${ks.length}`);

  console.log('Testing scan on mts:');
  const mts = await scanCategoryPages('mts');
  console.log(`Total Vodafone numbers scraped: ${mts.length}`);

  console.log('Testing scan on life:');
  const life = await scanCategoryPages('life');
  console.log(`Total Lifecell numbers scraped: ${life.length}`);
}

run();
