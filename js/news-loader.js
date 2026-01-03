// 新闻加载器
class NewsLoader {
    constructor() {
        this.newsData = [];
        this.filteredData = []; // 搜索过滤后的数据
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortOrder = 'desc'; // 'asc' 或 'desc'
        this.currentImages = [];
        this.currentImageIndex = 0;
        this.currentNewsId = null; // 用于跟踪当前新闻ID
        this.fromGallery = false; // 用于跟踪是否从相册墙打开的图片
        this.searchActive = false; // 搜索是否激活
        this.searchFilters = {
            dateFrom: '',
            dateTo: '',
            types: [],
            keyword: ''
        };
    }

    // 加载新闻索引
    async loadNewsIndex() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`data/index.json?t=${timestamp}`);
            const index = await response.json();
            return index.news || [];
        } catch (error) {
            console.error('加载新闻索引失败:', error);
            return [];
        }
    }

    // 加载单个新闻数据
    async loadNewsItem(id) {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`data/news/${id}.json?t=${timestamp}`);
            return await response.json();
        } catch (error) {
            console.error(`加载新闻 ${id} 失败:`, error);
            return null;
        }
    }

    // 加载所有新闻数据
    async loadAllNews() {
        const loading = document.getElementById('loading');
        loading.style.display = 'block';

        try {
            const newsIndex = await this.loadNewsIndex();
            const newsPromises = newsIndex.map(id => this.loadNewsItem(id));
            const newsItems = await Promise.all(newsPromises);

            this.newsData = newsItems.filter(item => item !== null);
            this.filteredData = [...this.newsData]; // 初始化过滤数据
            this.sortNews();
            this.initializeSearchTypes(); // 初始化搜索类型
            this.renderCurrentPage();
        } catch (error) {
            console.error('加载新闻数据失败:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    // 排序新闻
    sortNews() {
        const dataToSort = this.searchActive ? this.filteredData : this.newsData;
        dataToSort.sort((a, b) => {
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }

    // 设置排序方式
    setSortOrder(order) {
        this.sortOrder = order;
        this.sortNews();
        this.currentPage = 1;
        this.renderCurrentPage();
        this.updateSortButton();
    }

    // 切换排序方式
    toggleSortOrder() {
        const newOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
        this.setSortOrder(newOrder);
    }

    // 更新排序按钮显示
    updateSortButton() {
        const sortBtn = document.getElementById('sort-toggle');
        const sortText = sortBtn.querySelector('.sort-text');
        const lang = window.i18n.getCurrentLanguage();
        
        if (this.sortOrder === 'desc') {
            sortText.textContent = lang === 'zh' ? '最新' : 'Newest';
        } else {
            sortText.textContent = lang === 'zh' ? '最早' : 'Oldest';
        }
    }

    // 获取当前页数据
    getCurrentPageData() {
        const dataSource = this.searchActive ? this.filteredData : this.newsData;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return dataSource.slice(startIndex, endIndex);
    }

    // 获取总页数
    getTotalPages() {
        const dataSource = this.searchActive ? this.filteredData : this.newsData;
        return Math.ceil(dataSource.length / this.itemsPerPage);
    }

    // 渲染新闻卡片
    renderNewsCard(news) {
        const lang = window.i18n.getCurrentLanguage();

        // 格式化日期
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return lang === 'zh'
                ? date.toLocaleDateString('zh-CN')
                : date.toLocaleDateString('en-US');
        };

        const dateText = news.endDate
            ? `${formatDate(news.startDate)} - ${formatDate(news.endDate)}`
            : formatDate(news.startDate);

        // 处理描述文本
        const description = news.description[lang] || news.description.zh;
        const isLongDescription = description.length > 60;
        const shortDescription = isLongDescription ? description.substring(0, 60) + '...' : description;

        // 渲染图片
        const renderImages = () => {
            if (!news.images || news.images.length === 0) return '';

            const visibleImages = news.images.slice(0, 3);
            const hiddenCount = news.images.length - 3;
            const imageCount = news.images.length;

            return `
                <div class="images-grid images-count-${Math.min(imageCount, 3)}">
                    ${visibleImages.map((img, index) => {
                const isMoreButton = index === 2 && hiddenCount > 0;
                const moreText = imageCount >= 4
                    ? `+${hiddenCount}  ${lang === 'zh' ? '查看所有图片' : 'View All'}`
                    : `+${hiddenCount}`;

                const clickHandler = isMoreButton && imageCount >= 4
                    ? `newsLoader.openGalleryModal('${news.id}')`
                    : `newsLoader.openImageModal('${news.id}', ${index})`;

                return `
                            <div class="image-item ${isMoreButton ? 'images-more' : ''}" 
                                 data-count="${isMoreButton ? moreText : ''}"
                                 onclick="${clickHandler}">
                                <img src="${img.thumbnail}" alt="${img.alt || ''}" loading="lazy">
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        };

        // 渲染视频
        const renderVideos = () => {
            if (!news.videos || news.videos.length === 0) return '';

            return `
                <div class="videos">
                    ${news.videos.map(video => {
                const videoTitle = typeof video.title === 'object'
                    ? (video.title[lang] || video.title.zh)
                    : (video.title || (lang === 'zh' ? 'Bilibili视频' : 'Bilibili Video'));

                return `
                            <div class="video-embed">
                                <iframe 
                                    src="//player.bilibili.com/player.html?bvid=${video.id}&page=1&autoplay=0&muted=1" 
                                    scrolling="no" 
                                    border="0" 
                                    frameborder="no" 
                                    framespacing="0" 
                                    allowfullscreen="true"
                                    title="${videoTitle}">
                                </iframe>
                                ${videoTitle ? `<div class="video-title">${videoTitle}</div>` : ''}
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        };

        // 渲染链接
        const renderLinks = () => {
            if (!news.links || news.links.length === 0) return '';

            return `
                <div class="links">
                    ${news.links.map(link => {
                const linkTitle = typeof link.title === 'object'
                    ? (link.title[lang] || link.title.zh)
                    : (link.title || (lang === 'zh' ? '相关链接' : 'Related Link'));

                return `
                            <a href="${link.url}" target="_blank" class="link-item">
                                🔗 ${linkTitle}
                            </a>
                        `;
            }).join('')}
                </div>
            `;
        };

        return `
            <div class="news-card">
                <div class="news-date">${dateText}</div>
                <div class="news-content">
                    <h2 class="news-title">${news.title[lang] || news.title.zh}</h2>
                    ${news.subtitle ? `<h3 class="news-subtitle">${news.subtitle[lang] || news.subtitle.zh}</h3>` : ''}
                    <div class="news-description">
                        <div class="description-short" id="desc-short-${news.id}">
                            ${shortDescription}
                        </div>
                        ${isLongDescription ? `
                            <div class="description-full" id="desc-full-${news.id}" style="display: none;">
                                ${description}
                            </div>
                            <button class="expand-btn" onclick="newsLoader.toggleDescription('${news.id}')" 
                                    id="expand-btn-${news.id}" 
                                    data-zh="展开" data-en="Expand">
                                ${lang === 'zh' ? '展开' : 'Expand'}
                            </button>
                        ` : ''}
                    </div>
                    ${renderImages()}
                    ${renderVideos()}
                    ${renderLinks()}
                </div>
            </div>
        `;
    }

    // 切换描述展开/收起
    toggleDescription(newsId) {
        const shortDiv = document.getElementById(`desc-short-${newsId}`);
        const fullDiv = document.getElementById(`desc-full-${newsId}`);
        const btn = document.getElementById(`expand-btn-${newsId}`);
        const lang = window.i18n.getCurrentLanguage();

        if (fullDiv.style.display === 'none') {
            shortDiv.style.display = 'none';
            fullDiv.style.display = 'block';
            btn.textContent = lang === 'zh' ? '收起' : 'Collapse';
        } else {
            shortDiv.style.display = 'block';
            fullDiv.style.display = 'none';
            btn.textContent = lang === 'zh' ? '展开' : 'Expand';
        }
    }

    // 渲染当前页
    renderCurrentPage() {
        const container = document.getElementById('news-container');
        const currentData = this.getCurrentPageData();

        // 检查是否为移动端
        const isMobile = window.innerWidth <= 1100;
        
        if (isMobile) {
            // 移动端：单列布局
            container.innerHTML = currentData.map(news => this.renderNewsCard(news)).join('');
        } else {
            // 桌面端：双列布局，奇数项在左列，偶数项在右列
            const leftColumn = currentData.filter((_, index) => index % 2 === 0);
            const rightColumn = currentData.filter((_, index) => index % 2 === 1);
            
            container.innerHTML = `
                <div class="news-column">
                    ${leftColumn.map(news => this.renderNewsCard(news)).join('')}
                </div>
                <div class="news-column">
                    ${rightColumn.map(news => this.renderNewsCard(news)).join('')}
                </div>
            `;
        }
        
        this.updatePagination();
    }

    // 更新分页信息
    updatePagination() {
        const totalPages = this.getTotalPages();

        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('next-page').disabled = this.currentPage >= totalPages;

        // 更新页码显示为简洁格式
        document.getElementById('page-info').textContent = `${this.currentPage} / ${totalPages}`;
    }

    // 打开页码选择器
    openPagePicker() {
        const overlay = document.getElementById('page-picker-overlay');
        const grid = document.getElementById('page-picker-grid');
        const totalPages = this.getTotalPages();

        // 生成页码按钮
        grid.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = 'page-picker-btn';
            if (i === this.currentPage) {
                btn.classList.add('active');
            }
            btn.textContent = i;
            btn.addEventListener('click', () => {
                this.goToPage(i);
                this.closePagePicker();
            });
            grid.appendChild(btn);
        }

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    // 关闭页码选择器
    closePagePicker() {
        const overlay = document.getElementById('page-picker-overlay');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // 恢复滚动
    }

    // 跳转到指定页
    goToPage(pageNumber) {
        const totalPages = this.getTotalPages();
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            this.currentPage = pageNumber;
            this.renderCurrentPage();
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // 初始化搜索类型选项
    initializeSearchTypes() {
        const lang = window.i18n.getCurrentLanguage();
        const typesSet = new Set();
        
        // 收集所有唯一的 subtitle
        this.newsData.forEach(news => {
            if (news.subtitle && news.subtitle[lang]) {
                const subtitles = Array.isArray(news.subtitle[lang]) 
                    ? news.subtitle[lang] 
                    : [news.subtitle[lang]];
                subtitles.forEach(sub => typesSet.add(sub));
            }
        });

        const dropdown = document.getElementById('search-type-dropdown');
        dropdown.innerHTML = '';

        Array.from(typesSet).sort().forEach(type => {
            const option = document.createElement('div');
            option.className = 'search-type-option';
            option.innerHTML = `
                <input type="checkbox" id="type-${type}" value="${type}">
                <label for="type-${type}">${type}</label>
            `;
            dropdown.appendChild(option);
        });
    }

    // 切换搜索面板
    toggleSearchPanel() {
        const panel = document.getElementById('search-panel');
        const toggle = document.getElementById('search-toggle');
        
        if (panel.classList.contains('active')) {
            panel.classList.remove('active');
        } else {
            panel.classList.add('active');
            // 更新类型选项（以防语言切换）
            this.initializeSearchTypes();
        }
    }

    // 切换类型下拉框
    toggleTypeDropdown() {
        const dropdown = document.getElementById('search-type-dropdown');
        const toggle = document.getElementById('search-type-toggle');
        
        dropdown.classList.toggle('active');
        toggle.classList.toggle('active');
    }

    // 执行搜索
    performSearch() {
        const lang = window.i18n.getCurrentLanguage();
        
        // 获取搜索条件
        this.searchFilters.dateFrom = document.getElementById('search-date-from').value;
        this.searchFilters.dateTo = document.getElementById('search-date-to').value;
        this.searchFilters.keyword = document.getElementById('search-keyword').value.trim().toLowerCase();
        
        // 获取选中的类型
        const typeCheckboxes = document.querySelectorAll('#search-type-dropdown input[type="checkbox"]:checked');
        this.searchFilters.types = Array.from(typeCheckboxes).map(cb => cb.value);

        // 检查是否有任何搜索条件
        const hasFilters = this.searchFilters.dateFrom || 
                          this.searchFilters.dateTo || 
                          this.searchFilters.types.length > 0 || 
                          this.searchFilters.keyword;

        if (!hasFilters) {
            // 没有搜索条件，显示所有数据
            this.clearSearch();
            return;
        }

        // 过滤数据
        this.filteredData = this.newsData.filter(news => {
            // 日期过滤
            if (this.searchFilters.dateFrom) {
                const newsDate = new Date(news.startDate);
                const fromDate = new Date(this.searchFilters.dateFrom);
                if (newsDate < fromDate) return false;
            }
            
            if (this.searchFilters.dateTo) {
                const newsDate = new Date(news.startDate);
                const toDate = new Date(this.searchFilters.dateTo);
                if (newsDate > toDate) return false;
            }

            // 类型过滤
            if (this.searchFilters.types.length > 0) {
                const newsSubtitles = news.subtitle && news.subtitle[lang]
                    ? (Array.isArray(news.subtitle[lang]) ? news.subtitle[lang] : [news.subtitle[lang]])
                    : [];
                
                const hasMatchingType = newsSubtitles.some(sub => 
                    this.searchFilters.types.includes(sub)
                );
                
                if (!hasMatchingType) return false;
            }

            // 关键词过滤
            if (this.searchFilters.keyword) {
                const title = (news.title[lang] || news.title.zh || '').toLowerCase();
                const description = (news.description[lang] || news.description.zh || '').toLowerCase();
                const subtitle = news.subtitle && news.subtitle[lang]
                    ? (Array.isArray(news.subtitle[lang]) ? news.subtitle[lang].join(' ') : news.subtitle[lang]).toLowerCase()
                    : '';
                
                const searchText = `${title} ${description} ${subtitle}`;
                if (!searchText.includes(this.searchFilters.keyword)) return false;
            }

            return true;
        });

        this.searchActive = true;
        this.currentPage = 1; // 重置到第一页
        this.sortNews();
        this.renderCurrentPage();
        
        // 关闭搜索面板，显示激活状态
        document.getElementById('search-panel').classList.remove('active');
        document.getElementById('search-toggle').classList.add('active');
        
        // 关闭类型下拉框
        document.getElementById('search-type-dropdown').classList.remove('active');
        document.getElementById('search-type-toggle').classList.remove('active');
    }

    // 清除搜索
    clearSearch() {
        // 重置搜索条件
        this.searchFilters = {
            dateFrom: '',
            dateTo: '',
            types: [],
            keyword: ''
        };
        
        // 清空输入框
        document.getElementById('search-date-from').value = '';
        document.getElementById('search-date-to').value = '';
        document.getElementById('search-keyword').value = '';
        
        // 取消所有类型选择
        document.querySelectorAll('#search-type-dropdown input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        // 重置状态
        this.searchActive = false;
        this.filteredData = [...this.newsData];
        this.currentPage = 1;
        this.sortNews();
        this.renderCurrentPage();
        
        // 移除激活状态
        document.getElementById('search-toggle').classList.remove('active');
    }

    // 上一页
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderCurrentPage();
        }
    }

    // 下一页
    nextPage() {
        if (this.currentPage < this.getTotalPages()) {
            this.currentPage++;
            this.renderCurrentPage();
        }
    }

    // 打开图片模态框
    openImageModal(newsId, imageIndex) {
        const news = this.newsData.find(n => n.id === newsId);
        if (!news || !news.images) return;

        this.currentImages = news.images;
        this.currentImageIndex = imageIndex;
        this.currentNewsId = newsId;
        this.fromGallery = false;

        this.showImageModal(imageIndex);
    }

    // 显示图片模态框
    showImageModal(imageIndex) {
        const lang = window.i18n.getCurrentLanguage();
        const image = this.currentImages[imageIndex];
        
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');
        const counter = document.getElementById('image-counter');
        const imageTitle = document.getElementById('image-title');
        const imageDescription = document.getElementById('image-description');

        modalImage.src = image.full;
        modalImage.alt = image.alt || '';
        counter.textContent = `${imageIndex + 1} / ${this.currentImages.length}`;

        // 显示图片标题和描述
        if (image.title) {
            const title = typeof image.title === 'object' 
                ? (image.title[lang] || image.title.zh || image.alt)
                : (image.title || image.alt);
            imageTitle.textContent = title;
            imageTitle.style.display = 'block';
        } else {
            imageTitle.textContent = image.alt || (lang === 'zh' ? '图片' : 'Image');
            imageTitle.style.display = 'block';
        }

        if (image.description) {
            const description = typeof image.description === 'object'
                ? (image.description[lang] || image.description.zh)
                : image.description;
            imageDescription.textContent = description;
            imageDescription.style.display = 'block';
        } else {
            imageDescription.style.display = 'none';
        }

        modal.style.display = 'block';

        // 更新导航按钮状态
        document.getElementById('prev-image').disabled = imageIndex === 0;
        document.getElementById('next-image').disabled = imageIndex === this.currentImages.length - 1;
    }

    // 从相册墙打开图片模态框
    openImageModalFromGallery(newsId, imageIndex) {
        const news = this.newsData.find(n => n.id === newsId);
        if (!news || !news.images) return;

        this.currentImages = news.images;
        this.currentImageIndex = imageIndex;
        this.currentNewsId = newsId;
        this.fromGallery = true;

        // 先关闭相册墙
        this.closeGalleryModal();

        this.showImageModal(imageIndex);
    }

    // 关闭图片模态框
    closeImageModal() {
        document.getElementById('image-modal').style.display = 'none';

        // 如果是从相册墙打开的，返回到相册墙
        if (this.fromGallery && this.currentNewsId) {
            this.openGalleryModal(this.currentNewsId);
        }
    }

    // 上一张图片
    prevImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            this.updateModalImage();
        }
    }

    // 下一张图片
    nextImage() {
        if (this.currentImageIndex < this.currentImages.length - 1) {
            this.currentImageIndex++;
            this.updateModalImage();
        }
    }

    // 更新模态框图片
    updateModalImage() {
        this.showImageModal(this.currentImageIndex);
    }

    // 下载当前图片
    downloadImage() {
        if (this.currentImages.length === 0) return;

        const image = this.currentImages[this.currentImageIndex];
        const link = document.createElement('a');
        link.href = image.full;
        link.download = `image_${this.currentImageIndex + 1}.jpg`;
        link.click();
    }

    // 打开相册墙模态框
    openGalleryModal(newsId) {
        console.log('Opening gallery modal for:', newsId); // 调试信息

        const news = this.newsData.find(n => n.id === newsId);
        if (!news || !news.images) {
            console.log('No news or images found'); // 调试信息
            return;
        }

        console.log('Found news with', news.images.length, 'images'); // 调试信息

        const lang = window.i18n.getCurrentLanguage();
        const title = news.title[lang] || news.title.zh;

        // 移除现有的相册墙模态框
        const existingModal = document.getElementById('gallery-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建新的相册墙模态框
        const galleryModal = document.createElement('div');
        galleryModal.id = 'gallery-modal';
        galleryModal.className = 'gallery-modal';
        galleryModal.style.display = 'block';

        galleryModal.innerHTML = `
            <div class="gallery-modal-content">
                <div class="gallery-header">
                    <div class="gallery-title">${title}</div>
                    <div class="gallery-controls">
                        <button class="gallery-btn" onclick="window.newsLoader.downloadAllImages('${newsId}')">
                            📥 ${lang === 'zh' ? '下载所有' : 'Download All'}
                        </button>
                        <span class="close" onclick="window.newsLoader.closeGalleryModal()">&times;</span>
                    </div>
                </div>
                <div class="gallery-grid">
                    ${news.images.map((img, index) => `
                        <div class="gallery-item" onclick="window.newsLoader.openImageModalFromGallery('${newsId}', ${index});">
                            <img src="${img.thumbnail}" alt="${img.alt || ''}" loading="lazy">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(galleryModal);

        // 点击背景关闭
        galleryModal.addEventListener('click', (e) => {
            if (e.target === galleryModal) {
                this.closeGalleryModal();
            }
        });

        console.log('Gallery modal created and displayed'); // 调试信息
    }

    // 关闭相册墙模态框
    closeGalleryModal() {
        console.log('Closing gallery modal'); // 调试信息
        const galleryModal = document.getElementById('gallery-modal');
        if (galleryModal) {
            galleryModal.remove();
        }
    }

    // 下载所有图片
    downloadAllImages(newsId) {
        const news = this.newsData.find(n => n.id === newsId);
        if (!news || !news.images) return;

        const lang = window.i18n.getCurrentLanguage();
        const title = news.title[lang] || news.title.zh;

        // 创建一个延迟函数来避免浏览器阻止多个下载
        const downloadWithDelay = (images, index = 0) => {
            if (index >= images.length) return;

            const img = images[index];
            const link = document.createElement('a');
            link.href = img.full;
            link.download = `${title}_${index + 1}.jpg`;
            link.click();

            // 延迟500ms后下载下一张
            setTimeout(() => {
                downloadWithDelay(images, index + 1);
            }, 500);
        };

        downloadWithDelay(news.images);
    }

    // 测试函数 - 可以在浏览器控制台调用
    testGalleryModal() {
        console.log('Testing gallery modal...');
        if (this.newsData.length > 0) {
            this.openGalleryModal(this.newsData[0].id);
        } else {
            console.log('No news data available');
        }
    }

    // 初始化
    init() {
        // 绑定分页事件
        document.getElementById('prev-page').addEventListener('click', () => this.prevPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());

        // 绑定页码选择器事件
        document.getElementById('page-selector').addEventListener('click', () => this.openPagePicker());
        document.getElementById('close-page-picker').addEventListener('click', () => this.closePagePicker());
        
        // 点击遮罩层关闭
        document.getElementById('page-picker-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'page-picker-overlay') {
                this.closePagePicker();
            }
        });

        // 绑定搜索事件
        document.getElementById('search-toggle').addEventListener('click', () => this.toggleSearchPanel());
        document.getElementById('search-type-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleTypeDropdown();
        });
        document.getElementById('search-submit').addEventListener('click', () => this.performSearch());
        document.getElementById('search-clear').addEventListener('click', () => this.clearSearch());
        
        // 搜索框回车触发搜索
        document.getElementById('search-keyword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // 点击其他地方关闭类型下拉框
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('search-type-dropdown');
            const toggle = document.getElementById('search-type-toggle');
            if (dropdown.classList.contains('active') && 
                !dropdown.contains(e.target) && 
                !toggle.contains(e.target)) {
                dropdown.classList.remove('active');
                toggle.classList.remove('active');
            }
        });

        // ESC键关闭页码选择器和搜索面板
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('page-picker-overlay');
                if (overlay.classList.contains('active')) {
                    this.closePagePicker();
                }
                
                const searchPanel = document.getElementById('search-panel');
                if (searchPanel.classList.contains('active')) {
                    searchPanel.classList.remove('active');
                }
                
                const typeDropdown = document.getElementById('search-type-dropdown');
                if (typeDropdown.classList.contains('active')) {
                    typeDropdown.classList.remove('active');
                    document.getElementById('search-type-toggle').classList.remove('active');
                }
            }
        });

        // 绑定排序事件
        document.getElementById('sort-toggle').addEventListener('click', () => {
            this.toggleSortOrder();
        });

        // 绑定模态框事件
        document.querySelector('.close').addEventListener('click', () => this.closeImageModal());
        document.getElementById('prev-image').addEventListener('click', () => this.prevImage());
        document.getElementById('next-image').addEventListener('click', () => this.nextImage());
        document.getElementById('download-btn').addEventListener('click', () => this.downloadImage());

        // 点击模态框背景关闭
        document.getElementById('image-modal').addEventListener('click', (e) => {
            if (e.target.id === 'image-modal') {
                this.closeImageModal();
            }
        });

        // 监听语言变更事件
        window.addEventListener('languageChanged', () => {
            this.renderCurrentPage();
            this.updateSortButton();
            // 重新初始化搜索类型（语言切换时）
            if (this.newsData.length > 0) {
                this.initializeSearchTypes();
            }
        });

        // 初始化排序按钮显示
        this.updateSortButton();

        // 加载数据
        this.loadAllNews();
    }
}

// 创建全局实例
window.newsLoader = new NewsLoader();