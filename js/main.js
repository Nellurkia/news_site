// 主应用入口
document.addEventListener('DOMContentLoaded', function () {
    // 初始化国际化
    window.i18n.init();

    // 初始化新闻加载器
    window.newsLoader.init();

    // 键盘快捷键支持
    document.addEventListener('keydown', function (e) {
        // ESC 关闭模态框
        if (e.key === 'Escape') {
            window.newsLoader.closeImageModal();
        }

        // 左右箭头切换图片
        if (document.getElementById('image-modal').style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                window.newsLoader.prevImage();
            } else if (e.key === 'ArrowRight') {
                window.newsLoader.nextImage();
            }
        }
    });

    // 添加一些实用的全局函数
    window.utils = {
        // 格式化日期
        formatDate: function (dateStr, lang = 'zh') {
            const date = new Date(dateStr);
            return lang === 'zh'
                ? date.toLocaleDateString('zh-CN')
                : date.toLocaleDateString('en-US');
        },

        // 截断文本
        truncateText: function (text, maxLength = 100) {
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        },

        // 检查是否为移动设备
        isMobile: function () {
            return window.innerWidth <= 768;
        }
    };

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 响应式处理
    function handleResize() {
        // 在移动设备上自动关闭模态框
        if (window.utils.isMobile() && document.getElementById('image-modal').style.display === 'block') {
            // 可以添加移动端特殊处理
        }
        
        // 重新渲染新闻列表以适应新的布局
        if (window.newsLoader) {
            window.newsLoader.renderCurrentPage();
        }
    }

    // 使用防抖处理resize事件，避免频繁重新渲染
    window.addEventListener('resize', debounce(handleResize, 250));

    // 添加加载完成的视觉反馈
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// 添加一些CSS动画类
const style = document.createElement('style');
style.textContent = `
    body {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    body.loaded {
        opacity: 1;
    }
    
    .news-card {
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.6s ease forwards;
    }
    
    .news-card:nth-child(1) { animation-delay: 0.1s; }
    .news-card:nth-child(2) { animation-delay: 0.2s; }
    .news-card:nth-child(3) { animation-delay: 0.3s; }
    .news-card:nth-child(4) { animation-delay: 0.4s; }
    .news-card:nth-child(5) { animation-delay: 0.5s; }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .image-item img {
        transition: transform 0.3s ease, filter 0.3s ease;
    }
    
    .image-item:hover img {
        transform: scale(1.05);
        filter: brightness(1.1);
    }
`;
document.head.appendChild(style);