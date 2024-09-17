from flask import Blueprint, request, jsonify
from services.userService import create_user, get_user_by_username, get_users, get_user_by_id
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

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = get_user_by_id(user_id)
    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted'})
    return jsonify({'error': 'User not found'}), 404