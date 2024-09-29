from flask import Blueprint, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy.exc import OperationalError
from services.gameService import *
from models.database import db
from __main__ import redis_client
import requests
import json

games_bp = Blueprint('games', __name__)
limiter = Limiter(key_func=get_remote_address)


@games_bp.route('/status', methods=['GET'])
def status():
    try:
        db.session.execute('SELECT 1')
        return jsonify({'status': 'Game store service is running', 'database': 'connected'}), 200
    except OperationalError as e:
        return jsonify({'status': 'Game store service is running', 'database': 'disconnected', 'error': 'Database is unreachable'}), 500
    except Exception as e:
        return jsonify({'status': 'Game store service is running', 'database': 'disconnected', 'error': str(e)}), 500

@games_bp.route('/', methods=['GET'])
@limiter.limit("5 per minute")
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
        'description': game.description
    } for game in games]
    redis_client.set('games_list', json.dumps(response), ex=3600)
    return jsonify(response)

@games_bp.route('/<int:game_id>', methods=['GET'])
@limiter.limit("5 per minute")
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
            'description': game.description
        }
        redis_client.set(f'game_{game_id}', json.dumps(response), ex=3600)
        return jsonify(response)
    return jsonify({'error': 'Game not found'}), 404

@games_bp.route('/', methods=['POST'])
@limiter.limit("5 per minute")
def add_game():
    try:
        data = request.get_json()
        game = create_game(data['title'], data['genre'], data['price'], data['description'])
        redis_client.delete('games_list')
        return jsonify({
            'title': game.title,
            'genre': game.genre,
            'price': game.price,
            'description': game.description,
            'release_date': game.release_date
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@games_bp.route('/<int:game_id>', methods=['PUT'])
@limiter.limit("5 per minute")
def update_game(game_id):
    game = get_game_by_id(game_id)
    if game:
        data = request.get_json()
        game.title = data['title']
        game.genre = data['genre']
        game.price = data['price']
        game.description = data['description']
        db.session.commit()
        redis_client.delete(f'game_{game_id}')
        redis_client.delete('games_list')
        return jsonify({
            'title': game.title,
            'genre': game.genre,
            'price': game.price,
            'description': game.description
        })
    return jsonify({'error': 'Game not found'}), 404

@games_bp.route('/<int:game_id>', methods=['DELETE'])
@limiter.limit("5 per minute")
def delete_game(game_id):
    game = get_game_by_id(game_id)
    if game:
        db.session.delete(game)
        db.session.commit()
        redis_client.delete(f'game_{game_id}')
        redis_client.delete('games_list')
        return jsonify({'message': 'Game deleted'})
    return jsonify({'error': 'Game not found'}), 404    

@games_bp.route('/buy/<int:game_id>/<string:username>', methods=['POST'])
@limiter.limit("5 per minute")
def buy_game(game_id, username):
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Authorization token is missing'}), 401

        game = get_game_by_id(game_id)
        if not game:
            return jsonify({'error': 'Game not found'}), 404

        headers = {'Authorization': token, 'Content-Type': 'application/json'}
        auth_service_url = 'http://auth-service:5000/users/add_game'
        payload = {'game_title': game.title, 'username': username}
        
        response = requests.post(auth_service_url, json=payload, headers=headers)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to add game to user profile', 'details': response.json()}), response.status_code

        return jsonify({'message': 'Game added to user profile'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400