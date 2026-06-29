const API = window.location.port === "8000" ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:8000`;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") {
        toggleAuthMode("register");
    }

    // Attach strength checks
    const regPass = document.getElementById("registerPassword");
    if (regPass) {
        regPass.addEventListener("input", () => {
            evaluatePasswordStrength(regPass.value, "registerPasswordStrengthDisplay");
        });
    }

    const resetPass = document.getElementById("resetPassword");
    if (resetPass) {
        resetPass.addEventListener("input", () => {
            evaluatePasswordStrength(resetPass.value, "resetPasswordStrengthDisplay");
        });
    }
});

function toggleAuthMode(mode) {
    const loginCard = document.getElementById("loginCard");
    const registerCard = document.getElementById("registerCard");
    const forgotCard = document.getElementById("forgotCard");
    const resetCard = document.getElementById("resetCard");

    // Hide all
    loginCard.classList.add("hidden");
    registerCard.classList.add("hidden");
    forgotCard.classList.add("hidden");
    resetCard.classList.add("hidden");

    // Show appropriate card
    if (mode === "register") {
        registerCard.classList.remove("hidden");
    } else if (mode === "forgot") {
        forgotCard.classList.remove("hidden");
    } else if (mode === "reset") {
        resetCard.classList.remove("hidden");
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

function evaluatePasswordStrength(password, displayId) {
    const display = document.getElementById(displayId);
    if (!display) return;

    if (!password) {
        display.innerHTML = "";
        return;
    }

    let score = 0;
    const feedback = [];

    if (password.length >= 8) {
        score++;
    } else {
        feedback.push("Min 8 chars");
    }

    if (/[a-z]/.test(password)) {
        score++;
    } else {
        feedback.push("lowercase");
    }

    if (/[A-Z]/.test(password)) {
        score++;
    } else {
        feedback.push("UPPERCASE");
    }

    if (/\d/.test(password)) {
        score++;
    } else {
        feedback.push("digit");
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score++;
    } else {
        feedback.push("special char");
    }

    if (score === 5) {
        display.style.color = "var(--success, #10b981)";
        display.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Strong Password`;
    } else if (score >= 3) {
        display.style.color = "var(--warning, #f59e0b)";
        display.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Medium Strength. Missing: ${feedback.join(", ")}`;
    } else {
        display.style.color = "var(--danger, #ef4444)";
        display.innerHTML = `<i class="fa-solid fa-xmark"></i> Weak Password. Missing: ${feedback.join(", ")}`;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("loginRememberMe").checked;

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
            body: JSON.stringify({ email, password, remember_me: rememberMe })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.detail || "Authentication failed", "error");
            return;
        }

        showToast("Login successful! Redirecting...", "success");
        
        // Save session details based on Remember Me selection
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("refresh_token", data.refresh_token);
        storage.setItem("user", data.user);
        storage.setItem("email", email);

        // Mirror in localStorage if needed for convenience, but clean on session
        if (!rememberMe) {
            // Ensure any old local persistent state is cleared
            localStorage.removeItem("token");
            localStorage.removeItem("refresh_token");
        }

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
        
        document.getElementById("registerForm").reset();
        document.getElementById("registerPasswordStrengthDisplay").innerHTML = "";

        setTimeout(() => {
            toggleAuthMode("login");
            document.getElementById("loginEmail").value = email;
        }, 1500);

    } catch (err) {
        console.error("Registration Error:", err);
        showToast("Could not connect to authentication server", "error");
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    
    showToast("Processing request...", "info");
    
    try {
        const response = await fetch(`${API}/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.detail || "Forgot password request failed", "error");
            return;
        }

        showToast(`Verification code sent! Code: ${data.reset_token}`, "success");
        
        // Open the reset page and pre-fill details for a premium UI flow
        setTimeout(() => {
            toggleAuthMode("reset");
            document.getElementById("resetEmail").value = email;
            document.getElementById("resetCode").value = data.reset_token;
        }, 2000);

    } catch (err) {
        console.error("Forgot Password Error:", err);
        showToast("Could not connect to server", "error");
    }
}

async function handleResetPassword(event) {
    event.preventDefault();
    const email = document.getElementById("resetEmail").value.trim();
    const token = document.getElementById("resetCode").value.trim();
    const newPassword = document.getElementById("resetPassword").value;

    if (!email || !token || !newPassword) {
        showToast("Please fill in all fields", "error");
        return;
    }

    try {
        const response = await fetch(`${API}/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, token, new_password: newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.detail || "Failed to reset password", "error");
            return;
        }

        showToast("Password updated successfully! Redirecting to sign in...", "success");
        document.getElementById("resetForm").reset();
        document.getElementById("resetPasswordStrengthDisplay").innerHTML = "";

        setTimeout(() => {
            toggleAuthMode("login");
            document.getElementById("loginEmail").value = email;
        }, 1500);

    } catch (err) {
        console.error("Reset Password Error:", err);
        showToast("Could not connect to server", "error");
    }
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