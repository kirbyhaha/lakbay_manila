document.addEventListener("DOMContentLoaded", () => {

    // BACKEND API
    const API_URL = "backend/api.php";

    // GET PAGE ELEMENTS
    const placesGrid = document.getElementById("placesGrid");
    const searchInput = document.getElementById("placeSearch");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const noResults = document.getElementById("noResults");

    // STORE DATABASE PLACES
    let places = [];

    let activeFilter = "all";

    // FORMAT CATEGORY
    function formatCategory(category) {
        const names = {
            historical: "Historical",
            museum: "Museum",
            church: "Church",
            park: "Park",
            food: "Food"
        };

        return names[category] || category;
    }

    // ESCAPE HTML
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return map[character];
        });
    }

    // SHOW LOADING MESSAGE
    placesGrid.textContent = "Loading places...";

    // LOAD PLACES FROM MYSQL
    async function loadPlaces() {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Unable to load places.");
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("Invalid server response.");
            }

            places = data;

            displayPlaces();
            updateFilterCounts();
            openPlaceFromURL();

        } catch (error) {
            placesGrid.innerHTML = "";

            noResults.hidden = false;
            noResults.textContent =
                "Unable to load places. Please check your database connection.";
        }
    }

    // UPDATE CATEGORY COUNTS
    function updateFilterCounts() {
        filterButtons.forEach(button => {
            const category = button.dataset.filter;

            const count = category === "all"
                ? places.length
                : places.filter(place => place.category === category).length;

            button.textContent =
                `${formatCategory(category) === category ? "All" : formatCategory(category)} (${count})`;

        });
    }

    // DISPLAY PLACE CARDS
    function displayPlaces() {
        placesGrid.innerHTML = "";

        const searchText = searchInput.value.toLowerCase().trim();

        const filteredPlaces = places.filter(place => {

            const searchableText = (
                place.name + " " +
                place.location + " " +
                place.category
            ).toLowerCase();

            const matchesSearch = searchableText.includes(searchText);

            const matchesCategory =
                activeFilter === "all" ||
                place.category === activeFilter;

            return matchesSearch && matchesCategory;
        });

        filteredPlaces.forEach(place => {

            const card = document.createElement("article");
            card.className = "card";
            card.dataset.placeId = place.id;
            card.dataset.category = place.category;

            const image = document.createElement("img");
            image.src = place.image || "";
            image.alt = place.name;
            image.loading = "lazy";

            image.addEventListener("error", () => {
                image.hidden = true;
            });

            const content = document.createElement("div");
            content.className = "card-content";

            const titleRow = document.createElement("div");
            titleRow.className = "card-title-row";

            const title = document.createElement("h2");
            title.textContent = place.name;

            const categoryBadge = document.createElement("span");
            categoryBadge.className = "status";
            categoryBadge.textContent = formatCategory(place.category);

            const location = document.createElement("p");
            location.className = "category";
            location.textContent = place.location;

            const buttons = document.createElement("div");
            buttons.className = "card-buttons";

            const mapButton = document.createElement("button");
            mapButton.type = "button";
            mapButton.className = "map-btn";
            mapButton.textContent = "Maps";

            const detailsButton = document.createElement("button");
            detailsButton.type = "button";
            detailsButton.className = "details-btn";
            detailsButton.textContent = "Details";

            titleRow.append(title, categoryBadge);
            buttons.append(mapButton, detailsButton);
            content.append(titleRow, location, buttons);

            card.append(image, content);

            placesGrid.appendChild(card);
        });

        noResults.hidden = filteredPlaces.length > 0;
    }

    // FILTER BUTTONS
    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            activeFilter = button.dataset.filter;

            filterButtons.forEach(item => {
                item.classList.toggle("active", item === button);
            });

            displayPlaces();

        });

    });

    // SEARCH
    searchInput.addEventListener("input", displayPlaces);

    // OPEN GOOGLE MAPS
    function openGoogleMaps(place) {
        if (!place) return;

        const url =
            "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent(place);

        window.open(url, "_blank", "noopener,noreferrer");
    }

    // SHOW DETAILS POPUP
    function showDetails(place) {
        if (!place) return;

        closePopup();

        const overlay = document.createElement("div");
        overlay.className = "details-overlay";

        const popup = document.createElement("div");
        popup.className = "details-popup";

        const closeButton = document.createElement("button");
        closeButton.className = "close-popup";
        closeButton.type = "button";
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Close details");

        const image = document.createElement("img");
        image.className = "details-image";
        image.src = place.image || "";
        image.alt = place.name;

        const content = document.createElement("div");
        content.className = "details-content";

        const title = document.createElement("h2");
        title.textContent = place.name;

        const description = document.createElement("p");
        description.textContent = place.details;

        const location = document.createElement("p");
        location.textContent = "Location: " + place.location;

        const directionButton = document.createElement("button");
        directionButton.className = "direction-btn";
        directionButton.type = "button";
        directionButton.textContent = "Get Directions";

        directionButton.addEventListener("click", () => {
            openGoogleMaps(place.map);
        });

        content.append(title, description, location, directionButton);
        popup.append(closeButton, image, content);
        overlay.appendChild(popup);

        document.body.appendChild(overlay);

        function closeThisPopup() {
            overlay.remove();
            document.removeEventListener("keydown", handleEscape);
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                closeThisPopup();
            }
        }

        closeButton.addEventListener("click", closeThisPopup);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                closeThisPopup();
            }
        });

        document.addEventListener("keydown", handleEscape);

        closeButton.focus();
    }

    // CLOSE POPUP
    function closePopup() {
        const existing = document.querySelector(".details-overlay");

        if (existing) {
            existing.remove();
        }
    }

    // HANDLE CARD BUTTONS
    placesGrid.addEventListener("click", event => {

        const card = event.target.closest(".card");

        if (!card) return;

        const place = places.find(item =>
            String(item.id) === card.dataset.placeId
        );

        if (!place) return;

        if (event.target.closest(".map-btn")) {
            openGoogleMaps(place.map);
        }

        if (event.target.closest(".details-btn")) {
            showDetails(place);
        }

    });

    // OPEN PLACE FROM HOMEPAGE LINK
    function openPlaceFromURL() {
        const params = new URLSearchParams(window.location.search);

        const category = params.get("category");
        const placeId = params.get("place");

        if (category) {
            const button = Array.from(filterButtons).find(item =>
                item.dataset.filter === category
            );

            if (button) {
                button.click();
            }
        }

        if (placeId) {
            const place = places.find(item => item.slug === placeId);

            if (place) {
                activeFilter = "all";

                filterButtons.forEach(button => {
                    button.classList.toggle(
                        "active",
                        button.dataset.filter === "all"
                    );
                });

                searchInput.value = "";

                displayPlaces();

                const card = placesGrid.querySelector(
                    `[data-place-id="${place.id}"]`
                );

                if (card) {
                    card.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }

                showDetails(place);
            }
        }
    }

    // UPDATE FOOTER YEAR
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // INITIALIZE EXPLORE PAGE
    loadPlaces();

});
