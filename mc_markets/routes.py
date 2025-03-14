from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, abort, session
from datetime import datetime
from .utils import fetch_news_articles, fetch_market_data, fetch_cfd_platforms, get_recommended_platforms_for_news
from .models import NewsArticle, CFDPlatform, MarketData
from . import cache

# 創建藍圖
main_bp = Blueprint('main', __name__)
news_bp = Blueprint('news', __name__)
platforms_bp = Blueprint('platforms', __name__)

# 主頁路由
@main_bp.route('/')
def index():
    """網站主頁"""
    # 獲取頭條新聞
    latest_news = fetch_news_articles(limit=4)
    news_articles = [NewsArticle.from_dict(article) for article in latest_news]
    
    # 獲取市場數據
    market_data = fetch_market_data()
    market_items = [MarketData.from_dict(data) for symbol, data in market_data.items()]
    
    # 獲取熱門交易平台
    platforms = fetch_cfd_platforms()
    top_platforms = sorted(platforms, key=lambda x: x['rating'], reverse=True)[:3]
    platform_items = [CFDPlatform.from_dict(platform) for platform in top_platforms]
    
    # 獲取推薦平台（這裡選擇兩個評分最高的平台作為精選）
    featured_platforms = sorted(platforms, key=lambda x: x['rating'], reverse=True)[:2]
    featured_items = [CFDPlatform.from_dict(platform) for platform in featured_platforms]
    
    return render_template('index.html', 
                          news_articles=news_articles,
                          market_data=market_items,
                          top_platforms=platform_items,
                          featured_platforms=featured_items)

# 關於我們頁面
@main_bp.route('/about')
def about():
    """關於我們頁面"""
    return render_template('about.html')

# 聯繫我們頁面
@main_bp.route('/contact', methods=['GET', 'POST'])
def contact():
    """聯繫我們頁面"""
    if request.method == 'POST':
        # 這裡可以添加處理表單提交的邏輯
        # 例如發送電子郵件或保存到數據庫
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message = request.form.get('message')
        
        # 這裡只是一個示例，實際應用中應該添加更多的處理邏輯
        flash('感謝您的訊息！我們將盡快回覆您。', 'success')
        return redirect(url_for('main.contact'))
    
    return render_template('contact.html')

# 搜索頁面
@main_bp.route('/search')
def search():
    """搜索結果頁面"""
    query = request.args.get('q', '')
    if not query:
        return redirect(url_for('main.index'))
    
    # 搜索新聞
    all_news = fetch_news_articles(limit=50)
    news_results = []
    for article in all_news:
        if (query.lower() in article['title'].lower() or 
            query.lower() in article['content'].lower() or 
            query.lower() in article['summary'].lower() or
            any(query.lower() in tag.lower() for tag in article['tags'])):
            news_results.append(article)
    
    # 搜索平台
    all_platforms = fetch_cfd_platforms()
    platform_results = []
    for platform in all_platforms:
        if (query.lower() in platform['name'].lower() or 
            query.lower() in platform['description'].lower()):
            platform_results.append(platform)
    
    # 合併結果
    results = []
    
    # 添加新聞結果
    for article in news_results[:10]:  # 限制結果數量
        article_obj = NewsArticle.from_dict(article)
        results.append({
            'type': '新聞',
            'type_class': 'info',
            'title': article_obj.title,
            'snippet': article_obj.summary,
            'date': article_obj.published_at,
            'url': url_for('news.news_detail', article_id=article_obj.id),
            'tags': article_obj.tags
        })
    
    # 添加平台結果
    for platform in platform_results[:5]:  # 限制結果數量
        platform_obj = CFDPlatform.from_dict(platform)
        results.append({
            'type': '交易平台',
            'type_class': 'primary',
            'title': platform_obj.name,
            'snippet': platform_obj.description[:150] + '...' if len(platform_obj.description) > 150 else platform_obj.description,
            'date': datetime.now(),  # 平台沒有日期，使用當前日期
            'url': url_for('platforms.platform_detail', platform_id=platform_obj.id),
            'tags': [f"最低入金: {platform_obj.min_deposit}", f"槓桿: {platform_obj.leverage}"]
        })
    
    # 按日期排序結果
    results = sorted(results, key=lambda x: x['date'], reverse=True)
    
    # 獲取熱門平台用於側邊欄
    top_platforms = sorted(all_platforms, key=lambda x: x['rating'], reverse=True)[:2]
    platform_items = [CFDPlatform.from_dict(platform) for platform in top_platforms]
    
    return render_template('search_results.html', 
                          query=query,
                          results=results,
                          top_platforms=platform_items)

# 新聞路由
@news_bp.route('/')
def news_list():
    """新聞列表頁"""
    category = request.args.get('category')
    articles = fetch_news_articles(category=category)
    news_articles = [NewsArticle.from_dict(article) for article in articles]
    
    return render_template('news/news_list.html', 
                          news_articles=news_articles,
                          category=category)

@news_bp.route('/<article_id>')
def news_detail(article_id):
    """新聞詳情頁"""
    # 獲取所有新聞
    all_articles = fetch_news_articles(limit=20)
    
    # 找到指定ID的新聞
    article_data = next((a for a in all_articles if a['id'] == article_id), None)
    if not article_data:
        abort(404)
    
    article = NewsArticle.from_dict(article_data)
    
    # 獲取相關市場數據
    # 這裡根據新聞類別選擇相關的市場數據
    market_symbols = {
        'precious_metals': ['GOLD', 'SILVER'],
        'forex': ['EURUSD'],
        'commodities': ['OIL'],
        'crypto': []
    }
    
    symbols = market_symbols.get(article.category, [])
    market_data = {}
    if symbols:
        market_data = fetch_market_data(symbols)
        market_data = {k: MarketData.from_dict(v) for k, v in market_data.items()}
    
    # 獲取推薦平台
    recommended_platforms = get_recommended_platforms_for_news(article.category)
    platform_items = [CFDPlatform.from_dict(platform) for platform in recommended_platforms]
    
    # 獲取相關新聞
    related_articles = [a for a in all_articles if a['category'] == article.category and a['id'] != article.id][:3]
    related_news = [NewsArticle.from_dict(a) for a in related_articles]
    
    # 獲取熱門文章
    popular_articles = sorted(all_articles, key=lambda x: len(x.get('comments', [])), reverse=True)[:5]
    popular_articles = [NewsArticle.from_dict(a) for a in popular_articles]
    
    return render_template('news/news_detail.html', 
                          article=article,
                          market_data=market_data,
                          recommended_platforms=platform_items,
                          related_articles=related_news,
                          popular_articles=popular_articles)

# 平台路由
@platforms_bp.route('/')
def platform_list():
    """平台列表頁"""
    platforms = fetch_cfd_platforms()
    
    # 應用過濾
    min_deposit = request.args.get('min_deposit', type=int)
    regulation = request.args.get('regulation')
    instrument = request.args.get('instrument')
    
    if min_deposit:
        platforms = [p for p in platforms if p['min_deposit'] <= min_deposit]
    
    if regulation:
        platforms = [p for p in platforms if regulation in p['regulations']]
    
    if instrument:
        platforms = [p for p in platforms if instrument in p['trading_instruments']]
    
    # 排序
    sort_by = request.args.get('sort', 'rating')
    reverse = request.args.get('order', 'desc') == 'desc'
    
    if sort_by == 'name':
        platforms = sorted(platforms, key=lambda x: x['name'], reverse=reverse)
    elif sort_by == 'min_deposit':
        platforms = sorted(platforms, key=lambda x: x['min_deposit'], reverse=reverse)
    elif sort_by == 'established_year':
        platforms = sorted(platforms, key=lambda x: x['established_year'], reverse=reverse)
    else:  # 默認按評分排序
        platforms = sorted(platforms, key=lambda x: x['rating'], reverse=reverse)
    
    platform_items = [CFDPlatform.from_dict(platform) for platform in platforms]
    
    # 獲取所有可能的選項，用於過濾器
    all_regulations = set()
    all_instruments = set()
    for platform in platforms:
        all_regulations.update(platform['regulations'])
        all_instruments.update(platform['trading_instruments'])
    
    # 添加當前時間以識別頁面版本
    now = datetime.now()
    
    return render_template('platforms/platform_comparison.html',
                          platforms=platform_items,
                          all_regulations=sorted(all_regulations),
                          all_instruments=sorted(all_instruments),
                          now=now)

@platforms_bp.route('/<platform_id>')
def platform_detail(platform_id):
    """平台詳情頁"""
    all_platforms = fetch_cfd_platforms()
    
    # 找到指定ID的平台
    platform_data = next((p for p in all_platforms if p['id'] == platform_id), None)
    if not platform_data:
        abort(404)
    
    platform = CFDPlatform.from_dict(platform_data)
    
    # 找出類似平台（這裡簡單地選擇除了當前平台之外的其他平台）
    similar_platforms = [p for p in all_platforms if p['id'] != platform_id][:3]
    similar_items = [CFDPlatform.from_dict(p) for p in similar_platforms]
    
    return render_template('platforms/platform_detail.html',
                          platform=platform,
                          similar_platforms=similar_items)

# 錯誤處理
@main_bp.app_errorhandler(404)
def page_not_found(e):
    return render_template('errors/404.html'), 404

@main_bp.app_errorhandler(500)
def server_error(e):
    return render_template('errors/500.html'), 500

@main_bp.route('/api/market_data')
def api_market_data():
    """API端點：提供最新市場數據"""
    market_data = fetch_market_data()
    result = {}
    for symbol, data in market_data.items():
        result[symbol] = {
            'symbol': data['symbol'],
            'name': data['name'],
            'price': data['price'],
            'change': data['change'],
            'change_percent': data['change_percent'],
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    return jsonify(result)

# 語言切換路由
@main_bp.route('/set_language/<lang>')
def set_language(lang):
    """設置用戶語言偏好"""
    # 保存語言設置到session
    session['lang'] = lang
    # 重定向回先前頁面或首頁
    return redirect(request.referrer or url_for('main.index'))
