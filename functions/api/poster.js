export async function onRequest(context) {
  // Handle CORS preflight requests
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await context.request.json();
    const { summary } = body;

    // 创建一个简单的 HTML 海报
    const html = `
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 40px;
              width: 800px;
              height: 1200px;
              background: white;
              font-family: Arial, sans-serif;
              box-sizing: border-box;
            }
            .title {
              font-size: 48px;
              font-weight: bold;
              color: #333;
              text-align: center;
              margin-bottom: 40px;
            }
            .content {
              font-size: 24px;
              color: #666;
              line-height: 1.6;
              white-space: pre-wrap;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 15;
              -webkit-box-orient: vertical;
            }
            .date {
              font-size: 20px;
              color: #999;
              text-align: right;
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          <div class="title">2024年度总结</div>
          <div class="content">${summary}</div>
          <div class="date">${new Date().toLocaleDateString()}</div>
        </body>
      </html>
    `;

    // 将 HTML 转换为 base64
    const base64Html = btoa(html);

    return new Response(JSON.stringify({
      status: 'success',
      image: base64Html,
      contentType: 'text/html'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error generating poster:', error);
    return new Response(JSON.stringify({
      error: '生成海报时出现错误: ' + error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
