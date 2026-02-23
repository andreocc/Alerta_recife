
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.FRONTEND_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Cache Key baseada no corpo (prompt) para garantir que respostas diferentes não colidam
    const cacheUrl = new URL(request.url);
    const cacheKey = new Request(cacheUrl.toString(), {
      method: 'GET', // Transformamos em GET para o Cache API aceitar
      headers: request.headers
    });
    const cache = caches.default;

    let response = await cache.match(cacheKey);
    if (response) return response;

    if (request.method !== 'POST') {
      return new Response('Use POST', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const { prompt } = body;

      // Usando gemini-2.0-flash para latência ultrabaixa
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json"
            },
          }),
        }
      );

      const data = await geminiResponse.json();

      const responseData = new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=600, max-age=300',
        },
      });

      // Salva no cache da borda de forma assíncrona
      ctx.waitUntil(cache.put(cacheKey, responseData.clone()));

      return responseData;
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Worker Error' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },
};
