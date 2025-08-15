// MC Markets CFD 槓桿與風控規則原型應用邏輯

// 風險配置（可編輯）
const CONFIG = {
  notionalBasis: "grossNotional",           // 多空名義合計

  // 二層浮動槓桿的分界
  thresholdUSD: 500_000,                    // > 500k 進入第 2 層（槓桿減半）

  // 品種設定（USD 計價；限紅＝單帳戶 x 單品種上限）
  symbols: {
    // ===== Metals =====
    XAUUSD: {
      category: "Metals",
      maxLeverageL1: 200,                   // 層1最大槓桿
      maxLeverageL2: 100,                   // 層2槓桿（減半）
      mmrL1: 0.005,                         // 維保率：0.50%
      mmrL2: 0.020,                         // 維保率：2.00%（4×）
      limitUSD: 10_000_000                  // 限紅
    },
    XAGUSD: {
      category: "Metals",
      maxLeverageL1: 200,
      maxLeverageL2: 100,
      mmrL1: 0.005,                         // 0.50%
      mmrL2: 0.020,                         // 2.00%（4×）
      limitUSD: 10_000_000
    },

    // ===== Crypto =====
    BTCUSD: {
      category: "Crypto",
      maxLeverageL1: 100,
      maxLeverageL2: 50,
      mmrL1: 0.008,                         // 0.80%
      mmrL2: 0.030,                         // 3.00%（≈3.75×）
      limitUSD: 1_000_000
    },
    ETHUSD: {
      category: "Crypto",
      maxLeverageL1: 100,
      maxLeverageL2: 50,
      mmrL1: 0.008,                         // 0.80%
      mmrL2: 0.030,                         // 3.00%
      limitUSD: 1_000_000
    },
    SOLUSD: {
      category: "Crypto",
      // 注意：SOL 的限紅 < 500k，所以實務上只會用到第 1 層
      maxLeverageL1: 100,
      maxLeverageL2: 50,                    // 仍保留欄位以維持統一邏輯
      mmrL1: 0.010,                         // 1.00%
      mmrL2: 0.040,                         // 4.00%
      limitUSD: 200_000
    }
  },

  // 階梯式點差（深度保費）：名義額越大，額外點差（bps）越高；僅展示，不納入保證金計算
  tieredSpread: [
    { min:       0, addBps: 0  },
    { min: 100_000, addBps: 3  },
    { min: 250_000, addBps: 7  },
    { min: 500_000, addBps: 12 }
  ],

  // 抵押品政策（可編輯）
  collateralPolicy: {
    // 穩定資產／現金
    USD_CASH: { 
      tiers: [
        { upTo: 5_000_000, ratio: 1.00 }, 
        { upTo: Infinity, ratio: 0.99 }
      ], 
      notes: "銀行入金USD/等值USD餘額" 
    },
    USDT: { 
      tiers: [
        { upTo: 5_000_000, ratio: 1.00 }, 
        { upTo: Infinity, ratio: 0.99 }
      ], 
      notes: "穩定幣；大型名義值輕微折扣" 
    },
    USDC: { 
      tiers: [
        { upTo: 5_000_000, ratio: 1.00 }, 
        { upTo: Infinity, ratio: 0.99 }
      ], 
      notes: "穩定幣；大型名義值輕微折扣" 
    },

    // Top 5 市值代幣（2025-08 週期）
    BTC: { 
      tiers: [
        { upTo: 1_000_000, ratio: 1.00 }, 
        { upTo: 2_000_000, ratio: 0.975 }, 
        { upTo: Infinity, ratio: 0.95 }
      ],  
      notes: "高流動、仍有波動尾部風險" 
    },
    ETH: { 
      tiers: [
        { upTo: 500_000, ratio: 1.00 }, 
        { upTo: 1_000_000, ratio: 0.975 }, 
        { upTo: Infinity, ratio: 0.95 }
      ],  
      notes: "流動性佳；較BTC略低容忍" 
    },
    BNB: { 
      tiers: [
        { upTo: 300_000, ratio: 1.00 }, 
        { upTo: 600_000, ratio: 0.95 }, 
        { upTo: Infinity, ratio: 0.90 }
      ],   
      notes: "交易所生態幣；給較高折扣" 
    },
    XRP: { 
      tiers: [
        { upTo: 200_000, ratio: 1.00 }, 
        { upTo: 500_000, ratio: 0.95 }, 
        { upTo: Infinity, ratio: 0.75 }
      ],  
      notes: "法務／波動事件敏感；更高折扣" 
    }
  },

  // 即時價格（靜態，實際應從 API 獲取）
  currentPrices: {
    BTC: 45000,
    ETH: 2800,
    BNB: 320,
    XRP: 0.55,
    USDT: 1.00,
    USDC: 1.00
  },

  // 預留：單品種總頭寸 / 特定時間規則（先不啟用）
  portfolioRules: {
    symbolAggregateLimit: null,  // e.g., { category:"Crypto", maxUSD: 3_000_000 }
    timeWindowLimit: null        // e.g., { symbol:"XAUUSD", from:"21:00", to:"22:30", levMul:0.8, note:"數據公佈時段臨時降槓桿" }
  }
};

// 工具提示內容
const TOOLTIPS = {
  "持倉名義價值": "您的持倉名義價值包含多頭與空頭倉位的名義總額（多空名義合計）。",
  "最大槓桿倍數": "可用的最大槓桿倍數取決於持倉名義價值所在的層級。",
  "維持保證金比率": "維持保證金採分段累加；名義跨入更高層級時，比率上升。",
  "維持金額 (USD)": "前 500,000 用層1比率，超過部分用層2比率；結果在跨層時保持連續。",
  "分層門檻": "當持倉名義價值超過 500,000 USD 時，將進入第二層級，槓桿減半且維保率提高。",
  "單品種限紅": "每個品種的最大持倉限制，超過此限制將無法開新倉位。",
  "層級門檻說明": "抵押品價值超過此門檻時，將適用下一層級的抵押率。",
  "抵押率說明": "抵押品在該層級下的有效價值比率，體現資產波動性差異與風控邏輯。",
  "說明提示": "各資產的風險特性和抵押率設定原因。"
};

// 應用主類
class MCMarketsApp {
  constructor() {
    this.currentSymbol = null;
    this.chart = null;
    this.init();
  }

  init() {
    this.renderSymbolsTable();
    this.renderCollateralTable();
    this.setupEventListeners();
    this.setupTooltips();
    this.initializeChart();
    console.log('MC Markets 應用已初始化');
  }

  // 渲染品種規格表
  renderSymbolsTable() {
    const tbody = document.getElementById('symbols-table-body');
    const symbolSelect = document.getElementById('symbol-select');
    
    if (!tbody || !symbolSelect) return;

    // 清空現有內容
    tbody.innerHTML = '';
    symbolSelect.innerHTML = '<option value="">請選擇品種</option>';

    Object.entries(CONFIG.symbols).forEach(([symbol, config]) => {
      // 表格行
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="font-semibold">${symbol}</td>
        <td>${config.maxLeverageL1} → ${config.maxLeverageL2}</td>
        <td>${this.formatUSD(CONFIG.thresholdUSD)}</td>
        <td>${(config.mmrL1 * 100).toFixed(2)}% / ${(config.mmrL2 * 100).toFixed(2)}%</td>
        <td>${this.formatUSD(config.limitUSD)}</td>
      `;
      tbody.appendChild(row);

      // 下拉選項
      const option = document.createElement('option');
      option.value = symbol;
      option.value = symbol;
      option.textContent = `${symbol} (${config.category})`;
      symbolSelect.appendChild(option);
    });
  }

  // 渲染抵押品表格
  renderCollateralTable() {
    const tbody = document.getElementById('collateral-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    Object.entries(CONFIG.collateralPolicy).forEach(([asset, policy]) => {
      const row = document.createElement('tr');
      
      // 構建層級和抵押率顯示
      let tiersDisplay = '';
      let ratiosDisplay = '';
      
      policy.tiers.forEach((tier, index) => {
        const upTo = tier.upTo === Infinity ? '∞' : this.formatUSD(tier.upTo);
        const ratio = (tier.ratio * 100).toFixed(1);
        
        if (index === 0) {
          tiersDisplay += `0 - ${upTo}`;
          ratiosDisplay += `${ratio}%`;
        } else {
          tiersDisplay += `<br>${this.formatUSD(policy.tiers[index-1].upTo)} - ${upTo}`;
          ratiosDisplay += `<br>${ratio}%`;
        }
      });

      row.innerHTML = `
        <td class="font-semibold">${asset}</td>
        <td>${tiersDisplay}</td>
        <td>${ratiosDisplay}</td>
        <td class="text-sm text-mc-muted">${policy.notes}</td>
      `;
      
      tbody.appendChild(row);
    });
  }

  // 設置事件監聽器
  setupEventListeners() {
    // 計算按鈕
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => this.calculate());
    }

    // 品種選擇
    const symbolSelect = document.getElementById('symbol-select');
    if (symbolSelect) {
      symbolSelect.addEventListener('change', (e) => {
        this.currentSymbol = e.target.value;
        this.updateChart();
      });
    }

    // 名義額輸入
    const inputs = ['long-notional', 'short-notional', 'total-notional'];
    inputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => this.handleInputChange());
      }
    });

    // 抵押品輸入
    const collateralInputs = ['collateral-usd', 'collateral-usdt', 'collateral-usdc', 'collateral-btc', 'collateral-eth', 'collateral-bnb', 'collateral-xrp'];
    collateralInputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => this.updateCollateralSummary());
      }
    });

    // 展開/收合按鈕
    this.setupToggleButtons();
  }

  // 設置工具提示
  setupTooltips() {
    const tooltipContainer = document.getElementById('tooltip-container');
    if (!tooltipContainer) return;

    // 桌面端 hover 事件
    document.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('tooltip-trigger')) {
        const label = e.target.getAttribute('aria-label');
        const tooltip = TOOLTIPS[label];
        if (tooltip) {
          this.showTooltip(e.target, tooltip);
        }
      }
    });

    document.addEventListener('mouseout', () => {
      this.hideTooltip();
    });

    // 移動端點擊事件
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tooltip-trigger')) {
        const label = e.target.getAttribute('aria-label');
        const tooltip = TOOLTIPS[label];
        if (tooltip) {
          this.toggleTooltip(e.target, tooltip);
        }
      }
    });
  }

  // 顯示工具提示
  showTooltip(element, text) {
    const tooltip = document.getElementById('tooltip-container');
    if (!tooltip) return;

    const rect = element.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 10) + 'px';
    tooltip.classList.add('show');
  }

  // 隱藏工具提示
  hideTooltip() {
    const tooltip = document.getElementById('tooltip-container');
    if (tooltip) {
      tooltip.classList.remove('show');
    }
  }

  // 切換工具提示（移動端）
  toggleTooltip(element, text) {
    const tooltip = document.getElementById('tooltip-container');
    if (!tooltip) return;

    if (tooltip.classList.contains('show')) {
      this.hideTooltip();
    } else {
      this.showTooltip(element, text);
    }
  }

  // 處理輸入變化
  handleInputChange() {
    const totalInput = document.getElementById('total-notional');
    const longInput = document.getElementById('long-notional');
    const shortInput = document.getElementById('short-notional');

    if (totalInput && totalInput.value) {
      // 如果直接輸入總額，清空多空輸入
      if (longInput) longInput.value = '';
      if (shortInput) shortInput.value = '';
    } else if (longInput && shortInput) {
      // 如果輸入多空，清空總額
      if (totalInput) totalInput.value = '';
    }
  }

  // 設置展開/收合按鈕
  setupToggleButtons() {
    // 導言說明展開/收合
    const toggleIntro = document.getElementById('toggle-intro');
    const introContent = document.getElementById('intro-content');
    if (toggleIntro && introContent) {
      toggleIntro.addEventListener('click', () => {
        const isHidden = introContent.classList.contains('hidden');
        introContent.classList.toggle('hidden');
        toggleIntro.innerHTML = isHidden ? '收起說明 ▲' : '查看詳細說明 ▼';
      });
    }

    // 抵押品表格展開/收合
    const toggleCollateralTable = document.getElementById('toggle-collateral-table');
    const collateralTableContent = document.getElementById('collateral-table-content');
    if (toggleCollateralTable && collateralTableContent) {
      toggleCollateralTable.addEventListener('click', () => {
        const isHidden = collateralTableContent.classList.contains('hidden');
        collateralTableContent.classList.toggle('hidden');
        toggleCollateralTable.innerHTML = isHidden ? '收起表格 ▲' : '展開表格 ▼';
      });
    }

    // 抵押倉位面板展開/收合
    const toggleCollateralPanel = document.getElementById('toggle-collateral-panel');
    const collateralPanelContent = document.getElementById('collateral-panel-content');
    if (toggleCollateralPanel && collateralPanelContent) {
      toggleCollateralPanel.addEventListener('click', () => {
        const isHidden = collateralPanelContent.classList.contains('hidden');
        collateralPanelContent.classList.toggle('hidden');
        toggleCollateralPanel.innerHTML = isHidden ? '收起面板 ▲' : '展開面板 ▼';
      });
    }
  }

  // 更新抵押品摘要
  updateCollateralSummary() {
    const summaryDiv = document.getElementById('collateral-summary');
    if (!summaryDiv) return;

    let totalValue = 0;
    let effectiveValue = 0;
    const details = [];

    // 計算各抵押品價值
    Object.entries(CONFIG.collateralPolicy).forEach(([asset, policy]) => {
      const inputId = `collateral-${asset.toLowerCase()}`;
      const input = document.getElementById(inputId);
      if (input && input.value) {
        const amount = parseFloat(input.value);
        const price = CONFIG.currentPrices[asset] || 1;
        const marketValue = amount * price;
        totalValue += marketValue;

        // 計算有效抵押價值（考慮分層折扣）
        const effectiveCollateralValue = this.calculateEffectiveCollateralValue(asset, marketValue);
        effectiveValue += effectiveCollateralValue;

        details.push(`${asset}: $${this.formatUSD(marketValue)} → $${this.formatUSD(effectiveCollateralValue)}`);
      }
    });

    if (totalValue === 0) {
      summaryDiv.innerHTML = '請輸入抵押品數量以查看摘要';
      return;
    }

    const efficiency = totalValue > 0 ? (effectiveValue / totalValue * 100).toFixed(1) : 0;
    
    summaryDiv.innerHTML = `
      <div class="space-y-2">
        <div class="flex justify-between">
          <span>總市值:</span>
          <span class="text-mc-text font-semibold">${this.formatUSD(totalValue)}</span>
        </div>
        <div class="flex justify-between">
          <span>有效抵押價值:</span>
          <span class="text-mc-primary font-semibold">${this.formatUSD(effectiveValue)}</span>
        </div>
        <div class="flex justify-between">
          <span>抵押效率:</span>
          <span class="text-mc-accent font-semibold">${efficiency}%</span>
        </div>
        <div class="text-xs text-mc-muted mt-2">
          ${details.join('<br>')}
        </div>
      </div>
    `;
  }

  // 計算有效抵押價值
  calculateEffectiveCollateralValue(asset, marketValue) {
    const policy = CONFIG.collateralPolicy[asset];
    if (!policy) return marketValue;

    let effectiveValue = 0;
    let remainingValue = marketValue;

    for (const tier of policy.tiers) {
      if (remainingValue <= 0) break;
      
      const tierValue = Math.min(remainingValue, tier.upTo);
      effectiveValue += tierValue * tier.ratio;
      remainingValue -= tierValue;
      
      if (tier.upTo === Infinity) break;
    }

    return effectiveValue;
  }

  // 計算保證金
  calculate() {
    if (!this.currentSymbol) {
      alert('請先選擇品種');
      return;
    }

    const symbol = CONFIG.symbols[this.currentSymbol];
    if (!symbol) return;

    // 獲取輸入值
    const longNotional = parseFloat(document.getElementById('long-notional').value) || 0;
    const shortNotional = parseFloat(document.getElementById('short-notional').value) || 0;
    const totalNotional = parseFloat(document.getElementById('total-notional').value) || 0;

    // 計算名義總額
    let grossNotional;
    if (totalNotional > 0) {
      grossNotional = totalNotional;
    } else {
      grossNotional = Math.abs(longNotional) + Math.abs(shortNotional);
    }

    if (grossNotional === 0) {
      alert('請輸入名義額');
      return;
    }

    // 檢查限紅
    if (grossNotional > symbol.limitUSD) {
      alert(`超過限紅！${this.currentSymbol} 最大持倉為 ${this.formatUSD(symbol.limitUSD)}`);
      return;
    }

    // 計算結果
    const result = this.calculateMargin(symbol, grossNotional);
    this.displayResults(result);
    this.updateChart(result);
    this.updateSpreadEstimate(grossNotional);
  }

  // 計算保證金邏輯
  calculateMargin(symbol, grossNotional) {
    // 判層與槓桿
    const isTier2 = grossNotional > CONFIG.thresholdUSD;
    const currentLeverage = isTier2 ? symbol.maxLeverageL2 : symbol.maxLeverageL1;

    // 初始保證金（分段相加）
    const p1 = Math.min(grossNotional, CONFIG.thresholdUSD) / symbol.maxLeverageL1;
    const p2 = Math.max(0, grossNotional - CONFIG.thresholdUSD) / symbol.maxLeverageL2;
    const initialMargin = p1 + p2;

    // 維持保證金（分段相加；跨層連續）
    const mm1 = Math.min(grossNotional, CONFIG.thresholdUSD) * symbol.mmrL1;
    const mm2 = Math.max(0, grossNotional - CONFIG.thresholdUSD) * symbol.mmrL2;
    const maintenanceMargin = mm1 + mm2;

    // 可加倉空間
    const headroomTier = Math.max(0, CONFIG.thresholdUSD - grossNotional);
    const headroomLimit = Math.max(0, symbol.limitUSD - grossNotional);

    // 計算可用保證金（包含抵押品）
    const availableMargin = this.calculateAvailableMargin();

    return {
      symbol: this.currentSymbol,
      grossNotional,
      isTier2,
      currentLeverage,
      initialMargin,
      maintenanceMargin,
      headroomTier,
      headroomLimit,
      limitUSD: symbol.limitUSD,
      thresholdUSD: CONFIG.thresholdUSD,
      availableMargin,
      canOpenPosition: availableMargin >= initialMargin
    };
  }

  // 計算可用保證金
  calculateAvailableMargin() {
    let totalCollateralValue = 0;

    // 計算抵押品總價值
    Object.entries(CONFIG.collateralPolicy).forEach(([asset, policy]) => {
      const inputId = `collateral-${asset.toLowerCase()}`;
      const input = document.getElementById(inputId);
      if (input && input.value) {
        const amount = parseFloat(input.value);
        const price = CONFIG.currentPrices[asset] || 1;
        const marketValue = amount * price;
        const effectiveValue = this.calculateEffectiveCollateralValue(asset, marketValue);
        totalCollateralValue += effectiveValue;
      }
    });

    // 可用保證金 = 抵押品有效價值 - 已用保證金 - 手續費/浮損緩衝
    // 這裡簡化處理，實際應考慮已用保證金和緩衝
    const buffer = totalCollateralValue * 0.05; // 5% 緩衝
    return Math.max(0, totalCollateralValue - buffer);
  }

  // 顯示計算結果
  displayResults(result) {
    const container = document.getElementById('calculation-results');
    if (!container) return;

    const tierClass = result.isTier2 ? 'warning' : 'success';
    const tierText = result.isTier2 ? '第2層' : '第1層';

    container.innerHTML = `
      <div class="result-item">
        <span class="result-label">當前層級</span>
        <span class="result-value ${tierClass}">${tierText}</span>
      </div>
      <div class="result-item">
        <span class="result-label">當前槓桿</span>
        <span class="result-value">${result.currentLeverage}x</span>
      </div>
      <div class="result-item">
        <span class="result-label">名義總額</span>
        <span class="result-value">${this.formatUSD(result.grossNotional)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">初始保證金</span>
        <span class="result-value">${this.formatUSD(result.initialMargin)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">維持保證金</span>
        <span class="result-value">${this.formatUSD(result.maintenanceMargin)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">可用保證金</span>
        <span class="result-value ${result.availableMargin >= result.initialMargin ? 'success' : 'danger'}">${this.formatUSD(result.availableMargin)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">可開倉狀態</span>
        <span class="result-value ${result.canOpenPosition ? 'success' : 'danger'}">${result.canOpenPosition ? '✓ 可開倉' : '✗ 保證金不足'}</span>
      </div>
      ${result.headroomTier > 0 ? `
        <div class="result-item">
          <span class="result-label">到下一層空間</span>
          <span class="result-value success">${this.formatUSD(result.headroomTier)}</span>
        </div>
      ` : ''}
      <div class="result-item">
        <span class="result-label">到限紅空間</span>
        <span class="result-value ${result.headroomLimit < 100000 ? 'warning' : 'success'}">${this.formatUSD(result.headroomLimit)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">限紅使用率</span>
        <div class="w-full">
          <div class="progress-bar">
            <div class="progress-fill ${result.grossNotional / result.limitUSD > 0.8 ? 'danger' : ''}" 
                 style="width: ${(result.grossNotional / result.limitUSD * 100)}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  // 更新點差預估
  updateSpreadEstimate(grossNotional) {
    const container = document.getElementById('spread-estimate');
    if (!container) return;

    // 匹配階梯
    let additionalBps = 0;
    for (let i = CONFIG.tieredSpread.length - 1; i >= 0; i--) {
      if (grossNotional >= CONFIG.tieredSpread[i].min) {
        additionalBps = CONFIG.tieredSpread[i].addBps;
        break;
      }
    }

    if (additionalBps === 0) {
      container.innerHTML = '<span class="text-mc-success">基礎點差</span>';
    } else {
      container.innerHTML = `<span class="text-mc-warning">基礎點差 + ${additionalBps} bps</span>`;
    }
  }

  // 初始化圖表
  initializeChart() {
    const canvas = document.getElementById('margin-chart');
    if (!canvas) return;

    this.chart = canvas.getContext('2d');
    this.updateChart();
  }

  // 更新圖表
  updateChart(result = null) {
    if (!this.chart) return;

    const canvas = document.getElementById('margin-chart');
    if (!canvas) return;

    // 清空畫布
    this.chart.clearRect(0, 0, canvas.width, canvas.height);

    if (!result || !this.currentSymbol) {
      this.drawEmptyChart();
      return;
    }

    this.drawMarginChart(result);
  }

  // 繪製空圖表
  drawEmptyChart() {
    const canvas = document.getElementById('margin-chart');
    if (!canvas) return;

    this.chart.fillStyle = '#9AA3B2';
    this.chart.font = '16px Inter';
    this.chart.textAlign = 'center';
    this.chart.fillText('請選擇品種並計算以顯示圖表', canvas.width / 2, canvas.height / 2);
  }

  // 繪製保證金圖表
  drawMarginChart(result) {
    const canvas = document.getElementById('margin-chart');
    if (!canvas) return;

    const ctx = this.chart;
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;

    // 清空畫布
    ctx.clearRect(0, 0, width, height);

    // 設置背景
    ctx.fillStyle = '#151821';
    ctx.fillRect(0, 0, width, height);

    // 計算數據範圍
    const maxNotional = Math.max(result.limitUSD, result.grossNotional * 1.2);
    const maxMargin = Math.max(
      result.limitUSD / (result.isTier2 ? CONFIG.symbols[result.symbol].maxLeverageL2 : CONFIG.symbols[result.symbol].maxLeverageL1),
      result.maintenanceMargin * 1.2
    );

    // 繪製網格
    this.drawGrid(ctx, width, height, padding, maxNotional, maxMargin);

    // 繪製軸線
    this.drawAxes(ctx, width, height, padding, maxNotional, maxMargin);

    // 繪製保證金曲線
    this.drawMarginCurves(ctx, width, height, padding, maxNotional, maxMargin, result);

    // 繪製當前點
    this.drawCurrentPoint(ctx, width, height, padding, maxNotional, maxMargin, result);

    // 繪製標籤
    this.drawLabels(ctx, width, height, padding, maxNotional, maxMargin);
  }

  // 繪製網格
  drawGrid(ctx, width, height, padding, maxNotional, maxMargin) {
    ctx.strokeStyle = '#2A2F3A';
    ctx.lineWidth = 0.5;

    // 垂直網格線
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // 水平網格線
    for (let i = 0; i <= 10; i++) {
      const y = height - padding - (i / 10) * (height - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  }

  // 繪製軸線
  drawAxes(ctx, width, height, padding, maxNotional, maxMargin) {
    ctx.strokeStyle = '#4DA3FF';
    ctx.lineWidth = 2;

    // X軸
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Y軸
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
  }

  // 繪製保證金曲線
  drawMarginCurves(ctx, width, height, padding, maxNotional, maxMargin, result) {
    const symbol = CONFIG.symbols[result.symbol];
    const points = 100;

    // 初始保證金曲線
    ctx.strokeStyle = '#24CBA6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
      const notional = (i / points) * maxNotional;
      const margin = this.calculateMargin(symbol, notional).initialMargin;
      const x = padding + (notional / maxNotional) * (width - 2 * padding);
      const y = height - padding - (margin / maxMargin) * (height - 2 * padding);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // 維持保證金曲線
    ctx.strokeStyle = '#FFC53D';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
      const notional = (i / points) * maxNotional;
      const margin = this.calculateMargin(symbol, notional).maintenanceMargin;
      const x = padding + (notional / maxNotional) * (width - 2 * padding);
      const y = height - padding - (margin / maxMargin) * (height - 2 * padding);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // 繪製分層線
    ctx.strokeStyle = '#FF4D4F';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const thresholdX = padding + (CONFIG.thresholdUSD / maxNotional) * (width - 2 * padding);
    ctx.beginPath();
    ctx.moveTo(thresholdX, padding);
    ctx.lineTo(thresholdX, height - padding);
    ctx.stroke();
    
    ctx.setLineDash([]);

    // 繪製限紅線
    const limitX = padding + (symbol.limitUSD / maxNotional) * (width - 2 * padding);
    ctx.strokeStyle = '#FF4D4F';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(limitX, padding);
    ctx.lineTo(limitX, height - padding);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 繪製當前點
  drawCurrentPoint(ctx, width, height, padding, maxNotional, maxMargin, result) {
    const x = padding + (result.grossNotional / maxNotional) * (width - 2 * padding);
    const y = height - padding - (result.initialMargin / maxMargin) * (height - 2 * padding);

    // 繪製點
    ctx.fillStyle = '#24CBA6';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // 繪製標籤
    ctx.fillStyle = '#E8EDF2';
    ctx.font = '12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.formatUSD(result.grossNotional)}`, x + 10, y - 10);
    ctx.fillText(`${this.formatUSD(result.initialMargin)}`, x + 10, y + 10);
  }

  // 繪製標籤
  drawLabels(ctx, width, height, padding, maxNotional, maxMargin) {
    ctx.fillStyle = '#E8EDF2';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';

    // X軸標籤
    ctx.fillText('名義額 (USD)', width / 2, height - 20);

    // Y軸標籤
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('保證金 (USD)', 0, 0);
    ctx.restore();

    // 圖例
    ctx.textAlign = 'left';
    ctx.fillStyle = '#24CBA6';
    ctx.fillRect(width - 150, 20, 20, 3);
    ctx.fillStyle = '#E8EDF2';
    ctx.fillText('初始保證金', width - 120, 30);

    ctx.fillStyle = '#FFC53D';
    ctx.fillRect(width - 150, 40, 20, 3);
    ctx.fillStyle = '#E8EDF2';
    ctx.fillText('維持保證金', width - 120, 50);

    ctx.fillStyle = '#FF4D4F';
    ctx.fillRect(width - 150, 60, 20, 3);
    ctx.fillStyle = '#E8EDF2';
    ctx.fillText('分層門檻/限紅', width - 120, 70);
  }

  // 格式化 USD 顯示
  formatUSD(amount) {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    } else if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  }
}

// 預留函數
function applyTimeRules() {
  console.log('時間規則功能尚未啟用');
}

function checkPortfolioLimits() {
  console.log('組合限制功能尚未啟用');
}

// 頁面加載完成後初始化應用
document.addEventListener('DOMContentLoaded', () => {
  new MCMarketsApp();
});

// QA 自測用例（寫在程式最下方註解）
/*
測試用例：

1. XAU 名義 800,000：
   - 初保 = 500,000/200 + 300,000/100 = 2,500 + 3,000 = 5,500
   - 維保 = 500,000×0.5% + 300,000×2.0% = 2,500 + 6,000 = 8,500

2. ETH 名義 900,000：
   - 維保 = 500,000×0.8% + 400,000×3.0% = 4,000 + 12,000 = 16,000

3. SOL 名義 >200,000：
   - 觸發限紅警示

4. 階梯式點差測試：
   - 0-100K: +0 bps
   - 100K-250K: +3 bps  
   - 250K-500K: +7 bps
   - >500K: +12 bps
*/
