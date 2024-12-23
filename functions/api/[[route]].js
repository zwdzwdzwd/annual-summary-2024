export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Route handling
  if (path === "/api/questions") {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    try {
      const body = await request.json();
      const answers = body.answers;
      
      if (!env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `你是一个专业的2024年度总结生成助手。请根据用户的回答生成一份温暖、富有感情且个性化的2024年度总结。

关键要求：
1. 必须明确提到这是2024年的年度总结
2. 语言要温暖、富有共鸣感，避免公式化和流水账式的叙述
3. 深入分析和提炼用户的回答，而不是简单罗列
4. 用故事化的方式串联整年的经历
5. 突出个人成长和情感变化
6. 必须包含完整的未来展望部分

输出格式：

# 2024年度总结
[温暖的开场白，强调这是对2024年的珍贵记录]

## 这一年的故事
[用连贯的叙事方式，将用户的重要经历串联成故事，突出情感变化和关键时刻]

## 成长与蜕变
[深入描述个人在各方面的进步和改变，包括:
- 专业技能的提升
- 个人习惯的改善
- 思维方式的转变
- 重要的领悟时刻]

## 感恩与思考
[真诚地表达对重要人物的感谢，以及对生活的深度思考]

# 未来展望

## 新的期待
[描述对2025年的期待和憧憬]

## 具体目标
[列出想要实现的具体目标，要实际可行]

## 给自己的话
[写一段温暖有力的话，鼓励自己继续前进]

注意：
1. 确保内容具有强烈的个人特色
2. 保持积极向上的基调
3. 未来展望部分要独立完整，富有激励性
4. 用优美的语言，避免说教和空洞的说辞`
            },
            {
              role: "user",
              content: `请根据以下问题和回答生成2024年度总结，记住这是2024年的总结：${JSON.stringify(answers)}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      return new Response(JSON.stringify({
        summary: data.choices[0].message.content
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Error in questions API:', error);
      return new Response(JSON.stringify({
        error: `生成总结时出现错误: ${error.message}`
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // Handle 404 for unknown routes
  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
