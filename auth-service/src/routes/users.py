from time import sleep
from flask import Blueprint, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy.exc import IntegrityError, OperationalError
from services.userService import *
from models.database import db
from utils.jwt_utils import generate_token, token_required

users_bp = Blueprint('users', __name__)
limiter = Limiter(key_func=get_remote_address)


@users_bp.route('/status', methods=['GET'])
@limiter.limit("5 per minute")
def status():
    try:
        db.session.execute('SELECT 1')
        return jsonify({'status': 'Auth service is running', 'database': 'connected'}), 200
    except OperationalError as e:
        return jsonify({'status': 'Auth service is running', 'database': 'disconnected', 'error': 'Database is unreachable'}), 500
    except Exception as e:
        return jsonify({'status': 'Auth service is running', 'database': 'disconnected', 'error': str(e)}), 500

@users_bp.route('/', methods=['GET'])
@limiter.limit("5 per minute")
def list_users():
    try:
        users = get_users()
        return jsonify([{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at,
            'updated_at': user.updated_at,
            'games': user.games
        } for user in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@limiter.limit("5 per minute")
@token_required
def get_user(user_id):
    try:
        user = get_user_by_id(user_id)
        if user:
            return jsonify({
                'id': user.id,
                'username': user.username,
                'password': user.password,
                'email': user.email,
                'created_at': user.created_at,
                'updated_at': user.updated_at,
                'games': user.games
            })
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    try:
        data = request.get_json()
        new_user = create_user(data['username'], data['email'], data['password'])
        return jsonify({'message': 'User registered', 'user': new_user.username}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'User already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    try:
        sleep(6)
        data = request.get_json()
        user = verify_user(data['username'], data['password'])
        if user:
            token = generate_token(user.id)
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'username': user.username,
                    'email': user.email
                }
            })
        return jsonify({'error': 'Invalid username or password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@users_bp.route('/<int:user_id>', methods=['PUT'])
@limiter.limit("5 per minute")
def update_user(user_id):
    try:
        data = request.get_json()
        updated_user = update_user_by_id(user_id, data)
        return jsonify({'message': 'User updated', 'user': updated_user})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@limiter.limit("5 per minute")
def delete_user(user_id):
    try:
        user = get_user_by_id(user_id)
        if user:
            db.session.delete(user)
            db.session.commit()
            return jsonify({'message': 'User deleted'})
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@users_bp.route('/add_game', methods=['POST'])
@token_required
def add_game():
    try:
        data = request.get_json()
        username = data['username']
        game_title = data['game_title']
        if not username:
            return jsonify({'error': 'Username is missing'}), 400
        if not game_title:
            return jsonify({'error': 'Game title is missing'}), 400
        try:
            user = add_game_to_user(username, game_title)
            return jsonify({'message': 'Game added to profile', 'user': user.username}), 200
        except ValueError as e:
            return jsonify({'error': str(e)}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 400
