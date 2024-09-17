from models.user import User
from models.database import db

def create_user(username: str, email: str, password: str):
    new_user = User(username=username, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

def get_user_by_username(username: str):
    return db.session.query(User).filter_by(username=username).first()

def get_users():
    return db.session.query(User).all()

def get_user_by_id(user_id: int):
    return db.session.query(User).get(user_id)