const activityRows = document.querySelector("#activity-rows");
const activityCount = document.querySelector("#activity-count");
const calendarDays = document.querySelector("#calendar-days");
const calendarMonthTitle = document.querySelector("#calendar-month-title");
const calendarActivityCount = document.querySelector("#calendar-activity-count");
const calendarPreviousButton = document.querySelector("#calendar-previous");
const calendarNextButton = document.querySelector("#calendar-next");
const calendarTodayButton = document.querySelector("#calendar-today");
const addActivityButton = document.querySelector("#add-activity-button");
const activityDialog = document.querySelector("#activity-dialog");
const activityForm = document.querySelector("#activity-form");
const activityDialogTitle = document.querySelector("#activity-dialog-title");
const activityFeedback = document.querySelector("#activity-feedback");
const saveActivityButton = document.querySelector("#save-activity");
const activityResponsibleOptions = document.querySelector("#activity-responsible-options");
const deleteActivityDialog = document.querySelector("#delete-activity-dialog");
const deleteActivityForm = document.querySelector("#delete-activity-form");
const deleteActivityName = document.querySelector("#delete-activity-name");
const deleteFeedback = document.querySelector("#delete-feedback");
const confirmDeleteButton = document.querySelector("#confirm-delete");
const stateRows = document.querySelector("#state-rows");
const stateSummaryCount = document.querySelector("#state-summary-count");
const stateForm = document.querySelector("#state-form");
const stateNameInput = document.querySelector("#new-state-name");
const stateFeedback = document.querySelector("#state-feedback");
const saveStateButton = document.querySelector("#save-state");
const projectProgress = document.querySelector("#project-progress");
const projectProgressBar = document.querySelector("#project-progress-bar");
const trackedActivityCount = document.querySelector("#tracked-activity-count");
const availableStateCount = document.querySelector("#available-state-count");
const activityStateSelect = document.querySelector("#activity-state-select");
const teamGrid = document.querySelector("#team-grid");
const teamCount = document.querySelector("#team-count");
const teamNotice = document.querySelector("#team-notice");
const addMemberButton = document.querySelector("#add-member-button");
const memberDialog = document.querySelector("#member-dialog");
const memberForm = document.querySelector("#member-form");
const formFeedback = document.querySelector("#form-feedback");
const saveMemberButton = document.querySelector("#save-member");
const memberDialogTitle = document.querySelector("#member-dialog-title");
const deleteMemberDialog = document.querySelector("#delete-member-dialog");
const deleteMemberForm = document.querySelector("#delete-member-form");
const deleteMemberName = document.querySelector("#delete-member-name");
const deleteMemberImpact = document.querySelector("#delete-member-impact");
const deleteMemberFeedback = document.querySelector("#delete-member-feedback");
const confirmDeleteMemberButton = document.querySelector("#confirm-delete-member");
const assignmentDialog = document.querySelector("#assignment-dialog");
const assignmentForm = document.querySelector("#assignment-form");
const assignmentActivityName = document.querySelector("#assignment-activity-name");
const assignmentLegacy = document.querySelector("#assignment-legacy");
const responsibleOptions = document.querySelector("#responsible-options");
const assignmentFeedback = document.querySelector("#assignment-feedback");
const saveAssignmentButton = document.querySelector("#save-assignment");
const pageTitle = document.querySelector("#page-title");
const pageIntro = document.querySelector("#page-intro");
const databaseUrl = "https://rutix-d29bf-default-rtdb.firebaseio.com";
const activitiesUrl = `${databaseUrl}/actividades`;
const teamUrl = `${databaseUrl}/equipo.json`;
const statesUrl = `${databaseUrl}/estados.json`;
const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "UTC"
});
let teamNodeAvailable = false;
let activityCrudAvailable = false;
let currentActivities = [];
let currentProjectData = null;
let selectedActivityId = null;
let editingActivityId = null;
let deletingActivityId = null;
let editingMemberId = null;
let deletingMemberId = null;
let statusManagementAvailable = false;
let currentStatuses = [];
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const calendarMonthFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
  timeZone: "UTC"
});

function displayValue(value) {
  return value == null || value === "" ? "—" : String(value);
}

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? String(value) : dateFormatter.format(date);
}

function calculateDurationDays(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const startTime = Date.parse(`${startDate}T00:00:00Z`);
  const endTime = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) return null;
  return Math.floor((endTime - startTime) / 86400000) + 1;
}

function activityDuration(activity) {
  return calculateDurationDays(activity?.fecha_inicio, activity?.fecha_fin) ?? activity?.dias;
}

function parseCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function calendarDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function updateActivityDuration(clearIncomplete = false) {
  const startDate = activityForm.elements.fecha_inicio.value;
  const endDate = activityForm.elements.fecha_fin.value;
  const duration = calculateDurationDays(startDate, endDate);
  if (duration !== null) {
    activityForm.elements.dias.value = String(duration);
    activityForm.elements.fecha_fin.setCustomValidity("");
    return;
  }

  if (startDate && endDate) {
    activityForm.elements.fecha_fin.setCustomValidity("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
  } else {
    activityForm.elements.fecha_fin.setCustomValidity("");
  }
  if (clearIncomplete) activityForm.elements.dias.value = "";
}

function statusClass(value) {
  const normalizedStatus = String(value ?? "").toLocaleLowerCase("es");
  if (normalizedStatus.includes("sin empezar")) return "status-pending";
  if (normalizedStatus.includes("progreso")) return "status-active";
  if (normalizedStatus.includes("complet")) return "status-complete";
  return "status-neutral";
}

function formatAdvance(value) {
  if (value == null || value === "") return "—";
  const advance = Number(value);
  if (!Number.isFinite(advance)) return "—";
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(advance * 100)}%`;
}

function showMessage(message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 8;
  cell.className = "table-message";
  cell.setAttribute("aria-live", "polite");
  cell.textContent = message;
  row.append(cell);
  activityRows.replaceChildren(row);
}

function toTeamMembers(team) {
  if (Array.isArray(team)) {
    return team.filter((member) => member && typeof member === "object")
      .map((member, index) => ({ ...member, id: String(index) }));
  }
  if (!team || typeof team !== "object") return [];
  return Object.entries(team)
    .filter(([, member]) => member && typeof member === "object")
    .map(([id, member]) => ({ ...member, id }));
}

function isActivityCollection(value) {
  return Array.isArray(value) || (value !== null && typeof value === "object");
}

function toActivityRecords(collection) {
  const entries = Array.isArray(collection)
    ? collection.map((activity, index) => [String(index), activity])
    : Object.entries(collection ?? {});
  return entries
    .filter(([, activity]) => activity && typeof activity === "object")
    .map(([id, activity]) => ({ id, data: activity }));
}

function activityResponsibleIds(activity) {
  const ids = Array.isArray(activity?.responsablesIds)
    ? activity.responsablesIds
    : activity?.responsableId ? [activity.responsableId] : [];
  return [...new Set(ids.filter((id) => typeof id === "string" && id))];
}

function renderAssigneeOptions(container, selectedIds, idPrefix) {
  container.replaceChildren();
  if (teamMembers.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "assignee-empty";
    emptyMessage.textContent = "Agrega integrantes en la pestaña Equipo para asignarlos.";
    container.append(emptyMessage);
    return;
  }

  teamMembers.forEach((member, index) => {
    const label = document.createElement("label");
    label.className = "assignee-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "responsablesIds";
    checkbox.value = member.id;
    checkbox.checked = selectedIds.includes(member.id);
    checkbox.id = `${idPrefix}-${index}`;
    const text = document.createElement("span");
    text.textContent = formatMember(member);
    label.htmlFor = checkbox.id;
    label.append(checkbox, text);
    container.append(label);
  });
}

function selectedAssigneeIds(form) {
  return [...new Set(new FormData(form).getAll("responsablesIds").filter(Boolean))];
}

function assigneeLabel(ids) {
  return ids
    .map((id) => teamMembers.find((member) => member.id === id))
    .filter(Boolean)
    .map(formatMember)
    .join(" · ");
}

function toStatusRecords(statuses) {
  const entries = Array.isArray(statuses)
    ? statuses.map((status, index) => [String(index), status])
    : Object.entries(statuses ?? {});
  return entries
    .map(([id, status]) => ({
      id,
      nombre: typeof status === "string" ? status : status?.nombre
    }))
    .filter((status) => typeof status.nombre === "string" && status.nombre.trim());
}

function trackedActivities() {
  return currentActivities.filter(({ data }) => {
    const name = String(data?.actividad ?? "").trim();
    if (!name) return false;
    const hasTrackingData = [
      data.estado,
      data.avance,
      data.fecha_inicio,
      data.fecha_fin,
      data.dias,
      data.responsableId,
      ...(Array.isArray(data.responsablesIds) ? data.responsablesIds : [])
    ].some((value) => value != null && value !== "");
    if (hasTrackingData) return true;
    return !/^FASE(?:\s|$)/i.test(name);
  });
}

function normalizedStatus(value) {
  return String(value ?? "").trim().toLocaleLowerCase("es");
}

function populateActivityStateSelect(selectedStatus = "") {
  activityStateSelect.replaceChildren();
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Sin estado";
  activityStateSelect.append(emptyOption);

  const statusNames = [...currentStatuses];
  if (selectedStatus && !statusNames.some((status) => normalizedStatus(status) === normalizedStatus(selectedStatus))) {
    statusNames.push(selectedStatus);
  }
  statusNames.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    activityStateSelect.append(option);
  });
  activityStateSelect.value = selectedStatus;
}

function renderStates(statuses) {
  const statusRecords = toStatusRecords(statuses);
  const namesByKey = new Map();
  statusRecords.forEach(({ nombre }) => namesByKey.set(normalizedStatus(nombre), nombre.trim()));
  trackedActivities().forEach(({ data }) => {
    const name = String(data.estado ?? "").trim();
    if (name && !namesByKey.has(normalizedStatus(name))) namesByKey.set(normalizedStatus(name), name);
  });

  currentStatuses = [...namesByKey.values()];
  availableStateCount.textContent = String(currentStatuses.length);
  stateNameInput.disabled = !statusManagementAvailable;
  saveStateButton.disabled = !statusManagementAvailable;
  stateForm.title = statusManagementAvailable
    ? ""
    : "Actualiza Firebase con la estructura del proyecto para agregar estados";
  populateActivityStateSelect(activityForm.elements.estado.value);

  const activities = trackedActivities();
  const averageAdvance = activities.length === 0
    ? 0
    : activities.reduce((total, { data }) => {
      const value = Number(data.avance);
      return total + (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);
    }, 0) / activities.length;
  projectProgress.textContent = formatAdvance(averageAdvance);
  projectProgressBar.style.width = `${Math.min(100, Math.max(0, averageAdvance * 100))}%`;
  trackedActivityCount.textContent = String(activities.length);

  const counts = new Map(currentStatuses.map((name) => [normalizedStatus(name), 0]));
  let withoutStatus = 0;
  activities.forEach(({ data }) => {
    const key = normalizedStatus(data.estado);
    if (!key) {
      withoutStatus += 1;
      return;
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const summary = currentStatuses.map((name) => ({
    name,
    count: counts.get(normalizedStatus(name)) ?? 0
  }));
  if (withoutStatus > 0) summary.push({ name: "Sin estado", count: withoutStatus });
  stateSummaryCount.textContent = summary.length === 1 ? "1 estado" : `${summary.length} estados`;

  if (summary.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "table-message";
    cell.textContent = "Aún no hay estados ni actividades con seguimiento.";
    row.append(cell);
    stateRows.replaceChildren(row);
    return;
  }

  const rows = summary.map(({ name, count }) => {
    const row = document.createElement("tr");
    const stateCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status-badge ${statusClass(name)}`;
    badge.textContent = name;
    stateCell.append(badge);

    const countCell = document.createElement("td");
    countCell.className = "state-count-cell";
    countCell.textContent = `${count} / ${activities.length}`;

    const percentage = activities.length === 0 ? 0 : (count / activities.length) * 100;
    const percentageCell = document.createElement("td");
    percentageCell.className = "state-percent-cell";
    percentageCell.textContent = `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(percentage)}%`;

    const distributionCell = document.createElement("td");
    const track = document.createElement("span");
    track.className = "state-distribution-track";
    const fill = document.createElement("span");
    fill.className = "state-distribution-fill";
    fill.style.width = `${Math.min(100, percentage)}%`;
    track.append(fill);
    distributionCell.append(track);
    row.append(stateCell, countCell, percentageCell, distributionCell);
    return row;
  });
  stateRows.replaceChildren(...rows);
}

function initials(name) {
  return String(name ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase("es")).join("") || "?";
}

function renderTeam(team) {
  teamMembers = toTeamMembers(team);
  teamCount.textContent = teamMembers.length === 1 ? "1 integrante" : `${teamMembers.length} integrantes`;
  addMemberButton.disabled = !teamNodeAvailable;
  teamNotice.hidden = teamNodeAvailable;
  teamNotice.textContent = teamNodeAvailable
    ? ""
    : "Copia la nueva estructura de actividades_rutix.json en Firebase para habilitar el alta de integrantes.";
  teamGrid.replaceChildren();

  if (teamMembers.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "team-empty";
    const title = document.createElement("h3");
    title.textContent = "Aún no hay integrantes";
    const description = document.createElement("p");
    description.textContent = teamNodeAvailable
      ? "Agrega las personas que tendrán responsabilidades en el proyecto."
      : "El equipo aparecerá aquí cuando el nodo equipo esté disponible en Firebase.";
    emptyState.append(title, description);
    teamGrid.append(emptyState);
    return;
  }

  const cards = teamMembers.map((member) => {
    const card = document.createElement("article");
    card.className = "team-card";

    const header = document.createElement("div");
    header.className = "member-card-header";
    const avatar = document.createElement("span");
    avatar.className = "member-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initials(member.nombre);

    const identity = document.createElement("div");
    identity.className = "member-identity";
    const name = document.createElement("h3");
    name.textContent = displayValue(member.nombre);
    const role = document.createElement("p");
    role.className = "member-role";
    role.textContent = displayValue(member.rol);
    identity.append(name, role);
    header.append(avatar, identity);

    const contacts = document.createElement("div");
    contacts.className = "member-contacts";
    if (member.correo) {
      const email = document.createElement("p");
      email.textContent = String(member.correo);
      contacts.append(email);
    }
    if (member.telefono) {
      const phone = document.createElement("p");
      phone.textContent = String(member.telefono);
      contacts.append(phone);
    }

    const actions = document.createElement("div");
    actions.className = "member-card-actions";
    const editButton = document.createElement("button");
    editButton.className = "row-action";
    editButton.type = "button";
    editButton.textContent = "Editar";
    editButton.disabled = !teamNodeAvailable;
    editButton.addEventListener("click", () => openMemberDialog(member));
    const deleteButton = document.createElement("button");
    deleteButton.className = "row-action row-action-danger";
    deleteButton.type = "button";
    deleteButton.textContent = "Eliminar";
    deleteButton.disabled = !teamNodeAvailable;
    deleteButton.addEventListener("click", () => openDeleteMemberDialog(member));
    actions.append(editButton, deleteButton);
    card.append(header, contacts, actions);
    return card;
  });
  teamGrid.replaceChildren(...cards);
}

function openMemberDialog(member = null) {
  if (!teamNodeAvailable) return;
  editingMemberId = member?.id ?? null;
  memberForm.reset();
  memberForm.elements.nombre.value = member?.nombre ?? "";
  memberForm.elements.rol.value = member?.rol ?? "";
  memberForm.elements.correo.value = member?.correo ?? "";
  memberForm.elements.telefono.value = member?.telefono ?? "";
  memberDialogTitle.textContent = editingMemberId === null ? "Nuevo integrante" : "Editar integrante";
  saveMemberButton.textContent = editingMemberId === null ? "Guardar integrante" : "Guardar cambios";
  formFeedback.hidden = true;
  memberDialog.showModal();
  memberForm.elements.nombre.focus();
}

function openDeleteMemberDialog(member) {
  if (!teamNodeAvailable) return;
  deletingMemberId = member.id;
  const assignedCount = currentActivities.filter((record) => activityResponsibleIds(record.data).includes(member.id)).length;
  deleteMemberName.textContent = displayValue(member.nombre);
  deleteMemberImpact.textContent = assignedCount === 0
    ? ""
    : `${assignedCount} ${assignedCount === 1 ? "actividad tiene" : "actividades tienen"} asignada esta persona. Se quitará el vínculo al equipo y se conservará el nombre como responsable histórico.`;
  deleteMemberImpact.hidden = assignedCount === 0;
  deleteMemberFeedback.hidden = true;
  deleteMemberDialog.showModal();
}

function formatMember(member) {
  const name = displayValue(member.nombre);
  const role = displayValue(member.rol);
  return role === "—" ? name : `${role} / ${name}`;
}

function openAssignment(activityId) {
  if (!teamNodeAvailable || teamMembers.length === 0) return;
  selectedActivityId = activityId;
  const activity = currentActivities.find((record) => record.id === activityId)?.data;
  if (!activity) return;
  assignmentActivityName.textContent = displayValue(activity?.actividad);
  const assignedIds = activityResponsibleIds(activity);
  assignmentLegacy.textContent = assignedIds.length === 0 && activity.responsable
    ? `Responsable registrado: ${activity.responsable}`
    : "";
  assignmentLegacy.hidden = !assignmentLegacy.textContent;
  assignmentFeedback.hidden = true;
  renderAssigneeOptions(responsibleOptions, assignedIds, "assignment-member");
  assignmentDialog.showModal();
  responsibleOptions.querySelector("input")?.focus();
}

function renderActivities(activities) {
  if (!isActivityCollection(activities)) {
    throw new Error("La respuesta de Firebase no tiene el formato esperado.");
  }
  currentActivities = toActivityRecords(activities);
  activityCount.textContent = currentActivities.length === 1 ? "1 actividad" : `${currentActivities.length} actividades`;
  if (currentActivities.length === 0) {
    showMessage("Aún no hay actividades en el cronograma.");
    return;
  }

  const rows = currentActivities.map(({ id, data: activity }) => {
    const row = document.createElement("tr");
    const columnLabels = ["Actividad", "Responsable", "Fecha de inicio", "N.º de días", "Fecha de fin", "Avance", "Estado", "Acciones"];
    const values = [
      displayValue(activity?.actividad),
      null,
      displayDate(activity?.fecha_inicio),
      displayValue(activityDuration(activity)),
      displayDate(activity?.fecha_fin),
      formatAdvance(activity?.avance),
      displayValue(activity?.estado),
      null
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.dataset.label = columnLabels[index];
      if (index === 1) {
        const viewButton = document.createElement("button");
        viewButton.className = "responsibles-button";
        viewButton.type = "button";
        viewButton.textContent = "Ver responsables";
        viewButton.disabled = !teamNodeAvailable || teamMembers.length === 0;
        viewButton.title = viewButton.disabled
          ? "Agrega integrantes al equipo para administrar responsables"
          : "Ver, agregar o quitar responsables de esta actividad";
        viewButton.setAttribute("aria-label", `Ver responsables de ${activity.actividad ?? "la actividad"}`);
        viewButton.addEventListener("click", () => openAssignment(id));
        cell.append(viewButton);
      } else if (index === 5) {
        const advance = Number(activity?.avance);
        if (activity?.avance == null || activity.avance === "" || !Number.isFinite(advance)) {
          cell.textContent = "—";
        } else {
          const progress = document.createElement("div");
          progress.className = "progress-cell";
          const track = document.createElement("span");
          track.className = "progress-track";
          const fill = document.createElement("span");
          fill.className = "progress-fill";
          fill.style.width = `${Math.min(100, Math.max(0, advance * 100))}%`;
          track.append(fill);
          const percent = document.createElement("span");
          percent.className = "progress-value";
          percent.textContent = value;
          progress.append(track, percent);
          cell.append(progress);
        }
      } else if (index === 6) {
        const badge = document.createElement("span");
        badge.className = `status-badge ${statusClass(activity?.estado)}`;
        badge.textContent = value;
        cell.append(badge);
      } else if (index === 7) {
        const actions = document.createElement("div");
        actions.className = "row-actions";
        const editButton = document.createElement("button");
        editButton.className = "row-action";
        editButton.type = "button";
        editButton.textContent = "Editar";
        editButton.disabled = !activityCrudAvailable;
        editButton.addEventListener("click", () => openActivityDialog({ id, data: activity }));
        const deleteButton = document.createElement("button");
        deleteButton.className = "row-action row-action-danger";
        deleteButton.type = "button";
        deleteButton.textContent = "Eliminar";
        deleteButton.disabled = !activityCrudAvailable;
        deleteButton.addEventListener("click", () => openDeleteDialog({ id, data: activity }));
        actions.append(editButton, deleteButton);
        cell.append(actions);
      } else {
        cell.textContent = value;
      }
      row.append(cell);
    });
    return row;
  });

  activityRows.replaceChildren(...rows);
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const mondayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  const monthActivities = currentActivities.flatMap((record) => {
    const startDate = parseCalendarDate(record.data.fecha_inicio);
    const endDate = parseCalendarDate(record.data.fecha_fin);
    const firstDate = startDate ?? endDate;
    const lastDate = endDate && startDate && endDate >= startDate ? endDate : firstDate;
    if (!firstDate || !lastDate) return [];
    return [{ ...record, firstDate, lastDate }];
  }).filter(({ firstDate, lastDate }) => {
    const monthStart = Date.UTC(year, month, 1);
    const monthEnd = Date.UTC(year, month + 1, 0);
    return firstDate.getTime() <= monthEnd && lastDate.getTime() >= monthStart;
  });

  calendarMonthTitle.textContent = calendarMonthFormatter.format(firstOfMonth);
  calendarActivityCount.textContent = monthActivities.length === 1
    ? "1 actividad"
    : `${monthActivities.length} actividades`;

  const eventsByDay = new Map();
  monthActivities.forEach((record) => {
    const start = new Date(Math.max(record.firstDate.getTime(), Date.UTC(year, month, 1)));
    const end = new Date(Math.min(record.lastDate.getTime(), Date.UTC(year, month + 1, 0)));
    for (let time = start.getTime(); time <= end.getTime(); time += 86400000) {
      const key = calendarDateKey(new Date(time));
      const events = eventsByDay.get(key) ?? [];
      events.push(record);
      eventsByDay.set(key, events);
    }
  });

  const today = new Date();
  const todayKey = calendarDateKey(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));
  const cells = [];
  for (let index = 0; index < cellCount; index += 1) {
    const day = index - mondayOffset + 1;
    const inMonth = day >= 1 && day <= daysInMonth;
    const cell = document.createElement("div");
    cell.className = inMonth ? "calendar-day" : "calendar-day is-outside-month";
    cell.setAttribute("role", "gridcell");

    if (!inMonth) {
      cell.setAttribute("aria-hidden", "true");
      cells.push(cell);
      continue;
    }

    const date = new Date(Date.UTC(year, month, day));
    const key = calendarDateKey(date);
    cell.setAttribute("aria-label", `${day} ${calendarMonthFormatter.format(firstOfMonth)}`);
    if (key === todayKey) cell.classList.add("is-today");

    const dayNumber = document.createElement("span");
    dayNumber.className = "calendar-day-number";
    dayNumber.textContent = String(day);
    if (key === todayKey) {
      const todayMark = document.createElement("span");
      todayMark.className = "calendar-today-mark";
      todayMark.textContent = "Hoy";
      dayNumber.append(todayMark);
    }
    cell.append(dayNumber);

    const eventsContainer = document.createElement("div");
    eventsContainer.className = "calendar-events";
    (eventsByDay.get(key) ?? []).forEach(({ id, data: activity, firstDate: originalStart, lastDate: originalEnd }) => {
      const eventButton = document.createElement("button");
      eventButton.className = `calendar-event ${statusClass(activity.estado)}`;
      eventButton.type = "button";
      const startLabel = activity.fecha_inicio ? displayDate(activity.fecha_inicio) : "Inicio sin definir";
      const endLabel = activity.fecha_fin ? displayDate(activity.fecha_fin) : "Fin sin definir";
      eventButton.title = `${activity.actividad} · ${startLabel} – ${endLabel}`;
      eventButton.setAttribute("aria-label", `${activity.actividad}, ${startLabel} a ${endLabel}. Editar actividad.`);
      if (calendarDateKey(originalStart) === key) eventButton.classList.add("starts-today");
      if (calendarDateKey(originalEnd) === key) eventButton.classList.add("ends-today");
      eventButton.textContent = displayValue(activity.actividad);
      eventButton.addEventListener("click", () => openActivityDialog({ id, data: activity }));
      eventsContainer.append(eventButton);
    });
    cell.append(eventsContainer);
    cells.push(cell);
  }
  calendarDays.replaceChildren(...cells);
}

function openActivityDialog(record = null) {
  if (!activityCrudAvailable) return;
  editingActivityId = record?.id ?? null;
  const activity = record?.data ?? {};
  activityForm.reset();
  activityForm.elements.actividad.value = activity.actividad ?? "";
  activityForm.elements.responsable.value = activity.responsable ?? "";
  activityForm.elements.fecha_inicio.value = activity.fecha_inicio ?? "";
  activityForm.elements.dias.value = activity.dias ?? "";
  activityForm.elements.fecha_fin.value = activity.fecha_fin ?? "";
  activityForm.elements.avance.value = activity.avance ?? "";
  activityForm.elements.estado.value = activity.estado ?? "";
  activityForm.elements.fecha_fin.setCustomValidity("");
  updateActivityDuration();
  renderAssigneeOptions(activityResponsibleOptions, activityResponsibleIds(activity), "activity-member");
  populateActivityStateSelect(activity.estado ?? "");
  activityDialogTitle.textContent = editingActivityId === null ? "Nueva actividad" : "Editar actividad";
  saveActivityButton.textContent = editingActivityId === null ? "Guardar actividad" : "Guardar cambios";
  activityFeedback.hidden = true;
  activityDialog.showModal();
  activityForm.elements.actividad.focus();
}

function activityFromForm() {
  const formData = new FormData(activityForm);
  const days = String(formData.get("dias") ?? "").trim();
  const advance = String(formData.get("avance") ?? "").trim();
  const textValue = (name) => String(formData.get(name) ?? "").trim();
  const responsablesIds = selectedAssigneeIds(activityForm);

  return {
    actividad: textValue("actividad"),
    responsable: responsablesIds.length > 0 ? assigneeLabel(responsablesIds) : textValue("responsable") || null,
    responsableId: responsablesIds.length === 1 ? responsablesIds[0] : null,
    responsablesIds: responsablesIds.length > 0 ? responsablesIds : null,
    fecha_inicio: textValue("fecha_inicio") || null,
    dias: calculateDurationDays(textValue("fecha_inicio"), textValue("fecha_fin"))
      ?? (days === "" ? null : Number(days)),
    fecha_fin: textValue("fecha_fin") || null,
    avance: advance === "" ? null : Number(advance),
    estado: textValue("estado") || null
  };
}

function openDeleteDialog(record) {
  if (!activityCrudAvailable) return;
  deletingActivityId = record.id;
  deleteActivityName.textContent = displayValue(record.data.actividad);
  deleteFeedback.hidden = true;
  deleteActivityDialog.showModal();
}

function activateTab(tab) {
  document.querySelectorAll('[role="tab"]').forEach((item) => {
    const selected = item === tab;
    item.classList.toggle("is-active", selected);
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.querySelector(`#${item.getAttribute("aria-controls")}`).hidden = !selected;
  });
  pageTitle.textContent = tab.dataset.title;
  pageIntro.textContent = tab.dataset.intro;
}

document.querySelectorAll('[role="tab"]').forEach((tab, index, tabs) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = tabs[(index + direction + tabs.length) % tabs.length];
    activateTab(nextTab);
    nextTab.focus();
  });
});

calendarPreviousButton.addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  renderCalendar();
});

calendarNextButton.addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  renderCalendar();
});

calendarTodayButton.addEventListener("click", () => {
  const today = new Date();
  calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  renderCalendar();
});

addMemberButton.addEventListener("click", () => openMemberDialog());

document.querySelector("#close-member-dialog").addEventListener("click", () => memberDialog.close());
document.querySelector("#cancel-member").addEventListener("click", () => {
  memberDialog.close();
  editingMemberId = null;
});
document.querySelector("#close-delete-member-dialog").addEventListener("click", () => deleteMemberDialog.close());
document.querySelector("#cancel-delete-member").addEventListener("click", () => deleteMemberDialog.close());
document.querySelector("#close-assignment-dialog").addEventListener("click", () => assignmentDialog.close());
document.querySelector("#cancel-assignment").addEventListener("click", () => assignmentDialog.close());
addActivityButton.addEventListener("click", () => openActivityDialog());
document.querySelector("#close-activity-dialog").addEventListener("click", () => activityDialog.close());
document.querySelector("#cancel-activity").addEventListener("click", () => activityDialog.close());
document.querySelector("#close-delete-dialog").addEventListener("click", () => deleteActivityDialog.close());
document.querySelector("#cancel-delete").addEventListener("click", () => deleteActivityDialog.close());

stateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!statusManagementAvailable) return;

  const nombre = stateNameInput.value.trim();
  if (!nombre) return;
  if (currentStatuses.some((status) => normalizedStatus(status) === normalizedStatus(nombre))) {
    stateFeedback.textContent = "Ese estado ya está registrado o ya se usa en una actividad.";
    stateFeedback.hidden = false;
    return;
  }

  saveStateButton.disabled = true;
  saveStateButton.textContent = "Guardando...";
  stateFeedback.hidden = true;
  try {
    const response = await fetch(statesUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre })
    });
    if (!response.ok) throw new Error(`Firebase respondió con estado ${response.status}.`);
    stateForm.reset();
    await loadProjectData();
  } catch (error) {
    console.error("No se pudo guardar el estado:", error);
    stateFeedback.textContent = "No se pudo guardar el estado. Verifica las reglas de escritura de Firebase.";
    stateFeedback.hidden = false;
  } finally {
    saveStateButton.disabled = !statusManagementAvailable;
    saveStateButton.textContent = "+ Agregar estado";
  }
});

activityResponsibleOptions.addEventListener("change", () => {
  const selectedNames = assigneeLabel(selectedAssigneeIds(activityForm));
  activityForm.elements.responsable.value = selectedNames;
});

activityForm.elements.fecha_inicio.addEventListener("input", () => updateActivityDuration(true));
activityForm.elements.fecha_fin.addEventListener("input", () => updateActivityDuration(true));

memberForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!teamNodeAvailable) return;

  const isEditing = editingMemberId !== null;
  const formData = new FormData(memberForm);
  const member = {
    nombre: String(formData.get("nombre")).trim(),
    rol: String(formData.get("rol")).trim(),
    correo: String(formData.get("correo")).trim(),
    telefono: String(formData.get("telefono")).trim()
  };

  saveMemberButton.disabled = true;
  saveMemberButton.textContent = "Guardando...";
  formFeedback.hidden = true;
  try {
    const response = await fetch(isEditing ? `${databaseUrl}/equipo/${encodeURIComponent(editingMemberId)}.json` : teamUrl, {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member)
    });
    if (!response.ok) throw new Error(`Firebase respondió con estado ${response.status}.`);
    memberDialog.close();
    memberForm.reset();
    editingMemberId = null;
    await loadProjectData();
  } catch (error) {
    console.error("No se pudo guardar el integrante:", error);
    formFeedback.textContent = `No se pudo ${isEditing ? "editar" : "guardar"}. Verifica las reglas de escritura de Firebase.`;
    formFeedback.hidden = false;
  } finally {
    saveMemberButton.disabled = false;
    saveMemberButton.textContent = isEditing ? "Guardar cambios" : "Guardar integrante";
  }
});

deleteMemberForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!teamNodeAvailable || deletingMemberId === null) return;

  const memberToDelete = teamMembers.find((member) => member.id === deletingMemberId);
  if (!memberToDelete) return;
  const updates = { [`equipo/${deletingMemberId}`]: null };
  currentActivities.forEach((record) => {
    const ids = activityResponsibleIds(record.data);
    if (!ids.includes(deletingMemberId)) return;
    const remainingIds = ids.filter((id) => id !== deletingMemberId);
    updates[`actividades/${record.id}/responsablesIds`] = remainingIds.length > 0 ? remainingIds : null;
    updates[`actividades/${record.id}/responsableId`] = remainingIds.length === 1 ? remainingIds[0] : null;
    updates[`actividades/${record.id}/responsable`] = remainingIds.length > 0
      ? assigneeLabel(remainingIds)
      : record.data.responsable ?? null;
  });

  confirmDeleteMemberButton.disabled = true;
  confirmDeleteMemberButton.textContent = "Eliminando...";
  deleteMemberFeedback.hidden = true;
  try {
    const response = await fetch(`${databaseUrl}/.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error(`Firebase respondió con estado ${response.status}.`);
    deleteMemberDialog.close();
    deletingMemberId = null;
    await loadProjectData();
  } catch (error) {
    console.error("No se pudo eliminar el integrante:", error);
    deleteMemberFeedback.textContent = "No se pudo eliminar. Revisa las reglas de escritura de Firebase.";
    deleteMemberFeedback.hidden = false;
  } finally {
    confirmDeleteMemberButton.disabled = false;
    confirmDeleteMemberButton.textContent = "Eliminar";
  }
});

activityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activityCrudAvailable) return;

  const isEditing = editingActivityId !== null;
  const activity = activityFromForm();
  const url = isEditing
    ? `${activitiesUrl}/${encodeURIComponent(editingActivityId)}.json`
    : `${activitiesUrl}.json`;
  saveActivityButton.disabled = true;
  saveActivityButton.textContent = "Guardando...";
  activityFeedback.hidden = true;

  try {
    const response = await fetch(url, {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity)
    });
    if (!response.ok) throw new Error(`Firebase respondió con estado ${response.status}.`);
    if (!isEditing && !Array.isArray(currentProjectData?.actividades)) {
      const result = await response.json();
      if (result?.name) {
        const itemResponse = await fetch(`${activitiesUrl}/${encodeURIComponent(result.name)}.json`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activity)
        });
        if (!itemResponse.ok) throw new Error(`Firebase respondió con estado ${itemResponse.status}.`);
      }
    }
    activityDialog.close();
    activityForm.reset();
    editingActivityId = null;
    await loadProjectData();
  } catch (error) {
    console.error("No se pudo guardar la actividad:", error);
    activityFeedback.textContent = "No se pudo guardar la actividad. Revisa las reglas de escritura de Firebase.";
    activityFeedback.hidden = false;
  } finally {
    saveActivityButton.disabled = false;
    saveActivityButton.textContent = isEditing ? "Guardar cambios" : "Guardar actividad";
  }
});

deleteActivityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activityCrudAvailable || deletingActivityId === null) return;

  confirmDeleteButton.disabled = true;
  confirmDeleteButton.textContent = "Eliminando...";
  deleteFeedback.hidden = true;
  try {
    const response = await fetch(`${activitiesUrl}/${encodeURIComponent(deletingActivityId)}.json`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error(`Firebase respondió con estado ${response.status}.`);
    deleteActivityDialog.close();
    deletingActivityId = null;
    await loadProjectData();
  } catch (error) {
    console.error("No se pudo eliminar la actividad:", error);
    deleteFeedback.textContent = "No se pudo eliminar la actividad. Revisa las reglas de escritura de Firebase.";
    deleteFeedback.hidden = false;
  } finally {
    confirmDeleteButton.disabled = false;
    confirmDeleteButton.textContent = "Eliminar";
  }
});

assignmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!teamNodeAvailable || selectedActivityId === null) return;

  const responsablesIds = selectedAssigneeIds(assignmentForm);
  const assignment = {
    responsableId: responsablesIds.length === 1 ? responsablesIds[0] : null,
    responsablesIds: responsablesIds.length > 0 ? responsablesIds : null,
    responsable: responsablesIds.length > 0 ? assigneeLabel(responsablesIds) : null
  };

  saveAssignmentButton.disabled = true;
  saveAssignmentButton.textContent = "Guardando...";
  assignmentFeedback.hidden = true;
  try {
    const response = await fetch(`${activitiesUrl}/${encodeURIComponent(selectedActivityId)}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignment)
    });
    if (!response.ok) throw new Error(`Firebase respondió con estado ${response.status}.`);
    assignmentDialog.close();
    selectedActivityId = null;
    await loadProjectData();
  } catch (error) {
    console.error("No se pudo asignar el responsable:", error);
    assignmentFeedback.textContent = "No se pudo guardar la asignación. Revisa las reglas de escritura de Firebase.";
    assignmentFeedback.hidden = false;
  } finally {
    saveAssignmentButton.disabled = false;
    saveAssignmentButton.textContent = "Guardar asignación";
  }
});

async function loadProjectData() {
  activityCount.textContent = "Cargando...";
  teamCount.textContent = "Cargando...";
  try {
    const response = await fetch(`${databaseUrl}/.json`);
    if (!response.ok) throw new Error(`Firebase respondió con estado ${response.status}.`);
    const projectData = await response.json();
    currentProjectData = Array.isArray(projectData) ? { actividades: projectData } : projectData;

    if (Array.isArray(projectData)) {
      teamNodeAvailable = false;
      activityCrudAvailable = false;
      statusManagementAvailable = false;
      addActivityButton.disabled = true;
      renderActivities(projectData);
      renderCalendar();
      renderTeam({});
      renderStates({});
      return;
    }
    if (!projectData || typeof projectData !== "object") {
      throw new Error("La raíz de Firebase no tiene el formato esperado.");
    }

    const hasProjectStructure = isActivityCollection(projectData.actividades)
      || Object.prototype.hasOwnProperty.call(projectData, "equipo");
    activityCrudAvailable = hasProjectStructure;
    teamNodeAvailable = activityCrudAvailable;
    statusManagementAvailable = hasProjectStructure;
    addActivityButton.disabled = !activityCrudAvailable;
    renderTeam(projectData.equipo);
    renderActivities(isActivityCollection(projectData.actividades) ? projectData.actividades : {});
    renderCalendar();
    renderStates(projectData.estados);
  } catch (error) {
    console.error("No se pudieron cargar los datos del proyecto:", error);
    activityCount.textContent = "No disponible";
    teamCount.textContent = "No disponible";
    activityCrudAvailable = false;
    teamNodeAvailable = false;
    statusManagementAvailable = false;
    addActivityButton.disabled = true;
    stateSummaryCount.textContent = "No disponible";
    stateRows.replaceChildren();
    calendarDays.replaceChildren();
    calendarActivityCount.textContent = "No disponible";
    projectProgress.textContent = "—";
    trackedActivityCount.textContent = "—";
    availableStateCount.textContent = "—";
    stateNameInput.disabled = true;
    saveStateButton.disabled = true;
    showMessage("No se pudieron cargar las actividades. Revisa la conexión y las reglas de lectura de Firebase.");
    teamGrid.textContent = "No se pudo cargar el equipo.";
  }
}

loadProjectData();
