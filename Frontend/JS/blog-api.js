const API_BASE = `${CONFIG.API_BASE}/blog`;

document.addEventListener("DOMContentLoaded", () => {
    const blogContainer = document.getElementById("blogContainer");
    const postTitle = document.getElementById("postTitle");

    if (blogContainer) {
        loadBlogList();
    } else if (postTitle) {
        loadPostDetail();
    }
});

// 1. Fetch and display all posts
async function loadBlogList() {
    try {
        const response = await fetch(`${API_BASE}/posts/`);
        const posts = await response.json();
        const container = document.getElementById("blogContainer");

        container.innerHTML = posts.map(post => `
            <div class="blog-card">
                <img src="${post.image}" alt="${post.title}">
                <div class="blog-card-content">
                    <span class="blog-category">${post.category}</span>
                    <h3>${post.title}</h3>
                    <p>${post.content.substring(0, 100)}...</p>
                    <a href="blog-post.html?id=${post.id}" class="read-more">Read More →</a>
                </div>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById("blogContainer").innerHTML = "<p>Failed to load blogs.</p>";
    }
}

// 2. Fetch and display a single post based on URL ID
async function loadPostDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/`);
        const post = await response.json();

        document.getElementById("postTitle").innerText = post.title;
        document.getElementById("postMeta").innerText = `In ${post.category} · ${new Date(post.created_at).toLocaleDateString()}`;
        document.getElementById("postBody").innerHTML = post.content.replace(/\n/g, '<br>');
        
        const img = document.getElementById("postImage");
        img.src = post.image;
        img.style.display = "block";
    } catch (err) {
        document.getElementById("postTitle").innerText = "Post Not Found";
    }
}