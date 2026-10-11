
from flask import Flask, render_template_string, request
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
    return render_template_string("""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CampusSpace</title>
        <style>
            * {
                box-sizing: border-box;
            }

            body {
                font-family: Arial, sans-serif;
                background: #f1f5f9;
                margin: 0;
                color: #172554;
            }

            header {
                background: #172554;
                color: white;
                padding: 28px 7%;
            }

            header h1 {
                margin-top: 0;
            }

            main {
                max-width: 1000px;
                margin: 30px auto;
                padding: 0 20px;
            }

            .rooms {
                display: grid;
                grid-template-columns:
                    repeat(auto-fit, minmax(220px, 1fr));
                gap: 18px;
            }

            .card {
                background: white;
                padding: 22px;
                border-radius: 12px;
                box-shadow: 0 3px 12px #17255410;
            }

            .available {
                color: #15803d;
                font-weight: bold;
            }

            .occupied {
                color: #dc2626;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <header>
            <h1>CampusSpace</h1>
            <p>Smart Campus Facility Availability</p>
        </header>

        <main>
            <h2>Campus Facilities</h2>

            <section class="rooms">
                {% for room in rooms %}
                <article class="card">
                    <h3>{{ room.name }}</h3>
                    <p>{{ room.type }}</p>
                    <p>{{ room.building }}</p>
                    <p>Capacity: {{ room.capacity }} people</p>
                    <p class="{{ room.status|lower }}">
                        {{ room.status }}
                    </p>
                </article>
                {% endfor %}
            </section>
        </main>
    </body>
    </html>
    """, rooms=ROOMS)


if __name__ == "__main__":
    app.run(debug=True)
