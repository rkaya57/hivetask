import {
  auth, db, onAuthStateChanged, collection, addDoc, getDocs, query, orderBy,
  serverTimestamp
} from "./firebase.js";

const form = document.getElementById("taskForm");
const taskNotice = document.getElementById("taskNotice");
const tableBody = document.querySelector("#adminTable tbody");
const submissionsWrap = document.getElementById("submissionsWrap");

function show(message, type="") {
  taskNotice.textContent = message;
  taskNotice.className = `notice ${type}`.trim();
  taskNotice.classList.remove("hide");
}

async function loadTasks() {
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  tableBody.innerHTML = "";
  snap.forEach(docSnap => {
    const task = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${task.title}</td>
      <td>${task.category}</td>
      <td>${task.reward} THP</td>
      <td>${task.deadline || "-"}</td>
    `;
    tableBody.appendChild(tr);
  });
}

async function loadSubmissions() {
  const q = query(collection(db, "submissions"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    submissionsWrap.innerHTML = '<div class="empty-state">Henüz kanıt gönderilmedi.</div>';
    return;
  }

  let html = "";
  snap.forEach(docSnap => {
    const s = docSnap.data();
    html += `
      <div class="list-item">
        <div class="rank">#</div>
        <div>
          <div class="task-title">${s.userEmail || s.userId}</div>
          <div class="meta">
            <span>Task ID: ${s.taskId}</span>
            <span>Status: ${s.status}</span>
          </div>
          <div class="muted" style="margin-top:6px;word-break:break-all">${s.proof}</div>
        </div>
        <div class="reward"><span class="status review">Bekliyor</span></div>
      </div>
    `;
  });

  submissionsWrap.innerHTML = html;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("taskName").value.trim();
  const category = document.getElementById("taskCategory").value;
  const reward = Number(document.getElementById("taskReward").value);
  const deadline = document.getElementById("taskDeadline").value;
  const description = document.getElementById("taskDesc").value.trim();

  if (!title || !reward) {
    show("Görev adı ve ödül zorunludur.", "error");
    return;
  }

  try {
    await addDoc(collection(db, "tasks"), {
      title,
      category,
      reward,
      deadline,
      description,
      status: "active",
      createdAt: serverTimestamp()
    });
    form.reset();
    show("Görev başarıyla eklendi.", "success");
    await loadTasks();
  } catch (err) {
    show("Görev eklenemedi: " + err.message, "error");
  }
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    show("Admin paneli için giriş yapmalısın. Yine de demo görünüm açık.", "error");
  }
});

loadTasks();
loadSubmissions();
