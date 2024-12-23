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

    // 处理文本内容
    const lines = summary.split('\n').filter(line => line.trim());
    const processedSummary = lines.slice(0, 10).join('\n'); // 只取前10行

    // 创建一个简单的文本海报
    const posterContent = `
2024年度总结
—————————————

${processedSummary}

${new Date().toLocaleDateString()}
    `.trim();

    return new Response(JSON.stringify({
      status: 'success',
      content: posterContent
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
