// CampusSpace - Flask API Integration
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const typeFilter = document.getElementById("typeFilter");
    const availabilityFilter = document.getElementById("availabilityFilter");
    const spacesGrid = document.getElementById("spacesGrid");
    const resultsCount = document.getElementById("resultsCount");
    const emptyState = document.getElementById("emptyState");

    const totalSpaces = document.getElementById("totalSpaces");
    const availableSpaces = document.getElementById("availableSpaces");
    const totalCapacity = document.getElementById("totalCapacity");

    const roomModal = document.getElementById("roomModal");
    const closeModal = document.getElementById("closeModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalCapacity = document.getElementById("modalCapacity");
    const modalAvailability = document.getElementById("modalAvailability");
    const openBookingButton = document.getElementById("openBookingButton");

    const bookingModal = document.getElementById("bookingModal");
    const closeBookingModal = document.getElementById("closeBookingModal");
    const bookingForm = document.getElementById("bookingForm");
    const bookingRoom = document.getElementById("bookingRoom");
    const bookingDate = document.getElementById("bookingDate");
    const bookingStartTime = document.getElementById("bookingStartTime");
    const bookingEndTime = document.getElementById("bookingEndTime");
    const bookedBy = document.getElementById("bookedBy");
    const bookingMessage = document.getElementById("bookingMessage");
    const submitBooking = document.getElementById("submitBooking");

    const bookingsList = document.getElementById("bookingsList");
    const refreshBookings = document.getElementById("refreshBookings");

    let rooms = [];
    let selectedRoom = null;

    function getLocalDate() {
        const today = new Date();

        return [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");
    }

    function getRoomStyle(type) {
        const normalizedType = String(type || "").toLowerCase();

        if (normalizedType.includes("classroom")) {
            return {
                visual: "visual-classroom",
                icon: "▤",
                label: "CLASSROOM"
            };
        }

        if (normalizedType.includes("lab")) {
            return {
                visual: "visual-lab",
                icon: "⌘",
                label: "LABORATORY"
            };
        }

        if (normalizedType.includes("seminar")) {
            return {
                visual: "visual-seminar",
                icon: "▣",
                label: "SEMINAR HALL"
            };
        }

        return {
            visual: "visual-library",
            icon: "▥",
            label: String(type || "SPACE").toUpperCase()
        };
    }

    function createRoomCard(room) {
        const isAvailable =
            String(room.status).toLowerCase() === "available";

        const style = getRoomStyle(room.type);
        const card = document.createElement("article");

        card.className = "space-card";
        card.dataset.name = String(room.name || "").toLowerCase();
        card.dataset.type = String(room.type || "").toLowerCase();
        card.dataset.status = String(room.status || "").toLowerCase();

        const visual = document.createElement("div");
        visual.className = `space-visual ${style.visual}`;

        const icon = document.createElement("span");
        icon.className = "visual-icon";
        icon.textContent = style.icon;

        const badge = document.createElement("span");
        badge.className =
            `availability ${isAvailable ? "available" : "occupied"}`;

        badge.appendChild(document.createElement("span"));

        badge.appendChild(
            document.createTextNode(
                isAvailable ? " Available" : " Occupied"
            )
        );

        visual.append(icon, badge);

        const content = document.createElement("div");
        content.className = "space-content";

        const typeLabel = document.createElement("p");
        typeLabel.className = "space-type";
        typeLabel.textContent = style.label;

        const title = document.createElement("h3");
        title.textContent = room.name;

        const location = document.createElement("p");
        location.className = "space-location";
        location.textContent = room.building;

        const capacityRow = document.createElement("div");
        capacityRow.className = "space-details";

        const capacityLabel = document.createElement("span");
        capacityLabel.textContent = "♙ Capacity";

        const capacityValue = document.createElement("strong");
        capacityValue.textContent = `${room.capacity} seats`;

        capacityRow.append(capacityLabel, capacityValue);

        const statusRow = document.createElement("div");
        statusRow.className = "space-details";

        const statusLabel = document.createElement("span");
        statusLabel.textContent = "◷ Status";

        const statusValue = document.createElement("strong");
        statusValue.className =
            isAvailable ? "text-available" : "text-occupied";

        statusValue.textContent =
            isAvailable ? "Available now" : "Currently occupied";

        statusRow.append(statusLabel, statusValue);

        const button = document.createElement("button");
        button.className = "view-button";
        button.type = "button";
        button.textContent = "View details →";

        button.addEventListener("click", function () {
            openRoomDetails(room);
        });

        content.append(
            typeLabel,
            title,
            location,
            capacityRow,
            statusRow,
            button
        );

        card.append(visual, content);

        return card;
    }

    function updateStatistics() {
        totalSpaces.textContent = rooms.length;

        availableSpaces.textContent = rooms.filter(
            room => String(room.status).toLowerCase() === "available"
        ).length;

        totalCapacity.textContent = rooms.reduce(
            (total, room) => total + Number(room.capacity || 0),
            0
        );
    }

    function filterSpaces() {
        const searchText = searchInput.value.trim().toLowerCase();
        const selectedType = typeFilter.value.toLowerCase();
        const selectedAvailability =
            availabilityFilter.value.toLowerCase();

        const cards = spacesGrid.querySelectorAll(".space-card");

        let visibleCount = 0;

        cards.forEach(function (card) {
            const roomName = (card.dataset.name || "").toLowerCase();
            const roomType = (card.dataset.type || "").toLowerCase();
            const roomStatus = (card.dataset.status || "").toLowerCase();

            const matchesSearch = roomName.includes(searchText);

            let matchesType = selectedType === "all";

            if (!matchesType) {
                if (selectedType.includes("lab")) {
                    matchesType = roomType.includes("lab");
                } else {
                    matchesType = roomType === selectedType;
                }
            }

            const matchesAvailability =
                selectedAvailability === "all" ||
                roomStatus === selectedAvailability;

            const shouldDisplay =
                matchesSearch &&
                matchesType &&
                matchesAvailability;

            card.hidden = !shouldDisplay;

            if (shouldDisplay) {
                visibleCount++;
            }
        });

        resultsCount.textContent =
            `${visibleCount} ${visibleCount === 1 ? "space" : "spaces"}`;

        emptyState.hidden = visibleCount !== 0;
        spacesGrid.hidden = visibleCount === 0;
    }

    function renderRooms() {
        spacesGrid.replaceChildren();

        rooms.forEach(function (room) {
            spacesGrid.appendChild(createRoomCard(room));
        });

        updateStatistics();
        filterSpaces();
    }

    async function loadRooms() {
        try {
            resultsCount.textContent = "Loading spaces...";

            const response = await fetch("/api/rooms");
            const data = await response.json();

            if (!response.ok || !Array.isArray(data.rooms)) {
                throw new Error(
                    data.error || "Unable to load spaces."
                );
            }

            rooms = data.rooms;

            renderRooms();
            populateBookingRooms();

        } catch (error) {
            console.error("Could not load rooms:", error);

            resultsCount.textContent = "Unable to load spaces";
            spacesGrid.hidden = true;
            emptyState.hidden = false;
        }
    }

    function populateBookingRooms() {
        const currentValue = bookingRoom.value;

        bookingRoom.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose a room";

        bookingRoom.appendChild(placeholder);

        rooms.forEach(function (room) {
            const option = document.createElement("option");

            option.value = room.id;
            option.textContent = `${room.name} — ${room.building}`;

            bookingRoom.appendChild(option);
        });

        if (currentValue) {
            bookingRoom.value = currentValue;
        }
    }

    function openRoomDetails(room) {
        selectedRoom = room;

        modalTitle.textContent = room.name;
        modalCapacity.textContent = `${room.capacity} seats`;

        const isAvailable =
            String(room.status).toLowerCase() === "available";

        modalAvailability.textContent =
            isAvailable ? "Available now" : "Currently occupied";

        modalAvailability.style.color =
            isAvailable ? "#16875d" : "#c94c55";

        roomModal.hidden = false;
        closeModal.focus();
    }

    function closeRoomDialog() {
        roomModal.hidden = true;
    }

    function closeBookingDialog() {
        bookingModal.hidden = true;
    }

    function showBookingMessage(message, success) {
        bookingMessage.textContent = message;

        bookingMessage.style.color =
            success ? "#16875d" : "#c94c55";
    }

    async function loadBookings() {
        if (!bookingsList || !refreshBookings) {
            return;
        }

        bookingsList.textContent = "Loading bookings...";
        refreshBookings.disabled = true;

        try {
           const response = await fetch("/api/student/bookings");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Could not load bookings."
                );
            }

            const bookings = data.bookings || [];

            bookingsList.replaceChildren();

            if (bookings.length === 0) {
                const emptyMessage = document.createElement("p");

                emptyMessage.textContent =
                    "No bookings yet. Reserve a space to get started.";

                bookingsList.appendChild(emptyMessage);
                return;
            }

            bookings.forEach(function (booking) {
                const card = document.createElement("article");
                card.className = "stat-card booking-item";

                const title = document.createElement("h3");
                title.textContent = booking.room_name || "Campus space";

                const date = document.createElement("p");
                date.textContent = "Date: " + booking.date;

                const time = document.createElement("p");
                time.textContent =
                    `Time: ${booking.start_time} – ${booking.end_time}`;

                const person = document.createElement("p");
                person.textContent = "Booked by: " + booking.booked_by;

                const id = document.createElement("p");
                id.textContent = "Booking ID: " + booking.id;

                card.append(title, date, time, person, id);
                bookingsList.appendChild(card);
            });

        } catch (error) {
            console.error("Could not load bookings:", error);

            bookingsList.textContent =
                "Unable to load bookings. Check that the Flask server is running.";

        } finally {
            refreshBookings.disabled = false;
        }
    }

    searchInput.addEventListener("input", filterSpaces);
    typeFilter.addEventListener("change", filterSpaces);
    availabilityFilter.addEventListener("change", filterSpaces);

    closeModal.addEventListener("click", closeRoomDialog);

    roomModal.addEventListener("click", function (event) {
        if (event.target === roomModal) {
            closeRoomDialog();
        }
    });

    openBookingButton.addEventListener("click", function () {
        closeRoomDialog();

        bookingForm.reset();
        bookingMessage.textContent = "";
        bookingDate.min = getLocalDate();

        if (selectedRoom) {
            bookingRoom.value = String(selectedRoom.id);
        }

        bookingModal.hidden = false;
        bookingRoom.focus();
    });

    closeBookingModal.addEventListener(
        "click",
        closeBookingDialog
    );

    bookingModal.addEventListener("click", function (event) {
        if (event.target === bookingModal) {
            closeBookingDialog();
        }
    });

    bookingForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        bookingMessage.textContent = "";

        const roomId = Number(bookingRoom.value);
        const date = bookingDate.value;
        const startTime = bookingStartTime.value;
        const endTime = bookingEndTime.value;
        const name = bookedBy.value.trim();

        if (
            !roomId ||
            !date ||
            !startTime ||
            !endTime ||
            !name
        ) {
            showBookingMessage(
                "Please complete all fields.",
                false
            );
            return;
        }

        if (endTime <= startTime) {
            showBookingMessage(
                "End time must be later than start time.",
                false
            );
            return;
        }

        if (date < getLocalDate()) {
            showBookingMessage(
                "Please select today or a future date.",
                false
            );
            return;
        }

        submitBooking.disabled = true;
        submitBooking.textContent = "Submitting...";

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    room_id: roomId,
                    date: date,
                    start_time: startTime,
                    end_time: endTime,
                    booked_by: name
                })
            });

            const result = await response.json();

            if (!response.ok) {
                showBookingMessage(
                    result.error ||
                    "Booking failed. Please try again.",
                    false
                );
                return;
            }

            const bookingId = result.booking
                ? result.booking.id
                : "confirmed";

            showBookingMessage(
                "Booking confirmed! Booking ID: " + bookingId,
                true
            );

            bookingForm.reset();

            await loadBookings();

        } catch (error) {
            console.error("Booking request failed:", error);

            showBookingMessage(
                "Could not connect to the server. Make sure Flask is running.",
                false
            );

        } finally {
            submitBooking.disabled = false;
            submitBooking.innerHTML =
                'Confirm Booking <span>→</span>';
        }
    });

    refreshBookings.addEventListener("click", loadBookings);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            if (!bookingModal.hidden) {
                closeBookingDialog();
            }

            if (!roomModal.hidden) {
                closeRoomDialog();
            }
        }
    });

    loadRooms();
    loadBookings();
});