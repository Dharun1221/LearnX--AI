window.onload = async function () {
  const params = new URLSearchParams(window.location.search);
  const resultId = params.get("id");
  const resultText = document.getElementById("resultText");
  const categoryBreakdown = document.getElementById("categoryBreakdown");
  const recommendation = document.getElementById("recommendation");

  if (!resultId) {
    resultText.textContent = "No result found. Please take the assessment first.";
    return;
  }

  try {
    const res = await fetch(`/api/result/${resultId}`);
    const data = await res.json();

    if (!res.ok) {
      resultText.textContent = data.error || "Could not load your result.";
      return;
    }

    resultText.innerHTML =
      `Hey <strong>${data.name}</strong>! Your Level: <strong>${data.level}</strong> ` +
      `(Score: ${data.score}/${data.total})`;

    // Category breakdown bars
    let breakdownHtml = `<h3>Category Breakdown</h3><div class="breakdown">`;
    for (const [category, s] of Object.entries(data.categoryScores)) {
      const pct = Math.round((s.correct / s.total) * 100);
      breakdownHtml += `
        <div class="bar-row">
          <span class="bar-label">${category} (${s.correct}/${s.total})</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
    }
    breakdownHtml += `</div>`;
    categoryBreakdown.innerHTML = breakdownHtml;

    // Personalized recommendation, weakest area first
    let recHtml = `<h3>Your Personalized Learning Path</h3>`;
    data.recommendation.forEach((item, idx) => {
      recHtml += `
        <div class="rec-block">
          <p class="rec-title">${idx + 1}. ${item.category} — ${item.focus} (${item.percent}%)</p>
          <ul>
            ${item.resources.map((r) => `<li>${r}</li>`).join("")}
          </ul>
        </div>`;
    });
    recommendation.innerHTML = recHtml;
  } catch (err) {
    resultText.textContent = "Could not reach the server. Please try again.";
  }
};
