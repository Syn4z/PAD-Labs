from flask import request
from __main__ import socketio


@socketio.on('connect')
def handle_connect():
    sid = request.sid
    if sid:
        socketio.emit('message', {'msg': 'Connected', 'sid': sid})
    else:
        socketio.emit('message', {'msg': 'Connection failed: sid missing'})

@socketio.on('message')
def handle_message(data):
    sid = request.sid
    if sid:
        socketio.send({'msg': data, 'sid': sid})
    else:
        socketio.send({'msg': data, 'sid': 'unknown'})

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid:
        socketio.emit('message', {'msg': 'Disconnected', 'sid': sid})
    else:
        socketio.emit('message', {'msg': 'Disconnected', 'sid': 'unknown'})
