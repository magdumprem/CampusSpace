
from flask import Flask, render_template, request, jsonify
from rooms import ROOMS
from datetime import date, time
import json
import os
from threading import Lock

app = Flask(__name__)

BOOKINGS_FILE = "bookings.json"
booking_lock = Lock()


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
        json.dump(bookings, file, indent=4)


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

    return jsonify({"rooms": filtered_rooms})


@app.route("/api/bookings", methods=["GET"])
def get_bookings():
    with booking_lock:
        return jsonify({"bookings": load_bookings()})


@app.route("/api/bookings", methods=["POST"])
def create_booking():
    data = request.get_json(silent=True) or {}

    room_id = data.get("room_id")
    booking_date = str(data.get("date", "")).strip()
    start_time = str(data.get("start_time", "")).strip()
    end_time = str(data.get("end_time", "")).strip()
    booked_by = str(data.get("booked_by", "")).strip()

    if not all([room_id, booking_date, start_time, end_time, booked_by]):
        return jsonify({
            "error": "Please provide room, date, start time, end time, and your name."
        }), 400

    try:
        room_id = int(room_id)
        date.fromisoformat(booking_date)
        start = time.fromisoformat(start_time)
        end = time.fromisoformat(end_time)
    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid room ID, date, or time format."
        }), 400

    if booking_date < date.today().isoformat():
        return jsonify({"error": "You cannot book a past date."}), 400

    if start >= end:
        return jsonify({
            "error": "End time must be later than start time."
        }), 400

    room = next((r for r in ROOMS if r["id"] == room_id), None)

    if room is None:
        return jsonify({"error": "Room not found."}), 404

    with booking_lock:
        bookings = load_bookings()

        for booking in bookings:
            if (
                booking["room_id"] == room_id
                and booking["date"] == booking_date
                and start_time < booking["end_time"]
                and end_time > booking["start_time"]
            ):
                return jsonify({
                    "error": "This room is already booked for that time. Please choose another slot."
                }), 409

        new_booking = {
            "id": max((b["id"] for b in bookings), default=0) + 1,
            "room_id": room_id,
            "room_name": room["name"],
            "date": booking_date,
            "start_time": start_time,
            "end_time": end_time,
            "booked_by": booked_by
        }

        bookings.append(new_booking)
        save_bookings(bookings)

    return jsonify({
        "message": "Room booked successfully!",
        "booking": new_booking
    }), 201


@app.route("/")
def home():
    return render_template("index.html", rooms=ROOMS)


if __name__ == "__main__":
    app.run(debug=True)
