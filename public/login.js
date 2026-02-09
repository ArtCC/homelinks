const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("login-error");

function setError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

async function checkSession() {
  const response = await fetch("/api/session");
  if (!response.ok) return;
  const data = await response.json();
  if (data.authenticated) {
    window.location.href = "/";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("");

  const payload = {
    email: emailInput.value.trim(),
    password: passwordInput.value,
  };

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    window.location.href = "/";
    return;
  }

  const data = await response.json().catch(() => ({}));
  setError(data.error || "Login failed");
});

checkSession();
