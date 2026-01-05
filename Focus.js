const API_URL = "https://fastapi-backend-7lwv.onrender.com/tareas"; // cambia por tu URL real

// ---- Utilidades ----
const VIEW_KEY = "focus_widget_view";

const toggle = document.getElementById("darkModeToggle");
toggle.addEventListener("change", () => {
  if (toggle.checked) {
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
  }
});

function getLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const hoyISO = () => getLocalISO(new Date());
const setView = (view) => localStorage.setItem(VIEW_KEY, view);
const getView = () => localStorage.getItem(VIEW_KEY) || "dia";
const isToday = (iso) => iso === hoyISO();
const isPending = (t) => t.status === "pending";

// ---- Comunicación con servidor ----
async function fetchTasks() {
  const res = await fetch(`${API_URL}/tareas`);
  return await res.json();
}

async function createTask(titulo, nota, fecha, hora, alarma) {
  const fechaHora = hora 
    ? new Date(`${fecha}T${hora}`).toISOString()
    : new Date(fecha).toISOString();

  const res = await fetch(`${API_URL}/tareas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: titulo,
      note: nota,
      datetime: fechaHora,
      status: "pending"
    }),
  });
  return await res.json();
}

async function completeTask(id) {
  const res = await fetch(`${API_URL}/tareas/${id}/completar`, { method: "PUT" });
  return await res.json();
}

// ---- Render principal ----
async function render() {
  const view = getView();
  const tasks = (await fetchTasks()).filter(isPending);

  if (view === "dia") renderDay(tasks);
  else if (view === "semana") renderWeek(tasks);
  else renderMonth(tasks);

  document.querySelectorAll(".view-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.view === view);
  });
}

// ---- Acciones de tarea ----
function attachTaskActions(list) {
  const ids = new Set(list.map(t => t.id));
  document.querySelectorAll(".task-card").forEach(card => {
    const id = card.dataset.id;
    if (!ids.has(id)) return;

    const complete = card.querySelector(".complete-btn");
    const del = card.querySelector(".delete-btn");

    complete?.addEventListener("click", async (e) => {
      e.stopPropagation();
      await completeTask(id);
      render();
    });

    del?.addEventListener("click", async (e) => {
      e.stopPropagation();
      // si agregas DELETE en backend:
      // await deleteTask(id);
      console.log("❌ Falta endpoint DELETE en backend");
      render();
    });
  });
}

// ---- Guardar nueva tarea ----
const taskForm = document.getElementById("taskForm");
if (taskForm) {
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo")?.value?.trim();
    const nota = document.getElementById("nota")?.value?.trim() || "";
    const fecha = document.getElementById("fecha")?.value;
    const hora = document.getElementById("hora")?.value;
    const minuto = document.getElementById("minuto")?.value.padStart(2, "0");
    const ampm = document.getElementById("ampm")?.value;
    let horaFinal = null;
    if (hora && minuto && ampm) {
      horaFinal = `${hora}:${minuto} ${ampm}`;
    }
    const alarma = document.getElementById("alarma")?.checked || false;

    if (!titulo || !fecha) return;

    await createTask(titulo, nota, fecha, horaFinal, alarma);
    cerrarFormulario();
    render();
  });
}

// ---- Inicializar ----
document.addEventListener("DOMContentLoaded", () => {
  if (toggle.checked) {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
  } else {
    document.body.classList.add("light-mode");
    document.body.classList.remove("dark-mode");
  }
  render();
});
