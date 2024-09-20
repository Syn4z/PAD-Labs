from flask import Blueprint, request, jsonify
from services.gameService import *
from models.database import db

games_bp = Blueprint('games', __name__)

@games_bp.route('/', methods=['GET'])
def list_games():
    games = get_games()
    return jsonify([{
        'id': game.id,
        'title': game.title,
        'genre': game.genre,
        'price': game.price,
        'description': game.description,
        'release_date': game.release_date
    } for game in games])

@games_bp.route('/<int:game_id>', methods=['GET'])
def get_game(game_id):
    game = get_game_by_id(game_id)
    if game:
        return jsonify({
            'id': game.id,
            'title': game.title,
            'genre': game.genre,
            'price': game.price,
            'description': game.description,
            'release_date': game.release_date
        })
    return jsonify({'error': 'Game not found'}), 404

@games_bp.route('/', methods=['POST'])
def add_game():
    try:
        data = request.get_json()
        game = create_game(data['title'], data['genre'], data['price'], data['description'], data['release_date'])
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
def update_game(game_id):
    game = get_game_by_id(game_id)
    if game:
        data = request.get_json()
        game.title = data['title']
        game.genre = data['genre']
        game.price = data['price']
        game.description = data['description']
        game.release_date = data['release_date']
        db.session.commit()
        return jsonify({
            'title': game.title,
            'genre': game.genre,
            'price': game.price,
            'description': game.description,
            'release_date': game.release_date
        })
    return jsonify({'error': 'Game not found'}), 404

@games_bp.route('/<int:game_id>', methods=['DELETE'])
def delete_game(game_id):
    game = get_game_by_id(game_id)
    if game:
        db.session.delete(game)
        db.session.commit()
        return jsonify({'message': 'Game deleted'})
    return jsonify({'error': 'Game not found'}), 404    
