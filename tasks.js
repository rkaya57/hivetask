import {
  auth, db, onAuthStateChanged,
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, where
} from "./firebase.js";

const taskList = document.getElementById("taskList");
const completedTaskList = document.getElementById("completedTaskList");
const proofForm = document.getElementById("proofForm");
const proofNotice = document.getElementById("proofNotice");
const proofTaskSelect = document.getElementById("proofTaskId");

let approvedTaskIds = new Set();
let submittedPendingTaskIds = new Set();
let allTasksMap = new Map();

function notice(message, type="") {
  proofNotice.textContent = message;
  proofNotice.className = `notice ${type}`.trim();
  proofNotice.classList.remove("hide");
}

function safe(v) {
  return v ? String(v) : "";
}

function taskCard(task, id, completed = false) {
  const badgeClass = completed ? "live" : "review";
  const badgeText = completed ? "Tamamlandı" : "Aktif";
  return `
    <div class="task-item" style="grid-template-columns:auto 1fr auto;align-items:start">
      <div class="task-icon">${safe(task.category)?.[0] || "T"}</div>
      <div>
        <div class="task-title">${safe(task.title)}</div>
        <div class="meta">
          <span>${safe(task.category) || "Kategori"}</span>
          <span>${safe(task.deadline) || "-"}</span>
          <span class="status ${badgeClass}">${badgeText}</span>
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

async function loadUserSubmissionState() {
  approvedTaskIds = new Set();
  submittedPendingTaskIds = new Set();

  const user = auth.currentUser;
  if (!user) return;

  const subQ = query(collection(db, "submissions"), where("userId", "==", user.uid));
  const subSnap = await getDocs(subQ);

  subSnap.forEach(docSnap => {
    const s = docSnap.data();
    if (s.status === "approved") approvedTaskIds.add(s.taskId);
    if (s.status === "pending") submittedPendingTaskIds.add(s.taskId);
  });
}

async function loadTasks() {
  await loadUserSubmissionState();

  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  allTasksMap = new Map();

  if (snap.empty) {
    taskList.innerHTML = `<div class="empty-state">Henüz görev yok. Önce admin panelinden görev ekle.</div>`;
    completedTaskList.innerHTML = `<div class="empty-state">Henüz tamamlanmış görev yok.</div>`;
    proofTaskSelect.innerHTML = `<option value="">Görev bulunamadı</option>`;
    return;
  }

  let activeHtml = "";
  let completedHtml = "";
  let options = '<option value="">Görev seç</option>';

  snap.forEach(docSnap => {
    const task = docSnap.data();
    const taskId = docSnap.id;
    allTasksMap.set(taskId, task);

    if (approvedTaskIds.has(taskId)) {
      completedHtml += taskCard(task, taskId, true);
      return;
    }

    const pendingText = submittedPendingTaskIds.has(taskId)
      ? '<div class="muted" style="margin-top:10px"><span class="status review">Kanıt Gönderildi, Onay Bekliyor</span></div>'
      : "";

    activeHtml += `
      <div>
        ${taskCard(task, taskId, false)}
        ${pendingText}
      </div>
    `;

    options += `<option value="${taskId}">${safe(task.title)}</option>`;
  });

  taskList.innerHTML = activeHtml || `<div class="empty-state">Aktif görev kalmadı.</div>`;
  completedTaskList.innerHTML = completedHtml || `<div class="empty-state">Henüz tamamlanan görev yok.</div>`;
  proofTaskSelect.innerHTML = options;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    notice("Kanıt göndermek için giriş yapmalısın.", "error");
  }
  await loadTasks();
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

  if (approvedTaskIds.has(taskId)) {
    notice("Bu görev zaten tamamlanmış görünüyor.", "error");
    return;
  }

  if (submittedPendingTaskIds.has(taskId)) {
    notice("Bu görev için zaten onay bekleyen bir kanıtın var.", "error");
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
    await loadTasks();
  } catch (err) {
    notice("Kanıt gönderilemedi: " + err.message, "error");
  }
});

loadTasks();
