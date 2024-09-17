from flask import Flask
from dotenv import load_dotenv
from models.database import db
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    with app.app_context():
        db.create_all()
    return app


if __name__ == '__main__':
    app = create_app()
    from routes.users import users_bp
    app.register_blueprint(users_bp, url_prefix='/auth')
    app.run(host='0.0.0.0', port=5000)