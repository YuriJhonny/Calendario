// Data structure for appointments
let appointments = [];

// Current displayed month and year
let currentDate = new Date();

// Holiday data for 2025 with date, name, and type
const holidays = [
  { data: "2025-01-01", nome: "Confraternização Universal", tipo: "Nacional" },
  { data: "2025-04-18", nome: "Paixão de Cristo", tipo: "Nacional" },
  { data: "2025-04-21", nome: "Tiradentes", tipo: "Nacional" },
  { data: "2025-05-01", nome: "Dia do Trabalho", tipo: "Nacional" },
  { data: "2025-09-07", nome: "Independência do Brasil", tipo: "Nacional" },
  { data: "2025-09-20", nome: "Revolução Farroupilha", tipo: "Estadual (RS)" },
  { data: "2025-10-12", nome: "Nossa Senhora Aparecida", tipo: "Nacional" },
  { data: "2025-11-02", nome: "Finados", tipo: "Nacional" },
  { data: "2025-11-15", nome: "Proclamação da República", tipo: "Nacional" },
  { data: "2025-11-20", nome: "Dia da Consciência Negra", tipo: "Nacional" },
  { data: "2025-12-25", nome: "Natal", tipo: "Nacional" }
];

// Function to check if a date is a holiday and return holiday info
function getHolidayInfo(dateStr) {
  return holidays.find(h => h.data === dateStr);
}

// Selected date for adding/editing appointments
let selectedDate = null;

// Editing appointment id
let editingId = null;

// DOM elements
const monthYearEl = document.getElementById('month-year');
const calendarEl = document.getElementById('calendar');
const appointmentsListEl = document.getElementById('appointments-list');
const searchInput = document.getElementById('search-appointments');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const appointmentForm = document.getElementById('appointment-form');
const btnCancel = document.getElementById('btn-cancel');

// Utility functions
function formatDate(date) {
  return date.toISOString().split('T')[0];
}
function isSameDate(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Render calendar header month and year
function renderMonthYear() {
  const options = { year: 'numeric', month: 'long' };
  monthYearEl.textContent = currentDate.toLocaleDateString('pt-BR', options);
}

// Generate calendar grid
function renderCalendar() {
  calendarEl.innerHTML = '';
  // Day names
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  dayNames.forEach(day => {
    const dayNameEl = document.createElement('div');
    dayNameEl.className = 'day-name';
    dayNameEl.textContent = day;
    calendarEl.appendChild(dayNameEl);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month
  const firstDay = new Date(year, month, 1);
  // Last day of month
  const lastDay = new Date(year, month + 1, 0);
  // Day of week for first day (0=Sun, 6=Sat)
  const firstDayWeekday = firstDay.getDay();

  // Days from previous month to show
  const prevMonthDays = firstDayWeekday;

  // Total days in current month
  const daysInMonth = lastDay.getDate();

  // Calculate total cells to show (prev + current + next)
  const totalCells = Math.ceil((prevMonthDays + daysInMonth) / 7) * 7;

  // Start date for grid (may be in previous month)
  const startDate = new Date(year, month, 1 - prevMonthDays);

  for (let i = 0; i < totalCells; i++) {
    const dayDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    dayEl.setAttribute('tabindex', '0');
    dayEl.setAttribute('role', 'gridcell');
    dayEl.setAttribute('aria-label', dayDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    // Mark inactive days (previous or next month)
    if (dayDate.getMonth() !== month) {
      dayEl.classList.add('inactive');
    }

    // Highlight today
    if (isSameDate(dayDate, getToday())) {
      dayEl.classList.add('today');
    }

  // Date number
  const dateNumber = document.createElement('div');
  dateNumber.className = 'date-number';
  dateNumber.textContent = dayDate.getDate();
  dayEl.appendChild(dateNumber);

  // Check if holiday
  const holiday = getHolidayInfo(formatDate(dayDate));
  if (holiday) {
    dayEl.classList.add('holiday');
    const holidayLabel = document.createElement('div');
    holidayLabel.className = 'holiday-label';
    holidayLabel.textContent = holiday.nome;
    holidayLabel.style.color = 'red';
    holidayLabel.style.fontWeight = 'bold';
    holidayLabel.style.fontSize = '0.75rem';
    dayEl.appendChild(holidayLabel);
  }

  // Appointment dots for this day
  const dotsContainer = document.createElement('div');
  dotsContainer.style.display = 'flex';
  dotsContainer.style.gap = '4px';
  dotsContainer.style.marginTop = 'auto';

  // Find appointments for this day
  const dayAppointments = appointments.filter(app => app.date === formatDate(dayDate));
  dayAppointments.forEach(app => {
    const dot = document.createElement('div');
    dot.className = 'appointment-dot';
    // Color code by status
    const appDateTime = new Date(app.date + 'T' + app.time);
    const now = new Date();
    if (appDateTime < now) {
      dot.style.backgroundColor = '#6c757d'; // gray overdue
    } else if (isSameDate(dayDate, getToday())) {
      dot.style.backgroundColor = '#f39c12'; // yellow today
    } else {
      dot.style.backgroundColor = '#1a73e8'; // blue future
    }
    dotsContainer.appendChild(dot);
  });
  dayEl.appendChild(dotsContainer);

    // Click to add appointment on this date
    if (!dayEl.classList.contains('inactive')) {
      dayEl.addEventListener('click', () => openModalForDate(dayDate));
      dayEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModalForDate(dayDate);
        }
      });
    }

    calendarEl.appendChild(dayEl);
  }
}

let selectionMode = false;
let selectedAppointments = new Set();

// Render appointment list filtered by search and selected date
function renderAppointments() {
  const searchTerm = searchInput.value.toLowerCase();
  appointmentsListEl.innerHTML = '';

  // Filter appointments by search term
  const filtered = appointments.filter(app => {
    return app.title.toLowerCase().includes(searchTerm) ||
           app.description.toLowerCase().includes(searchTerm) ||
           app.type.toLowerCase().includes(searchTerm);
  });

  if (filtered.length === 0) {
    appointmentsListEl.textContent = 'Nenhum compromisso encontrado.';
    return;
  }

  filtered.forEach(app => {
    const appEl = document.createElement('div');
    appEl.className = 'appointment';
    appEl.setAttribute('data-id', app.id);

    // Determine status class
    const appDateTime = new Date(app.date + 'T' + app.time);
    const now = new Date();
    if (appDateTime < now) {
      appEl.classList.add('overdue');
    } else if (isSameDate(new Date(app.date), getToday())) {
      appEl.classList.add('today');
    } else {
      appEl.classList.add('future');
    }

    // Appointment text
    const textEl = document.createElement('div');
    textEl.textContent = `${app.time} - ${app.title}`;
    textEl.title = app.description;
    appEl.appendChild(textEl);

    if (selectionMode) {
      // Add checkbox for selection
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selectedAppointments.has(app.id);
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          selectedAppointments.add(app.id);
        } else {
          selectedAppointments.delete(app.id);
        }
      });
      appEl.insertBefore(checkbox, textEl);
      // Disable click on appointment to open modal in selection mode
      appEl.style.cursor = 'default';
      appEl.removeEventListener('click', () => openModalForEdit(app.id));
    } else {
      // Actions: edit and delete
      const actionsEl = document.createElement('div');
      actionsEl.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.classList.add('edit-btn');
      editBtn.title = 'Editar compromisso';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModalForEdit(app.id);
      });
      actionsEl.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('delete-btn');
      deleteBtn.title = 'Excluir compromisso';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteAppointment(app.id);
      });
      actionsEl.appendChild(deleteBtn);

      appEl.appendChild(actionsEl);
      appEl.style.cursor = 'pointer';
    }

    appointmentsListEl.appendChild(appEl);
  });
}

function animateModalOpen() {
  const modalContent = document.getElementById('modal-content');
  modalContent.style.opacity = '0';
  modalContent.style.transform = 'scale(0.8)';
  modal.classList.add('active');
  setTimeout(() => {
    modalContent.style.transition = 'opacity 1s ease, transform 1s ease';
    modalContent.style.opacity = '1';
    modalContent.style.transform = 'scale(1)';
  }, 10);
}

function animateModalClose() {
  const modalContent = document.getElementById('modal-content');
  modalContent.style.transition = 'opacity 1s ease, transform 1s ease';
  modalContent.style.opacity = '0';
  modalContent.style.transform = 'scale(0.8)';
  setTimeout(() => {
    modal.classList.remove('active');
  }, 1000);
}

// Open modal to add appointment for a date
function openModalForDate(date) {
  selectedDate = date;
  editingId = null;
  modalTitle.textContent = 'Adicionar Compromisso';
  appointmentForm.reset();
  appointmentForm.date.value = formatDate(date);
  appointmentForm.time.value = '09:00';
  animateModalOpen();
  appointmentForm.title.focus();
}

// Open modal to edit existing appointment
function openModalForEdit(id) {
  const app = appointments.find(a => a.id === id);
  if (!app) return;
  editingId = id;
  modalTitle.textContent = 'Editar Compromisso';
  appointmentForm.title.value = app.title;
  appointmentForm.date.value = app.date;
  appointmentForm.time.value = app.time;
  appointmentForm.description.value = app.description;
  appointmentForm.type.value = app.type;
  appointmentForm.reminder.value = app.reminder;
  animateModalOpen();
  appointmentForm.title.focus();
}

// Close modal
function closeModal() {
  animateModalClose();
  editingId = null;
  selectedDate = null;
}

// Save appointment from form
function saveAppointment(e) {
  e.preventDefault();
  const title = appointmentForm.title.value.trim();
  const date = appointmentForm.date.value;
  const time = appointmentForm.time.value;
  const description = appointmentForm.description.value.trim();
  const type = appointmentForm.type.value;
  const reminder = parseInt(appointmentForm.reminder.value, 10);

  if (!title || !date || !time) {
    alert('Por favor, preencha os campos obrigatórios.');
    return;
  }

  if (editingId) {
    // Update existing
    const index = appointments.findIndex(a => a.id === editingId);
    if (index !== -1) {
      appointments[index] = { id: editingId, title, date, time, description, type, reminder };
    }
  } else {
    // Add new
    const id = Date.now().toString();
    appointments.push({ id, title, date, time, description, type, reminder });
  }

  closeModal();
  renderCalendar();
  renderAppointments();
  saveToStorage();
}

function createConfetti(x, y) {
  const confetti = document.createElement('div');
  confetti.classList.add('confetti');
  confetti.style.left = `${x}px`;
  confetti.style.top = `${y}px`;
  confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
  confetti.style.setProperty('--x', (Math.random() - 0.5).toFixed(2));
  confetti.style.setProperty('--y', (Math.random() - 0.5).toFixed(2));
  document.body.appendChild(confetti);
  setTimeout(() => {
    confetti.remove();
  }, 2000);
}

let deleteConfirmResolve = null;

function showDeleteModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'block';

    const btnYes = document.getElementById('delete-yes');
    const btnNo = document.getElementById('delete-no');

    function cleanup() {
      btnYes.removeEventListener('click', onYes);
      btnNo.removeEventListener('click', onNo);
      modal.style.display = 'none';
    }

    function onYes() {
      cleanup();
      resolve(true);
    }

    function onNo() {
      cleanup();
      resolve(false);
    }

    btnYes.addEventListener('click', onYes);
    btnNo.addEventListener('click', onNo);
  });
}

async function deleteAppointment(id) {
  const confirmed = await showDeleteModal();
  if (!confirmed) return;

  const appointmentElement = document.querySelector(`.appointment[data-id="${id}"]`);
  if (!appointmentElement) {
    // Fallback if element not found
    appointments = appointments.filter(a => a.id !== id);
    renderCalendar();
    renderAppointments();
    saveToStorage();
    return;
  }

  // Animate: move right and fade out
  appointmentElement.style.transition = 'transform 1s ease, opacity 1s ease';
  appointmentElement.style.transform = 'translateX(100%)';
  appointmentElement.style.opacity = '0';

  // Remove appointment after animation
  setTimeout(() => {
    appointments = appointments.filter(a => a.id !== id);
    renderCalendar();
    renderAppointments();
    saveToStorage();
  }, 1000);
}

// Navigate months and years
document.getElementById('prev-year').addEventListener('click', () => {
  currentDate.setFullYear(currentDate.getFullYear() - 1);
  renderMonthYear();
  renderCalendar();
});
document.getElementById('prev-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderMonthYear();
  renderCalendar();
});
document.getElementById('next-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderMonthYear();
  renderCalendar();
});
document.getElementById('next-year').addEventListener('click', () => {
  currentDate.setFullYear(currentDate.getFullYear() + 1);
  renderMonthYear();
  renderCalendar();
});

// Search input event
searchInput.addEventListener('input', renderAppointments);

// Modal cancel button
btnCancel.addEventListener('click', (e) => {
  e.preventDefault();
  closeModal();
});

// Modal form submit
appointmentForm.addEventListener('submit', saveAppointment);

// Save appointments to localStorage
function saveToStorage() {
  localStorage.setItem('agenda_mei_appointments', JSON.stringify(appointments));
}

// Load appointments from localStorage
function loadFromStorage() {
  const data = localStorage.getItem('agenda_mei_appointments');
  if (data) {
    appointments = JSON.parse(data);
  }
}

// Notification check (pop-up inside system)
function checkNotifications() {
  const now = new Date();
  appointments.forEach(app => {
    const appDateTime = new Date(app.date + 'T' + app.time);
    const reminderTime = new Date(appDateTime.getTime() - app.reminder * 60000);
    if (now >= reminderTime && now < appDateTime && !app.notified) {
      alert(`Lembrete: ${app.title} às ${app.time} em ${app.date}`);
      app.notified = true;
      saveToStorage();
    }
  });
}

// Initialize
function init() {
  loadFromStorage();
  renderMonthYear();
  renderCalendar();
  renderAppointments();
  setInterval(checkNotifications, 60000); // check every minute
}

document.getElementById('btn-select').addEventListener('click', () => {
  selectionMode = !selectionMode;
  selectedAppointments.clear();
  document.getElementById('bulk-actions').style.display = selectionMode ? 'block' : 'none';
  document.getElementById('btn-select').textContent = selectionMode ? 'Cancelar Seleção' : 'Selecionar';
  renderAppointments();
});

document.getElementById('btn-delete-selected').addEventListener('click', () => {
  if (selectedAppointments.size === 0) {
    alert('Nenhum compromisso selecionado para excluir.');
    return;
  }
  if (confirm(`Tem certeza que deseja excluir ${selectedAppointments.size} compromissos selecionados?`)) {
    appointments = appointments.filter(app => !selectedAppointments.has(app.id));
    selectedAppointments.clear();
    selectionMode = false;
    document.getElementById('bulk-actions').style.display = 'none';
    document.getElementById('btn-select').textContent = 'Selecionar';
    renderCalendar();
    renderAppointments();
    saveToStorage();
  }
});

document.getElementById('btn-edit-selected').addEventListener('click', () => {
  if (selectedAppointments.size !== 1) {
    alert('Por favor, selecione exatamente um compromisso para editar.');
    return;
  }
  const id = Array.from(selectedAppointments)[0];
  openModalForEdit(id);
  selectionMode = false;
  selectedAppointments.clear();
  document.getElementById('bulk-actions').style.display = 'none';
  document.getElementById('btn-select').textContent = 'Selecionar';
  renderAppointments();
});

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

init();
