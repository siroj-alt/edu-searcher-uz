// Saytning hozirgi versiyasi: ochiq qolgan eski sahifa yangilanishi kerakligini bilish uchun
export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(JSON.stringify({ build: process.env.ES_BUILD || '' }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, max-age=0' }
  });
}
