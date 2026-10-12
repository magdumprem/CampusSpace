import json
import os
from datetime import datetime

from flask import Flask, render_template, request
from rooms import ROOMS

app = Flask(__name__)

BOOKINGS_FILE = "bookings.json"


def load_bookings():
    if not os.path.exists(BOOKINGS_FILE):
        return []

    try:
        with open(BOOKINGS_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return []


def save_bookings(bookings):
    with open(BOOKINGS_FILE, "w", encoding="utf-8") as file:
        json.dump(bookings, file, indent=2)


@app.route("/")
def home():
    return render_template("index.html", rooms=ROOMS)


@app.route("/api/rooms", methods=["GET"])
def get_rooms():
    room_type = request.args.get("type", "").strip().lower()
    status = request.args.get("status", "").strip().lower()
    min_capacity = request.args.get("min_capacity", type=int)

    date = request.args.get("date", "").strip()
    start_time = request.args.get("start_time", "").strip()
    end_time = request.args.get("end_time", "").strip()

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

    if date and start_time and end_time:
        bookings = load_bookings()

        filtered_rooms = [
            room for room in filtered_rooms
            if not any(
                booking["room_id"] == room["id"]
                and booking["date"] == date
                and start_time < booking["end_time"]
                and end_time > booking["start_time"]
                for booking in bookings
            )
        ]

    return {"rooms": filtered_rooms}


@app.route("/api/bookings", methods=["GET"])
def get_bookings():
    return {"bookings": load_bookings()}


@app.route("/api/bookings", methods=["POST"])
def create_booking():
    data = request.get_json(silent=True) or {}

    required_fields = [
        "room_id",
        "date",
        "start_time",
        "end_time",
        "booked_by",
    ]

    if any(not data.get(field) for field in required_fields):
        return {"error": "Please provide all booking details."}, 400

    try:
        room_id = int(data["room_id"])
        booking_date = datetime.strptime(
            data["date"], "%Y-%m-%d"
        ).date()
        start = datetime.strptime(
            data["start_time"], "%H:%M"
        ).time()
        end = datetime.strptime(
            data["end_time"], "%H:%M"
        ).time()

    except (ValueError, TypeError):
        return {
            "error": "Invalid room ID, date, or time format."
        }, 400

    if booking_date < datetime.now().date():
        return {
            "error": "Please choose today or a future date."
        }, 400

    if end <= start:
        return {
            "error": "End time must be after start time."
        }, 400

    room = next(
        (room for room in ROOMS if room["id"] == room_id),
        None,
    )

    if room is None:
        return {"error": "Room not found."}, 404

    booked_by = str(data["booked_by"]).strip()

    if not booked_by:
        return {"error": "Please enter your name."}, 400

    bookings = load_bookings()

    for booking in bookings:
        if (
            booking["room_id"] == room_id
            and booking["date"] == data["date"]
            and start.strftime("%H:%M") < booking["end_time"]
            and end.strftime("%H:%M") > booking["start_time"]
        ):
            return {
                "error": (
                    "This room is already booked for that time. "
                    "Please choose another slot."
                )
            }, 409

    new_booking = {
        "id": max(
            (booking["id"] for booking in bookings),
            default=0,
        ) + 1,
        "room_id": room_id,
        "room_name": room["name"],
        "date": data["date"],
        "start_time": start.strftime("%H:%M"),
        "end_time": end.strftime("%H:%M"),
        "booked_by": booked_by,
    }

    bookings.append(new_booking)
    save_bookings(bookings)

    return {
        "message": "Booking confirmed!",
        "booking": new_booking,
    }, 201


if __name__ == "__main__":
    app.run(debug=True)