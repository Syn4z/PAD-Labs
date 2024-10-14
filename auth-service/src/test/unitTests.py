import unittest
from unittest.mock import patch, MagicMock
from werkzeug.security import generate_password_hash, check_password_hash
from services.userService import create_user, get_user_by_id, get_users, verify_user, update_user_by_id, add_game_to_user
from models.user import User
from models.database import db

class TestUserService(unittest.TestCase):

    @patch('services.userService.db.session')
    def test_create_user(self, mock_session):
        mock_session.add = MagicMock()
        mock_session.commit = MagicMock()
        
        username = "testuser"
        email = "testuser@example.com"
        password = "password123"
        
        user = create_user(username, email, password)
        
        self.assertEqual(user.username, username)
        self.assertEqual(user.email, email)
        self.assertTrue(check_password_hash(user.password, password))

    @patch('services.userService.db.session')
    def test_get_user_by_id(self, mock_session):
        mock_user = User(username="testuser", email="testuser@example.com", password="password123")
        mock_user.id = 1 
        mock_query = MagicMock()
        mock_query.get.return_value = mock_user
        mock_session.query.return_value = mock_query
        
        user = get_user_by_id(1)
        
        self.assertEqual(user.id, 1)
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "testuser@example.com")

    @patch('services.userService.db.session')
    def test_get_users(self, mock_session):
        mock_user1 = User(username="testuser1", email="testuser1@example.com", password="password123")
        mock_user2 = User(username="testuser2", email="testuser2@example.com", password="password123")
        mock_session.query.return_value.all.return_value = [mock_user1, mock_user2]
        
        users = get_users()
        
        self.assertEqual(len(users), 2)
        self.assertEqual(users[0].username, "testuser1")
        self.assertEqual(users[1].username, "testuser2")

    @patch('services.userService.get_user_by_username')
    @patch('services.userService.check_password_hash')
    def test_verify_user(self, mock_check_password_hash, mock_get_user_by_username):
        mock_user = User(username="testuser", email="testuser@example.com", password="hashedpassword")
        mock_get_user_by_username.return_value = mock_user
        mock_check_password_hash.return_value = True
        
        user = verify_user("testuser", "password123")
        
        self.assertEqual(user.username, "testuser")
        mock_check_password_hash.assert_called_once_with("hashedpassword", "password123")

    @patch('services.userService.db.session')
    def test_update_user_by_id(self, mock_session):
        user_id = 1
        new_username = "updateduser"
        new_email = "updateduser@example.com"
        new_password = "newpassword123"
        
        mock_user = User(username="testuser", email="testuser@example.com", password=generate_password_hash("password123"))
        mock_user.id = user_id
        
        mock_query = MagicMock()
        mock_query.get.return_value = mock_user
        mock_session.query.return_value = mock_query
        
        updated_user = update_user_by_id(user_id, new_username, new_email, new_password)
        
        self.assertEqual(updated_user.username, new_username)
        self.assertEqual(updated_user.email, new_email)
        self.assertTrue(check_password_hash(updated_user.password, new_password))

    @patch('services.userService.db.session')
    def test_add_game_to_user(self, mock_session):
        mock_user = User(username="testuser", email="testuser@example.com", password="password123")
        mock_user.games = []
        mock_session.query.return_value.filter_by.return_value.first.return_value = mock_user
        
        add_game_to_user("testuser", "newgame")
        
        self.assertIn("newgame", mock_user.games)
        mock_session.commit.assert_called_once()

        

if __name__ == '__main__':
    unittest.main()