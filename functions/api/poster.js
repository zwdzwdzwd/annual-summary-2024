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

    // 创建一个简单的 SVG 海报
    const width = 800;
    const height = 1200;
    const padding = 40;
    const maxTextWidth = width - (padding * 2);

    // 将文本分成多行
    const words = summary.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length * 14 < maxTextWidth) {  // 估算字符宽度
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // 限制行数
    lines = lines.slice(0, 15);
    if (lines.length === 15) {
      lines[14] += '...';
    }

    // 生成 SVG
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        
        <!-- 标题 -->
        <text x="${width/2}" y="${padding + 40}" 
              font-family="Arial" font-size="48" font-weight="bold" 
              text-anchor="middle" fill="#333333">
          2024年度总结
        </text>

        <!-- 内容 -->
        ${lines.map((line, i) => `
          <text x="${padding}" y="${padding + 120 + (i * 40)}"
                font-family="Arial" font-size="24"
                fill="#666666">
            ${line}
          </text>
        `).join('')}

        <!-- 日期 -->
        <text x="${width - padding}" y="${height - padding}"
              font-family="Arial" font-size="20"
              text-anchor="end" fill="#999999">
          ${new Date().toLocaleDateString()}
        </text>
      </svg>
    `;

    // 将 SVG 转换为 base64
    const base64Image = btoa(svg);

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
