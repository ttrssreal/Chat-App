from flask import Flask, render_template
from flask_socketio import SocketIO, emit

from home.views import home_blueprint
from room.views import room_blueprint
from dostuff.views import dostuff_blueprint

def make_app():
    app = Flask(__name__)
    socketio = SocketIO(app)

    app.register_blueprint(home_blueprint)
    app.register_blueprint(room_blueprint)
    app.register_blueprint(dostuff_blueprint)

    @socketio.on("connect")
    def connect():
        emit("connected")

    @app.errorhandler(404)
    def resource_not_found(error):
        return render_template("error.html", error=error), 404

    return app

if __name__ == "__main__":
    make_app().run(debug=True)
    socketio.run(app)