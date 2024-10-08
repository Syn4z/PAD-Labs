from models.user import User
from models.database import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm.attributes import flag_modified

def create_user(username: str, email: str, password: str):
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return new_user

def get_users():
    return db.session.query(User).all()

def get_user_by_id(user_id: int):
    return db.session.query(User).get(user_id)

def get_user_by_username(username: str):
    return db.session.query(User).filter_by(username=username).first()

def verify_user(username: str, password: str):
    user = get_user_by_username(username)
    if user and check_password_hash(user.password, password):
        return user
    return None

def update_user_by_id(user_id: int, username: str, email: str, password: str):
    user = get_user_by_id(user_id)
    if user:
        user.username = username
        user.email = email
        user.password = generate_password_hash(password)
        db.session.commit()
    return user

def add_game_to_user(username, game_title):
    user = get_user_by_username(username)
    if user:
        if user.games is None:
            user.games = []
        if game_title in user.games:
            raise ValueError(f"Game '{game_title}' already exists in user '{username}' profile")
        else:
            user.games.append(game_title)
            flag_modified(user, 'games')
            db.session.commit()
    return user