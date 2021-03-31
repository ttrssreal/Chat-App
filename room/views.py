from flask import Blueprint, render_template, request

room_blueprint = Blueprint("room",__name__,template_folder="templates")

@room_blueprint.route("/room", methods=["GET"])
def room():
    return render_template("room.html", room_number=request.args.get("num"))

@room_blueprint.route("/sum_msg", methods=["POST"])
def sub_msg():
    pass