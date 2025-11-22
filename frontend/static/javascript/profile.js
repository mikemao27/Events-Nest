document.addEventListener("DOMContentLoaded", () => {
    loadProfileDegreeCheckboxes();
    loadFollowedOrganizations();
    loadFollowedEvents();
    setupSaveDegreesButton();
    setupLogoutButton();
});

async function loadProfileDegreeCheckboxes() {
    const container = document.getElementById("profile-degrees-container");
    if (!container) return;

    try {
        const resFields = await fetch("/api/academic-fields", { credentials: "include" });
        const fields = await resFields.json();

        const resUser = await fetch("/api/user/degrees", { credentials: "include" });
        if (resUser.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const dataUser = await resUser.json();
        const current = new Set((dataUser.degrees || []).map(degree => degree.id));

        container.innerHTML = "";
        fields.forEach(field => {
            const wrapper = document.createElement("label");
            wrapper.style.display = "block";
            wrapper.style.marginBottom = "4px";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.value = field.id;
            cb.name = "profile_degree";
            if (current.has(field.id)) cb.checked = true;

            wrapper.appendChild(cb);
            wrapper.appendChild(document.createTextNode(" " + (field.name || field.degree_name)));
            container.appendChild(wrapper);
        });
    } catch (error) {
        console.error("Error Loading Profile Degrees", error);
        container.textContent = "Error Loading Academic Fields";
    }
}

function setupSaveDegreesButton() {
    const button = document.getElementById("save-degrees-button");
    if (!button) return;
    button.addEventListener("click", saveProfileDegrees);
}

async function saveProfileDegrees() {
    const statusEl = document.getElementById("degrees-status");
    const checkboxes = document.querySelectorAll(
        '#profile-degrees-container input[type="checkbox"]:checked'
    );
    const degree_ids = Array.from(checkboxes).map(cb => Number(cb.value));

    try {
        const response = await fetch("/api/user/degrees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ degree_ids }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.ok === false) {
            statusEl.textContent = data.error || "Error Saving Preferences";
            statusEl.style.color = "red";
            return;
        }

        statusEl.textContent = "Preferences Saved";
        statusEl.style.color = "green";
    } catch (error) {
        console.error("Error Saving Profile Degrees:", error);
        statusEl.textContent = "Network Error";
        statusEl.style.color = "red";
    }
}

async function loadFollowedOrganizations() {
    const container = document.getElementById("followed-organizations-list");
    if (!container) return;

    try {
        const response = await fetch("/api/organizations/followed", { credentials: "include" });

        if (response.status === 401) {
            container.textContent = "Log In to See Followed Organizations";
            return;
        }

        const data = await response.json();
        const organizations = data.organizations || data || [];

        container.innerHTML = "";

        if (organizations.length === 0) {
            container.textContent = "You're Not Following Any Organizations";
            return;
        }

        organizations.forEach(org => {
            const div = document.createElement("div");
            div.style.marginBottom = "8px";
            div.innerHTML = `
                <strong>${org.title}</strong><br>
                <span style="font-size: 13px; color: #555;">
                    ${org.organization_description || ""}
                </span>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error Loading Followed Organizations: ", error);
        container.textContent = "Failed to Load Followed Organizations";
    }
}

async function loadFollowedEvents() {
    const container = document.getElementById("followed-events-list");
    if (!container) return;

    try {
        const response = await fetch("/api/events/followed", { credentials: "include" });

        if (response.status === 401) {
            container.textContent = "Log In to See Events From Your Organizations";
            return;
        }

        const data = await response.json();
        const events = data.events || data || [];

        container.innerHTML = "";

        if (events.length === 0) {
            container.textContent = "No Upcoming Events From Your Organizations";
            return;
        }

        events.forEach(event => {
            const start = event.start_time
                ? new Date(event.start_time).toLocaleString()
                : "Time TBD";
            const location = event.event_location || "Location TBD";
            const organization_name = event.organization_name || "";

            const card = document.createElement("div");
            card.className = "card";
            card.style.marginBottom = "10px";

            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="card-title">${event.title}</div>
                        <div class="card-meta">${start} - ${location}</div>
                        ${
                            organization_name
                                ? `<div class="card-meta">Hosted By ${organization_name}</div>`
                                : ""
                        }
                    </div>
                    <div class="card-meta">${event.source || ""}</div>
                </div>
                <div class="card-body">
                    ${event.event_description || ""}
                    ${
                        event.source_url
                            ? `<div style="margin-top: 8px;">
                                    <a class="button" href="${event.source_url}" target="_blank" rel="noopener">
                                        View on Source Site
                                    </a>
                               </div>`
                            : ""
                    }
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error Loading Followed Events: ", error);
        container.textContent = "Failed to Load Events.";
    }
}

function setupLogoutButton() {
    const button = document.getElementById("logout-button");
    if (!button) return;
    button.addEventListener("click", async () => {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        window.location.href = "index.html";
    });
}
