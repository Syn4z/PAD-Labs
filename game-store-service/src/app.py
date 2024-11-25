from flask import Flask
from models.database import db
from dotenv import load_dotenv
import os
from redis.cluster import RedisCluster
from redis.cluster import ClusterNode
from flask_socketio import SocketIO
import logging
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()
POSTGRES_USER = os.getenv('POSTGRES_USER')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
POSTGRES_DB = os.getenv('POSTGRES_DB')
POSTGRES_HOST = os.getenv('POSTGRES_HOST')
POSTGRES_PORT = os.getenv('POSTGRES_PORT')
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=["200 per day", "100 per hour", "30 per minute"]
    )
    limiter.init_app(app)
    return app

if __name__ == '__main__':
    app = create_app()
    socketio = SocketIO(app)
    redis_nodes = [
        ClusterNode('game-store-redis-leader-1', 6379),
        ClusterNode('game-store-redis-leader-2', 6379),
        ClusterNode('game-store-redis-leader-3', 6379)
    ]
    try:
        redis_client = RedisCluster(startup_nodes=redis_nodes, decode_responses=True)
    except Exception as e:
        logging.error(f'Error connecting to Redis Cluster: {e}')    
    from routes.games import games_bp
    from routes.websocket import socketio
    app.register_blueprint(games_bp, url_prefix='/games')
    socketio.run(app, debug=True, host='0.0.0.0', port=os.getenv('SERVICE_PORT'), allow_unsafe_werkzeug=True)