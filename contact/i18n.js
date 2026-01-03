// 国际化管理
class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'zh';
        this.translations = {};
    }

    // 设置当前语言
    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.updateUI();
        
        // 触发语言变更事件
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }

    // 获取当前语言
    getCurrentLanguage() {
        return this.currentLang;
    }

    // 更新UI中的所有文本
    updateUI() {
        const elements = document.querySelectorAll('[data-zh][data-en]');
        elements.forEach(element => {
            const text = element.getAttribute(`data-${this.currentLang}`);
            if (text) {
                element.textContent = text;
            }
        });

        // 更新placeholder
        const placeholderElements = document.querySelectorAll('[data-zh-placeholder][data-en-placeholder]');
        placeholderElements.forEach(element => {
            const placeholder = element.getAttribute(`data-${this.currentLang}-placeholder`);
            if (placeholder) {
                element.placeholder = placeholder;
            }
        });

        // 更新语言按钮状态
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`lang-${this.currentLang}`)?.classList.add('active');

        // 更新HTML lang属性
        document.documentElement.lang = this.currentLang === 'zh' ? 'zh-CN' : 'en';
    }

    // 获取翻译文本
    t(key, lang = null) {
        const targetLang = lang || this.currentLang;
        return this.translations[key]?.[targetLang] || key;
    }

    // 添加翻译
    addTranslations(translations) {
        this.translations = { ...this.translations, ...translations };
    }

    // 初始化
    init() {
        // 设置语言切换按钮事件
        document.getElementById('lang-zh')?.addEventListener('click', () => {
            this.setLanguage('zh');
        });

        document.getElementById('lang-en')?.addEventListener('click', () => {
            this.setLanguage('en');
        });

        // 初始化UI
        this.updateUI();
    }
}

// 创建全局实例
window.i18n = new I18n();
