from flask import Blueprint, request, jsonify
from services.userService import *
from models.database import db

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def list_users():
    users = get_users()
    return jsonify([{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'created_at': user.created_at,
        'updated_at': user.updated_at
    } for user in users])

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
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

@users_bp.route('/', methods=['POST'])
def add_user():
    try:
        data = request.get_json()
        user = create_user(data['username'], data['email'], data['password'])
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = get_user_by_id(user_id)
    if user:
        data = request.get_json()
        user.username = data['username']
        user.email = data['email']
        db.session.commit()
        return jsonify({
            'username': user.username,
            'email': user.email
        })
    return jsonify({'error': 'User not found'}), 404

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = get_user_by_id(user_id)
    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted'})
    return jsonify({'error': 'User not found'}), 404

@users_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        user = create_user(data['username'], data['email'], data['password'])
        return jsonify({
            'username': user.username,
            'email': user.email
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@users_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = verify_user(data['username'], data['password'])
    if user:
        return jsonify({
            'message': 'Login successful',
            'user': {
                'username': user.username,
                'email': user.email
            }
        })
    return jsonify({'error': 'Invalid username or password'}), 401
