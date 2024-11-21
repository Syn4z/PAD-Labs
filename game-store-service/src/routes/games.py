from flask import Blueprint, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy.exc import OperationalError, IntegrityError
from sqlalchemy.sql import text
from services.gameService import *
from models.database import db
from __main__ import redis_client, socketio
import json
import logging
import grpc
import requests
from game_store_pb2 import BuyGameRequest
from game_store_pb2_grpc import GameStoreStub
from logstash_formatter import LogstashFormatterV1
import os


class HTTPLogstashHandler(logging.Handler):
    def __init__(self, host, port, tags):
        logging.Handler.__init__(self)
        self.host = host
        self.port = port
        self.tags = tags

    def emit(self, record):
        try:
            log_entry = self.format(record)
            url = f'http://{self.host}:{self.port}'
            headers = {'Content-Type': 'application/json'}
            data = {
                "message": log_entry,
                "tags": self.tags
            }
            requests.post(url, json=data, headers=headers)
        except Exception as e:
            print(f"Failed to send log to Logstash: {e}")

logger = logging.getLogger('game-store-service')
logger.setLevel(logging.INFO)
console_handler = logging.StreamHandler()
console_handler.setFormatter(LogstashFormatterV1())
logger.addHandler(console_handler)
logstash_handler = HTTPLogstashHandler(host=os.getenv('LOGSTASH_HOST'), port=os.getenv('LOGSTASH_PORT'), tags=["game-store"])
logstash_handler.setFormatter(LogstashFormatterV1())
logger.addHandler(logstash_handler)

games_bp = Blueprint('games', __name__)
limiter = Limiter(key_func=get_remote_address)

@games_bp.route('/status', methods=['GET'])
def status():
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({'status': 'Game store service is running', 'database': 'connected'}), 200
    except OperationalError as e:
        logger.error(({
          "service": "game-store",
          "msg": f"Database is unreachable: {str(e)}",
        }))
        return jsonify({'status': 'Game store service is running', 'database': 'disconnected', 'error': 'Database is unreachable'}), 500
    except Exception as e:
        return jsonify({'status': 'Game store service is running', 'database': 'disconnected', 'error': str(e)}), 500

@games_bp.route('/', methods=['GET'])
def list_games():
    cached_games = redis_client.get('games_list')
    if cached_games:
        return jsonify(json.loads(cached_games))
    games = get_games()
    response = [{
        'id': game.id,
        'title': game.title,
        'genre': game.genre,
        'price': game.price,
        'description': game.description,
        'username': game.username,
    } for game in games]
    redis_client.set('games_list', json.dumps(response), ex=3600)
    return jsonify(response)

@games_bp.route('/<int:game_id>', methods=['GET'])
def get_game(game_id):
    cached_game = redis_client.get(f'game_{game_id}')
    if cached_game:
        return jsonify(json.loads(cached_game))
    game = get_game_by_id(game_id)
    if game:
        response = {
            'id': game.id,
            'title': game.title,
            'genre': game.genre,
            'price': game.price,
            'description': game.description,
            'username': game.username,
        }
        redis_client.set(f'game_{game_id}', json.dumps(response), ex=3600)
        return jsonify(response)
    return jsonify({'error': 'Game not found'}), 404

@games_bp.route('/', methods=['POST'])
def add_game():
    try:
        data = request.get_json()
        if 'title' not in data or 'genre' not in data or 'price' not in data or 'description' not in data:
            logger.error(({
                "service": "game-store",
                "msg": "Missing required fields",
            }))
            return jsonify({'error': 'Missing required fields'}), 400
        game = create_game(data['title'], data['genre'], data['price'], data['description'], data['username'])
        redis_client.delete('games_list')
        socketio.emit('game_update', {'action': 'add', 'game': {
            'id': game.id,
            'title': game.title,
            'genre': game.genre,
            'price': game.price,
            'description': game.description,
            'release_date': game.release_date.strftime('%Y-%m-%d'),
            'username': game.username
        }}, room='games')
        return jsonify({
            'title': game.title,
            'genre': game.genre,
            'price': game.price,
            'description': game.description,
            'release_date': game.release_date.strftime('%Y-%m-%d'),
            'username': game.username
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Game already exists'}), 409
    except Exception as e:
        logger.error(({
            "service": "game-store",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@games_bp.route('/<int:game_id>', methods=['PUT'])
def update_game(game_id):
    game = get_game_by_id(game_id)
    if game:
        data = request.get_json()
        new_title = data['title']
        existing_game = get_game_by_title(new_title)
        if existing_game and existing_game.id != game_id:
            return jsonify({'error': 'A game with this title already exists'}), 409
        game.title = new_title
        game.genre = data['genre']
        game.price = data['price']
        game.description = data['description']
        game.username = data['username']
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': 'A game with this title already exists'}), 409
        redis_client.delete(f'game_{game_id}')
        redis_client.delete('games_list')
        socketio.emit(f'game_update_{new_title}', {'action': 'update', 'game': {
            'id': game.id,
            'title': game.title,
            'genre': game.genre,
            'price': game.price,
            'description': game.description,
            'username': game.username
        }}, room='games')
        return jsonify({
            'title': game.title,
            'genre': game.genre,
            'price': game.price,
            'description': game.description,
            'username': game.username
        })
    return jsonify({'error': 'Game not found'}), 404

@games_bp.route('/<int:game_id>', methods=['DELETE'])
def delete_game(game_id):
    game = get_game_by_id(game_id)
    if game:
        db.session.delete(game)
        db.session.commit()
        redis_client.delete(f'game_{game_id}')
        redis_client.delete('games_list')
        socketio.emit(f'game_update_{game_id}', {'action': 'delete', 'game_id': game.title}, room='games')
        return jsonify({'message': 'Game deleted'})
    return jsonify({'error': 'Game not found'}), 404    

@games_bp.route('/buy', methods=['POST'])
def buy_game():
    data = request.get_json()
    if 'username' not in data or 'game_title' not in data:
        logger.error(({
            "service": "game-store",
            "msg": "Missing required fields",
        }))
        return jsonify({'error': 'Missing required fields'}), 400
    if not data['username'] or not data['game_title']:
        logger.error(({
            "service": "game-store",
            "msg": "Empty fields",
        }))
        return jsonify({'error': 'Empty fields'}), 400
    username = data['username']
    game_title = data['game_title']
    with grpc.insecure_channel(f'gateway:50051') as channel:
        stub = GameStoreStub(channel)
        try:
            update_request = BuyGameRequest(
                username=username,
                game_title=game_title
            )
            update_response = stub.BuyGame(update_request)
            logger.info(({
                "service": "game-store",
                "msg": f"Game bought: {update_response.message}",
            }))
            return jsonify({'message': update_response.message}), 200
        except grpc.RpcError as e:
            logger.error(({
                "service": "game-store",
                "msg": f"{e.details(), e.code(), e}",
            }))
            http_status_code = map_grpc_to_http_status(e.code())
            return jsonify({'message': e.details()}), http_status_code
        except Exception as e:
            logger.error(({
                "service": "game-store",
                "msg": f"{str(e)}",
            }))
            return jsonify({'message': str(e)}), 500 

def map_grpc_to_http_status(grpc_code):
    grpc_to_http = {
        grpc.StatusCode.INVALID_ARGUMENT: 400,
        grpc.StatusCode.NOT_FOUND: 404,
        grpc.StatusCode.UNAUTHENTICATED: 401,
        grpc.StatusCode.PERMISSION_DENIED: 403,
        grpc.StatusCode.ALREADY_EXISTS: 409,
        grpc.StatusCode.UNAVAILABLE: 503,
        grpc.StatusCode.INTERNAL: 500,
        grpc.StatusCode.UNKNOWN: 500,
    }
    return grpc_to_http.get(grpc_code, 500)     

@games_bp.route('/prepare_update_username', methods=['PUT'])
def prepare_update_username():
    try:
        data = request.get_json()
        old_username = data.get('old_username')
        new_username = data.get('new_username')
        if not old_username or not new_username:
            return jsonify({'error': 'Old or new username is missing'}), 400

        user = get_game_by_username(old_username)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.temp_username = new_username
        db.session.commit()
        return jsonify({'status': "OK", 'message': 'Username update prepared', 'temp_username': user.temp_username}), 200
    except Exception as e:
        logger.error(({
            "service": "game-store",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@games_bp.route('/commit_update_username', methods=['PUT'])
def commit_update_username():
    try:
        games = get_all_temp_usernames()
        for game in games:
            game.username = game.temp_username
            game.temp_username = None
        db.session.commit()
        return jsonify({'status': "OK", 'message': 'Username update committed', 'username': game.username}), 200
    except Exception as e:
        logger.error(({
            "service": "game-store",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@games_bp.route('/abort_update_username', methods=['PUT'])
def abort_update_username():
    try:
        games = get_all_temp_usernames()
        for game in games:
            game.temp_username = None
        db.session.commit()
        return jsonify({'status': "OK", 'message': 'Username update aborted'}), 200
    except Exception as e:
        logger.error(({
            "service": "game-store",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500
    
@games_bp.route('/saga_update_username', methods=['PUT'])
def update_username():
    try:
        data = request.get_json()
        old_username = data.get('old_username')
        new_username = data.get('new_username')
        if not old_username or not new_username:
            return jsonify({'error': 'Old or new username is missing'}), 400

        game = get_game_by_username(old_username)
        if not game:
            return jsonify({'error': 'User not found'}), 404
        
        game.temp_username = old_username
        game.username = new_username
        db.session.commit()
        redis_client.delete(f'game_{game.id}')
        redis_client.delete('games_list')
        return jsonify({'message': 'Username updated', 'username': game.username}), 200
    except Exception as e:
        logger.error(({
            "service": "game-store",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500 

@games_bp.route('/saga_update_username_rollback', methods=['PUT'])
def update_username_rollback():
    try:
        games = get_all_temp_usernames()
        for game in games:
            game.username = game.temp_username
            game.temp_username = None

        db.session.commit()
        redis_client.delete(f'game_{game.id}')
        redis_client.delete('games_list')
        return jsonify({'message': 'Username returned to initial state', 'username': game.username}), 200
    except Exception as e:
        logger.error(({
            "service": "game-store",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500       