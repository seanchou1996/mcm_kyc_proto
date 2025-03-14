from flask import Flask, request, session
from flask_bootstrap import Bootstrap
from flask_caching import Cache
from flask_babel import Babel, gettext as _
import os

from .config import config

# 創建擴展實例
bootstrap = Bootstrap()
cache = Cache()
# 初始化Babel
babel = Babel()

def get_locale():
    """根據使用者偏好設定返回語言代碼"""
    # 優先從session中獲取
    if 'lang' in session:
        return session['lang']
    # 其次從請求參數中獲取
    lang = request.args.get('lang')
    if lang:
        session['lang'] = lang
        return lang
    # 從請求頭中檢測
    return request.accept_languages.best_match(['zh', 'en', 'es'], default='zh')

def create_app(config_name='default'):
    """創建並配置Flask應用"""
    app = Flask(__name__)
    
    # 載入配置
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # 初始化擴展
    bootstrap.init_app(app)
    cache.init_app(app)
    
    # 初始化Babel
    babel.init_app(app, locale_selector=get_locale)
    
    # 註冊藍圖
    from .routes import main_bp, news_bp, platforms_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(news_bp, url_prefix='/news')
    app.register_blueprint(platforms_bp, url_prefix='/platforms')
    
    # 註冊自定義過濾器或上下文處理器
    from .utils import register_template_filters
    register_template_filters(app)
    
    # 註冊jinja2上下文處理器，添加多語言支持
    @app.context_processor
    def inject_language():
        return dict(CURRENT_LANG=get_locale())
    
    return app
