// ---- Utilidades ----
const STORAGE_KEY = "focus_tareas";
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
const loadTasks = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const saveTasks = (tasks) => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
const setView = (view) => localStorage.setItem(VIEW_KEY, view);
const getView = () => localStorage.getItem(VIEW_KEY) || "dia";
const isToday = (iso) => iso === hoyISO();
const isPending = (t) => !t.completada && (t.fecha >= hoyISO());

// ---- Datos iniciales demo ----
if (!localStorage.getItem(STORAGE_KEY)) {
  saveTasks([
    { id: 1, titulo: "Reunión con equipo", nota: "Traer informe", fecha: hoyISO(), hora: "2:30 PM", alarma: true, completada: false },
    { id: 2, titulo: "Ejercicio", nota: "30 min", fecha: hoyISO(), hora: "6:00 PM", alarma: false, completada: false },
    { id: 3, titulo: "Comprar regalos", nota: "Sin hora", fecha: hoyISO(), hora: null, alarma: true, completada: false }
  ]);
}

// ---- Referencias ----
const widget = document.getElementById("widget");
const content = document.getElementById("widget-content");

// ---- Render principal ----
function render() {
  const view = getView();
  const tasks = loadTasks().filter(isPending);

  if (view === "dia") renderDay(tasks);
  else if (view === "semana") renderWeek(tasks);
  else renderMonth(tasks);

  document.querySelectorAll(".view-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.view === view);
  });
}

// ---- Vista Día ----
function renderDay(tasks) {
  const todayTasks = tasks.filter(t => isToday(t.fecha));
  if (todayTasks.length === 0) {
    content.innerHTML = `<div class="empty">Nada pendiente hoy</div>`;
    return;
  }
  content.innerHTML = todayTasks.map(t => taskCardHTML(t)).join("");
  attachTaskActions(todayTasks);
}

// ---- Vista Semana ----
function renderWeek(tasks) {
  const start = new Date(hoyISO());
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return getLocalISO(d);
  });

  let html = `<div class="week-grid">`;
  days.forEach((iso) => {
    const dayTasks = tasks.filter(t => t.fecha === iso);
    const dayNumber = iso.slice(8, 10);
    const todayClass = iso === hoyISO() ? "today" : "";

    html += `
      <div class="day-cell ${todayClass}" data-date="${iso}">
        <div class="day-label">${dayNumber}</div>
        ${dayTasks.length ? dayTasks.map(() => `<span class="dot"></span>`).join("") : ``}
        <div class="task-list hidden">
          ${dayTasks.map(t => `
            <div class="task-card" data-id="${t.id}">
              <div>
                <div class="task-title">${t.titulo}</div>
                ${t.nota ? `<div class="task-note">${t.nota}</div>` : ``}
              </div>
              <div class="task-actions">
                ${t.hora ? `<span class="task-time">${t.hora}</span>` : ``}
                <button class="btn-mini complete-btn">✓</button>
                <button class="btn-mini delete-btn">✗</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  });
  html += `</div>`;
  content.innerHTML = html;

  attachTaskActions(tasks);
  bindDayClicks();
}

// ---- Vista Mes ----
function renderMonth(tasks) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayISO = hoyISO();
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `<h3 class="month-title">${monthNames[month]} ${year}</h3>`;
  html += `<div class="month-grid">`;

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = getLocalISO(new Date(year, month, d));
    const dayTasks = tasks.filter(t => t.fecha === iso);
    const todayClass = iso === todayISO ? "today" : "";
    const dayNumber = d;

    html += `
      <div class="month-cell ${todayClass}" data-date="${iso}">
        <div class="day-number">${dayNumber}</div>
        ${dayTasks.length ? dayTasks.map(() => `<span class="dot"></span>`).join("") : ``}
        <div class="task-list hidden">
          ${dayTasks.map(t => `
            <div class="task-card" data-id="${t.id}">
              <div>
                <div class="task-title">${t.titulo}</div>
                ${t.nota ? `<div class="task-note">${t.nota}</div>` : ``}
              </div>
              <div class="task-actions">
                ${t.hora ? `<span class="task-time">${t.hora}</span>` : ``}
                <button class="btn-mini complete-btn">✓</button>
                <button class="btn-mini delete-btn">✗</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  content.innerHTML = html;

  attachTaskActions(tasks);
  bindDayClicks();
}

// ---- Templates ----
function taskCardHTML(t) {
  return `
    <div class="task-card" data-id="${t.id}">
      <div>
        <div class="task-title">${t.titulo}</div>
        ${t.nota ? `<div class="task-note">${t.nota}</div>` : ``}
      </div>
      <div class="task-actions">
        ${t.hora ? `<span class="task-time">${t.hora}</span>` : ``}
        <button class="btn-mini complete-btn">Hecho</button>
        <button class="btn-mini delete-btn">Borrar</button>
      </div>
    </div>
  `;
}

// ---- Acciones de tarea ----
function attachTaskActions(list) {
  const ids = new Set(list.map(t => t.id));
  document.querySelectorAll(".task-card").forEach(card => {
    const id = Number(card.dataset.id);
    if (!ids.has(id)) return;

    const complete = card.querySelector(".complete-btn");
    const del = card.querySelector(".delete-btn");

    complete?.addEventListener("click", (e) => {
      e.stopPropagation();
      const tasks = loadTasks();
      const idx = tasks.findIndex(t => t.id === id);
      if (idx >= 0) {
        tasks[idx].completada = true;
        saveTasks(tasks);
        render();
      }
    });

    del?.addEventListener("click", (e) => {
      e.stopPropagation();
      const tasks = loadTasks().filter(t => t.id !== id);
      saveTasks(tasks);
      render();
    });
  });
}

// ---- Estado de vista previa ----
let previousView = null;

// ---- Abrir formulario ----
function abrirFormulario(fecha) {
  const formSection = document.getElementById("nueva-tarea");
  const fechaInput = document.getElementById("fecha");
  const widgetContent = document.getElementById("widget-content");

  if (!formSection || !fechaInput) return;

  previousView = getView();
  formSection.classList.remove("hidden");
  fechaInput.value = fecha;
  if (widgetContent) widgetContent.style.display = "none";
}
// ---- Cerrar formulario ----
function cerrarFormulario() {
  const formSection = document.getElementById("nueva-tarea");
  const widgetContent = document.getElementById("widget-content");

  if (formSection) formSection.classList.add("hidden");
  if (widgetContent) widgetContent.style.display = "grid";

  if (previousView) {
    setView(previousView);
    previousView = null;
  }
  render();
}

// ---- Guardar nueva tarea ----
const taskForm = document.getElementById("taskForm");
if (taskForm) {
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo")?.value?.trim();
    const nota = document.getElementById("nota")?.value?.trim() || "";
    const fecha = document.getElementById("fecha")?.value;

    // Hora en formato AM/PM
    const hora = document.getElementById("hora")?.value;
    const minuto = document.getElementById("minuto")?.value.padStart(2, "0");
    const ampm = document.getElementById("ampm")?.value;
    let horaFinal = null;
    if (hora && minuto && ampm) {
      horaFinal = `${hora}:${minuto} ${ampm}`;
    }

    const alarma = document.getElementById("alarma")?.checked || false;
    const intervaloRaw = document.getElementById("intervalo")?.value;
    const intervalo = intervaloRaw ? Number(intervaloRaw) : null;

    if (!titulo || !fecha) return;

    const tasks = loadTasks();
    tasks.push({
      id: Date.now(),
      titulo,
      nota,
      fecha,
      hora: horaFinal,
      alarma,
      intervalo,
      completada: false
    });
    saveTasks(tasks);

    cerrarFormulario();
  });
}

// ---- Delegación de eventos para botones de vista ----
widget?.addEventListener("click", (e) => {
  const btn = e.target.closest(".view-btn");
  if (!btn) return;

  const formAbierto = !document.getElementById("nueva-tarea")?.classList.contains("hidden");
  if (formAbierto) {
    // Si el formulario está abierto, actualizamos la vista que se restaurará
    previousView = btn.dataset.view;
  } else {
    setView(btn.dataset.view);
    render();
  }
});

// ---- Bind robusto para clics en celdas ----
function bindDayClicks() {
  const content = document.getElementById("widget-content");
  if (!content) return;

  content.addEventListener("click", (e) => {
    // Ignorar clics en botones de tarea
    if (e.target.closest(".complete-btn, .delete-btn")) return;

    // Buscar la celda más cercana
    const cell = e.target.closest(".day-cell[data-date], .month-cell[data-date]");
    if (!cell) return;

    abrirFormulario(cell.dataset.date);
  }, { capture: true });
}

// ---- Inicializar ----
document.addEventListener("DOMContentLoaded", () => {
  // Forzar clase inicial según toggle
  if (toggle.checked) {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
  } else {
    document.body.classList.add("light-mode");
    document.body.classList.remove("dark-mode");
  }

  render();
});
