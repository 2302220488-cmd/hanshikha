/* ==========================================
   AKADEMIKKU - MAIN JAVASCRIPT
   Dipakai oleh semua halaman website
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  updateDate();
  setupMobileMenu();
  setupActiveNavigation();
  setupTasks();
  setupSchedule();
});

/* ===== TANGGAL DAN TAHUN ===== */

function updateDate() {
  const dateElement = document.getElementById("currentDate");
  const yearElement = document.getElementById("currentYear");

  const now = new Date();

  if (dateElement) {
    dateElement.textContent = new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(now);
  }

  if (yearElement) {
    yearElement.textContent = now.getFullYear();
  }
}

/* ===== MENU MOBILE ===== */

function setupMobileMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");

  if (!menuBtn || !sidebar || !overlay) return;

  function openMenu() {
    sidebar.classList.add("open");
    overlay.classList.add("show");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  menuBtn.addEventListener("click", function () {
    if (sidebar.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener("click", closeMenu);

  sidebar.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 680) {
      closeMenu();
    }
  });
}
/* ===== NAVIGASI AKTIF ===== */

function setupActiveNavigation() {
  const currentPage = location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-link").forEach(link => {
    const targetPage = link.getAttribute("href");

    if (targetPage === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });
}

/* ==========================================
   TASK MANAGER
========================================== */

const TASK_STORAGE_KEY = "akademikku_tasks_v1";
let currentTaskFilter = "all";
let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = localStorage.getItem(TASK_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.name === "string" &&
      typeof task.subject === "string"
    ).map(task => ({
      id: task.id,
      name: task.name,
      subject: task.subject,
      due: typeof task.due === "string" ? task.due : "",
      completed: task.completed === true,
      createdAt: Number(task.createdAt) || Date.now()
    }));
  } catch (error) {
    console.warn("Data tugas tidak dapat dibaca.", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Data tugas tidak dapat disimpan.", error);
    alert("Tugas tidak bisa disimpan. Periksa penyimpanan browser kamu.");
    return false;
  }
}

function setupTasks() {
  const form = document.getElementById("taskForm");
  const list = document.getElementById("taskList");
  const filters = document.getElementById("taskFilters");

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();

      const nameInput = document.getElementById("taskName");
      const subjectInput = document.getElementById("taskSubject");
      const dueInput = document.getElementById("taskDue");

      const name = nameInput.value.trim();
      const subject = subjectInput.value;
      const due = dueInput.value;

      if (!name) {
        nameInput.focus();
        return;
      }

      const newTask = {
        id: createTaskId(),
        name,
        subject,
        due,
        completed: false,
        createdAt: Date.now()
      };

      tasks.unshift(newTask);

      if (!saveTasks()) {
        tasks.shift();
        return;
      }

      currentTaskFilter = "all";
      updateFilterButtons();
      renderTasks();
      form.reset();
      nameInput.focus();
    });
  }

  if (list) {
    list.addEventListener("change", event => {
      const checkbox = event.target.closest(".task-check");
      if (!checkbox) return;

      const task = tasks.find(item => item.id === checkbox.dataset.id);
      if (!task) return;

      const previousValue = task.completed;
      task.completed = checkbox.checked;

      if (!saveTasks()) {
        task.completed = previousValue;
      }

      renderTasks();
    });

    list.addEventListener("click", event => {
      const deleteButton = event.target.closest(".delete-task");
      if (!deleteButton) return;

      const task = tasks.find(item => item.id === deleteButton.dataset.id);
      if (!task) return;

      const confirmed = confirm(
        'Hapus tugas "' + task.name + '"?'
      );

      if (!confirmed) return;

      const previousTasks = [...tasks];
      tasks = tasks.filter(item => item.id !== task.id);

      if (!saveTasks()) {
        tasks = previousTasks;
      }

      renderTasks();
    });
  }

  if (filters) {
    filters.addEventListener("click", event => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;

      currentTaskFilter = button.dataset.filter;
      updateFilterButtons();
      renderTasks();
    });
  }

  updateFilterButtons();
  renderTasks();
}

function createTaskId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

function updateFilterButtons() {
  document.querySelectorAll("#taskFilters [data-filter]").forEach(button => {
    const active = button.dataset.filter === currentTaskFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderTasks() {
  updateTaskStatistics();

  const list = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");

  if (!list) return;

  const filteredTasks = tasks.filter(task => {
    if (currentTaskFilter === "pending") return !task.completed;
    if (currentTaskFilter === "completed") return task.completed;
    return true;
  });

  list.replaceChildren();

  filteredTasks.forEach(task => {
    const row = document.createElement("article");
    row.className = "task-item" + (task.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.dataset.id = task.id;
    checkbox.setAttribute("aria-label", "Tandai selesai: " + task.name);

    const details = document.createElement("div");
    details.className = "task-details";

    const title = document.createElement("span");
    title.className = "task-text";
    title.textContent = task.name;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const subject = document.createElement("span");
    subject.className = "task-subject-badge";
    subject.textContent = task.subject;
    meta.appendChild(subject);

    if (task.due) {
      const due = document.createElement("span");
      due.className = "task-due";

      const dueDate = parseLocalDate(task.due);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      due.textContent = "Tenggat: " +
        new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric"
        }).format(dueDate);

      if (!task.completed && dueDate < today) {
        due.classList.add("overdue");
        due.textContent += " · Terlewat";
      }

      meta.appendChild(due);
    }

    if (task.completed) {
      const status = document.createElement("span");
      status.textContent = "Selesai";
      meta.appendChild(status);
    }

    details.append(title, meta);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-task";
    deleteButton.dataset.id = task.id;
    deleteButton.textContent = "Hapus";
    deleteButton.setAttribute("aria-label", "Hapus tugas: " + task.name);

    row.append(checkbox, details, deleteButton);
    list.appendChild(row);
  });

  if (emptyState) {
    emptyState.hidden = filteredTasks.length > 0;

    const emptyTitle = emptyState.querySelector("h3");
    const emptyMessage = emptyState.querySelector("p");

    if (emptyTitle && emptyMessage) {
      if (tasks.length === 0) {
        emptyTitle.textContent = "Belum ada tugas";
        emptyMessage.textContent =
          "Tambahkan tugas pertama kamu menggunakan formulir di atas.";
      } else if (currentTaskFilter === "pending") {
        emptyTitle.textContent = "Semua tugas sudah selesai";
        emptyMessage.textContent =
          "Tidak ada tugas yang menunggu saat ini.";
      } else if (currentTaskFilter === "completed") {
        emptyTitle.textContent = "Belum ada tugas selesai";
        emptyMessage.textContent =
          "Tandai tugas sebagai selesai setelah kamu mengerjakannya.";
      }
    }
  }
}

function parseLocalDate(value) {
  const parts = value.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function updateTaskStatistics() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const progress = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  setText("totalTasks", total);
  setText("completedTasks", completed);
  setText("pendingTasks", pending);
  setText("progressPercent", progress);
  setText("sidebarTaskCount", pending);

  const sectionCount = document.getElementById("taskSectionCount");
  if (sectionCount) sectionCount.textContent = total + " TUGAS";

  const progressFill = document.getElementById("progressFill");
  if (progressFill) {
    progressFill.style.width = progress + "%";
    progressFill.setAttribute("role", "progressbar");
    progressFill.setAttribute("aria-valuemin", "0");
    progressFill.setAttribute("aria-valuemax", "100");
    progressFill.setAttribute("aria-valuenow", String(progress));
  }

  let message = "Mulai langkah pertamamu";
  if (total > 0 && progress === 100) message = "Semua tugas selesai!";
  else if (progress >= 70) message = "Hebat, teruskan!";
  else if (progress > 0) message = "Terus tingkatkan progresmu";
  else if (total > 0) message = "Saatnya mulai mengerjakan";

  setText("progressLabel", message);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

/* ==========================================
   JADWAL MINGGUAN
========================================== */

const weeklySchedule = {
  Senin: [
    { les: "1", waktu: "07.30–08.05", mapel: "Matematika" },
    { les: "2", waktu: "08.05–08.40", mapel: "Bahasa Indonesia" },
    { les: "3", waktu: "08.40–09.15", mapel: "IPA" },
    { les: "—", waktu: "09.15–09.30", mapel: "ISTIRAHAT", istirahat: true },
    { les: "4", waktu: "09.30–10.05", mapel: "Bahasa Inggris" },
    { les: "—", waktu: "10.40–10.55", mapel: "ISTIRAHAT", istirahat: true },
    { les: "5", waktu: "10.55–11.30", mapel: "PKN" },
    { les: "6", waktu: "11.30–12.00", mapel: "Agama" },
    { les: "7", waktu: "12.00–12.35", mapel: "Informatika" }
  ],

  Selasa: [
    { les: "1", waktu: "07.30–08.05", mapel: "Bahasa Inggris" },
    { les: "2", waktu: "08.05–08.40", mapel: "Matematika" },
    { les: "3", waktu: "08.40–09.15", mapel: "Sejarah" },
    { les: "—", waktu: "09.15–09.30", mapel: "ISTIRAHAT", istirahat: true },
    { les: "4", waktu: "09.30–10.05", mapel: "Geografi" },
    { les: "5", waktu: "10.05–10.40", mapel: "Ekonomi" },
    { les: "—", waktu: "10.40–10.55", mapel: "ISTIRAHAT", istirahat: true },
    { les: "6", waktu: "10.55–11.30", mapel: "Sosiologi" },
    { les: "7", waktu: "11.30–12.00", mapel: "Prakarya" },
    { les: "8", waktu: "12.00–12.35", mapel: "SBK" }
  ],

  Rabu: [
    { les: "1", waktu: "07.30–08.05", mapel: "IPA" },
    { les: "2", waktu: "08.05–08.40", mapel: "Matematika" },
    { les: "3", waktu: "08.40–09.15", mapel: "Bahasa Indonesia" },
    { les: "—", waktu: "09.15–09.30", mapel: "ISTIRAHAT", istirahat: true },
    { les: "4", waktu: "09.30–10.05", mapel: "Mandarin" },
    { les: "5", waktu: "10.05–10.40", mapel: "Bahasa Inggris" },
    { les: "—", waktu: "10.40–10.55", mapel: "ISTIRAHAT", istirahat: true },
    { les: "6", waktu: "10.55–11.30", mapel: "PJOK" },
    { les: "7", waktu: "11.30–12.00", mapel: "Seni Lukis" },
    { les: "8", waktu: "12.00–12.35", mapel: "PKN" }
  ],

  Kamis: [
    { les: "1", waktu: "07.30–08.05", mapel: "Ekonomi" },
    { les: "2", waktu: "08.05–08.40", mapel: "Matematika" },
    { les: "3", waktu: "08.40–09.15", mapel: "Geografi" },
    { les: "—", waktu: "09.15–09.30", mapel: "ISTIRAHAT", istirahat: true },
    { les: "4", waktu: "09.30–10.05", mapel: "IPA" },
    { les: "5", waktu: "10.05–10.40", mapel: "Sosiologi" },
    { les: "—", waktu: "10.40–10.55", mapel: "ISTIRAHAT", istirahat: true },
    { les: "6", waktu: "10.55–11.30", mapel: "Bahasa Indonesia" },
    { les: "7", waktu: "11.30–12.00", mapel: "Agama" },
    { les: "8", waktu: "12.00–12.35", mapel: "Informatika" }
  ],

  Jumat: [
    { les: "1", waktu: "07.30–08.05", mapel: "Bahasa Indonesia" },
    { les: "2", waktu: "08.05–08.40", mapel: "Bahasa Inggris" },
    { les: "3", waktu: "08.40–09.15", mapel: "Matematika" },
    { les: "—", waktu: "09.15–09.30", mapel: "ISTIRAHAT", istirahat: true },
    { les: "4", waktu: "09.30–10.05", mapel: "Sejarah" },
    { les: "5", waktu: "10.05–10.40", mapel: "PJOK" },
    { les: "—", waktu: "10.40–10.55", mapel: "ISTIRAHAT", istirahat: true },
    { les: "6", waktu: "10.55–11.30", mapel: "Prakarya" },
    { les: "7", waktu: "11.30–12.00", mapel: "Agama" }
  ],

  Sabtu: [
    { les: "1", waktu: "07.30–08.05", mapel: "Mandarin" },
    { les: "2", waktu: "08.05–08.40", mapel: "Matematika" },
    { les: "3", waktu: "08.40–09.15", mapel: "IPA" },
    { les: "—", waktu: "09.15–09.30", mapel: "ISTIRAHAT", istirahat: true },
    { les: "4", waktu: "09.30–10.05", mapel: "SBK" },
    { les: "5", waktu: "10.05–10.40", mapel: "Seni Lukis" },
    { les: "—", waktu: "10.40–10.55", mapel: "ISTIRAHAT", istirahat: true },
    { les: "6", waktu: "10.55–11.30", mapel: "Ekonomi" },
    { les: "7", waktu: "11.30–12.00", mapel: "Geografi" },
    { les: "8", waktu: "12.00–12.35", mapel: "Sosiologi" }
  ],

  Minggu: [
    { les: "1", waktu: "09.00–09.30", mapel: "Mengulang materi minggu ini" },
    { les: "2", waktu: "09.30–10.00", mapel: "Mengerjakan tugas" },
    { les: "3", waktu: "16.00–16.30", mapel: "Menyiapkan pelajaran minggu depan" }
  ]
};

/* ===== MENAMPILKAN JADWAL ===== */

function setupSchedule() {
  const selector = document.getElementById("daySelector");
  const body = document.getElementById("scheduleBody");

  if (!selector || !body) return;

  selector.addEventListener("click", event => {
    const button = event.target.closest("[data-day]");

    if (!button || !selector.contains(button)) return;

    renderSchedule(button.dataset.day);
  });

  renderSchedule("Senin");
}

function renderSchedule(day) {
  const selector = document.getElementById("daySelector");
  const body = document.getElementById("scheduleBody");

  if (!selector || !body || !weeklySchedule[day]) return;

  selector.querySelectorAll("[data-day]").forEach(button => {
    const active = button.dataset.day === day;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  setText("selectedDayLabel", "Jadwal hari " + day);
  setText("scheduleDayTitle", day);

  setText(
    "scheduleDaySubtitle",
    day === "Minggu"
      ? "Belajar mandiri"
      : "Jadwal pelajaran sekolah"
  );

  body.replaceChildren();

  weeklySchedule[day].forEach(item => {
    const row = document.createElement("tr");

    if (item.istirahat) {
      row.classList.add("break-row");
    }

    const lessonCell = document.createElement("td");
    lessonCell.textContent = item.les;

    const timeCell = document.createElement("td");
    timeCell.textContent = item.waktu;

    const subjectCell = document.createElement("td");
    subjectCell.textContent = item.mapel;

    if (!item.istirahat) {
      subjectCell.classList.add("subject-label");
    }

    row.append(lessonCell, timeCell, subjectCell);
    body.appendChild(row);
  });
}
