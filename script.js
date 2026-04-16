const demoButton = document.getElementById("demoButton");
const formMessage = document.getElementById("formMessage");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackList = document.getElementById("feedbackList");
const feedbackStatus = document.getElementById("feedbackStatus");
const refreshFeedback = document.getElementById("refreshFeedback");
const API_BASE = "http://127.0.0.1:8000";

if (demoButton && formMessage) {
  demoButton.addEventListener("click", () => {
    formMessage.textContent = "This sample form is not connected to the database. The opinions form below is the working part.";
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(dateText) {
  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return date.toLocaleString();
}

function renderFeedback(items) {
  if (!feedbackList) {
    return;
  }

  if (!items.length) {
    feedbackList.innerHTML = '<p class="empty-state">No opinions yet. Be the first one to post feedback.</p>';
    return;
  }

  feedbackList.innerHTML = items
    .map((item) => `
      <article class="feedback-item">
        <div class="feedback-meta">
          <span class="feedback-name">${escapeHtml(item.name)}</span>
          <span class="feedback-role">${escapeHtml(item.role)}</span>
          <span class="feedback-date">${escapeHtml(formatDate(item.created_at))}</span>
        </div>
        <p class="feedback-text">${escapeHtml(item.message)}</p>
      </article>
    `)
    .join("");
}

async function loadFeedback() {
  if (!feedbackList) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/feedback`);

    if (!response.ok) {
      throw new Error("Unable to load feedback.");
    }

    const items = await response.json();
    renderFeedback(items);
  } catch (error) {
    feedbackList.innerHTML = '<p class="empty-state">Start the Python server to load saved opinions.</p>';
  }
}

if (feedbackForm && feedbackStatus) {
  feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById("feedbackName").value.trim(),
      role: document.getElementById("feedbackRole").value,
      message: document.getElementById("feedbackMessage").value.trim()
    };

    if (!payload.name || !payload.message) {
      feedbackStatus.textContent = "Please enter your name and opinion before submitting.";
      return;
    }

    feedbackStatus.textContent = "Saving opinion...";

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Unable to save opinion.");
      }

      feedbackForm.reset();
      feedbackStatus.textContent = "Opinion saved to the database.";
      await loadFeedback();
    } catch (error) {
      feedbackStatus.textContent = "Could not save opinion. Make sure the Python server is running.";
    }
  });
}

if (refreshFeedback) {
  refreshFeedback.addEventListener("click", loadFeedback);
}

loadFeedback();
