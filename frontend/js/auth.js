const API = "http://127.0.0.1:8000";

function toggleAuthMode(mode) {
    const loginCard = document.getElementById("loginCard");
    const registerCard = document.getElementById("registerCard");

    if (mode === "register") {
        loginCard.classList.add("hidden");
        registerCard.classList.remove("hidden");
    } else {
        registerCard.classList.add("hidden");
        loginCard.classList.remove("hidden");
    }
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    // Add appropriate status text or styling helper
    let prefix = "✓";
    if (type === "error") prefix = "✕";
    if (type === "info") prefix = "ℹ";

    toast.innerHTML = `<span><strong>${prefix}</strong> ${message}</span>`;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    // Remove toast after 4 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        showToast("Please fill in all fields", "error");
        return;
    }

    try {
        const response = await fetch(`${API}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.detail || "Authentication failed", "error");
            return;
        }

        showToast("Login successful! Redirecting...", "success");
        
        // Save auth data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", data.user);
        localStorage.setItem("email", email);

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1200);

    } catch (err) {
        console.error("Login Error:", err);
        showToast("Could not connect to authentication server", "error");
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    if (!name || !email || !password) {
        showToast("Please fill in all fields", "error");
        return;
    }

    try {
        const response = await fetch(`${API}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.detail || "Registration failed", "error");
            return;
        }

        showToast("Registration successful! Please login.", "success");
        
        // Clear register inputs
        document.getElementById("registerForm").reset();

        // Switch to login view
        setTimeout(() => {
            toggleAuthMode("login");
            document.getElementById("loginEmail").value = email;
        }, 1500);

    } catch (err) {
        console.error("Registration Error:", err);
        showToast("Could not connect to authentication server", "error");
    }
}
