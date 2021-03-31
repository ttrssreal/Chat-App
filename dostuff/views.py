from flask import Blueprint, render_template, request
from flask_socketio import SocketIO, emit

dostuff_blueprint = Blueprint("dostuff",__name__,template_folder="templates")

@dostuff_blueprint.route("/dostuff", methods=["POST"])
def POST_dostuff():
    # if request.args.get("todo") == "update":
    #     return "updating"
        
    return "not"

    