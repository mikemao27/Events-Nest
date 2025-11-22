let orgDisplayLimit = 50;

document.addEventListener("DOMContentLoaded", () => {
    const listEl = document.getElementById("organizations-container");
    const filterEl = document.getElementById("field-filter");
    const searchEl = document.getElementById("org-search");
    const loadMoreBtn = document.getElementById("load-more-orgs");

    if (!listEl || !filterEl) return;

    let allOrganizations = [];

    async function loadOrganizations() {
        listEl.textContent = "Loading Organizations...";
        try {
            const response = await fetch("/api/organizations", { credentials: "include" });
            if (!response.ok) throw new Error("Network Error");
            const organizations = await response.json();

            allOrganizations = organizations;
            populateFieldFilter(organizations);
            applyFilters();
        } catch (err) {
            console.error(err);
            listEl.textContent = "Failed to Load Organizations";
            if (loadMoreBtn) loadMoreBtn.style.display = "none";
        }
    }

    function populateFieldFilter(organizations) {
        const fields = new Set();
        organizations.forEach(organization => {
            if (organization.academic_fields) {
                organization.academic_fields.split(",").forEach(field => {
                    const trimmed = field.trim();
                    if (trimmed) fields.add(trimmed);
                });
            }
        });

        while (filterEl.options.length > 1) {
            filterEl.remove(1);
        }

        Array.from(fields).sort().forEach(field => {
            const option = document.createElement("option");
            option.value = field;
            option.textContent = field;
            filterEl.appendChild(option);
        });
    }

    function applyFilters() {
        const field = filterEl.value;
        const query = (searchEl?.value || "").toLowerCase();

        let orgs = allOrganizations.slice();

        if (field) {
            orgs = orgs.filter(organization => {
                return (organization.academic_fields || "")
                    .split(",")
                    .map(s => s.trim())
                    .includes(field)
            });
        }

        if (query) {
            orgs = orgs.filter(org => {
                const name = (org.title || "").toLowerCase();
                const desc = (org.organization_description || "").toLowerCase();
                return name.includes(query) || desc.includes(query);
            });
        }

        const totalCount = orgs.length;
        const visible = orgs.slice(0, orgDisplayLimit);

        renderOrganizations(visible, totalCount);
    }

    function attachFollowHandlers() {
        const buttons = document.querySelectorAll(".follow-button");
        buttons.forEach(button => {
            button.onclick = async () => {
                const orgId = Number(button.getAttribute("data-organization-id"));
                const orgName = button.getAttribute("data-organization-name");
                const currentlyUnfollow = button.dataset.followed === "true";

                const url = currentlyUnfollow
                    ? "/api/organizations/unfollow"
                    : "/api/organizations/follow";

                try {
                    const response = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            organization_id: orgId,
                            organization_name: orgName
                        }),
                    });

                    const data = await response.json().catch(() => ({}));
                    if (!response.ok || data.ok === false) {
                        alert(data.error || "Failed");
                        return;
                    }

                    button.dataset.followed = (!currentlyUnfollow).toString();
                    button.textContent = currentlyUnfollow ? "Follow" : "Unfollow";
                } catch (error) {
                    console.error(error);
                    alert("Network Error");
                }
            };
        });
    }

    function renderOrganizations(organizations, totalCount) {
        listEl.innerHTML = "";

        if (organizations.length === 0) {
            listEl.textContent = "No Organizations Match These Filters";
            if (loadMoreBtn) loadMoreBtn.style.display = "none";
            return;
        }

        organizations.forEach(organization => {
            const card = document.createElement("div");
            card.className = "card";

            const fields = organization.academic_fields || "Uncategorized";
            const description = (organization.organization_description || "").replace(/\n/g, "<br>");
            const isFollowed = organization.followed === 1 || organization.followed === true;

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${organization.title}</div>
                    <div class="card-meta">${fields}</div>
                </div>
                <div class="card-body">
                    ${description}
                    <div style="margin-top: 8px;">
                        <button
                            class="button follow-button"
                            data-organization-id="${organization.id}"
                            data-organization-name="${organization.title}"
                            data-followed="${isFollowed}"
                        >
                            ${isFollowed ? "Unfollow" : "Follow"}
                        </button>
                    </div>
                </div>
            `;
            listEl.appendChild(card);
        });

        attachFollowHandlers();

        if (loadMoreBtn) {
            if (orgDisplayLimit < totalCount) {
                loadMoreBtn.style.display = "inline-block";
            } else {
                loadMoreBtn.style.display = "none";
            }
        }
    }

    filterEl.addEventListener("change", () => {
        orgDisplayLimit = 10;
        applyFilters();
    });

    if (searchEl) {
        searchEl.addEventListener("input", () => {
            orgDisplayLimit = 10;
            applyFilters();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            orgDisplayLimit += 10;
            applyFilters();
        });
    }

    loadOrganizations();
});
