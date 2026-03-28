import {
  auth, db, onAuthStateChanged, collection, addDoc, getDocs, query, orderBy,
  serverTimestamp, doc, getDoc, updateDoc, increment
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

function safe(v) {
  return v ? String(v) : "";
}

async function loadTasks() {
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  tableBody.innerHTML = "";
  snap.forEach(docSnap => {
    const task = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${safe(task.title)}</td>
      <td>${safe(task.category)}</td>
      <td>${Number(task.reward || 0)} THP</td>
      <td>${safe(task.description)}</td>
      <td>${safe(task.deadline) || "-"}</td>
    `;
    tableBody.appendChild(tr);
  });
}

async function approveSubmission(submissionId) {
  try {
    const subRef = doc(db, "submissions", submissionId);
    const subSnap = await getDoc(subRef);
    if (!subSnap.exists()) {
      show("Submission bulunamadı.", "error");
      return;
    }

    const submission = subSnap.data();
    if (submission.status === "approved") {
      show("Bu submission zaten onaylanmış.", "error");
      return;
    }

    const taskRef = doc(db, "tasks", submission.taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) {
      show("Göreve ait kayıt bulunamadı.", "error");
      return;
    }

    const reward = Number(taskSnap.data().reward || 0);
    const userRef = doc(db, "users", submission.userId);

    await updateDoc(subRef, {
      status: "approved",
      approvedAt: serverTimestamp()
    });

    await updateDoc(userRef, {
      points: increment(reward)
    });

    show(`Submission onaylandı. Kullanıcıya ${reward} THP eklendi.`, "success");
    await loadSubmissions();
  } catch (err) {
    show("Onay işlemi başarısız: " + err.message, "error");
  }
}

async function rejectSubmission(submissionId) {
  try {
    const subRef = doc(db, "submissions", submissionId);
    await updateDoc(subRef, {
      status: "rejected",
      rejectedAt: serverTimestamp()
    });
    show("Submission reddedildi.", "success");
    await loadSubmissions();
  } catch (err) {
    show("Red işlemi başarısız: " + err.message, "error");
  }
}

async function loadSubmissions() {
  const q = query(collection(db, "submissions"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    submissionsWrap.innerHTML = '<div class="empty-state">Henüz kanıt gönderilmedi.</div>';
    return;
  }

  let html = "";
  for (const docSnap of snap.docs) {
    const s = docSnap.data();
    let taskTitle = s.taskId;
    try {
      const tSnap = await getDoc(doc(db, "tasks", s.taskId));
      if (tSnap.exists()) taskTitle = tSnap.data().title || s.taskId;
    } catch {}

    const statusClass = s.status === "approved" ? "live" : s.status === "rejected" ? "closed" : "review";
    const statusText = s.status === "approved" ? "Onaylandı" : s.status === "rejected" ? "Reddedildi" : "Bekliyor";

    html += `
      <div class="list-item" style="grid-template-columns:auto 1fr auto;align-items:start">
        <div class="rank">#</div>
        <div>
          <div class="task-title">${safe(s.userEmail || s.userId)}</div>
          <div class="meta">
            <span>Görev: ${safe(taskTitle)}</span>
            <span>Status: ${safe(s.status)}</span>
            <span>X: ${safe(s.xUsername)}</span>
          </div>
          <div class="muted" style="margin-top:8px;line-height:1.7">
            <strong style="color:#eef4ff">X Profil:</strong> ${safe(s.xProfileLink) || "-"}<br>
            <strong style="color:#eef4ff">Ekran Görüntüsü:</strong> ${safe(s.screenshotLink) || "-"}<br>
            <strong style="color:#eef4ff">Ek Kanıt:</strong> ${safe(s.proof) || "-"}<br>
            <strong style="color:#eef4ff">Not:</strong> ${safe(s.note) || "-"}
          </div>
        </div>
        <div class="reward">
          <span class="status ${statusClass}">${statusText}</span>
          <div style="display:grid;gap:10px;margin-top:12px;min-width:140px">
            <button class="btn" data-approve="${docSnap.id}" ${s.status === "approved" ? "disabled" : ""}>Onayla</button>
            <button class="btn-ghost" data-reject="${docSnap.id}" ${s.status === "rejected" ? "disabled" : ""}>Reddet</button>
          </div>
        </div>
      </div>
    `;
  }

  submissionsWrap.innerHTML = html;

  submissionsWrap.querySelectorAll("[data-approve]").forEach(btn => {
    btn.addEventListener("click", () => approveSubmission(btn.dataset.approve));
  });

  submissionsWrap.querySelectorAll("[data-reject]").forEach(btn => {
    btn.addEventListener("click", () => rejectSubmission(btn.dataset.reject));
  });
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
