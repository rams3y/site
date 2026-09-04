import fetch from 'node-fetch';

async function testCategory(url: string) {
  console.log(`Checking ${url}...`);
  const res = await fetch(url);
  const text = await res.text();
  
  // Extract pagination links
  const startMatches = text.match(/start=(\d+)/g) || [];
  console.log(`Found start matches for ${url}:`, startMatches);
  
  // Extract products count or items
  const productMatches = text.match(/class="product productitem_(\d+)"/g) || [];
  console.log(`Found ${productMatches.length} products on first page of ${url}`);
}

async function run() {
  await testCategory('https://meganomer.com.ua/kievstar');
  await testCategory('https://meganomer.com.ua/mts');
  await testCategory('https://meganomer.com.ua/life');
}

run();
