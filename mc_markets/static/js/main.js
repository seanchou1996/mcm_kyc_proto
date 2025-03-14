// 等待DOM完全加載
document.addEventListener('DOMContentLoaded', function() {
    console.log('MC Markets loaded');
    
    // 活動導航項目
    setActiveNavItem();
    
    // 初始化工具提示
    initTooltips();
    
    // 訂閱表單處理
    setupSubscribeForm();
    
    // 過濾器處理（平台比較頁面）
    setupFilters();
    
    // 實時市場數據
    initializeMarketData();
    
    // 語言切換處理
    setupLanguageSwitcher();
});

/**
 * 設置當前活動的導航項目
 */
function setActiveNavItem() {
    // 獲取當前路徑
    const path = window.location.pathname;
    
    // 獲取所有導航項目
    const navItems = document.querySelectorAll('.navbar-nav .nav-link');
    
    // 遍歷導航項目，設置活動狀態
    navItems.forEach(item => {
        // 檢查項目的href屬性是否包含在當前路徑中
        if (item.getAttribute('href') && path.includes(item.getAttribute('href')) && item.getAttribute('href') !== '/') {
            item.classList.add('active');
        } else if (item.getAttribute('href') === '/' && path === '/') {
            item.classList.add('active');
        }
    });
}

/**
 * 初始化Bootstrap工具提示
 */
function initTooltips() {
    // 檢查是否存在Bootstrap的tooltip函數
    if (typeof bootstrap !== 'undefined' && typeof bootstrap.Tooltip !== 'undefined') {
        // 初始化所有工具提示
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

/**
 * 設置訂閱表單處理
 */
function setupSubscribeForm() {
    const subscribeBtn = document.getElementById('button-subscribe');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', function() {
            const emailInput = subscribeBtn.previousElementSibling;
            if (emailInput && emailInput.value) {
                // 模擬表單提交成功
                alert('感謝您的訂閱！');
                emailInput.value = '';
            } else {
                alert('請輸入有效的電子郵件地址');
            }
        });
    }
}

/**
 * 設置過濾器處理（平台比較頁面）
 */
function setupFilters() {
    // 獲取所有過濾器表單元素
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        // 為表單元素添加變更事件監聽器
        const filterInputs = filterForm.querySelectorAll('select, input');
        filterInputs.forEach(input => {
            input.addEventListener('change', function() {
                filterForm.submit();
            });
        });
        
        // 清除過濾器按鈕
        const clearFilterBtn = document.getElementById('clear-filters');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 重置所有過濾器
                filterInputs.forEach(input => {
                    if (input.tagName === 'SELECT') {
                        input.selectedIndex = 0;
                    } else if (input.tagName === 'INPUT' && input.type === 'number') {
                        input.value = '';
                    }
                });
                
                // 提交表單
                filterForm.submit();
            });
        }
    }
}

/**
 * 初始化實時市場數據
 */
function initializeMarketData() {
    // 立即獲取一次市場數據
    fetchMarketData();
    
    // 設置定時器，每30秒更新一次
    setInterval(fetchMarketData, 30000);
}

/**
 * 從API獲取市場數據並更新UI
 */
function fetchMarketData() {
    fetch('/api/market_data')
        .then(response => response.json())
        .then(data => {
            updateMarketTicker(data);
        })
        .catch(error => {
            console.error('獲取市場數據時出錯:', error);
        });
}

/**
 * 更新市場行情條
 * @param {Object} data - 市場數據
 */
function updateMarketTicker(data) {
    // 更新每個商品的價格和變化
    const tickerItems = document.querySelectorAll('#market-ticker [data-symbol]');
    
    tickerItems.forEach(item => {
        const symbol = item.getAttribute('data-symbol');
        if (data[symbol]) {
            const marketData = data[symbol];
            const priceElement = item.querySelector('.price');
            
            // 更新價格
            if (priceElement) {
                // 格式化價格顯示
                let formattedPrice;
                if (symbol === 'BTC') {
                    formattedPrice = marketData.price.toLocaleString();
                } else if (symbol === 'EURUSD') {
                    formattedPrice = marketData.price.toFixed(4);
                } else {
                    formattedPrice = marketData.price.toFixed(2);
                }
                priceElement.textContent = formattedPrice;
            }
            
            // 更新箭頭和顏色
            const iconElement = item.querySelector('i');
            if (iconElement) {
                if (marketData.change_percent >= 0) {
                    iconElement.className = 'fas fa-caret-up';
                    item.className = 'text-success';
                } else {
                    iconElement.className = 'fas fa-caret-down';
                    item.className = 'text-danger';
                }
            }
        }
    });
    
    // 更新最後更新時間
    updateLastUpdatedTime();
}

/**
 * 更新最後更新時間
 */
function updateLastUpdatedTime() {
    const timeElement = document.getElementById('market-update-time');
    if (timeElement) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeElement.textContent = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${hours}:${minutes}:${seconds}`;
    }
}

/**
 * 處理語言切換
 */
function setupLanguageSwitcher() {
    const languageLinks = document.querySelectorAll('#languageDropdown + .dropdown-menu .dropdown-item');
    languageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 語言切換後，確保頁面數據是最新的
            localStorage.setItem('lastLanguageChange', Date.now());
        });
    });
    
    // 檢查是否剛剛切換過語言
    const lastLanguageChange = localStorage.getItem('lastLanguageChange');
    if (lastLanguageChange && (Date.now() - parseInt(lastLanguageChange)) < 5000) {
        // 如果5秒內切換過語言，立即刷新市場數據
        fetchMarketData();
        localStorage.removeItem('lastLanguageChange');
    }
}
