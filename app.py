from flask import Flask, jsonify, request, send_from_directory, send_file
import random
import openai
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont
import io
import base64

app = Flask(__name__)

# 读取问题列表
def load_questions():
    with open('40.txt', 'r', encoding='utf-8') as f:
        # 只读取问题内容，忽略原有序号
        questions = []
        for line in f:
            if line.strip():
                # 去掉原有序号，只保留问题内容
                question = line.strip()
                if '. ' in question:
                    question = question.split('. ', 1)[1]
                questions.append(question)
    return questions

# 随机选择20个问题并添加新序号
def select_random_questions():
    all_questions = load_questions()
    selected_questions = random.sample(all_questions, 20)
    # 添加新的序号（1-20）
    numbered_questions = [f"{i+1}. {q}" for i, q in enumerate(selected_questions)]
    return numbered_questions

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def serve_css():
    return send_from_directory('.', 'style.css')

@app.route('/script.js')
def serve_js():
    return send_from_directory('.', 'script.js')

@app.route('/get_questions')
def get_questions():
    questions = select_random_questions()
    return jsonify(questions)

@app.route('/generate_summary', methods=['POST'])
def generate_summary():
    data = request.json
    questions = data['questions']
    answers = data['answers']

    # 将问答组合成文本
    qa_pairs = []
    for q, a in zip(questions, answers):
        # 去掉问题中的序号
        if '. ' in q:
            q = q.split('. ', 1)[1]
        qa_pairs.append(f"问：{q}\n答：{a}")
    qa_text = "\n".join(qa_pairs)

    # 使用OpenAI生成总结
    try:
        # 年度回顾
        review_prompt = f"""
        请为用户生成2024年的年度总结回顾。这是一份2024年（不是2023年）的年度总结，请确保所有内容都围绕2024年展开。

        要求：
        1. 总结要有故事性和连贯性
        2. 突出重要事件和成就
        3. 体现个人成长
        4. 包含情感体验
        5. 明确强调这是2024年的经历和感受
        6. 内容结构要求：
           - 开篇总述：简要概括这一年的整体感受
           - 重要成就：列举2-3个最重要的成就或突破
           - 个人成长：描述在能力、思维等方面的提升
           - 人际关系：总结与家人朋友的情感联系
           - 感悟总结：对这一年的深度思考和感悟
        7. 每个部分都要分段，段落之间要加空行
        8. 重要的数字或关键词可以适当加粗

        问答内容：
        {qa_text}
        """
        
        review_response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "你是一个专业的年度总结写作助手。请注意：当前是在总结2024年的经历，确保所有内容都是关于2024年的，不要出现2023年的表述。请用温暖真诚的语气写作，注意文章结构和段落划分，使用Markdown格式来美化文本。"},
                {"role": "user", "content": review_prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        review = review_response.choices[0].message.content

        # 未来展望
        outlook_prompt = f"""
        基于用户2024年的经历和总结，请为2025年制定展望计划。注意这是展望2025年（不是2024年）的计划。

        要求：
        1. 根据2024年的经历提出对2025年的合理期望
        2. 包含具体可行的2025年目标
        3. 提供实现目标的建议
        4. 保持积极向上的基调
        5. 确保所有展望都是针对2025年的
        6. 内容结构要求：
           - 开篇寄语：对新一年的期待和展望
           - 具体目标：分领域列举明确的目标（如工作、学习、生活等）
           - 行动计划：针对主要目标提供具体可行的实施步骤
           - 潜在挑战：预估可能遇到的困难和应对方案
           - 寄语结尾：富有激励性的结束语
        7. 每个部分都要分段，段落之间要加空行
        8. 重要的目标或关键行动点可以用列表形式呈现

        2024年经历：
        {qa_text}
        """
        
        outlook_response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "你是一个专业的未来规划顾问。请注意：我们正在基于2024年的总结来规划2025年，确保所有建议和展望都是面向2025年的。请提供具体且富有启发性的建议，使用Markdown格式来组织文本，确保内容结构清晰。"},
                {"role": "user", "content": outlook_prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        outlook = outlook_response.choices[0].message.content

        # 处理返回的文本，确保HTML换行正确显示
        review = review.replace('\n', '<br>')
        outlook = outlook.replace('\n', '<br>')

        return jsonify({
            "review": review,
            "outlook": outlook
        })
    except Exception as e:
        print(f"Error generating summary: {str(e)}")  # 添加错误日志
        return jsonify({"error": str(e)}), 500

@app.route('/generate_poster', methods=['POST'])
def generate_poster():
    try:
        # 创建海报背景
        width = 300  # 宽度
        height = 400  # 高度
        poster = Image.new('RGB', (width, height), '#FFFFFF')
        draw = ImageDraw.Draw(poster)

        # 苹果风格的渐变背景
        for y in range(height):
            r = int(240 + (y / height) * 15)
            g = int(240 + (y / height) * 15)
            b = int(245 + (y / height) * 10)
            for x in range(width):
                draw.point((x, y), fill=(r, g, b))

        # 添加标题
        try:
            title_font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 20)
        except:
            title_font = ImageFont.load_default()
            
        title = "我的2024年终总结"
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (width - title_width) // 2
        draw.text((title_x, 20), title, font=title_font, fill='#1D1D1F')

        # 添加装饰元素
        draw.line([(20, 45), (width-20, 45)], fill='#86868B', width=1)
        
        # 添加年份显示
        try:
            year_font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 40)
        except:
            year_font = ImageFont.load_default()
            
        year_text = "2024"
        year_bbox = draw.textbbox((0, 0), year_text, font=year_font)
        year_width = year_bbox[2] - year_bbox[0]
        year_x = (width - year_width) // 2
        draw.text((year_x, 60), year_text, font=year_font, fill='#86868B')

        # 生成当前页面的QR码
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(request.json.get('url', 'http://localhost:5005'))
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="#1D1D1F", back_color="white")
        
        # 调整QR码大小并添加到海报中央
        qr_size = 200  # 调整二维码大小为200px
        qr_img = qr_img.resize((qr_size, qr_size))
        qr_x = (width - qr_size) // 2
        qr_y = (height - qr_size) // 2  # 计算垂直居中位置
        poster.paste(qr_img, (qr_x, qr_y))  # 放置在中央位置

        # 添加扫码提示文字
        try:
            hint_font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 10)
        except:
            hint_font = ImageFont.load_default()
            
        hint_text = "扫描二维码，开启你的年度总结之旅"
        hint_bbox = draw.textbbox((0, 0), hint_text, font=hint_font)
        hint_width = hint_bbox[2] - hint_bbox[0]
        hint_x = (width - hint_width) // 2
        draw.text((hint_x, height - 20), hint_text, font=hint_font, fill='#1D1D1F')

        # 将图片转换为base64
        img_byte_arr = io.BytesIO()
        poster.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')

        return jsonify({
            'status': 'success',
            'image': img_base64
        })

    except Exception as e:
        print(f"Error generating poster: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # 设置OpenAI API密钥
    openai.api_key = os.getenv('OPENAI_API_KEY', '')  # 从环境变量获取 API 密钥
    # 启动应用
    app.run(debug=True, port=5006)
