from datetime import datetime

class NewsArticle:
    """新聞文章模型"""
    def __init__(self, id, title, content, summary, author, published_at, category, 
                 image_url=None, source=None, tags=None, related_articles=None):
        self.id = id
        self.title = title
        self.content = content
        self.summary = summary
        self.author = author
        self.published_at = published_at
        self.category = category
        self.image_url = image_url
        self.source = source
        self.tags = tags or []
        self.related_articles = related_articles or []
    
    @classmethod
    def from_dict(cls, data):
        """從字典創建實例"""
        return cls(
            id=data.get('id'),
            title=data.get('title'),
            content=data.get('content'),
            summary=data.get('summary'),
            author=data.get('author'),
            published_at=data.get('published_at'),
            category=data.get('category'),
            image_url=data.get('image_url'),
            source=data.get('source'),
            tags=data.get('tags'),
            related_articles=data.get('related_articles')
        )

class CFDPlatform:
    """交易平台模型"""
    def __init__(self, id, name, established_year, description, website_url, 
                 min_deposit, leverage, spreads, trading_instruments, regulations, 
                 payment_methods, pros, cons, rating, logo_url=None):
        self.id = id
        self.name = name
        self.established_year = established_year
        self.description = description
        self.website_url = website_url
        self.min_deposit = min_deposit
        self.leverage = leverage
        self.spreads = spreads
        self.trading_instruments = trading_instruments
        self.regulations = regulations
        self.payment_methods = payment_methods
        self.pros = pros
        self.cons = cons
        self.rating = rating
        self.logo_url = logo_url
    
    @classmethod
    def from_dict(cls, data):
        """從字典創建實例"""
        return cls(
            id=data.get('id'),
            name=data.get('name'),
            established_year=data.get('established_year'),
            description=data.get('description'),
            website_url=data.get('website_url'),
            min_deposit=data.get('min_deposit'),
            leverage=data.get('leverage'),
            spreads=data.get('spreads'),
            trading_instruments=data.get('trading_instruments', []),
            regulations=data.get('regulations', []),
            payment_methods=data.get('payment_methods', []),
            pros=data.get('pros', []),
            cons=data.get('cons', []),
            rating=data.get('rating', 0.0),
            logo_url=data.get('logo_url')
        )

class MarketData:
    """市場數據模型"""
    def __init__(self, symbol, name, price, change, change_percent, 
                 high, low, volume, market_cap=None, timestamp=None):
        self.symbol = symbol
        self.name = name
        self.price = price
        self.change = change
        self.change_percent = change_percent
        self.high = high
        self.low = low
        self.volume = volume
        self.market_cap = market_cap
        self.timestamp = timestamp or datetime.now()
    
    @classmethod
    def from_dict(cls, data):
        """從字典創建實例"""
        return cls(
            symbol=data.get('symbol'),
            name=data.get('name'),
            price=data.get('price'),
            change=data.get('change'),
            change_percent=data.get('change_percent'),
            high=data.get('high'),
            low=data.get('low'),
            volume=data.get('volume'),
            market_cap=data.get('market_cap'),
            timestamp=data.get('timestamp')
        )
