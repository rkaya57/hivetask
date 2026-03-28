import {
  auth, db, onAuthStateChanged,
  collection, addDoc, getDocs, query, orderBy, serverTimestamp
} from "./firebase.js";

const taskList = document.getElementById("taskList");
const proofForm = document.getElementById("proofForm");
const proofNotice = document.getElementById("proofNotice");
const proofTaskSelect = document.getElementById("proofTaskId");

function notice(message, type="") {
  proofNotice.textContent = message;
  proofNotice.className = `notice ${type}`.trim();
  proofNotice.classList.remove("hide");
}

function safe(v) {
  return v ? String(v) : "";
}

function taskCard(task, id) {
  return `
    <div class="task-item" style="grid-template-columns:auto 1fr auto;align-items:start">
      <div class="task-icon">${safe(task.category)?.[0] || "T"}</div>
      <div>
        <div class="task-title">${safe(task.title)}</div>
        <div class="meta">
          <span>${safe(task.category) || "Kategori"}</span>
          <span>${safe(task.status) || "active"}</span>
          <span>${safe(task.deadline) || "-"}</span>
        </div>
        <div class="muted" style="margin-top:10px;line-height:1.7">
          ${safe(task.description) || "Bu görev için henüz açıklama girilmemiş."}
        </div>
      </div>
      <div class="reward">
        <strong>${Number(task.reward || 0)} THP</strong>
        <span>ID: ${id.slice(0,8)}</span>
      </div>
    </div>
  `;
}

async function loadTasks() {
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    taskList.innerHTML = `<div class="empty-state">Henüz görev yok. Önce admin panelinden görev ekle.</div>`;
    proofTaskSelect.innerHTML = `<option value="">Görev bulunamadı</option>`;
    return;
  }

  let html = "";
  let options = '<option value="">Görev seç</option>';
  snap.forEach(docSnap => {
    const task = docSnap.data();
    html += taskCard(task, docSnap.id);
    options += `<option value="${docSnap.id}">${safe(task.title)}</option>`;
  });

  taskList.innerHTML = html;
  proofTaskSelect.innerHTML = options;
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    notice("Kanıt göndermek için giriş yapmalısın.", "error");
  }
});

proofForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    notice("Önce giriş yapmalısın.", "error");
    return;
  }

  const taskId = document.getElementById("proofTaskId").value;
  const xUsername = document.getElementById("xUsername").value.trim();
  const xProfileLink = document.getElementById("xProfileLink").value.trim();
  const screenshotLink = document.getElementById("screenshotLink").value.trim();
  const proof = document.getElementById("proofLink").value.trim();
  const note = document.getElementById("proofNote").value.trim();

  if (!taskId || !xUsername || !xProfileLink || !screenshotLink) {
    notice("Görev, X kullanıcı adı, X profil linki ve ekran görüntüsü linki zorunludur.", "error");
    return;
  }

  try {
    await addDoc(collection(db, "submissions"), {
      userId: user.uid,
      userEmail: user.email,
      taskId,
      xUsername,
      xProfileLink,
      screenshotLink,
      proof,
      note,
      status: "pending",
      createdAt: serverTimestamp()
    });
    proofForm.reset();
    notice("Kanıt başarıyla gönderildi. Admin panelinden incelenecek.", "success");
  } catch (err) {
    notice("Kanıt gönderilemedi: " + err.message, "error");
  }
});

loadTasks();
