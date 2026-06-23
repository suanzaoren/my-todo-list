const STORAGE_KEY = 'todo-app-tasks';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABELS = { high: '高', medium: '中', low: '低' };

const addForm = document.getElementById('addForm');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const taskList = document.getElementById('taskList');
const pendingCountEl = document.getElementById('pendingCount');
const doneCountEl = document.getElementById('doneCount');
const emptyState = document.getElementById('emptyState');
const clearDoneBtn = document.getElementById('clearDoneBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

let tasks = loadTasks();
let editingId = null;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((t) => ({
      ...t,
      priority: t.priority || 'medium',
    }));
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function sortTasks(list) {
  return [...list].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return 0;
  });
}

function updateStats() {
  const done = tasks.filter((t) => t.completed).length;
  const pending = tasks.length - done;
  pendingCountEl.textContent = pending;
  doneCountEl.textContent = done;
  const isEmpty = tasks.length === 0;
  emptyState.classList.toggle('hidden', !isEmpty);
  taskList.classList.toggle('hidden', isEmpty);
  clearDoneBtn.disabled = done === 0;
  clearAllBtn.disabled = isEmpty;
}

function createPrioritySelect(task, onChange) {
  const select = document.createElement('select');
  select.className = `priority-badge priority-${task.priority}`;
  select.setAttribute('aria-label', '任务优先级');
  ['high', 'medium', 'low'].forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = PRIORITY_LABELS[p];
    if (p === task.priority) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => {
    onChange(select.value);
    select.className = `priority-badge priority-${select.value}`;
  });
  return select;
}

function renderTasks() {
  taskList.innerHTML = '';

  sortTasks(tasks).forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' done' : '');
    li.dataset.id = task.id;

    const prioritySelectEl = createPrioritySelect(task, (value) => {
      task.priority = value;
      saveTasks();
    });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const content = document.createElement('div');
    content.className = 'task-content';

    if (editingId === task.id) {
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'task-edit-input';
      editInput.value = task.text;
      editInput.maxLength = 200;

      const editActions = document.createElement('div');
      editActions.className = 'edit-actions';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn-icon btn-save';
      saveBtn.title = '保存';
      saveBtn.textContent = '✓';
      saveBtn.addEventListener('click', () => saveEdit(task.id, editInput.value));

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn-icon btn-cancel';
      cancelBtn.title = '取消';
      cancelBtn.textContent = '✕';
      cancelBtn.addEventListener('click', cancelEdit);

      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEdit(task.id, editInput.value);
        if (e.key === 'Escape') cancelEdit();
      });

      editActions.append(saveBtn, cancelBtn);
      content.append(editInput, editActions);

      requestAnimationFrame(() => {
        editInput.focus();
        editInput.select();
      });
    } else {
      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task.text;
      span.title = '双击可编辑';
      span.addEventListener('dblclick', () => startEdit(task.id));
      content.appendChild(span);
    }

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-icon btn-edit';
    editBtn.title = '编辑';
    editBtn.setAttribute('aria-label', '编辑任务');
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => startEdit(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-icon btn-delete';
    deleteBtn.title = '删除';
    deleteBtn.setAttribute('aria-label', '删除任务');
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    if (editingId !== task.id) {
      actions.append(editBtn);
    }
    actions.append(deleteBtn);

    li.append(prioritySelectEl, checkbox, content, actions);
    taskList.appendChild(li);
  });

  updateStats();
}

function addTask(text, priority) {
  const trimmed = text.trim();
  if (!trimmed) return;

  tasks.unshift({
    id: createId(),
    text: trimmed,
    completed: false,
    priority: priority || 'medium',
  });

  saveTasks();
  renderTasks();
}

function startEdit(id) {
  editingId = id;
  renderTasks();
}

function saveEdit(id, text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.text = trimmed;
    saveTasks();
  }
  editingId = null;
  renderTasks();
}

function cancelEdit() {
  editingId = null;
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  if (editingId === id) editingId = null;
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderTasks();
}

function clearAll() {
  if (tasks.length === 0) return;
  if (!confirm('确定要清空全部任务吗？此操作无法撤销。')) return;

  editingId = null;
  tasks = [];
  saveTasks();
  renderTasks();
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(taskInput.value, prioritySelect.value);
  taskInput.value = '';
  taskInput.focus();
});

clearDoneBtn.addEventListener('click', clearCompleted);
clearAllBtn.addEventListener('click', clearAll);

renderTasks();
