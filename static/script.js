// ========================================
// CampusSpace - Frontend Interactions
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // Get HTML elements
    const searchInput = document.getElementById("searchInput");
    const typeFilter = document.getElementById("typeFilter");
    const availabilityFilter = document.getElementById("availabilityFilter");

    const spacesGrid = document.getElementById("spacesGrid");
    const spaceCards = document.querySelectorAll(".space-card");

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

    // Calculate dashboard statistics from the sample cards
    function updateStatistics() {

        let availableCount = 0;
        let capacityCount = 0;

        spaceCards.forEach(function (card) {

            if (card.dataset.status === "available") {
                availableCount++;
            }

            const capacityElement = card.querySelector(
                ".space-details strong"
            );

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

    // Search and filter spaces
    function filterSpaces() {

        const searchText = searchInput.value.trim().toLowerCase();
        const selectedType = typeFilter.value;
        const selectedAvailability = availabilityFilter.value;

        let visibleCount = 0;

        spaceCards.forEach(function (card) {

            const roomName = card.dataset.name.toLowerCase();
            const roomType = card.dataset.type;
            const roomStatus = card.dataset.status;

            const matchesSearch = roomName.includes(searchText);

            const matchesType =
                selectedType === "all" ||
                roomType === selectedType;

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

        // Update the result count
        resultsCount.textContent =
            visibleCount + (visibleCount === 1 ? " space" : " spaces");

        // Show a message when there are no results
        emptyState.hidden = visibleCount !== 0;

        // Hide the card grid when there are no results
        spacesGrid.hidden = visibleCount === 0;
    }

    // Listen for search input changes
    searchInput.addEventListener("input", filterSpaces);

    // Listen for space type changes
    typeFilter.addEventListener("change", filterSpaces);

    // Listen for availability changes
    availabilityFilter.addEventListener("change", filterSpaces);

    // Open the room details modal
    document.querySelectorAll(".view-button").forEach(function (button) {

        button.addEventListener("click", function () {

            const roomName = button.dataset.room;
            const roomCapacity = button.dataset.capacity;

            const card = button.closest(".space-card");
            const roomStatus = card.dataset.status;

            modalTitle.textContent = roomName;
            modalCapacity.textContent = roomCapacity + " seats";

            if (roomStatus === "available") {
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

    // Close the modal using the close button
    closeModal.addEventListener("click", function () {
        roomModal.hidden = true;
    });

    // Close the modal when clicking outside the dialog
    roomModal.addEventListener("click", function (event) {

        if (event.target === roomModal) {
            roomModal.hidden = true;
        }
    });

    // Close the modal using the Escape key
    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" && !roomModal.hidden) {
            roomModal.hidden = true;
        }
    });

    // Initialize the dashboard
    updateStatistics();
    filterSpaces();

});