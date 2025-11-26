// Cloudflare Worker لجعل R2 bucket عام
// انسخ هذا الكود وحطه في Cloudflare Workers

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // إزالة / من البداية

    try {
      // جلب الملف من R2
      const object = await env.R2_BUCKET.get(key);

      if (object === null) {
        return new Response('File not found', { status: 404 });
      }

      // إرجاع الملف مع headers صحيحة
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Access-Control-Allow-Origin', '*'); // CORS
      headers.set('Cache-Control', 'public, max-age=31536000'); // Cache سنة

      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      return new Response('Error: ' + error.message, { status: 500 });
    }
  },
};

// ============================================
// خطوات التفعيل:
// ============================================
// 1. روح Cloudflare Dashboard → Workers & Pages
// 2. Create Application → Create Worker
// 3. سمّه: heritage-r2-public
// 4. انسخ الكود فوق وحطه
// 5. Deploy
// 6. Settings → Variables → R2 Bucket Bindings
//    - Variable name: R2_BUCKET
//    - R2 bucket: heritage
// 7. Save
// 8. Settings → Triggers → Custom Domains
//    - ربط domain (مثلاً: cdn.yoursite.com)
//    - أو استخدم workers.dev subdomain
// 9. غير R2_PUBLIC_URL في .env للدومين الجديد
// ============================================
