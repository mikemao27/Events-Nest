let allEvents = [];
let displayLimit = 10;

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("events-container");
    const fieldSelect = document.getElementById("event-field-filter");
    const freeFoodToggle = document.getElementById("free-food-toggle");
    const loadMoreBtn = document.getElementById("load-more-events");

    if (!container || !fieldSelect || !freeFoodToggle) return;

    function extractFieldName(obj) {
        if (!obj || typeof obj !== "object") return null;

        if (obj.degree_name) return obj.degree_name;
        if (obj.name) return obj.name;

        for (const [k, v] of Object.entries(obj)) {
            const key = k.toLowerCase();
            if ((key.includes("degree") || key.includes("field")) && typeof v === "string") {
                return v;
            }
        }

        for (const v of Object.values(obj)) {
            if (typeof v === "string") return v;
        }

        return null;
    }

    async function loadAcademicFields() {
        try {
            const res = await fetch("/api/academic-fields", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load academic fields");
            const fields = await res.json();

            while (fieldSelect.options.length > 1) {
                fieldSelect.remove(1);
            }

            const names = new Set();
            fields.forEach(f => {
                const name = extractFieldName(f);
                if (name) names.add(name);
            });

            Array.from(names)
                .sort()
                .forEach(name => {
                    const option = document.createElement("option");
                    option.value = name;
                    option.textContent = name;
                    fieldSelect.appendChild(option);
                });
        } catch (err) {
            console.error("Error loading academic fields for events filter:", err);
        }
    }

    async function loadEvents() {
        container.textContent = "Loading Events...";
        try {
            const response = await fetch("/api/events", { credentials: "include" });
            if (!response.ok) throw new Error("Network Response Error");
            allEvents = await response.json();
            renderFiltered();
        } catch (error) {
            console.error(error);
            container.textContent = "Failed to Load Events";
            if (loadMoreBtn) loadMoreBtn.style.display = "none";
        }
    }

    function parseEventDate(iso) {
        if (!iso) return { month: "TBA", day: "--", full: null };
        const date = new Date(iso);
        const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
        return {
            month: monthNames[date.getMonth()],
            day: String(date.getDate()).padStart(2, "0"),
            full: date.toLocaleString()
        };
    }

    function renderEventCard(event) {
        const card = document.createElement("div");
        card.className = "event-card";

        const date = parseEventDate(event.start_time);
        const dateDiv = document.createElement("div");
        dateDiv.className = "event-date";
        dateDiv.innerHTML = `
            <div class="event-month">${date.month}</div>
            <div class="event-day">${date.day}</div>
        `;

        const body = document.createElement("div");
        body.className = "event-body";
        const timeLocation = [
            date.full || "Time TBD",
            event.event_location || "Location TBD"
        ].join(" - ");

        const descriptionText = event.event_description || "";
        const shortDesc = descriptionText.length > 180
            ? descriptionText.slice(0, 177) + "..."
            : descriptionText;

        body.innerHTML = `
            <h2 class="event-title">${event.title}</h2>
            <div class="event-meta">${timeLocation}</div>
            ${event.organization_name
                ? `<div class="event-meta">Hosted by ${event.organization_name}</div>`
                : ""
            }
            <p class="event-description">${shortDesc}</p>
            ${event.source_url
                ? `<a href="${event.source_url}" target="_blank" rel="noopener" class="event-link">
                        View Details
                   </a>`
                : ""
            }
        `;

        card.appendChild(dateDiv);
        card.appendChild(body);
        return card;
    }

    function renderFiltered() {
        const field = fieldSelect.value;
        const freeFoodOnly = freeFoodToggle.checked;

        let events = allEvents.slice();

        if (field) {
            events = events.filter(event => {
                const fieldsStr = event.academic_fields || "";
                const fields = fieldsStr
                    .split(",")
                    .map(s => s.trim())
                    .filter(Boolean);
                return fields.includes(field);
            });
        }

        if (freeFoodOnly) {
            events = events.filter(event =>
                event.free_food === 1 ||
                event.free_food === true ||
                event.free_food === "1"
            );
        }

        if (events.length === 0) {
            container.innerHTML = "No Events Match This Filter";
            if (loadMoreBtn) loadMoreBtn.style.display = "none";
            return;
        }

        const recommended = events.filter(
            event => event.followed === 1 || event.followed === true
        );
        const recommendedSet = new Set(recommended.map(e => e.id));
        const others = events.filter(event => !recommendedSet.has(event.id));

        const ordered = recommended.concat(others);
        const visible = ordered.slice(0, displayLimit);

        container.innerHTML = "";

        const visibleRecommended = visible.filter(e => recommendedSet.has(e.id));
        const visibleOthers = visible.filter(e => !recommendedSet.has(e.id));

        if (visibleRecommended.length > 0) {
            const h2 = document.createElement("h2");
            h2.textContent = "Recommended For You";
            container.appendChild(h2);
            visibleRecommended.forEach(event =>
                container.appendChild(renderEventCard(event))
            );
        }

        if (visibleOthers.length > 0) {
            const h2all = document.createElement("h2");
            h2all.textContent = visibleRecommended.length ? "All Events" : "Events";
            container.appendChild(h2all);
            visibleOthers.forEach(event =>
                container.appendChild(renderEventCard(event))
            );
        }

        if (loadMoreBtn) {
            if (visible.length < events.length) {
                loadMoreBtn.style.display = "inline-block";
            } else {
                loadMoreBtn.style.display = "none";
            }
        }
    }

    fieldSelect.addEventListener("change", () => {
        displayLimit = 10;
        renderFiltered();
    });

    freeFoodToggle.addEventListener("change", () => {
        displayLimit = 10;
        renderFiltered();
    });

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            displayLimit += 10;
            renderFiltered();
        });
    }

    loadAcademicFields();
    loadEvents();
});