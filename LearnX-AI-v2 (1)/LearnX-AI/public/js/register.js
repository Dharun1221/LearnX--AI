window.onload = function () {
  const form = document.getElementById("registerForm");
  const errorMsg = document.getElementById("errorMsg");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorMsg.style.display = "none";

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || "Something went wrong. Please try again.";
        errorMsg.style.display = "block";
        return;
      }

      sessionStorage.setItem("userId", data.userId);
      sessionStorage.setItem("userName", data.name);
      window.location.href = "assessment.html";
    } catch (err) {
      errorMsg.textContent = "Could not reach the server. Is it running?";
      errorMsg.style.display = "block";
    }
  });
};
