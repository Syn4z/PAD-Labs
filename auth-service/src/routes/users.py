from flask import Blueprint, request, jsonify
from ..services import userService
from ..models.user import User
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

users_bp = Blueprint('users', __name__)

# Database setup
engine = create_engine('sqlite:///../auth-service.db')  # Use your actual database URL
Session = sessionmaker(bind=engine)
session = Session()

@users_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if userService.get_user_by_username(session, username):
        return jsonify({"message": "User already exists"}), 400

    user = userService.create_user(session, username, email, password)
    return jsonify({"message": "User registered successfully", "user": user.username}), 201

@users_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = userService.get_user_by_username(session, username)
    if user and user.check_password(password):
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@users_bp.route('/')
def get_users():
    users = userService.get_users()
    return jsonify(users)

@users_bp.route('/<int:user_id>')
def get_user(user_id):
    user = userService.get_user_by_id(user_id)
    return jsonify(user)

@users_bp.route('/', methods=['POST'])
def create_user():
    data = request.get_json()
    user = userService.create_user(data)
    return jsonify(user), 201