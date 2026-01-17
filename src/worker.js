// Cloudflare Workers极简实现
export default {
  async fetch(request) {
    // 简单的Hello World响应
    return new Response('Hello from Cloudflare Workers!', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};