import os
from datetime import timedelta

class Config:
    """基本配置"""
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'mc-markets-secret-key')
    
    # Babel設置
    BABEL_DEFAULT_LOCALE = 'zh'
    BABEL_TRANSLATION_DIRECTORIES = 'translations'
    SUPPORTED_LANGUAGES = {
        'zh': '中文',
        'en': 'English',
        'es': 'Español'
    }
    
    # 其他設置
    MARKET_API_KEY = os.environ.get('MARKET_API_KEY', '')
    MARKET_CACHE_TIMEOUT = 300  # 5分鐘
    
    @staticmethod
    def init_app(app):
        """初始化應用配置"""
        pass

class DevelopmentConfig(Config):
    """開發環境配置"""
    DEBUG = True
    CACHE_TYPE = 'SimpleCache'

class ProductionConfig(Config):
    """生產環境配置"""
    DEBUG = False
    CACHE_TYPE = 'SimpleCache'
    
    # 在生產環境中應該使用更安全的設置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-string'

# 根據環境變量選擇配置
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
