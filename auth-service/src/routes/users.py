from random import randrange
from flask import Blueprint, request, jsonify
import requests
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.sql import text
from services.userService import *
from models.database import db
from utils.jwt_utils import generate_token, token_required
import psutil
import logging
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

logger = logging.getLogger('auth-service')
logger.setLevel(logging.INFO)
console_handler = logging.StreamHandler()
console_handler.setFormatter(LogstashFormatterV1())
logger.addHandler(console_handler)
logstash_handler = HTTPLogstashHandler(host=os.getenv('LOGSTASH_HOST'), port=os.getenv('LOGSTASH_PORT'), tags=["auth"])
logstash_handler.setFormatter(LogstashFormatterV1())
logger.addHandler(logstash_handler)

users_bp = Blueprint('users', __name__)

@users_bp.route('/status', methods=['GET'])
def status():
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({'status': 'Auth service is running', 'database': 'connected'}), 200
    except OperationalError as e:
        logger.error(({
          "service": "auth",
          "msg": f"Database is unreachable: {str(e)}",
        }))
        return jsonify({'status': 'Auth service is running', 'database': 'disconnected', 'error': 'Database is unreachable'}), 500
    except Exception as e:
        return jsonify({'status': 'Auth service is running', 'database': 'disconnected', 'error': str(e)}), 500

@users_bp.route('/load', methods=['GET'])
def load():
    try:
        cpu_usage = psutil.cpu_percent(interval=1) * randrange(2, 20)
        return jsonify({'cpu_usage': cpu_usage}), 200
    except Exception as e:
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@users_bp.route('/', methods=['GET'])
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
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
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
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@users_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if 'username' not in data:
            logger.error(({
                "service": "auth",
                "msg": "Username is missing",
            }))
            return jsonify({'error': 'Username is missing'}), 400
        if 'password' not in data:
            logger.error(({
                "service": "auth",
                "msg": "Password is missing",
            }))
            return jsonify({'error': 'Password is missing'}), 400
        if 'email' not in data:
            logger.error(({
                "service": "auth",
                "msg": "Email is missing",
            }))
            return jsonify({'error': 'Email is missing'}), 400
        new_user = create_user(data['username'], data['email'], data['password'])
        return jsonify({'message': 'User registered', 'user': new_user.username}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'User already exists'}), 409
    except Exception as e:
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@users_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if 'username' not in data:
            logger.error(({
                "service": "auth",
                "msg": "Username is missing",
            }))
            return jsonify({'error': 'Username is missing'}), 400
        if 'password' not in data:
            logger.error(({
                "service": "auth",
                "msg": "Password is missing",
            }))
            return jsonify({'error': 'Password is missing'}), 400
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
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500
    
@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.get_json()
        updated_user = update_user_by_id(user_id, data)
        return jsonify({'message': 'User updated', 'user': updated_user})
    except Exception as e:
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = get_user_by_id(user_id)
        if user:
            db.session.delete(user)
            db.session.commit()
            return jsonify({'message': 'User deleted'})
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500
    
@users_bp.route('/add_game', methods=['POST'])
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
            existing_user = get_user_by_username(username)
            if not existing_user:
                return jsonify({'error': 'User not found'}), 404
            user = add_game_to_user(username, game_title)
            return jsonify({'message': 'Game added to profile', 'user': user.username}), 200
        except ValueError as e:
            return jsonify({'error': str(e)}), 409
    except Exception as e:
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 400

@users_bp.route('/prepare_update_username/<int:user_id>', methods=['PUT'])
def prepare_update_username(user_id):
    try:
        data = request.get_json()
        new_username = data.get('new_username')
        if not new_username:
            return jsonify({'error': 'New username is missing'}), 400

        user = get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.temp_username = new_username
        db.session.commit()
        return jsonify({'status': "OK", 'message': 'Username update prepared', 'temp_username': user.temp_username}), 200
    except Exception as e:
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@users_bp.route('/commit_update_username/<int:user_id>', methods=['PUT'])
def commit_update_username(user_id):
    try:
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not user.temp_username:
            return jsonify({'error': 'No prepared username update found'}), 400

        user.username = user.temp_username
        user.temp_username = None
        db.session.commit()
        return jsonify({'status': "OK", 'message': 'Username update committed', 'username': user.username}), 200
    except Exception as e:
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500

@users_bp.route('/abort_update_username/<int:user_id>', methods=['PUT'])
def abort_update_username(user_id):
    try:
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.temp_username = None
        db.session.commit()
        return jsonify({'status': "OK", 'message': 'Username update aborted'}), 200
    except Exception as e:
        logger.error(({
            "service": "auth",
            "msg": f"{str(e)}",
        }))
        return jsonify({'error': str(e)}), 500