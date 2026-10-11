
from flask import Flask, render_template, request
from rooms import ROOMS

app = Flask(__name__)


@app.route("/api/rooms", methods=["GET"])
def get_rooms():
    room_type = request.args.get("type", "").strip().lower()
    status = request.args.get("status", "").strip().lower()
    min_capacity = request.args.get("min_capacity", type=int)

    filtered_rooms = ROOMS

    if room_type:
        filtered_rooms = [
            room for room in filtered_rooms
            if room["type"].lower() == room_type
        ]

    if status:
        filtered_rooms = [
            room for room in filtered_rooms
            if room["status"].lower() == status
        ]

    if min_capacity is not None:
        filtered_rooms = [
            room for room in filtered_rooms
            if room["capacity"] >= min_capacity
        ]

    return {"rooms": filtered_rooms}


@app.route("/")
def home():
    return render_template("index.html", rooms=ROOMS)


if __name__ == "__main__":
    app.run(debug=True)
