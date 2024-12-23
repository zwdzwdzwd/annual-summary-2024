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
    const { ImageResponse } = await import('@vercel/og');
    const body = await context.request.json();
    const { summary } = body;

    // 创建一个简单的海报
    const image = new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '800px',
            height: '1200px',
            backgroundColor: '#ffffff',
            padding: '40px',
          },
          children: [
            {
              type: 'h1',
              props: {
                style: { fontSize: '48px', color: '#333333', marginBottom: '40px' },
                children: '2024年度总结',
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '24px',
                  color: '#666666',
                  textAlign: 'left',
                  lineHeight: '1.5',
                  maxWidth: '600px',
                },
                children: summary.substring(0, 500) + '...',  // 限制文本长度
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  marginTop: '40px',
                  fontSize: '20px',
                  color: '#999999',
                },
                children: new Date().toLocaleDateString(),
              },
            },
          ],
        },
      },
      {
        width: 800,
        height: 1200,
      }
    );

    // 将图片转换为 base64
    const buffer = await image.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return new Response(JSON.stringify({
      status: 'success',
      image: base64Image
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
