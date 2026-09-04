import data from '../../src/data/all_numbers.json';

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      success: true,
      count: data.length,
      data: data,
    }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
