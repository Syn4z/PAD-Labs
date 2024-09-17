from sqlalchemy.orm import Session
from models.user import User

def create_user(session: Session, username: str, email: str, password: str):
    user = User(username=username, email=email)
    user.set_password(password)
    session.add(user)
    session.commit()
    return user

def get_user_by_username(session: Session, username: str):
    return session.query(User).filter_by(username=username).first()

def get_users(session: Session):
    return session.query(User).all()

def get_user_by_id(session: Session, user_id: int):
    return session.query(User).filter_by(id=user_id).first()