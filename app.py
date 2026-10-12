
from flask import Flask, render_template, request, jsonify
from rooms import ROOMS
from datetime import date, time, datetime
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

    requested_date = request.args.get("date", "").strip()
    start_time = request.args.get("start_time", "").strip()
    end_time = request.args.get("end_time", "").strip()

    # Validate status
    if status and status not in ("available", "occupied"):
        return jsonify({
            "error": "Status must be available or occupied."
        }), 400

    # Date and time must be supplied together
    slot_values = [requested_date, start_time, end_time]
    if any(slot_values) and not all(slot_values):
        return jsonify({
            "error": "Provide date, start_time, and end_time together."
        }), 400

    filtered_rooms = list(ROOMS)

    if room_type:
        filtered_rooms = [
            room for room in filtered_rooms
            if room["type"].lower() == room_type
        ]

    if min_capacity is not None:
        if min_capacity < 0:
            return jsonify({
                "error": "Minimum capacity cannot be negative."
            }), 400

        filtered_rooms = [
            room for room in filtered_rooms
            if room["capacity"] >= min_capacity
        ]

    # Filter by requested date and time
    if all(slot_values):
        try:
            datetime.strptime(requested_date, "%Y-%m-%d")
            start = datetime.strptime(start_time, "%H:%M").time()
            end = datetime.strptime(end_time, "%H:%M").time()

            if end <= start:
                return jsonify({
                    "error": "End time must be later than start time."
                }), 400

        except ValueError:
            return jsonify({
                "error": "Use date YYYY-MM-DD and times HH:MM."
            }), 400

        with booking_lock:
            bookings = load_bookings()

        unavailable_room_ids = set()

        for booking in bookings:
            if booking["date"] != requested_date:
                continue

            existing_start = datetime.strptime(
                booking["start_time"], "%H:%M"
            ).time()
            existing_end = datetime.strptime(
                booking["end_time"], "%H:%M"
            ).time()

            # Two slots overlap if each starts before the other ends
            if start < existing_end and end > existing_start:
                unavailable_room_ids.add(int(booking["room_id"]))

        if status == "available":
            filtered_rooms = [
                room for room in filtered_rooms
                if room["id"] not in unavailable_room_ids
            ]

        elif status == "occupied":
            filtered_rooms = [
                room for room in filtered_rooms
                if room["id"] in unavailable_room_ids
            ]

        else:
            # With a time slot, return rooms free during that slot
            filtered_rooms = [
                room for room in filtered_rooms
                if room["id"] not in unavailable_room_ids
            ]

    elif status:
        # Without a time slot, use each room's stored status
        filtered_rooms = [
            room for room in filtered_rooms
            if room["status"].lower() == status
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

    if not all([
        room_id, booking_date, start_time, end_time, booked_by
    ]):
        return jsonify({
            "error": "Please provide room, date, start time, end time, and your name."
        }), 400

    try:
        room_id = int(room_id)
        parsed_date = date.fromisoformat(booking_date)
        start = time.fromisoformat(start_time)
        end = time.fromisoformat(end_time)

        # Require the exact formats accepted by the API
        if (
            parsed_date.isoformat() != booking_date
            or start.strftime("%H:%M") != start_time
            or end.strftime("%H:%M") != end_time
        ):
            raise ValueError

    except (ValueError, TypeError):
        return jsonify({
            "error": "Use a valid room ID, date YYYY-MM-DD, and times HH:MM."
        }), 400

    if booking_date < date.today().isoformat():
        return jsonify({
            "error": "You cannot book a past date."
        }), 400

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
                int(booking["room_id"]) == room_id
                and booking["date"] == booking_date
                and start_time < booking["end_time"]
                and end_time > booking["start_time"]
            ):
                return jsonify({
                    "error": "This room is already booked for that time. Please choose another slot."
                }), 409

        new_booking = {
            "id": max(
                (b["id"] for b in bookings), default=0
            ) + 1,
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
