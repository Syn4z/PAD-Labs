from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models.database import db
from dotenv import load_dotenv
import os
import redis
from flask_socketio import SocketIO

load_dotenv()
POSTGRES_USER = os.getenv('POSTGRES_USER')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
POSTGRES_DB = os.getenv('POSTGRES_DB')
POSTGRES_HOST = os.getenv('POSTGRES_HOST')
POSTGRES_PORT = os.getenv('POSTGRES_PORT')
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

socketio = SocketIO()

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
    socketio.init_app(app)
    return app

if __name__ == '__main__':
    app = create_app()
    redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT)
    from routes.games import games_bp
    app.register_blueprint(games_bp, url_prefix='/games')
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)