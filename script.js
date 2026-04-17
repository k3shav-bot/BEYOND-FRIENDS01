// Firebase config (paste yours)
const firebaseConfig = {
  apiKey: "AIzaSyAGrW7X5_596VeRKlvSYnVkSCwtsovs_Kk",
  authDomain: "beyond-friends-4b7f6.firebaseapp.com",
  projectId: "beyond-friends-4b7f6",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Submit feedback
document.getElementById("feedbackForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("feedbackName").value;
  const role = document.getElementById("feedbackRole").value;
  const message = document.getElementById("feedbackMessage").value;

  try {
    await db.collection("feedback").add({
      name,
      role,
      message,
      createdAt: new Date()
    });

    document.getElementById("feedbackStatus").innerText = "✅ Feedback saved!";
    e.target.reset();
    loadFeedback();

  } catch (err) {
    console.error(err);
    document.getElementById("feedbackStatus").innerText = "❌ Error saving";
  }
});

// Load feedback
async function loadFeedback() {
  const list = document.getElementById("feedbackList");
  list.innerHTML = "";

  const snapshot = await db.collection("feedback").orderBy("createdAt", "desc").get();

  snapshot.forEach(doc => {
    const data = doc.data();

    list.innerHTML += `
      <div style="margin-bottom:10px; padding:10px; border:1px solid #ccc;">
        <strong>${data.name}</strong> (${data.role})
        <p>${data.message}</p>
      </div>
    `;
  });
}

// Load on start
loadFeedback();

// Refresh button
document.getElementById("refreshFeedback").addEventListener("click", loadFeedback);﻿


       
