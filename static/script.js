
document.addEventListener("DOMContentLoaded", function () {
    // Search and filters
    const searchInput = document.getElementById("searchInput");
    const typeFilter = document.getElementById("typeFilter");
    const availabilityFilter = document.getElementById("availabilityFilter");

    const spacesGrid = document.getElementById("spacesGrid");
    const spaceCards = document.querySelectorAll("#spacesGrid .space-card");
    const resultsCount = document.getElementById("resultsCount");
    const emptyState = document.getElementById("emptyState");

    // Dashboard statistics
    const totalSpaces = document.getElementById("totalSpaces");
    const availableSpaces = document.getElementById("availableSpaces");
    const totalCapacity = document.getElementById("totalCapacity");

    // Room details modal
    const roomModal = document.getElementById("roomModal");
    const closeModal = document.getElementById("closeModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalCapacity = document.getElementById("modalCapacity");
    const modalAvailability = document.getElementById("modalAvailability");
    const openBookingButton = document.getElementById("openBookingButton");

    // Booking modal and form
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

    // My Bookings section
    const bookingsList = document.getElementById("bookingsList");
    const refreshBookings = document.getElementById("refreshBookings");

    let selectedRoomName = "";

    // Get today's date in local YYYY-MM-DD format
    function getLocalDate() {
        const today = new Date();

        return [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");
    }

    // Dashboard statistics
    function updateStatistics() {
        let availableCount = 0;
        let capacityCount = 0;

        spaceCards.forEach(function (card) {
            if (card.dataset.status === "available") {
                availableCount++;
            }

            const capacityElement = card.querySelector(".space-details strong");

            if (capacityElement) {
                const capacity = parseInt(capacityElement.textContent, 10);

                if (!Number.isNaN(capacity)) {
                    capacityCount += capacity;
                }
            }
        });

        totalSpaces.textContent = spaceCards.length;
        availableSpaces.textContent = availableCount;
        totalCapacity.textContent = capacityCount;
    }

    // Search and filter rooms
    function filterSpaces() {
        const searchText = searchInput.value.trim().toLowerCase();
        const selectedType = typeFilter.value;
        const selectedAvailability = availabilityFilter.value;

        let visibleCount = 0;

        spaceCards.forEach(function (card) {
            const roomName = (card.dataset.name || "").toLowerCase();
            const roomType = card.dataset.type;
            const roomStatus = card.dataset.status;

            const matchesSearch = roomName.includes(searchText);

            const matchesType =
                selectedType === "all" || roomType === selectedType;

            const matchesAvailability =
                selectedAvailability === "all" ||
                roomStatus === selectedAvailability;

            const shouldDisplay =
                matchesSearch && matchesType && matchesAvailability;

            card.hidden = !shouldDisplay;

            if (shouldDisplay) {
                visibleCount++;
            }
        });

        resultsCount.textContent =
            visibleCount + (visibleCount === 1 ? " space" : " spaces");

        emptyState.hidden = visibleCount !== 0;
        spacesGrid.hidden = visibleCount === 0;
    }

    // Close modals
    function closeRoomModal() {
        roomModal.hidden = true;
    }

    function closeBookingDialog() {
        bookingModal.hidden = true;
    }

    // Display booking messages
    function showBookingMessage(message, success) {
        bookingMessage.textContent = message;
        bookingMessage.style.color = success ? "#16875d" : "#c94c55";
    }

    // Load saved bookings from Flask
    async function loadBookings() {
        bookingsList.textContent = "Loading bookings...";
        refreshBookings.disabled = true;

        try {
            const response = await fetch("/api/bookings");
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
                title.textContent =
                    booking.room_name || "Campus space";

                const date = document.createElement("p");
                date.textContent = "Date: " + booking.date;

                const time = document.createElement("p");
                time.textContent =
                    "Time: " +
                    booking.start_time +
                    " – " +
                    booking.end_time;

                const person = document.createElement("p");
                person.textContent =
                    "Booked by: " + booking.booked_by;

                const id = document.createElement("p");
                id.textContent = "Booking ID: " + booking.id;

                card.append(title, date, time, person, id);
                bookingsList.appendChild(card);
            });
        } catch (error) {
            bookingsList.textContent =
                "Unable to load bookings. Check that the Flask server is running.";
        } finally {
            refreshBookings.disabled = false;
        }
    }

    // Search and filter events
    searchInput.addEventListener("input", filterSpaces);
    typeFilter.addEventListener("change", filterSpaces);
    availabilityFilter.addEventListener("change", filterSpaces);

    // Open room details from room cards only
    document.querySelectorAll("#spacesGrid .view-button").forEach(function (button) {
        button.addEventListener("click", function () {
            const card = button.closest(".space-card");

            if (!card) {
                return;
            }

            selectedRoomName = button.dataset.room || "";

            modalTitle.textContent = selectedRoomName;
            modalCapacity.textContent =
                (button.dataset.capacity || "0") + " seats";

            if (card.dataset.status === "available") {
                modalAvailability.textContent = "Available now";
                modalAvailability.style.color = "#16875d";
            } else {
                modalAvailability.textContent = "Currently occupied";
                modalAvailability.style.color = "#c94c55";
            }

            roomModal.hidden = false;
            closeModal.focus();
        });
    });

    closeModal.addEventListener("click", closeRoomModal);

    roomModal.addEventListener("click", function (event) {
        if (event.target === roomModal) {
            closeRoomModal();
        }
    });

    // Open booking form
    openBookingButton.addEventListener("click", function () {
        closeRoomModal();

        bookingForm.reset();
        bookingMessage.textContent = "";

        // Prevent selecting a past date
        bookingDate.min = getLocalDate();

        // Select the matching supported room when possible
        const roomOptions = Array.from(bookingRoom.options);

        const matchingOption = roomOptions.find(function (option) {
            return (
                option.value &&
                option.textContent
                    .toLowerCase()
                    .includes(selectedRoomName.toLowerCase())
            );
        });

        bookingRoom.value = matchingOption
            ? matchingOption.value
            : "";

        bookingModal.hidden = false;
        bookingRoom.focus();
    });

    closeBookingModal.addEventListener("click", closeBookingDialog);

    bookingModal.addEventListener("click", function (event) {
        if (event.target === bookingModal) {
            closeBookingDialog();
        }
    });

    // Submit booking to Flask API
    bookingForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        bookingMessage.textContent = "";

        const roomId = Number(bookingRoom.value);
        const date = bookingDate.value;
        const startTime = bookingStartTime.value;
        const endTime = bookingEndTime.value;
        const name = bookedBy.value.trim();

        if (!roomId || !date || !startTime || !endTime || !name) {
            showBookingMessage("Please complete all fields.", false);
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
                    result.error || "Booking failed. Please try again.",
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

            // Refresh the My Bookings list after successful booking
            await loadBookings();
        } catch (error) {
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

    // Refresh bookings manually
    refreshBookings.addEventListener("click", loadBookings);

    // Close open modals with Escape
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            if (!bookingModal.hidden) {
                closeBookingDialog();
            } else if (!roomModal.hidden) {
                closeRoomModal();
            }
        }
    });

    // Initial page setup
    updateStatistics();
    filterSpaces();
    loadBookings();
});
