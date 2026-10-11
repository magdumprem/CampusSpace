// ========================================
// CampusSpace - Frontend Interactions
// ========================================

// ========================================
// CampusSpace - Flask API Integration
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // Get HTML elements
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

    let rooms = [];

    // Choose a card style based on room type
    function getRoomStyle(type) {
        const normalizedType = type.toLowerCase();

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
            label: type.toUpperCase()
        };
    }

    // Create a room card using backend data
    function createRoomCard(room) {
        const isAvailable = room.status.toLowerCase() === "available";
        const statusClass = isAvailable ? "available" : "occupied";
        const statusText = isAvailable ? "Available" : "Occupied";
        const style = getRoomStyle(room.type);

        const card = document.createElement("article");
        card.className = "space-card";

        card.dataset.name = room.name.toLowerCase();
        card.dataset.type = room.type;
        card.dataset.status = room.status.toLowerCase();

        const visual = document.createElement("div");
        visual.className = `space-visual ${style.visual}`;

        const icon = document.createElement("span");
        icon.className = "visual-icon";
        icon.textContent = style.icon;

        const badge = document.createElement("span");
        badge.className = `availability ${statusClass}`;

        const badgeDot = document.createElement("span");
        badge.appendChild(badgeDot);
        badge.appendChild(document.createTextNode(` ${statusText}`));

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
        statusValue.className = isAvailable
            ? "text-available"
            : "text-occupied";
        statusValue.textContent = isAvailable
            ? "Available now"
            : "Currently occupied";

        statusRow.append(statusLabel, statusValue);

        const button = document.createElement("button");
        button.className = "view-button";
        button.dataset.roomId = room.id;
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

    // Display rooms received from Flask
    function renderRooms() {
        spacesGrid.replaceChildren();

        rooms.forEach(function (room) {
            spacesGrid.appendChild(createRoomCard(room));
        });

        updateStatistics();
        filterSpaces();
    }

    // Update dashboard statistics
    function updateStatistics() {
        const availableCount = rooms.filter(function (room) {
            return room.status.toLowerCase() === "available";
        }).length;

        const capacityCount = rooms.reduce(function (total, room) {
            return total + Number(room.capacity || 0);
        }, 0);

        totalSpaces.textContent = rooms.length;
        availableSpaces.textContent = availableCount;
        totalCapacity.textContent = capacityCount;
    }

    // Search and filter rooms
    function filterSpaces() {
        const searchText = searchInput.value.trim().toLowerCase();
        const selectedType = typeFilter.value;
        const selectedAvailability = availabilityFilter.value;

        const cards = spacesGrid.querySelectorAll(".space-card");
        let visibleCount = 0;

        cards.forEach(function (card) {
            const roomName = card.dataset.name;
            const roomType = card.dataset.type.toLowerCase();
            const roomStatus = card.dataset.status;

            const matchesSearch = roomName.includes(searchText);

            let matchesType = selectedType === "all";

            if (selectedType !== "all") {
                const selected = selectedType.toLowerCase();

                if (selected === "laboratory") {
                    matchesType = roomType.includes("lab");
                } else {
                    matchesType = roomType === selected;
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

    // Open the room details modal
    function openRoomDetails(room) {
        modalTitle.textContent = room.name;
        modalCapacity.textContent = `${room.capacity} seats`;

        const isAvailable = room.status.toLowerCase() === "available";

        modalAvailability.textContent = isAvailable
            ? "Available now"
            : "Currently occupied";

        modalAvailability.style.color = isAvailable
            ? "#16875d"
            : "#c94c55";

        roomModal.hidden = false;
        closeModal.focus();
    }

    // Close modal using the close button
    closeModal.addEventListener("click", function () {
        roomModal.hidden = true;
    });

    // Close modal by clicking the backdrop
    roomModal.addEventListener("click", function (event) {
        if (event.target === roomModal) {
            roomModal.hidden = true;
        }
    });

    // Close modal using Escape
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !roomModal.hidden) {
            roomModal.hidden = true;
        }
    });

    // Search and filter listeners
    searchInput.addEventListener("input", filterSpaces);
    typeFilter.addEventListener("change", filterSpaces);
    availabilityFilter.addEventListener("change", filterSpaces);

    // Fetch room data from Flask
    async function loadRooms() {
        try {
            resultsCount.textContent = "Loading spaces...";

            const response = await fetch("/api/rooms");

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data.rooms)) {
                throw new Error("The API response does not contain a rooms array.");
            }

            rooms = data.rooms;
            renderRooms();

        } catch (error) {
            console.error("Could not load rooms:", error);

            resultsCount.textContent = "Unable to load spaces";
            spacesGrid.hidden = true;
            emptyState.hidden = false;
        }
    }

    // Initialize the dashboard
    loadRooms();

});