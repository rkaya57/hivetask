document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      const parent = btn.parentElement;
      parent.querySelectorAll("[data-filter]").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
    });
  });
});
