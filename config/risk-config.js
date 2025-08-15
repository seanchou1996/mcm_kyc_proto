// MC Markets 風險配置檔案
// 說明：以下數值已依「帕累托最優＋資產波動性」原則填入，後台未來可改。金額單位：USD。

export const CollateralPolicy = {
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
};

// 交易品種（非抵押）上限與浮動槓桿（延用）
export const LeverageBrackets = {
  XAUUSD: { 
    tier1: { notionalUpTo: 500_000, leverage: 200 }, 
    tier2: { leverage: 100 }, 
    maxNotional: 10_000_000 
  },
  XAGUSD: { 
    tier1: { notionalUpTo: 500_000, leverage: 200 }, 
    tier2: { leverage: 100 }, 
    maxNotional: 10_000_000 
  },
  BTCUSD: { 
    tier1: { notionalUpTo: 500_000, leverage: 100 }, 
    tier2: { leverage: 50 },  
    maxNotional: 1_000_000  
  },
  ETHUSD: { 
    tier1: { notionalUpTo: 500_000, leverage: 100 }, 
    tier2: { leverage: 50 },  
    maxNotional: 1_000_000  
  },
  SOLUSD: { 
    tier1: { notionalUpTo: 500_000, leverage: 100 }, 
    tier2: { leverage: 50 },  
    maxNotional: 200_000  
  }
};

// 階梯式點差（深度保費）
export const TieredSpread = [
  { min: 0, addBps: 0 },
  { min: 100_000, addBps: 3 },
  { min: 250_000, addBps: 7 },
  { min: 500_000, addBps: 12 }
];

// 預留：依「單品種總頭寸／特定時間」加碼規則（先佔位，後續再填）
export const FutureGuardsPlaceholders = {
  perSymbolAggregateLimit: "TODO",
  timeWindowAggregateLimit: "TODO",
  steppedSpreadBySize: "已接上；維持與名義區間同步"
};

// 即時價格（靜態，實際應從 API 獲取）
export const CurrentPrices = {
  BTC: 45000,
  ETH: 2800,
  BNB: 320,
  XRP: 0.55,
  USDT: 1.00,
  USDC: 1.00
};

// 預設配置
export const DEFAULT_CONFIG = {
  notionalBasis: "grossNotional",
  thresholdUSD: 500_000,
  symbols: {
    XAUUSD: {
      category: "Metals",
      maxLeverageL1: 200,
      maxLeverageL2: 100,
      mmrL1: 0.005,
      mmrL2: 0.020,
      limitUSD: 10_000_000
    },
    XAGUSD: {
      category: "Metals",
      maxLeverageL1: 200,
      maxLeverageL2: 100,
      mmrL1: 0.005,
      mmrL2: 0.020,
      limitUSD: 10_000_000
    },
    BTCUSD: {
      category: "Crypto",
      maxLeverageL1: 100,
      maxLeverageL2: 50,
      mmrL1: 0.008,
      mmrL2: 0.030,
      limitUSD: 1_000_000
    },
    ETHUSD: {
      category: "Crypto",
      maxLeverageL1: 100,
      maxLeverageL2: 50,
      mmrL1: 0.008,
      mmrL2: 0.030,
      limitUSD: 1_000_000
    },
    SOLUSD: {
      category: "Crypto",
      maxLeverageL1: 100,
      maxLeverageL2: 50,
      mmrL1: 0.010,
      mmrL2: 0.040,
      limitUSD: 200_000
    }
  }
};
