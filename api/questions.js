export async function onRequestPost(context) {
  const body = await context.request.json();
  const answers = body.answers;
  
  // OpenAI API configuration
  const OPENAI_API_KEY = context.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({
      error: "OpenAI API key not configured"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "你是一个专业的年度总结生成助手。请根据用户的回答生成一份结构化的年度总结。包含以下部分：开篇总述、重要成就、个人成长、人际关系、感悟总结。使用 Markdown 格式。"
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
