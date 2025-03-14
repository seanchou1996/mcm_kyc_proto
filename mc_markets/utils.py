import requests
import datetime
from flask import render_template
import json
import uuid
import requests_cache
from . import cache
import random

# 設置請求緩存
requests_cache.install_cache('mc_markets_cache', backend='sqlite', expire_after=3600)

def get_current_time():
    """獲取當前時間"""
    return datetime.datetime.now()

def register_template_filters(app):
    """註冊模板過濾器"""
    
    # 添加全局變量
    @app.context_processor
    def inject_now():
        return {'now': get_current_time()}
    
    @app.template_filter('format_date')
    def format_date(value, format='%Y-%m-%d'):
        """日期格式化過濾器"""
        if isinstance(value, str):
            try:
                value = datetime.datetime.fromisoformat(value)
            except ValueError:
                try:
                    value = datetime.datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ')
                except ValueError:
                    return value
        if isinstance(value, datetime.datetime):
            return value.strftime(format)
        return value
    
    @app.template_filter('currency')
    def format_currency(value):
        """貨幣格式化過濾器"""
        try:
            float_value = float(value)
            return f"${float_value:,.2f}"
        except (ValueError, TypeError):
            return value
    
    @app.template_filter('truncate_html')
    def truncate_html(value, length=100):
        """截斷HTML內容，保留指定長度"""
        if not value:
            return ""
        # 去除HTML標籤
        import re
        text = re.sub(r'<[^>]*>', '', value)
        if len(text) <= length:
            return text
        return text[:length] + "..."

    @app.template_filter('stars')
    def stars(value, max_stars=5):
        """將數值轉換為星級顯示"""
        try:
            rating = min(float(value), max_stars)
            full_stars = int(rating)
            half_star = rating - full_stars > 0.3
            empty_stars = max_stars - full_stars - (1 if half_star else 0)
            
            result = "★" * full_stars
            if half_star:
                result += "½"
            result += "☆" * empty_stars
            return result
        except (ValueError, TypeError):
            return "☆" * max_stars

@cache.memoize(timeout=30)  # 降低緩存時間到30秒
def fetch_market_data(symbols=None):
    """獲取市場數據"""
    # 這裡使用模擬數據，您可以替換為實際的API呼叫
    
    # 為了模擬實時數據變化，增加一些隨機價格變動
    
    # 基礎價格
    base_prices = {
        'GOLD': 2183.45,
        'SILVER': 28.75,
        'EURUSD': 1.0825,
        'OIL': 78.95,
        'BTC': 63521.42  # 添加比特幣
    }
    
    # 為每個商品生成小量隨機變動
    data = {}
    for symbol, base_price in base_prices.items():
        # 生成-0.5%到+0.5%之間的隨機變動
        price_change_percent = random.uniform(-0.5, 0.5)
        price_change = base_price * price_change_percent / 100
        current_price = base_price + price_change
        
        # 保留適當的小數位數
        if symbol in ['GOLD', 'OIL', 'BTC']:
            current_price = round(current_price, 2)
        elif symbol == 'SILVER':
            current_price = round(current_price, 3)
        elif symbol == 'EURUSD':
            current_price = round(current_price, 4)
            
        change_percent = price_change_percent
        
        data[symbol] = {
            'symbol': get_symbol_code(symbol),
            'name': get_symbol_name(symbol),
            'price': current_price,
            'change': round(price_change, 4),
            'change_percent': round(change_percent, 2),
            'high': round(current_price * (1 + random.uniform(0.1, 0.3) / 100), 4),
            'low': round(current_price * (1 - random.uniform(0.1, 0.3) / 100), 4),
            'volume': random.randint(80000, 200000),
            'timestamp': datetime.datetime.now()
        }
    
    if symbols:
        return {symbol: data.get(symbol) for symbol in symbols if symbol in data}
    return data

def get_symbol_code(symbol):
    """獲取商品的代碼"""
    symbol_codes = {
        'GOLD': 'XAUUSD',
        'SILVER': 'XAGUSD',
        'EURUSD': 'EURUSD',
        'OIL': 'USOIL',
        'BTC': 'BTCUSD'
    }
    return symbol_codes.get(symbol, symbol)

def get_symbol_name(symbol):
    """獲取商品的顯示名稱"""
    symbol_names = {
        'GOLD': '黃金',
        'SILVER': '白銀',
        'EURUSD': '歐元/美元',
        'OIL': '原油',
        'BTC': '比特幣'
    }
    return symbol_names.get(symbol, symbol)

@cache.memoize(timeout=3600)  # 1小時緩存
def fetch_news_articles(category=None, limit=10):
    """獲取新聞文章"""
    # 這裡使用模擬數據，您可以替換為實際的API呼叫
    articles = [
        {
            'id': str(uuid.uuid4()),
            'title': '黃金突破2100美元大關，分析師看好後市',
            'summary': '昨日黃金期貨突破2100美元關口，創下三個月新高。分析師認為近期美聯儲降息預期增強，將持續支撐金價上漲。',
            'content': """
            昨日黃金期貨突破2100美元關口，創下三個月新高。此輪上漲受到以下幾個因素推動：
            
            1. 美聯儲降息預期增強
            2. 地緣政治風險加劇
            3. 通膨數據超出預期
            
            多位華爾街分析師表示，金價有望在年底前達到2300美元水平。投資者可關注近期FOMC會議紀要以獲取更多線索。
            """,
            'author': '王小明',
            'published_at': datetime.datetime.now() - datetime.timedelta(hours=5),
            'category': 'precious_metals',
            'image_url': 'https://example.com/images/gold-price-chart.jpg',
            'source': 'MC Markets 研究部',
            'tags': ['黃金', '貴金屬', '市場分析'],
            'related_articles': []
        },
        {
            'id': str(uuid.uuid4()),
            'title': '美元指數創新高，歐元承壓下跌',
            'summary': '美元指數昨日攀升至103.45，創下近兩個月新高。歐元兌美元跌至1.08下方，受歐洲經濟數據疲軟影響。',
            'content': """
            美元指數昨日攀升至103.45，創下近兩個月新高。這一走勢主要受以下因素影響：
            
            1. 美國經濟數據表現強勁
            2. 歐元區經濟增長放緩
            3. 市場風險偏好下降
            
            歐元兌美元跌至1.08下方，為近期最低水平。分析師預期，除非歐洲央行政策立場發生轉變，否則歐元或將維持弱勢。
            """,
            'author': '李大方',
            'published_at': datetime.datetime.now() - datetime.timedelta(hours=8),
            'category': 'forex',
            'image_url': 'https://example.com/images/usd-index-chart.jpg',
            'source': 'MC Markets 研究部',
            'tags': ['外匯', '美元', '歐元'],
            'related_articles': []
        },
        {
            'id': str(uuid.uuid4()),
            'title': '原油庫存意外減少，油價反彈上漲',
            'summary': '美國能源信息署(EIA)報告顯示，上週原油庫存減少250萬桶，超出市場預期，油價應聲上漲。',
            'content': """
            美國能源信息署(EIA)最新報告顯示，上週原油庫存減少250萬桶，超出市場預期的減少50萬桶。數據公布後，WTI原油期貨上漲超過2%，突破79美元關口。
            
            除庫存數據外，以下因素也支持油價上行：
            
            1. OPEC+可能延長減產協議
            2. 全球需求有回升跡象
            3. 中東地區局勢持續緊張
            
            能源分析師表示，如果OPEC+在下月會議上決定延長減產，油價可能進一步上升至85美元水平。
            """,
            'author': '陳專家',
            'published_at': datetime.datetime.now() - datetime.timedelta(hours=12),
            'category': 'commodities',
            'image_url': 'https://example.com/images/oil-price-chart.jpg',
            'source': 'MC Markets 研究部',
            'tags': ['原油', '能源', '商品'],
            'related_articles': []
        },
        {
            'id': str(uuid.uuid4()),
            'title': '比特幣再創歷史新高，加密貨幣市場熱潮持續',
            'summary': '比特幣價格突破85,000美元，創歷史新高。機構投資者持續增加加密貨幣配置，推動市場上行。',
            'content': """
            比特幣價格突破85,000美元，創下歷史新高。自年初以來，比特幣價格已上漲超過100%，表現遠超傳統資產。這一走勢主要受以下因素推動：
            
            1. 機構投資者持續增加配置
            2. 比特幣ETF資金流入穩定
            3. 全球貨幣政策預期轉向寬鬆
            
            與此同時，以太幣表現相對滯後，目前交易價格約4,500美元。分析師認為，隨著以太坊網絡升級完成，以太幣可能會縮小與比特幣的表現差距。
            """,
            'author': '張分析',
            'published_at': datetime.datetime.now() - datetime.timedelta(hours=15),
            'category': 'crypto',
            'image_url': 'https://example.com/images/bitcoin-chart.jpg',
            'source': 'MC Markets 研究部',
            'tags': ['加密貨幣', '比特幣', '以太幣'],
            'related_articles': []
        }
    ]
    
    if category:
        filtered_articles = [article for article in articles if article['category'] == category]
        return filtered_articles[:limit]
    return articles[:limit]

@cache.memoize(timeout=86400)  # 24小時緩存
def fetch_cfd_platforms():
    """獲取CFD平台數據"""
    # 這裡使用模擬數據，您可以替換為實際的API呼叫或數據庫查詢
    platforms = [
        {
            'id': str(uuid.uuid4()),
            'name': 'MC Markets',
            'established_year': 2013,
            'description': 'MC Markets是一家領先的全球CFD和外匯交易服務提供商，專注於為交易者提供卓越的交易體驗。以優惠的交易條件、先進的技術和全方位的客戶服務聞名，致力於滿足從初學者到專業交易者的各種需求。',
            'website_url': 'https://mcmarkets.com/zh-HK/',
            'min_deposit': 50,
            'leverage': '1:200',
            'spreads': '外匯 0.4點起, 黃金 0.15點起',
            'trading_instruments': ['外匯', '股票', '指數', '商品', '債券', '加密貨幣', '貴金屬', '能源'],
            'regulations': ['CySEC', 'FSA'],
            'payment_methods': ['銀行轉賬', '信用卡', 'PayPal', 'Skrill', 'Neteller', 'Apple Pay', 'Google Pay'],
            'pros': ['業界領先的低點差', '多樣化交易產品', '先進的交易平台', '24/7多語言客戶支持', '豐富的教育資源', '靈活的賬戶類型'],
            'cons': ['高級分析工具需要升級賬戶', '某些地區服務有限制'],
            'rating': 4.9,
            'logo_url': 'https://example.com/images/mcmarkets-logo.png'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'TradeMax Global',
            'established_year': 2015,
            'description': 'TradeMax Global是一家領先的CFD交易平台，提供外匯、股票、指數、商品和加密貨幣交易。平台以低點差和高效執行聞名。',
            'website_url': 'https://trademax-global.com',
            'min_deposit': 100,
            'leverage': '1:500',
            'spreads': '外匯 0.8點起, 黃金 0.25點起',
            'trading_instruments': ['外匯', '股票', '指數', '商品', '加密貨幣'],
            'regulations': ['ASIC', 'FCA', 'FSC'],
            'payment_methods': ['銀行轉賬', '信用卡', '電子錢包'],
            'pros': ['超低點差', '多樣化交易產品', '強大的交易平台', '24/7客戶支持'],
            'cons': ['出金時間有時較長', '某些產品的保證金要求較高'],
            'rating': 4.8,
            'logo_url': 'https://example.com/images/trademax-logo.png'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'InvestGlobal Pro',
            'established_year': 2010,
            'description': 'InvestGlobal Pro是一家專業的交易服務提供商，專注於為交易者提供優質的執行和全面的市場覆蓋。適合有經驗的交易者。',
            'website_url': 'https://investglobal-pro.com',
            'min_deposit': 200,
            'leverage': '1:400',
            'spreads': '外匯 0.6點起, 黃金 0.35點起',
            'trading_instruments': ['外匯', '指數', '商品', '債券', '股票'],
            'regulations': ['CySEC', 'FCA', 'FSCA'],
            'payment_methods': ['銀行轉賬', '信用卡', 'PayPal', 'Skrill'],
            'pros': ['高執行速度', '豐富的研究資源', '專業的交易條件', '多平台支持'],
            'cons': ['入金門檻較高', '新手不友好的界面'],
            'rating': 4.6,
            'logo_url': 'https://example.com/images/investglobal-logo.png'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'EasyTrade Markets',
            'established_year': 2018,
            'description': 'EasyTrade Markets是一家面向入門級交易者的平台，提供簡單直觀的交易界面和全面的教育資源，幫助新手快速上手。',
            'website_url': 'https://easytrade-markets.com',
            'min_deposit': 50,
            'leverage': '1:200',
            'spreads': '外匯 1.5點起, 黃金 0.5點起',
            'trading_instruments': ['外匯', '股票', '商品', '加密貨幣'],
            'regulations': ['FSC', 'VFSC'],
            'payment_methods': ['銀行轉賬', '信用卡', 'Apple Pay', 'Google Pay'],
            'pros': ['低入金門檻', '豐富的教育資源', '簡單易用的界面', '多語言支持'],
            'cons': ['點差相對較高', '可交易產品較少', '分析工具有限'],
            'rating': 4.5,
            'logo_url': 'https://example.com/images/easytrade-logo.png'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'PrimeFX Capital',
            'established_year': 2012,
            'description': 'PrimeFX Capital是一家專注於外匯和金屬交易的專業平台，為交易者提供頂級的交易條件和執行質量。',
            'website_url': 'https://primefx-capital.com',
            'min_deposit': 100,
            'leverage': '1:500',
            'spreads': '外匯 0.5點起, 黃金 0.20點起',
            'trading_instruments': ['外匯', '貴金屬', '能源', '指數'],
            'regulations': ['ASIC', 'FCA', 'DFSA'],
            'payment_methods': ['銀行轉賬', '信用卡', 'Neteller', 'Skrill'],
            'pros': ['極低點差', '高速執行', '先進的圖表工具', '專業的市場分析'],
            'cons': ['客服響應時間不穩定', '交易產品範圍較窄'],
            'rating': 4.7,
            'logo_url': 'https://example.com/images/primefx-logo.png'
        }
    ]
    
    return platforms

def get_recommended_platforms_for_news(news_category):
    """根據新聞類別推薦相關交易平台"""
    all_platforms = fetch_cfd_platforms()
    
    # 根據不同新聞類別推薦不同的平台
    category_platform_mapping = {
        'precious_metals': lambda p: '貴金屬' in p['trading_instruments'] or '商品' in p['trading_instruments'],
        'forex': lambda p: '外匯' in p['trading_instruments'],
        'commodities': lambda p: '商品' in p['trading_instruments'] or '能源' in p['trading_instruments'],
        'crypto': lambda p: '加密貨幣' in p['trading_instruments'],
        'indices': lambda p: '指數' in p['trading_instruments'],
        'stocks': lambda p: '股票' in p['trading_instruments']
    }
    
    if news_category in category_platform_mapping:
        filter_func = category_platform_mapping[news_category]
        recommended = [p for p in all_platforms if filter_func(p)]
        # 按評分排序，取前2名
        recommended.sort(key=lambda x: x['rating'], reverse=True)
        return recommended[:2]
    
    # 若無特定匹配，返回評分最高的2個平台
    all_platforms.sort(key=lambda x: x['rating'], reverse=True)
    return all_platforms[:2]
