// Get DOM Elements
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const toggleThemeBtn = document.getElementById("themeToggle");
const openAddModalBtn = document.getElementById("openAddModal");
const taskModal = document.getElementById("taskModal");
const closeModal = document.querySelector(".close");
const saveTaskBtn = document.getElementById("saveTask");
const cancelTaskBtn = document.getElementById("cancelTask");
const modalTaskInput = document.getElementById("modalTaskInput");
const modalTitle = document.getElementById("modalTitle");
const filterTasks = document.getElementById("filterTasks");
const confirmationModal = document.getElementById("confirmationModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

// Initialize Tasks from Local Storage or Empty Array
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Initialize Variables for Dragging, Search Timeout, Edit Task ID and Task to Delete
let draggedItem = null;
let searchTimeout = null;
let editTaskId = null;
let taskToDelete = null;

//----------------------------------------------------------------
// Theme Functionality
//----------------------------------------------------------------

// Load Theme Preference from Local Storage
document.body.classList.toggle("dark-mode", localStorage.getItem("theme") === "dark");

// Toggle Theme
toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});

//----------------------------------------------------------------
// Modal Functionality
//----------------------------------------------------------------

// Function to Open Modal
function openModal() {
    taskModal.style.display = "flex"; // Ensure flexbox is applied for centering
    taskModal.style.justifyContent = "center";
    taskModal.style.alignItems = "center";
}

// Function to Open Add Task Modal
openAddModalBtn.addEventListener("click", () => {
    modalTitle.textContent = "Add Task";
    modalTaskInput.value = "";
    editTaskId = null;
    openModal();
});

// Function to Open Edit Task Modal
function openEditModal(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;

    modalTitle.textContent = "Edit Task";
    modalTaskInput.value = task.text;
    editTaskId = id;
    openModal();
}

// Function to Close Modal
function closeModalFunc() {
    taskModal.style.display = "none";
}

// Event Listeners for Closing Modal
closeModal.addEventListener("click", closeModalFunc);
cancelTaskBtn.addEventListener("click", closeModalFunc);

// Function to Save Task
saveTaskBtn.addEventListener("click", () => {
    const text = modalTaskInput.value.trim();
    if (text === "") return;

    if (editTaskId !== null) {
        // Update Existing Task
        const task = tasks.find(task => task.id === editTaskId);
        if (task) {
            task.text = text;
            showFlashMessage("Task updated successfully", "success");
        }
    } else {
        // Add New Task
        const task = { id: Date.now(), text, completed: false };
        tasks.push(task);
        showFlashMessage("Task added successfully", "success");
    }

    updateTaskList();
    closeModalFunc();
});

//----------------------------------------------------------------
// Task List Functionality
//----------------------------------------------------------------

// Function to Update Task List in UI
function updateTaskList(filteredTasks = tasks) {
    taskList.innerHTML = "";

    if (filteredTasks.length === 0) {
        taskList.innerHTML = "<p class='no-tasks'>No tasks found</p>";
        return;
    }

    filteredTasks.forEach((task) => {
        const listItem = document.createElement("li");
        listItem.setAttribute("draggable", "true");
        listItem.setAttribute("data-id", task.id);
        listItem.className = task.completed ? "completed" : "";

        listItem.innerHTML = `
            <span onclick="toggleTask(${task.id})">${task.text}</span>
            <div class="task-actions">
                <button onclick="openEditModal(${task.id})">Edit</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;

        // Drag & Drop Events
        listItem.addEventListener("dragstart", handleDragStart);
        listItem.addEventListener("dragover", handleDragOver);
        listItem.addEventListener("dragleave", handleDragLeave);
        listItem.addEventListener("drop", handleDrop);
        listItem.addEventListener("dragend", handleDragEnd);

        taskList.appendChild(listItem);
    });

    saveTasks();
}

// Function to Toggle Task Completion
function toggleTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) task.completed = !task.completed;
    updateTaskList();
}

//----------------------------------------------------------------
// Delete Task Functionality
//----------------------------------------------------------------

// Function to Display Confirmation Modal Before Deleting
function deleteTask(id) {
    taskToDelete = id;
    const task = tasks.find(task => task.id === id); // Find the task by ID
    const modalBody = confirmationModal.querySelector(".modal-body");

    if (task) {
        modalBody.innerHTML = `<p>Are you sure you want to delete the task: <strong>${task.text}</strong>?</p>`;
    } else {
        modalBody.innerHTML = `<p>Task not found.</p>`;
    }

    confirmationModal.style.display = "flex";
}

// Event Listener for Confirm Delete Button
confirmDeleteBtn.addEventListener("click", () => {
    if (taskToDelete) {
        confirmationModal.style.display = "none";
        const taskElement = document.querySelector(`li[data-id='${taskToDelete}']`);
        if (taskElement) {
            setTimeout(() => {
                taskElement.classList.add("fade-out");
                setTimeout(() => {
                    tasks = tasks.filter(task => task.id !== taskToDelete);
                    updateTaskList();
                    showFlashMessage("Task deleted successfully", "error");
                    confirmationModal.style.display = "none";
                    taskToDelete = null;
                }, 500);
            }, 100);
        }
    }
});

// Event Listener for Cancel Delete Button
cancelDeleteBtn.addEventListener("click", () => {
    confirmationModal.style.display = "none";
    taskToDelete = null;
});

// Event Listener to Close Confirmation Modal on Outside Click
window.addEventListener("click", (event) => {
    if (event.target === confirmationModal) {
        confirmationModal.style.display = "none";
        taskToDelete = null;
    }
});

//----------------------------------------------------------------
// Drag & Drop Functionality
//----------------------------------------------------------------

// Function to Handle Drag Start Event
function handleDragStart(event) {
    draggedItem = event.target;
    event.target.classList.add("dragging");
    event.dataTransfer.setData("text/plain", event.target.dataset.id);
}

// Function to Handle Drag Over Event
function handleDragOver(event) {
    event.preventDefault();
    const targetItem = event.target.closest("li");
    if (targetItem && targetItem !== draggedItem) {
        targetItem.classList.add("drag-over");
    }
}

// Function to Handle Drag Leave Event
function handleDragLeave(event) {
    event.target.classList.remove("drag-over");
}

// Function to Handle Drop Event
function handleDrop(event) {
    event.preventDefault();
    const draggedTaskId = event.dataTransfer.getData("text/plain");
    const targetTaskId = event.target.closest("li").dataset.id;

    if (!draggedTaskId || !targetTaskId || draggedTaskId === targetTaskId) return;

    const draggedIndex = tasks.findIndex(task => task.id == draggedTaskId);
    const targetIndex = tasks.findIndex(task => task.id == targetTaskId);

    // Swap positions
    const temp = tasks[draggedIndex];
    tasks[draggedIndex] = tasks[targetIndex];
    tasks[targetIndex] = temp;

    updateTaskList();
}

// Function to Handle Drag End Event
function handleDragEnd(event) {
    event.target.classList.remove("dragging");
    document.querySelectorAll(".drag-over").forEach(item => item.classList.remove("drag-over"));
}

//----------------------------------------------------------------
// Search & Filter Functionality
//----------------------------------------------------------------

// Debounced Search
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = searchInput.value.toLowerCase();
        updateTaskList(tasks.filter(task => task.text.toLowerCase().includes(query)));
    }, 300);
});

// Filter Tasks by Completion Status
filterTasks.addEventListener("change", function () {
    const filterValue = this.value;
    let filteredTasks = tasks;
    if (filterValue === "completed") {
        filteredTasks = tasks.filter(task => task.completed);
    } else if (filterValue === "notCompleted") {
        filteredTasks = tasks.filter(task => !task.completed);
    }
    updateTaskList(filteredTasks);
});

//----------------------------------------------------------------
// Local Storage Functionality
//----------------------------------------------------------------

// Save Tasks to Local Storage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

//----------------------------------------------------------------
// Flash Message Functionality
//----------------------------------------------------------------

// Function to Show a Flash Message
function showFlashMessage(message, type = "success") {
    const flashMessage = document.createElement("div");
    flashMessage.className = `flash-message ${type}`;
    flashMessage.textContent = message;

    document.body.appendChild(flashMessage);

    // Animate in
    setTimeout(() => {
        flashMessage.classList.add("show");
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        flashMessage.classList.remove("show");
        setTimeout(() => flashMessage.remove(), 500);
    }, 3000);
}

//----------------------------------------------------------------
// Initialization
//----------------------------------------------------------------

// Load tasks on page load
updateTaskList();
