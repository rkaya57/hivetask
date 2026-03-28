import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "./firebase.js";

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");
const authNotice = document.getElementById("authNotice");
const logoutBtn = document.getElementById("logoutBtn");
const walletChip = document.getElementById("authWalletStatus");
const authStateText = document.getElementById("authStateText");

function showNotice(message, type = "") {
  authNotice.textContent = message;
  authNotice.className = `notice ${type}`.trim();
  authNotice.classList.remove("hide");
}

loginTab?.addEventListener("click", () => {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginBox.classList.remove("hide");
  registerBox.classList.add("hide");
});

registerTab?.addEventListener("click", () => {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerBox.classList.remove("hide");
  loginBox.classList.add("hide");
});

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showNotice("Giriş başarılı. Dashboard sayfasına yönlendiriliyorsun.", "success");
    setTimeout(() => location.href = "dashboard.html", 900);
  } catch (err) {
    showNotice("Giriş başarısız: " + err.message, "error");
  }
});

document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("registerName").value.trim();
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const password2 = document.getElementById("registerPassword2").value.trim();

  if (password !== password2) {
    showNotice("Şifreler eşleşmiyor.", "error");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name,
      username,
      email,
      points: 0,
      walletAddress: "",
      role: "user",
      createdAt: serverTimestamp()
    });
    showNotice("Kayıt başarılı. Dashboard sayfasına yönlendiriliyorsun.", "success");
    setTimeout(() => location.href = "dashboard.html", 900);
  } catch (err) {
    showNotice("Kayıt başarısız: " + err.message, "error");
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const snap = await getDoc(doc(db, "users", user.uid));
    const userData = snap.exists() ? snap.data() : null;
    authStateText.textContent = userData?.username
      ? `Aktif oturum: ${userData.username}`
      : `Aktif oturum: ${user.email}`;
    walletChip.textContent = user.email;
    logoutBtn.classList.remove("hide");
  } else {
    authStateText.textContent = "Henüz giriş yapılmadı";
    walletChip.textContent = "Bağlı değil";
    logoutBtn.classList.add("hide");
  }
});
