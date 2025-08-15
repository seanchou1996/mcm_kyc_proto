/*
 * MC Markets 原型 (第二版) - 主腳本文件
 * 此文件將包含從HTML中提取的所有JavaScript功能
 * 包括步驟導航、表單驗證和用戶交互邏輯
 */

// 後續將從index.html提取腳本到此文件 

// IP 地理位置檢測和國家選擇相關功能
async function detectUserCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        console.log('User location data:', data);
        
        const countrySelect = document.getElementById('country');
        if (countrySelect && data.country) {
            countrySelect.value = data.country;
            countrySelect.dispatchEvent(new Event('change'));
        }
    } catch (error) {
        console.error('Error detecting user country:', error);
    }
}

// 監管選項控制
function updateRegulationOptions() {
    const countrySelect = document.getElementById('country');
    const regulationOptions = document.querySelectorAll('.regulatory-option');
    const selectedCountry = countrySelect.value;
    
    // 如果沒有選擇國家，禁用所有監管選項
    if (!selectedCountry) {
        regulationOptions.forEach(option => {
            option.classList.add('disabled');
            option.onclick = null;
        });
        return;
    }
    
    // 啟用監管選項
    regulationOptions.forEach(option => {
        option.classList.remove('disabled');
        option.onclick = function() { selectRegulation(this.id); };
    });
    
    // 檢查是否為歐盟國家
    const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
    const isEUCountry = euCountries.includes(selectedCountry);
    
    // 如果是歐盟國家，禁用 FSA 選項
    const fsaOption = document.getElementById('fsa-option');
    if (isEUCountry && fsaOption) {
        fsaOption.classList.add('disabled');
        fsaOption.onclick = null;
        // 如果當前選中的是 FSA，則取消選擇
        if (fsaOption.classList.contains('selected')) {
            fsaOption.classList.remove('selected');
            updateNextButtonState();
        }
    }
}

// 更新下一步按鈕狀態
function updateNextButtonState() {
    const countrySelect = document.getElementById('country');
    const regulationOptions = document.querySelectorAll('.regulatory-option.selected');
    const nextButton = document.querySelector('#region-next');
    
    if (countrySelect.value && regulationOptions.length > 0) {
        nextButton.disabled = false;
    } else {
        nextButton.disabled = true;
    }
}

// 選擇監管框架
function selectRegulation(optionId) {
    const option = document.getElementById(optionId);
    if (option.classList.contains('disabled')) {
        return;
    }
    
    // 移除其他選項的選中狀態
    document.querySelectorAll('.regulatory-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // 選中當前選項
    option.classList.add('selected');
    
    // 更新下一步按鈕狀態
    updateNextButtonState();
    
    // 保存選擇到 localStorage
    localStorage.setItem('selectedRegulation', optionId);
}

// 選擇帳戶類型
function selectAccount(accountType) {
    // 移除其他選項的選中狀態
    document.querySelectorAll('.account-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // 選中當前選項
    const selectedAccount = document.getElementById(`${accountType}-account`);
    selectedAccount.classList.add('selected');
    
    // 保存選擇到 localStorage
    localStorage.setItem('selectedAccountType', accountType);
}

// 切換專業帳戶詳細信息
function toggleProfessionalDetails(event) {
    event.stopPropagation(); // 防止事件冒泡到帳戶選項
    const detailsPanel = document.getElementById('professional-details');
    const expandButton = event.target;
    
    if (detailsPanel.style.display === 'none') {
        detailsPanel.style.display = 'block';
        expandButton.textContent = '收起專業帳戶類型 ▲';
    } else {
        detailsPanel.style.display = 'none';
        expandButton.textContent = '了解更多專業帳戶類型 ▼';
    }
}

// 頁面加載完成後執行
document.addEventListener('DOMContentLoaded', function() {
    // 檢測用戶國家
    detectUserCountry();
    
    // 初始化國家選擇列表
    const countrySelect = document.getElementById('country');
    const countries = {
        'CN': '中國',
        'HK': '香港',
        'TW': '台灣',
        'SG': '新加坡',
        'JP': '日本',
        // 歐盟國家
        'DE': '德國',
        'FR': '法國',
        'IT': '意大利',
        'ES': '西班牙',
        // 其他主要國家
        'GB': '英國',
        'US': '美國',
        'CA': '加拿大',
        'AU': '澳大利亞'
    };
    
    for (const [code, name] of Object.entries(countries)) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        countrySelect.appendChild(option);
    }
    
    // 添加國家選擇變更監聽器
    countrySelect.addEventListener('change', function() {
        updateRegulationOptions();
        updateNextButtonState();
    });
    
    // 初始化監管選項狀態
    updateRegulationOptions();
    updateNextButtonState();
}); 