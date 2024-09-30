import jwt
from datetime import datetime, timedelta
from os import getenv
from functools import wraps
from flask import request, jsonify

SECRET_KEY = getenv('JWT_SECRET_KEY')

def generate_token(user_id: int) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=5)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token has expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')
    
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header is missing'}), 403
        
        parts = auth_header.split()
        if parts[0].lower() != 'bearer':
            return jsonify({'error': 'Authorization header must start with Bearer'}), 403
        elif len(parts) == 1:
            return jsonify({'error': 'Token not found'}), 403
        elif len(parts) > 2:
            return jsonify({'error': 'Authorization header must be Bearer token'}), 403

        token = parts[1]
        try:
            payload = verify_token(token)
            request.user_id = payload['user_id']
        except Exception as e:
            return jsonify({'error': str(e)}), 403
        return f(*args, **kwargs)
    return decorated