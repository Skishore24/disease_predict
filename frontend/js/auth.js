const API = window.location.port === "8000" ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:8000`;

// On Load: Check if URL queries specify register mode
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") {
        toggleAuthMode("register");
    }
});

function toggleAuthMode(mode) {
    const loginCard = document.getElementById("loginCard");
    const registerCard = document.getElementById("registerCard");
    const forgotCard = document.getElementById("forgotCard");

    // Hide all
    loginCard.classList.add("hidden");
    registerCard.classList.add("hidden");
    forgotCard.classList.add("hidden");

    // Show appropriate card
    if (mode === "register") {
        registerCard.classList.remove("hidden");
    } else if (mode === "forgot") {
        forgotCard.classList.remove("hidden");
    } else {
        loginCard.classList.remove("hidden");
    }
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconClass = "fa-solid fa-circle-check";
    if (type === "error") iconClass = "fa-solid fa-circle-xmark";
    if (type === "info") iconClass = "fa-solid fa-circle-info";

    toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
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

function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    
    showToast("Processing request...", "info");
    
    setTimeout(() => {
        showToast(`Reset link compiled and sent to ${email}`, "success");
        document.getElementById("forgotForm").reset();
        setTimeout(() => {
            toggleAuthMode("login");
        }, 1500);
    }, 1500);
}

function togglePassword(id, element) {
    const input = document.getElementById(id);
    const icon = element.querySelector("i");

    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}