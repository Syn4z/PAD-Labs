from datetime import datetime
from models.game import Game
from models.database import db

def create_game(title: str, genre: str, price: float, description: str):
    release_date = datetime.now()
    new_game = Game(title=title, genre=genre, price=price, description=description, release_date=release_date)
    db.session.add(new_game)
    db.session.commit()
    return new_game

def get_games():
    return db.session.query(Game).all()

def get_game_by_id(game_id: int):
    return db.session.query(Game).get(game_id)

def update_game_by_id(game_id: int, title: str, genre: str, price: float, description: str):
    game = get_game_by_id(game_id)
    if game:
        game.title = title
        game.genre = genre
        game.price = price
        game.description = description
        db.session.commit()
    return game
