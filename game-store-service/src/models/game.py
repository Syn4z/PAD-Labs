from models.database import db

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(80), unique=True, nullable=False)
    genre = db.Column(db.String(120), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(120), nullable=False)
    release_date = db.Column(db.DateTime, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    temp_username = db.Column(db.String(80), unique=True, nullable=True)

    def __init__(self, title, genre, price, description, release_date, username):
        self.title = title
        self.genre = genre
        self.price = price
        self.description = description
        self.release_date = release_date  
        self.username = username