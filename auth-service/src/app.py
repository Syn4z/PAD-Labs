from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models.database import db
from dotenv import load_dotenv
import os

load_dotenv()
POSTGRES_USER = os.getenv('POSTGRES_USER')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
POSTGRES_DB = os.getenv('POSTGRES_DB')
POSTGRES_HOST = os.getenv('POSTGRES_HOST')
POSTGRES_PORT = os.getenv('POSTGRES_PORT')
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["5 per minute"]
    )
    limiter.init_app(app)
    return app


if __name__ == '__main__':
    app = create_app()
    from routes.users import users_bp
    app.register_blueprint(users_bp, url_prefix='/users')
    app.run(host='0.0.0.0', port=5000)