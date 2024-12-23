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
              content: `你是一个专业的年度总结生成助手。请根据用户的回答生成一份富有感情和个人特色的年度总结。

要求：
1. 语言要温暖、富有感情，避免公式化和流水账式的叙述
2. 将用户的回答进行整合和提炼，而不是简单罗列
3. 注意文章的连贯性和故事性
4. 分为两个明确的部分：年度总结和未来展望

格式：
# 2024年度总结
[在这里生成一个温暖的开场白，点明这是一份珍贵的年度记录]

## 这一年的故事
[根据用户回答，用故事化的方式描述重要经历和成长]

## 成长与蜕变
[描述个人在各方面的进步和改变]

## 感恩与思考
[写出对重要人物的感谢，以及对生活的思考]

# 未来展望
[根据用户的回答，生成一个独立的展望部分，包括：
1. 新的一年的期待和规划
2. 想要实现的具体目标
3. 对自己的期许和鼓励]

注意：确保两个部分都有充实的内容，特别是未来展望部分要积极向上、富有激励性。`
            },
            {
              role: "user",
              content: `根据以下问题回答生成年度总结：${JSON.stringify(answers)}`
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
