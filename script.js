class QuestionnaireApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = [];
        
        // DOM elements
        this.questionSection = document.getElementById('question-section');
        this.summarySection = document.getElementById('summary-section');
        this.questionText = document.getElementById('question-text');
        this.answerInput = document.getElementById('answer-input');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.startBtn = document.getElementById('start-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.loadingSection = document.getElementById('loading-section');
        
        // 添加返回按钮
        this.backBtn = document.createElement('button');
        this.backBtn.textContent = '返回上一题';
        this.backBtn.className = 'btn btn-secondary';
        this.backBtn.style.marginRight = '10px';
        
        this.loadQuestions();
        this.bindEvents();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startQuestionnaire());
        this.prevBtn.addEventListener('click', () => this.showPreviousQuestion());
        this.nextBtn.addEventListener('click', () => this.handleNextQuestion());
        this.saveBtn.addEventListener('click', () => this.saveSummary());
        this.restartBtn.addEventListener('click', () => this.restart());
        this.backBtn.addEventListener('click', () => this.showPreviousQuestion());
        document.getElementById('share-btn').addEventListener('click', () => this.generatePoster());
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('poster-modal').style.display = 'none';
        });
        document.getElementById('download-poster-btn').addEventListener('click', () => this.downloadPoster());
    }

    async loadQuestions() {
        try {
            const response = await fetch('40.txt');
            const text = await response.text();
            this.questions = text.split('\n').filter(q => q.trim());
            // 随机选择20个问题
            this.questions = this.shuffleArray(this.questions).slice(0, 20);
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('加载问题失败，请刷新页面重试');
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    startQuestionnaire() {
        this.questionSection.classList.remove('hidden');
        this.startBtn.classList.add('hidden');
        this.showQuestion();
    }

    showQuestion() {
        const currentQuestion = this.questions[this.currentQuestionIndex];
        this.questionText.textContent = `${this.currentQuestionIndex + 1}. ${currentQuestion}`;
        this.answerInput.value = this.answers[this.currentQuestionIndex] || '';
        
        // Update button states
        this.prevBtn.disabled = this.currentQuestionIndex === 0;
        this.nextBtn.textContent = this.currentQuestionIndex === this.questions.length - 1 ? '完成' : '下一题';
    }

    showPreviousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.showQuestion();
        }
    }

    handleNextQuestion() {
        const answer = this.answerInput.value.trim();
        if (!answer) {
            alert('请回答当前问题');
            return;
        }

        this.answers[this.currentQuestionIndex] = answer;

        if (this.currentQuestionIndex === this.questions.length - 1) {
            this.generateSummary();
        } else {
            this.currentQuestionIndex++;
            this.showQuestion();
        }
    }

    async generateSummary() {
        this.loadingSection.classList.remove('hidden');
        this.questionSection.classList.add('hidden');

        try {
            const answersWithQuestions = this.questions.map((q, i) => ({
                question: q,
                answer: this.answers[i]
            }));

            // 在生成总结前，保存问题和答案到 sessionStorage
            sessionStorage.setItem('questions', JSON.stringify(this.questions));
            sessionStorage.setItem('answers', JSON.stringify(this.answers));

            const response = await fetch('/api/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers: answersWithQuestions })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            const reviewContent = document.getElementById('review-content');
            reviewContent.innerHTML = marked.parse(data.summary);
            
            // 在总结部分添加返回按钮
            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '20px';
            buttonContainer.appendChild(this.backBtn);
            reviewContent.parentElement.insertBefore(buttonContainer, reviewContent.nextSibling);

            this.loadingSection.classList.add('hidden');
            this.summarySection.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error generating summary:', error);
            alert('生成总结时出现错误，请稍后重试');
            this.loadingSection.classList.add('hidden');
            this.questionSection.classList.remove('hidden');
        }
    }

    saveSummary() {
        const summaryText = document.getElementById('review-content').innerText;
        const blob = new Blob([summaryText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '2024年度总结.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async generatePoster() {
        try {
            const response = await fetch('/api/poster', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: window.location.href
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                const posterPreview = document.getElementById('poster-preview');
                posterPreview.innerHTML = `<img src="data:image/png;base64,${data.image}" alt="分享海报">`;
                document.getElementById('poster-modal').style.display = 'block';
            } else {
                alert('生成海报失败，请稍后重试');
            }
        } catch (error) {
            console.error('Error generating poster:', error);
            alert('生成海报时出现错误，请稍后重试');
        }
    }

    downloadPoster() {
        const img = document.querySelector('#poster-preview img');
        if (!img) return;

        const link = document.createElement('a');
        link.download = '2024年终总结分享海报.png';
        link.href = img.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    restart() {
        // 从 sessionStorage 恢复之前的答案
        const savedQuestions = sessionStorage.getItem('questions');
        const savedAnswers = sessionStorage.getItem('answers');
        
        if (savedQuestions && savedAnswers) {
            this.questions = JSON.parse(savedQuestions);
            this.answers = JSON.parse(savedAnswers);
        }
        
        this.currentQuestionIndex = this.answers.length - 1;
        this.summarySection.classList.add('hidden');
        this.questionSection.classList.remove('hidden');
        this.showQuestion();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new QuestionnaireApp();
});