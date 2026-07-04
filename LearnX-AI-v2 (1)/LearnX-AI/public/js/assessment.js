window.onload = async function () {
  const userId = sessionStorage.getItem("userId");
  if (!userId) {
    // No registration found in this session - send them back to register.
    window.location.href = "register.html";
    return;
  }

  const form = document.getElementById("quizForm");
  const questionsWrap = document.getElementById("questionsWrap");
  const loadingMsg = document.getElementById("loadingMsg");
  const errorMsg = document.getElementById("errorMsg");

  let questions = [];

  // Escape HTML special characters so option/question text like
  // "<link>" or "<script>" renders as visible text instead of being
  // parsed as an actual tag.
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  try {
    const res = await fetch("/api/questions");
    const data = await res.json();
    questions = data.questions;
  } catch (err) {
    loadingMsg.textContent = "Could not load questions. Is the server running?";
    return;
  }

  // Group by category for a nicer, sectioned quiz UI.
  const byCategory = {};
  for (const q of questions) {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  }

  let html = "";
  for (const [category, qs] of Object.entries(byCategory)) {
    html += `<h3 class="category-heading">${escapeHtml(category)}</h3>`;
    for (const q of qs) {
      html += `<div class="question">
        <p>${escapeHtml(q.text)}</p>`;
      for (const opt of q.options) {
        html += `
          <label class="option">
            <input type="radio" name="${escapeHtml(q.id)}" value="${escapeHtml(opt.id)}" required>
            ${escapeHtml(opt.text)}
          </label>`;
      }
      html += `</div>`;
    }
  }

  questionsWrap.innerHTML = html;
  loadingMsg.style.display = "none";
  form.style.display = "block";

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorMsg.style.display = "none";

    const answers = {};
    for (const q of questions) {
      const selected = document.querySelector(`input[name="${q.id}"]:checked`);
      if (selected) answers[q.id] = selected.value;
    }

    if (Object.keys(answers).length < questions.length) {
      errorMsg.textContent = "Please answer every question before submitting.";
      errorMsg.style.display = "block";
      return;
    }

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), answers }),
      });
      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || "Something went wrong.";
        errorMsg.style.display = "block";
        return;
      }

      window.location.href = `result.html?id=${data.resultId}`;
    } catch (err) {
      errorMsg.textContent = "Could not reach the server. Please try again.";
      errorMsg.style.display = "block";
    }
  });
};
