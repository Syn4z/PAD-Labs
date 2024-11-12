from datetime import datetime
from models.game import Game
from models.database import db

def create_game(title: str, genre: str, price: float, description: str, username: str):
    release_date = datetime.now()
    new_game = Game(title=title, genre=genre, price=price, description=description, release_date=release_date, username=username)
    db.session.add(new_game)
    db.session.commit()
    return new_game

def get_games():
    return db.session.query(Game).all()

def get_game_by_id(game_id: int):
    return db.session.query(Game).get(game_id)

def get_game_by_title(game_title: str):
    return db.session.query(Game).filter_by(title=game_title).first()

def update_game_by_id(game_id: int, title: str, genre: str, price: float, description: str):
    game = get_game_by_id(game_id)
    if game:
        game.title = title
        game.genre = genre
        game.price = price
        game.description = description
        db.session.commit()
    return game

def get_user_by_username(username: str):
    return db.session.query(Game).filter_by(username=username).first()

def get_all_temp_usernames():
    return db.session.query(Game).filter(Game.temp_username.isnot(None)).all()