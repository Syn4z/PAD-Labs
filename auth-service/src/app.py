from flask import Flask
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from routes.users import users_bp
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

Base = declarative_base()
engine = create_engine(f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}")
Session = sessionmaker(bind=engine)
session = Session()

app = Flask(__name__)
app.register_blueprint(users_bp, url_prefix='/users')

if __name__ == '__main__':
    Base.metadata.create_all(engine)
    app.run(host='0.0.0.0', port=5000)