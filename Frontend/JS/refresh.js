fetch(`${CONFIG.API_BASE}/users/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        refresh: localStorage.getItem("refresh_token")
    })
})
.then(res => res.json())
.then(data => {
    localStorage.setItem("access_token", data.access);
});
