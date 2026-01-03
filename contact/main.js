// 主应用入口
document.addEventListener('DOMContentLoaded', function () {
    // 初始化国际化
    window.i18n.init();

    // 获取模态框元素
    const qrModal = document.getElementById('qrModal');
    const modalImage = document.getElementById('modalImage');
    let currentImageSrc = '';

    // 为所有联系卡片添加点击事件
    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // 如果点击的是链接，不打开模态框
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }
            
            const img = this.querySelector('img');
            if (img) {
                currentImageSrc = img.src;
                modalImage.src = currentImageSrc;
                qrModal.classList.add('active');
            }
        });
    });

    // 点击模态框背景关闭
    qrModal.addEventListener('click', function(e) {
        if (e.target === qrModal) {
            closeModal();
        }
    });

    // 关闭模态框函数
    function closeModal() {
        qrModal.classList.remove('active');
        currentImageSrc = '';
    }

    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && qrModal.classList.contains('active')) {
            closeModal();
        }
    });

    // 保存二维码函数
    window.saveQRCode = function() {
        if (!currentImageSrc) return;

        // 创建一个临时的a标签来下载图片
        const link = document.createElement('a');
        link.href = currentImageSrc;
        
        // 从图片路径中提取文件名
        const filename = currentImageSrc.split('/').pop();
        link.download = filename || 'qrcode.png';
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 添加加载完成的视觉反馈
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // 添加一些实用的全局函数
    window.utils = {
        // 检查是否为移动设备
        isMobile: function () {
            return window.innerWidth <= 768;
        }
    };
});
