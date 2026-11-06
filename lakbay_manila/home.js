// LAKBAY MANILA HOMEPAGE JAVASCRIPT

document.addEventListener("DOMContentLoaded", () => {

    // UPDATE FOOTER YEAR IF THE YEAR ELEMENT EXISTS
    const footerYear = document.getElementById("year");

    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    // HOMEPAGE CATEGORY LINKS
    const categoryCards = document.querySelectorAll(".category-card");

    categoryCards.forEach(card => {
        card.addEventListener("click", () => {
            const categoryName = card.querySelector("h3");

            if (!categoryName) return;

            console.log("Selected category:", categoryName.textContent);
        });
    });

    // FAMOUS PLACE LINKS OPEN THE EXPLORE PAGE
    const placeCards = document.querySelectorAll(".place-card");

    placeCards.forEach(card => {
        card.addEventListener("click", () => {
            console.log("Opening:", card.querySelector("h3")?.textContent);
        });
    });

});
