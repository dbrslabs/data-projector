class Config(object):
    DEBUG = False
    TESTING = False

class ProductionConfig(Config):
    DEBUG = False
    API_URL = 'guardian-galaxy-api/'

class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True
    API_URL = ''
