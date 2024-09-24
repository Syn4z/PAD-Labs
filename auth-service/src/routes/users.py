from functools import wraps
from flask import Blueprint, request, jsonify
from services.userService import *
from models.database import db
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from utils.jwt_utils import generate_token, token_required
from sqlalchemy.exc import IntegrityError

users_bp = Blueprint('users', __name__)
limiter = Limiter(key_func=get_remote_address)


@users_bp.route('/status', methods=['GET'])
@limiter.limit("5 per minute")
def status():
    try:
        db.session.execute('SELECT 1')
        return jsonify({'status': 'Auth service is running', 'database': 'connected'}), 200
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
            'updated_at': user.updated_at
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
                'updated_at': user.updated_at
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
