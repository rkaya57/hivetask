import {
  auth, db, onAuthStateChanged, doc, getDoc, collection, getDocs, query, where
} from "./firebase.js";

const usernameEl = document.getElementById("dashUsername");
const emailEl = document.getElementById("dashEmail");
const pointsEl = document.getElementById("dashPoints");
const approvedEl = document.getElementById("dashApproved");
const pendingEl = document.getElementById("dashPending");
const rejectedEl = document.getElementById("dashRejected");
const totalEl = document.getElementById("dashTotalSubmissions");
const estimateEl = document.getElementById("dashEstimate");
const badgeEl = document.getElementById("dashBadge");
const dashNotice = document.getElementById("dashNotice");
const recentApprovedList = document.getElementById("recentApprovedList");
const submissionHistoryList = document.getElementById("submissionHistoryList");
const approvedPercentEl = document.getElementById("approvedPercent");
const pendingPercentEl = document.getElementById("pendingPercent");
const rejectedPercentEl = document.getElementById("rejectedPercent");
const approvedBar = document.getElementById("approvedBar");
const pendingBar = document.getElementById("pendingBar");
const rejectedBar = document.getElementById("rejectedBar");
const completionRateEl = document.getElementById("dashCompletionRate");
const insightEl = document.getElementById("dashInsight");
const sideUsername = document.getElementById("sideUsername");
const sideEmail = document.getElementById("sideEmail");

function show(message, type="") {
  dashNotice.textContent = message;
  dashNotice.className = `notice ${type}`.trim();
  dashNotice.classList.remove("hide");
}

function safe(v) {
  return v ? String(v) : "";
}

function badgeFromPoints(points) {
  if (points >= 10000) return "Gold Hive";
  if (points >= 7500) return "Silver Hive";
  if (points >= 3000) return "Builder";
  if (points >= 1000) return "Rising";
  return "Newbie";
}

function statusUI(status) {
  if (status === "approved") return { cls: "live", text: "Onaylandı" };
  if (status === "rejected") return { cls: "closed", text: "Reddedildi" };
  return { cls: "review", text: "Bekliyor" };
}

async function getTaskTitle(taskId) {
  try {
    const snap = await getDoc(doc(db, "tasks", taskId));
    return snap.exists() ? (snap.data().title || taskId) : taskId;
  } catch {
    return taskId;
  }
}

function renderRecentApproved(items) {
  if (!items.length) {
    recentApprovedList.innerHTML = '<div class="empty-state">Henüz onaylanan görev yok.</div>';
    return;
  }

  recentApprovedList.innerHTML = items.map(item => `
    <div class="list-item">
      <div class="rank">✓</div>
      <div>
        <div class="task-title">${safe(item.taskTitle)}</div>
        <div class="meta">
          <span>${safe(item.xUsername || "-")}</span>
          <span>${safe(item.userEmail || "-")}</span>
        </div>
      </div>
      <div class="reward"><span class="status live">Onaylandı</span></div>
    </div>
  `).join("");
}

function renderHistory(items) {
  if (!items.length) {
    submissionHistoryList.innerHTML = '<div class="empty-state">Henüz submission geçmişin yok.</div>';
    return;
  }

  submissionHistoryList.innerHTML = items.map(item => {
    const ui = statusUI(item.status);
    const reason = item.status === "rejected" && item.rejectedReason
      ? `<div style="margin-top:8px;color:#ffc9d3"><strong>Red Nedeni:</strong> ${safe(item.rejectedReason)}</div>`
      : "";

    return `
      <div class="list-item submission-card">
        <div class="rank">#</div>
        <div class="submission-content">
          <div class="task-title">${safe(item.taskTitle)}</div>
          <div class="meta">
            <span>X: ${safe(item.xUsername || "-")}</span>
            <span>${safe(item.userEmail || "-")}</span>
          </div>
          <div class="muted submission-links">
            <strong style="color:#eef4ff">X Profil:</strong> ${item.xProfileLink ? `<a href="${safe(item.xProfileLink)}" target="_blank" rel="noopener noreferrer">${safe(item.xProfileLink)}</a>` : "-"}<br>
            <strong style="color:#eef4ff">Ekran Görüntüsü:</strong> ${item.screenshotLink ? `<a href="${safe(item.screenshotLink)}" target="_blank" rel="noopener noreferrer">${safe(item.screenshotLink)}</a>` : "-"}<br>
            <strong style="color:#eef4ff">Ek Kanıt:</strong> ${item.proof ? `<a href="${safe(item.proof)}" target="_blank" rel="noopener noreferrer">${safe(item.proof)}</a>` : "-"}<br>
            <strong style="color:#eef4ff">Not:</strong> ${safe(item.note) || "-"}
            ${reason}
          </div>
        </div>
        <div class="reward">
          <span class="status ${ui.cls}">${ui.text}</span>
        </div>
      </div>
    `;
  }).join("");
}

function setPercent(elText, elBar, value) {
  const val = Math.max(0, Math.min(100, Math.round(value)));
  elText.textContent = `${val}%`;
  elBar.style.width = `${val}%`;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    show("Dashboard verilerini görmek için giriş yapmalısın.", "error");
    usernameEl.textContent = "Misafir";
    emailEl.textContent = "-";
    sideUsername.textContent = "Misafir";
    sideEmail.textContent = "-";
    return;
  }

  const userSnap = await getDoc(doc(db, "users", user.uid));
  let points = 0;

  if (userSnap.exists()) {
    const u = userSnap.data();
    usernameEl.textContent = u.username || u.name || "Kullanıcı";
    emailEl.textContent = u.email || user.email;
    sideUsername.textContent = u.username || u.name || "Kullanıcı";
    sideEmail.textContent = u.email || user.email;
    points = Number(u.points || 0);
    pointsEl.textContent = points;
    estimateEl.textContent = "$" + ((points * 0.015).toFixed(2));
    badgeEl.textContent = badgeFromPoints(points);
  } else {
    usernameEl.textContent = user.email;
    emailEl.textContent = user.email;
    sideUsername.textContent = user.email;
    sideEmail.textContent = user.email;
  }

  const subSnap = await getDocs(query(collection(db, "submissions"), where("userId", "==", user.uid)));
  const items = [];

  for (const docSnap of subSnap.docs) {
    const data = docSnap.data();
    const taskTitle = await getTaskTitle(data.taskId);
    items.push({ id: docSnap.id, ...data, taskTitle });
  }

  items.sort((a, b) => {
    const aSec = a.createdAt?.seconds || 0;
    const bSec = b.createdAt?.seconds || 0;
    return bSec - aSec;
  });

  const approved = items.filter(x => x.status === "approved");
  const pending = items.filter(x => x.status === "pending");
  const rejected = items.filter(x => x.status === "rejected");
  const total = items.length;

  approvedEl.textContent = approved.length;
  pendingEl.textContent = pending.length;
  rejectedEl.textContent = rejected.length;
  totalEl.textContent = total;

  const approvedPct = total ? (approved.length / total) * 100 : 0;
  const pendingPct = total ? (pending.length / total) * 100 : 0;
  const rejectedPct = total ? (rejected.length / total) * 100 : 0;

  setPercent(approvedPercentEl, approvedBar, approvedPct);
  setPercent(pendingPercentEl, pendingBar, pendingPct);
  setPercent(rejectedPercentEl, rejectedBar, rejectedPct);
  completionRateEl.textContent = `%${Math.round(approvedPct)}`;

  if (approved.length >= 5) {
    insightEl.textContent = "Harika gidiyorsun. Onaylanan görevlerin güçlü bir ritim yakalamış durumda.";
  } else if (pending.length > approved.length) {
    insightEl.textContent = "Bekleyen görevlerin onay bekliyor. Admin paneli onaylarından sonra puanın hızla artabilir.";
  } else if (rejected.length > 0) {
    insightEl.textContent = "Bazı görevlerin reddedilmiş. Red nedenlerini inceleyip daha güçlü kanıt gönderebilirsin.";
  } else {
    insightEl.textContent = "Başlangıç seviyesindesin. Yeni görevler tamamlayarak puanını yükseltebilirsin.";
  }

  renderRecentApproved(approved.slice(0, 5));
  renderHistory(items);
});
