const API_BASE = `${CONFIG.API_BASE}/dashboard`;
const token = localStorage.getItem("access_token");
const topicsList = document.getElementById("topicsList");

if (!token) {
    window.location.href = "login.html";
}

fetch(`${API_BASE}/skills/`, {
    headers: {
        "Authorization": `Bearer ${token}`
    }
})
.then(res => {
    if (!res.ok) throw new Error("Failed to load skills");
    return res.json();
})
.then(renderSkills)
.catch(err => console.error(err));


function renderSkills(skills) {
    const wrapper = document.getElementById("skillsWrapper");
    const emptyState = document.getElementById("emptyState");

    wrapper.innerHTML = "";

    if (!skills.length) {
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    skills.forEach(skill => {
        const card = document.createElement("div");
        card.className = "skill-card";

        card.innerHTML = `
            <h2>${skill.name}</h2>
            <p class="skill-description">${skill.description}</p>

            <div class="progress-bar">
                <div class="progress-fill" style="width:${skill.progress}%"></div>
            </div>

            <div class="topics"></div>
        `;

        const topicsContainer = card.querySelector(".topics");

        skill.topics.forEach(topic => {
            const topicDiv = document.createElement("div");
            topicDiv.className = "topic";

            topicDiv.innerHTML = `
                <input type="checkbox" ${topic.completed ? "checked" : ""} />
                <a href="${topic.resource_url || '#'}" target="_blank">
                    ${topic.title}
                </a>
            `;

            topicDiv.querySelector("input").addEventListener("change", () => {
                toggleTopic(topic.id);
            });

            topicsContainer.appendChild(topicDiv);
        });

        wrapper.appendChild(card);
    });
}

function toggleTopic(topicId) {
    fetch(`${CONFIG.API_BASE}/dashboard/skill-topics/${topicId}/toggle/`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        }
    })
    .then(res => res.json())
    .then(() => loadSkills());
}

function navigateToTopic(topic) {
    switch (topic.content_type) {
        case "lesson":
            window.location.href = `/lessons.html?id=${topic.content_id}`;
            break;

        case "discussion":
            window.location.href = `/discussions.html?id=${topic.content_id}`;
            break;

        case "resource":
            window.location.href = `/resources.html?id=${topic.content_id}`;
            break;

        case "project":
            window.location.href = `/projects.html?id=${topic.content_id}`;
            break;

        default:
            console.error("Unknown content type:", topic.content_type);
    }
}

fetch(`${CONFIG.API_BASE}/dashboard/skills-topics/`, {
    headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
    }
})
.then(res => res.json())
.then(topics => {
    topicsList.innerHTML = "";

    if (topics.length === 0) {
        topicsList.innerHTML = "<h1>No topics found</h1>";
        return;
    }

    topics.forEach(topic => {
        const li = document.createElement("li");
        li.textContent = topic.title;

        li.addEventListener("click", () => {
            navigateToTopic(topic);
        });

        topicsList.appendChild(li);
    });
})
.catch(err => {
    console.error("Failed to load topics", err);
});
