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

    // 创建一个简单的海报
    const canvas = new OffscreenCanvas(800, 1200);
    const ctx = canvas.getContext('2d');

    // 设置背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 1200);

    // 添加标题
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('2024年度总结', 400, 100);

    // 添加内容
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    const lines = summary.split('\n');
    let y = 200;
    for (const line of lines) {
      if (y > 1100) break; // 防止内容溢出
      ctx.fillText(line, 50, y);
      y += 40;
    }

    // 添加日期
    ctx.font = '20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleDateString(), 750, 1150);

    // 将 canvas 转换为 blob
    const blob = await canvas.convertToBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
      error: '生成海报时出现错误'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
