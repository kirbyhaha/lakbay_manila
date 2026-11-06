document.addEventListener("DOMContentLoaded", () => {

    // BACKEND API
    const API_URL = "backend/api.php";

    // GET PAGE ELEMENTS
    const dashboardSection = document.getElementById("dashboard");
    const placesSection = document.getElementById("places");

    const placesTable = document.getElementById("placesTable");
    const recentPlacesTable = document.getElementById("recentPlacesTable");

    const searchInput = document.getElementById("searchPlaces");
    const categoryFilter = document.getElementById("categoryFilter");

    const modal = document.getElementById("placeModal");
    const placeForm = document.getElementById("placeForm");

    const imageInput = document.getElementById("placeImage");
    const imagePreview = document.getElementById("imagePreview");

    const toast = document.getElementById("toast");

    // STORE DATABASE RECORDS
    let places = [];

    // CURRENT IMAGE PREVIEW
    let currentImage = "";

    // FORMAT CATEGORY
    function formatCategory(category) {
        const categories = {
            historical: "Historical",
            museum: "Museum",
            church: "Church",
            park: "Park",
            food: "Food"
        };

        return categories[category] || category;
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

    // SHOW NOTIFICATION
    let toastTimer;

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }

    // SEND REQUEST TO PHP
    async function apiRequest(url, options = {}) {
        const response = await fetch(url, options);

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(data?.message || "Server request failed.");
        }

        return data;
    }

    // LOAD PLACES FROM MYSQL
    async function loadPlaces() {
        try {
            places = await apiRequest(API_URL);

            if (!Array.isArray(places)) {
                throw new Error("Invalid data received from the server.");
            }

            displayPlaces();

        } catch (error) {
            showToast(error.message);
        }
    }

    // UPDATE DASHBOARD STATISTICS
    function updateStatistics() {
        document.getElementById("totalPlaces").textContent = places.length;

        document.getElementById("historicalCount").textContent =
            places.filter(place => place.category === "historical").length;

        document.getElementById("museumCount").textContent =
            places.filter(place => place.category === "museum").length;

        document.getElementById("churchCount").textContent =
            places.filter(place => place.category === "church").length;

        document.getElementById("parkCount").textContent =
            places.filter(place => place.category === "park").length;

        document.getElementById("foodCount").textContent =
            places.filter(place => place.category === "food").length;
    }

    // CREATE PLACE TABLE ROW
    function createPlaceRow(place) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="place-cell">
                    <img
                        src="${escapeHTML(place.image || "")}"
                        alt="${escapeHTML(place.name)}"
                    >

                    <div>
                        <strong>${escapeHTML(place.name)}</strong>
                        <small>ID: ${escapeHTML(place.id)}</small>
                    </div>
                </div>
            </td>

            <td>
                <span class="category-badge">
                    ${escapeHTML(formatCategory(place.category))}
                </span>
            </td>

            <td>${escapeHTML(place.location)}</td>

            <td>${escapeHTML(place.map)}</td>

            <td>
                <div class="action-buttons">
                    <button
                        class="edit-btn"
                        data-action="edit"
                        data-id="${place.id}"
                        type="button"
                    >Edit</button>

                    <button
                        class="delete-btn"
                        data-action="delete"
                        data-id="${place.id}"
                        type="button"
                    >Delete</button>
                </div>
            </td>
        `;

        return row;
    }

    // DISPLAY PLACES
    function displayPlaces() {
        const searchText = searchInput.value.toLowerCase().trim();
        const selectedCategory = categoryFilter.value;

        const filteredPlaces = places.filter(place => {
            const searchableText = (
                place.name + " " + place.location
            ).toLowerCase();

            const matchesSearch = searchableText.includes(searchText);

            const matchesCategory =
                selectedCategory === "all" ||
                place.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        placesTable.innerHTML = "";

        filteredPlaces.forEach(place => {
            placesTable.appendChild(createPlaceRow(place));
        });

        document.getElementById("placesEmpty").hidden =
            filteredPlaces.length > 0;

        updateStatistics();
        displayRecentPlaces();
    }

    // DISPLAY RECENT PLACES
    function displayRecentPlaces() {
        recentPlacesTable.innerHTML = "";

        const recentPlaces = [...places]
            .sort((a, b) => Number(b.id) - Number(a.id))
            .slice(0, 5);

        recentPlaces.forEach(place => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="place-cell">
                        <img
                            src="${escapeHTML(place.image || "")}"
                            alt="${escapeHTML(place.name)}"
                        >
                        <strong>${escapeHTML(place.name)}</strong>
                    </div>
                </td>

                <td>
                    <span class="category-badge">
                        ${escapeHTML(formatCategory(place.category))}
                    </span>
                </td>

                <td>${escapeHTML(place.location)}</td>

                <td>
                    <button
                        class="edit-btn"
                        data-action="edit"
                        data-id="${place.id}"
                        type="button"
                    >Edit</button>
                </td>
            `;

            recentPlacesTable.appendChild(row);
        });

        document.getElementById("recentEmpty").hidden =
            recentPlaces.length > 0;
    }

    // OPEN ADD OR EDIT MODAL
    function openModal(place = null) {
        placeForm.reset();

        currentImage = "";
        imagePreview.src = "";
        imagePreview.hidden = true;

        if (place) {
            document.getElementById("modalTitle").textContent =
                "Edit Place Details";

            document.getElementById("placeId").value = place.id;
            document.getElementById("placeName").value = place.name;
            document.getElementById("placeCategory").value = place.category;
            document.getElementById("placeLocation").value = place.location;
            document.getElementById("placeMap").value = place.map;
            document.getElementById("placeDetails").value = place.details;

            currentImage = place.image || "";

            if (currentImage) {
                imagePreview.src = currentImage;
                imagePreview.hidden = false;
            }

        } else {
            document.getElementById("modalTitle").textContent =
                "Add New Place";

            document.getElementById("placeId").value = "";
        }

        modal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    // CLOSE MODAL
    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = "";
        placeForm.reset();

        currentImage = "";
        imagePreview.src = "";
        imagePreview.hidden = true;
    }

    // ADD PLACE BUTTONS
    document.getElementById("addPlaceBtn").addEventListener("click", () => {
        openModal();
    });

    document.getElementById("addPlaceBtn2").addEventListener("click", () => {
        openModal();
    });

    // CLOSE BUTTONS
    document.getElementById("closeModalBtn").addEventListener("click", closeModal);
    document.getElementById("cancelBtn").addEventListener("click", closeModal);

    // CLOSE MODAL WHEN CLICKING OUTSIDE
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // CLOSE MODAL USING ESCAPE
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    // IMAGE PREVIEW
    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("Please select an image.");
            imageInput.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("Image must not exceed 5 MB.");
            imageInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = event => {
            imagePreview.src = event.target.result;
            imagePreview.hidden = false;
        };

        reader.readAsDataURL(file);
    });

    // ADD OR UPDATE PLACE
    placeForm.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData();

        formData.append(
            "id",
            document.getElementById("placeId").value
        );

        formData.append(
            "name",
            document.getElementById("placeName").value.trim()
        );

        formData.append(
            "category",
            document.getElementById("placeCategory").value
        );

        formData.append(
            "location",
            document.getElementById("placeLocation").value.trim()
        );

        formData.append(
            "map",
            document.getElementById("placeMap").value.trim()
        );

        formData.append(
            "details",
            document.getElementById("placeDetails").value.trim()
        );

        // ADD NEW IMAGE ONLY WHEN SELECTED
        if (imageInput.files[0]) {
            formData.append("image", imageInput.files[0]);
        }

        const saveButton = placeForm.querySelector(
            'button[type="submit"]'
        );

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            const result = await apiRequest(API_URL, {
                method: "POST",
                body: formData
            });

            closeModal();
            await loadPlaces();
            showToast(result.message);

        } catch (error) {
            showToast(error.message);

        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Place";
        }
    });

    // EDIT AND DELETE ACTIONS
    document.addEventListener("click", async event => {
        const button = event.target.closest("[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        const place = places.find(item => String(item.id) === String(id));

        if (!place) return;

        // EDIT PLACE
        if (action === "edit") {
            openModal(place);
        }

        // DELETE PLACE
        if (action === "delete") {
            const confirmed = confirm(
                `Are you sure you want to delete "${place.name}"?`
            );

            if (!confirmed) return;

            button.disabled = true;

            try {
                const result = await apiRequest(API_URL, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ id: Number(id) })
                });

                await loadPlaces();
                showToast(result.message);

            } catch (error) {
                showToast(error.message);
                button.disabled = false;
            }
        }
    });

    // SEARCH AND CATEGORY FILTER
    searchInput.addEventListener("input", displayPlaces);
    categoryFilter.addEventListener("change", displayPlaces);

    // NAVIGATION
    document.querySelectorAll(".nav-link[data-section]").forEach(link => {

        link.addEventListener("click", event => {
            event.preventDefault();

            const section = link.dataset.section;

            dashboardSection.hidden = section !== "dashboard";
            placesSection.hidden = section !== "places";

            document.querySelectorAll(".nav-link[data-section]").forEach(item => {
                item.classList.toggle("active", item === link);
            });

            window.location.hash = section;
        });

    });

    // VIEW ALL PLACES
    document.getElementById("viewAllBtn").addEventListener("click", () => {
        document.querySelector('[data-section="places"]').click();
    });

    // CURRENT YEAR
    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

    // OPEN CORRECT SECTION FROM URL
    if (window.location.hash === "#places") {
        document.querySelector('[data-section="places"]').click();
    }

    // LOAD DATABASE RECORDS
    loadPlaces();

});
