import {
  auth, db, onAuthStateChanged, doc, getDoc, collection, getDocs, query, where
} from "./firebase.js";

const usernameEl = document.getElementById("dashUsername");
const emailEl = document.getElementById("dashEmail");
const pointsEl = document.getElementById("dashPoints");
const completedEl = document.getElementById("dashCompleted");
const pendingEl = document.getElementById("dashPending");
const estimateEl = document.getElementById("dashEstimate");
const dashNotice = document.getElementById("dashNotice");

function show(message, type="") {
  dashNotice.textContent = message;
  dashNotice.className = `notice ${type}`.trim();
  dashNotice.classList.remove("hide");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    show("Dashboard verilerini görmek için giriş yapmalısın.", "error");
    usernameEl.textContent = "Misafir";
    emailEl.textContent = "-";
    return;
  }

  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (userSnap.exists()) {
    const u = userSnap.data();
    usernameEl.textContent = u.username || u.name || "Kullanıcı";
    emailEl.textContent = u.email || user.email;
    pointsEl.textContent = u.points || 0;
    estimateEl.textContent = "$" + (((u.points || 0) * 0.015).toFixed(2));
  }

  const subSnap = await getDocs(query(collection(db, "submissions"), where("userId", "==", user.uid)));
  let pending = 0;
  subSnap.forEach(x => {
    if ((x.data().status || "") === "pending") pending++;
  });

  completedEl.textContent = subSnap.size;
  pendingEl.textContent = pending;
});
