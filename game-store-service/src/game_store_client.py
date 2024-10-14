import logging
import grpc
from game_store_pb2 import BuyGameRequest, BuyGameResponse
from game_store_pb2_grpc import GameStoreStub

def buy_game(username, game_name):
    with grpc.insecure_channel('localhost:50051') as channel:
        stub = GameStoreStub(channel)
        request = BuyGameRequest(username=username, game_name=game_name)
        logging.info(f'request: {request}')
        response = stub.BuyGame(request)
        logging.info(f'response: {response}')
        return response