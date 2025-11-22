let hoverSpeechEnabled = false;

async function refreshNav() {
    const signedInLinks = document.querySelectorAll(".nav-signed-in");
    const signedOutLinks = document.querySelectorAll(".nav-signed-out");

    try {
        const response = await fetch("/api/user", {credentials: "include"});
        const data = await response.json();
        if (!response.ok || !data.authenticated) throw new Error("Not Logged In");

        signedInLinks.forEach(element => element.style.display = "inline-flex");
        signedOutLinks.forEach(element => element.style.display = "none");

    } catch (error){
        console.warn("Nav Authentication Check Failed")
        signedInLinks.forEach(element => element.style.display = "none");
        signedOutLinks.forEach(element => element.style.display = "inline-flex");
    }
}

function setupProfileIconGuard() {
    const profileLink = document.getElementById("nav-profile");
    if (!profileLink) return;

    profileLink.addEventListener("click", async (e) => {
        
        e.preventDefault();
        try {
            const response = await fetch("/api/user", {credentials: "include"});
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    window.location.href = "profile.html";
                    return;
                }
            }
        } catch (error) {
            console.error("Error Checking Authentation:", error);
        }
        window.location.href = "login.html";
    });
}

function setupHoverSpeech() {
    if (!("speechSynthesis" in window)) {
        console.warn("Speech Synthesis is not Supported in this Browser");
        return;
    }

    const toggle = document.getElementById("screenreader-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
        hoverSpeechEnabled = !hoverSpeechEnabled;

        if (hoverSpeechEnabled) {
            const msg = new SpeechSynthesisUtterance(
                "Screen Reader Enabled"
            );
            speechSynthesis.cancel();
            speechSynthesis.speak(msg);
        } else {
            speechSynthesis.cancel();
        }
    });

    document.addEventListener("mouseover", (e) => {
        if (!hoverSpeechEnabled) return;

        if (e.target.closest("[data-no-speek")) return;

        const text = (e.target.innerText || "").trim();
        if (!text) return;

        const msg = new SpeechSynthesisUtterance(text);
        speechSynthesis.cancel();
        speechSynthesis.speak(msg);
});
}

document.addEventListener("DOMContentLoaded", () => {
    refreshNav();
    setupProfileIconGuard();
    setupHoverSpeech();
});
