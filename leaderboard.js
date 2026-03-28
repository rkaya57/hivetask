import { db, collection, getDocs, query, orderBy } from "./firebase.js";

const board = document.getElementById("leaderboardList");

async function loadBoard() {
  const q = query(collection(db, "users"), orderBy("points", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    board.innerHTML = '<div class="empty-state">Henüz kullanıcı verisi yok.</div>';
    return;
  }

  let rank = 1;
  let html = "";
  snap.forEach(docSnap => {
    const u = docSnap.data();
    html += `
      <div class="leader-item">
        <div class="rank">${rank}</div>
        <div>
          <div class="task-title"><span class="avatar" style="margin-right:10px;display:inline-grid">${(u.username || u.name || "U")[0].toUpperCase()}</span>${u.username || u.name || "Kullanıcı"}</div>
          <div class="meta">
            <span>${u.email || "-"}</span>
            <span>Üye</span>
          </div>
        </div>
        <div class="reward">
          <strong>${u.points || 0} THP</strong>
          <span>${rank === 1 ? "Gold Hive" : rank === 2 ? "Silver Hive" : "Builder"}</span>
        </div>
      </div>
    `;
    rank++;
  });

  board.innerHTML = html;
}

loadBoard();
