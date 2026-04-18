const API_BASE_URL = window.API_BASE_URL || "http://localhost:8080";

const state = {
    route: getRouteFromHash(),
    loading: true,
    message: null,
    messageTimer: null,
    search: {
        books: "",
        students: "",
        borrows: "",
    },
    books: [],
    students: [],
    borrows: [],
    editStudent: null,
};

const appRoot = document.getElementById("app");
const messageArea = document.getElementById("message-area");

function getRouteFromHash() {
    const route = window.location.hash.replace("#", "").trim() || "home";
    return ["home", "books", "students", "borrow"].includes(route) ? route : "home";
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function formatCurrency(value) {
    const number = Number(value ?? 0);
    if (Number.isNaN(number)) {
        return "$0.00";
    }
    return `$${number.toFixed(2)}`;
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function normalizeText(value) {
    return String(value ?? "").toLowerCase();
}

function filterRows(items, query, keys) {
    const needle = normalizeText(query).trim();
    if (!needle) {
        return items;
    }

    return items.filter((item) =>
        keys.some((key) => normalizeText(item?.[key]).includes(needle))
    );
}

function availableBooks() {
    return state.books.filter((book) => Number(book?.stock ?? 0) > 0);
}

function showMessage(text, type = "error") {
    state.message = { text, type };
    renderMessage();

    if (state.messageTimer) {
        clearTimeout(state.messageTimer);
    }

    state.messageTimer = window.setTimeout(() => {
        state.message = null;
        renderMessage();
    }, 4000);
}

function renderMessage() {
    if (!messageArea) {
        return;
    }

    if (!state.message) {
        messageArea.innerHTML = "";
        return;
    }

    const typeClass = state.message.type === "success"
        ? "flash-success"
        : state.message.type === "info"
            ? "flash-info"
            : "flash-error";

    messageArea.innerHTML = `
        <div class="flash ${typeClass}">
            <p>${escapeHTML(state.message.text)}</p>
        </div>
    `;
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const rawText = await response.text();
    let payload = null;

    if (rawText) {
        try {
            payload = JSON.parse(rawText);
        } catch {
            payload = rawText;
        }
    }

    if (!response.ok) {
        const error = new Error(
            (payload && typeof payload === "string" ? payload : payload?.message) ||
            `Request failed with status ${response.status}`
        );
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

async function fetchCollection(path) {
    try {
        const payload = await apiRequest(path);
        return Array.isArray(payload) ? payload : [];
    } catch (error) {
        if (error.status === 404) {
            return [];
        }
        throw error;
    }
}

async function refreshAllData() {
    state.loading = true;
    render();

    try {
        const [books, students, borrows] = await Promise.all([
            fetchCollection("/book"),
            fetchCollection("/student"),
            fetchCollection("/borrow"),
        ]);

        state.books = books;
        state.students = students;
        state.borrows = borrows;

        if (
            state.editStudent &&
            !state.students.some((student) => String(student?.id) === String(state.editStudent?.id))
        ) {
            state.editStudent = null;
        }
    } catch (error) {
        showMessage(`Unable to load data: ${error.message}`, "error");
        state.books = [];
        state.students = [];
        state.borrows = [];
    } finally {
        state.loading = false;
        render();
    }
}

function setRoute(route) {
    state.route = ["home", "books", "students", "borrow"].includes(route) ? route : "home";
    render();
}

function renderNavState() {
    document.querySelectorAll(".nav-link").forEach((link) => {
        const route = link.getAttribute("href")?.replace("#", "");
        const isActive = route === state.route;
        link.classList.toggle("active", isActive);
        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function renderHome() {
    return `
        <section class="hero">
            <div class="atom-container" aria-hidden="true">
                <div class="nucleus"></div>
                <div class="electron-orbit">
                    <div class="electron"></div>
                </div>
            </div>
            <h1>Library<br>Atomic.</h1>
            <p>
                The fundamental building block of knowledge management.<br>
                Now powered by a lightweight vanilla JavaScript frontend.
            </p>
            <div class="hero-actions">
                <a href="#books" class="btn btn-primary">Launch App</a>
            </div>
        </section>

        <div class="metric-grid">
            <article class="card metric-card">
                <h3>Books</h3>
                <p class="metric-value">${state.books.length}</p>
                <span class="muted">Cataloged titles</span>
            </article>
            <article class="card metric-card">
                <h3>Students</h3>
                <p class="metric-value">${state.students.length}</p>
                <span class="muted">Registered readers</span>
            </article>
            <article class="card metric-card">
                <h3>Borrow Records</h3>
                <p class="metric-value">${state.borrows.length}</p>
                <span class="muted">Issued transactions</span>
            </article>
        </div>

        <div class="card">
            <h3>Backend</h3>
            <p class="muted">Spring Boot API at <code>${escapeHTML(API_BASE_URL)}</code></p>
        </div>
    `;
}

function renderBooks() {
    const filteredBooks = filterRows(state.books, state.search.books, ["title", "author"]);

    return `
        <div class="header-flex">
            <div>
                <h2>Book Inventory</h2>
                <p class="muted">Search, add, and remove books directly against the Spring API.</p>
            </div>

            <form id="book-search-form" class="search-form">
                <input type="text" name="query" class="search-input" placeholder="Search title or author..." value="${escapeHTML(state.search.books)}">
                <button type="submit" class="search-btn">Search</button>
                ${state.search.books ? '<button type="button" class="btn search-clear" data-clear-search="books">✕</button>' : ''}
            </form>
        </div>

        <div class="card">
            <h3>Add New Book</h3>
            <form id="book-form" class="form-row">
                <input type="text" name="title" placeholder="Title" required>
                <input type="text" name="author" placeholder="Author" required>
                <input type="number" step="0.01" min="0" name="price" placeholder="Price" required>
                <input type="number" min="0" name="stock" placeholder="Stock" required>
                <button type="submit" class="btn btn-primary">Add Book</button>
            </form>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredBooks.length ? filteredBooks.map((book) => `
                        <tr>
                            <td>${escapeHTML(book.title)}</td>
                            <td>${escapeHTML(book.author)}</td>
                            <td>${formatCurrency(book.price)}</td>
                            <td>
                                ${Number(book.stock ?? 0) > 0
                                    ? `<span class="status-chip status-ok">${escapeHTML(book.stock)}</span>`
                                    : `<span class="status-chip status-danger">Out of Stock</span>`}
                            </td>
                            <td>
                                <button type="button" class="btn btn-danger" data-delete-book="${escapeHTML(book.id)}">Delete</button>
                            </td>
                        </tr>
                    `).join("") : `
                        <tr><td colspan="5"><div class="empty-state">No books found in the library.</div></td></tr>
                    `}
                </tbody>
            </table>
        </div>
    `;
}

function renderStudentEditCard() {
    if (!state.editStudent) {
        return "";
    }

    return `
        <div class="card edit-card">
            <h3>Edit Student</h3>
            <form id="student-edit-form" class="form-row">
                <input type="text" name="name" value="${escapeHTML(state.editStudent.name)}" placeholder="Full Name" required>
                <input type="text" value="${escapeHTML(state.editStudent.roll)}" disabled aria-label="Roll number cannot be changed">
                <button type="submit" class="btn btn-primary">Update Student</button>
                <button type="button" class="btn btn-secondary" data-cancel-edit>Cancel</button>
            </form>
            <p class="muted">Roll number is fixed. Only the name can be changed from this form.</p>
        </div>
    `;
}

function renderStudents() {
    const filteredStudents = filterRows(state.students, state.search.students, ["name", "roll"]);

    return `
        <div class="header-flex">
            <div>
                <h2>Student Registry</h2>
                <p class="muted">Register, search, edit, and remove students.</p>
            </div>

            <form id="student-search-form" class="search-form">
                <input type="text" name="query" class="search-input" placeholder="Search name or roll..." value="${escapeHTML(state.search.students)}">
                <button type="submit" class="search-btn">Search</button>
                ${state.search.students ? '<button type="button" class="btn search-clear" data-clear-search="students">✕</button>' : ''}
            </form>
        </div>

        <div class="card">
            <h3>Register Student</h3>
            <form id="student-form" class="form-row">
                <input type="text" name="name" placeholder="Full Name" required>
                <input type="text" name="roll" placeholder="Roll Number" required>
                <button type="submit" class="btn btn-primary">Register</button>
            </form>
        </div>

        ${renderStudentEditCard()}

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Roll No</th>
                        <th>Borrowed Books</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredStudents.length ? filteredStudents.map((student) => {
                        const borrowedBooks = Array.isArray(student.borrowedBooks) ? student.borrowedBooks : [];
                        return `
                            <tr>
                                <td>${escapeHTML(student.name)}</td>
                                <td>${escapeHTML(student.roll)}</td>
                                <td>
                                    ${borrowedBooks.length
                                        ? borrowedBooks.map((book) => `<span class="badge">${escapeHTML(book?.title || "Untitled")}</span>`).join(" ")
                                        : '<span class="muted">None</span>'}
                                </td>
                                <td>
                                    <div class="inline-actions">
                                        <button type="button" class="btn btn-primary btn-small" data-edit-student="${escapeHTML(student.id)}">Edit</button>
                                        <button type="button" class="btn btn-danger btn-small" data-delete-student="${escapeHTML(student.id)}">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join("") : `
                        <tr><td colspan="4"><div class="empty-state">No students registered.</div></td></tr>
                    `}
                </tbody>
            </table>
        </div>
    `;
}

function renderBorrow() {
    const needle = normalizeText(state.search.borrows).trim();
    const filteredBorrows = needle
        ? state.borrows.filter((borrow) => {
            const studentName = normalizeText(borrow?.student?.name);
            const bookTitle = normalizeText(borrow?.book?.title);
            const dateTime = normalizeText(borrow?.dateTime);
            return studentName.includes(needle) || bookTitle.includes(needle) || dateTime.includes(needle);
        })
        : state.borrows;

    const studentOptions = state.students;
    const bookOptions = availableBooks();

    return `
        <div class="header-flex">
            <div>
                <h2>Circulation Desk</h2>
                <p class="muted">Issue books and inspect the transaction history.</p>
            </div>

            <form id="borrow-search-form" class="search-form">
                <input type="text" name="query" class="search-input" placeholder="Find by student, book, or date..." value="${escapeHTML(state.search.borrows)}">
                <button type="submit" class="search-btn">Search</button>
                ${state.search.borrows ? '<button type="button" class="btn search-clear" data-clear-search="borrows">✕</button>' : ''}
            </form>
        </div>

        <div class="card">
            <h3>Issue Book</h3>
            <form id="borrow-form" class="form-row">
                <select name="studentId" required>
                    <option value="" disabled selected>Select Student</option>
                    ${studentOptions.map((student) => `<option value="${escapeHTML(student.id)}">${escapeHTML(student.name)} (${escapeHTML(student.roll)})</option>`).join("")}
                </select>

                <select name="bookId" required>
                    <option value="" disabled selected>Select Book</option>
                    ${bookOptions.map((book) => `<option value="${escapeHTML(book.id)}">${escapeHTML(book.title)} (Qty: ${escapeHTML(book.stock)})</option>`).join("")}
                </select>

                <button type="submit" class="btn btn-primary">Issue Book</button>
            </form>
            ${!bookOptions.length ? '<p class="muted" style="margin-top: 1rem;">No books are currently available for issuing.</p>' : ''}
        </div>

        <div class="card">
            <h3>Transaction History</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Student</th>
                        <th>Book</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredBorrows.length ? filteredBorrows.map((borrow) => `
                        <tr>
                            <td>${formatDateTime(borrow.dateTime)}</td>
                            <td>${borrow?.student?.name ? escapeHTML(borrow.student.name) : '<em class="muted">Deleted Student</em>'}</td>
                            <td>${borrow?.book?.title ? escapeHTML(borrow.book.title) : '<em class="muted">Deleted Book</em>'}</td>
                        </tr>
                    `).join("") : `
                        <tr><td colspan="3"><div class="empty-state">No records found.</div></td></tr>
                    `}
                </tbody>
            </table>
        </div>
    `;
}

function renderLoading() {
    return `
        <div class="card loading-card">
            <h3>Loading</h3>
            <p class="muted">Fetching library data from the backend...</p>
        </div>
    `;
}

function render() {
    state.route = getRouteFromHash();
    renderNavState();
    renderMessage();

    if (!appRoot) {
        return;
    }

    if (state.loading) {
        appRoot.innerHTML = renderLoading();
        return;
    }

    if (state.route === "books") {
        appRoot.innerHTML = renderBooks();
    } else if (state.route === "students") {
        appRoot.innerHTML = renderStudents();
    } else if (state.route === "borrow") {
        appRoot.innerHTML = renderBorrow();
    } else {
        appRoot.innerHTML = renderHome();
    }

    bindCurrentViewHandlers();
}

function bindCurrentViewHandlers() {
    document.querySelectorAll("[data-clear-search]").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.getAttribute("data-clear-search");
            state.search[key] = "";
            render();
        });
    });

    if (state.route === "books") {
        const searchForm = document.getElementById("book-search-form");
        const addForm = document.getElementById("book-form");

        searchForm?.addEventListener("submit", (event) => {
            event.preventDefault();
            state.search.books = new FormData(searchForm).get("query")?.toString().trim() || "";
            render();
        });

        addForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const formData = new FormData(addForm);
            const payload = {
                title: formData.get("title")?.toString().trim(),
                author: formData.get("author")?.toString().trim(),
                price: Number(formData.get("price")),
                stock: Number(formData.get("stock")),
            };

            try {
                await apiRequest("/book", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                addForm.reset();
                showMessage("Book added successfully.", "success");
                await refreshAllData();
            } catch (error) {
                showMessage(`Unable to add book: ${error.message}`, "error");
            }
        });

        document.querySelectorAll("[data-delete-book]").forEach((button) => {
            button.addEventListener("click", async () => {
                const bookId = button.getAttribute("data-delete-book");
                if (!window.confirm("Are you sure you want to delete this book?")) {
                    return;
                }

                try {
                    await apiRequest(`/book/${bookId}`, { method: "DELETE" });
                    showMessage("Book deleted successfully.", "success");
                    await refreshAllData();
                } catch (error) {
                    showMessage(`Unable to delete book: ${error.message}`, "error");
                }
            });
        });
    }

    if (state.route === "students") {
        const searchForm = document.getElementById("student-search-form");
        const addForm = document.getElementById("student-form");
        const editForm = document.getElementById("student-edit-form");

        searchForm?.addEventListener("submit", (event) => {
            event.preventDefault();
            state.search.students = new FormData(searchForm).get("query")?.toString().trim() || "";
            render();
        });

        addForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const formData = new FormData(addForm);
            const payload = {
                name: formData.get("name")?.toString().trim(),
                roll: formData.get("roll")?.toString().trim(),
            };

            try {
                await apiRequest("/student", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                addForm.reset();
                showMessage("Student registered successfully.", "success");
                await refreshAllData();
            } catch (error) {
                showMessage(`Unable to register student: ${error.message}`, "error");
            }
        });

        editForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!state.editStudent?.id) {
                return;
            }

            const formData = new FormData(editForm);
            const payload = {
                name: formData.get("name")?.toString().trim(),
                borrowedBooks: Array.isArray(state.editStudent.borrowedBooks) ? state.editStudent.borrowedBooks : [],
            };

            try {
                await apiRequest(`/student/${state.editStudent.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                state.editStudent = null;
                showMessage("Student updated successfully.", "success");
                await refreshAllData();
            } catch (error) {
                showMessage(`Unable to update student: ${error.message}`, "error");
            }
        });

        document.querySelectorAll("[data-edit-student]").forEach((button) => {
            button.addEventListener("click", () => {
                const studentId = button.getAttribute("data-edit-student");
                state.editStudent = state.students.find((student) => String(student?.id) === String(studentId)) || null;
                if (!state.editStudent) {
                    showMessage("Student not found.", "error");
                    return;
                }
                render();
            });
        });

        document.querySelectorAll("[data-delete-student]").forEach((button) => {
            button.addEventListener("click", async () => {
                const studentId = button.getAttribute("data-delete-student");
                if (!window.confirm("Delete this student?")) {
                    return;
                }

                try {
                    await apiRequest(`/student/${studentId}`, { method: "DELETE" });
                    if (state.editStudent && String(state.editStudent.id) === String(studentId)) {
                        state.editStudent = null;
                    }
                    showMessage("Student deleted successfully.", "success");
                    await refreshAllData();
                } catch (error) {
                    showMessage(`Unable to delete student: ${error.message}`, "error");
                }
            });
        });

        document.querySelectorAll("[data-cancel-edit]").forEach((button) => {
            button.addEventListener("click", () => {
                state.editStudent = null;
                render();
            });
        });
    }

    if (state.route === "borrow") {
        const searchForm = document.getElementById("borrow-search-form");
        const borrowForm = document.getElementById("borrow-form");

        searchForm?.addEventListener("submit", (event) => {
            event.preventDefault();
            state.search.borrows = new FormData(searchForm).get("query")?.toString().trim() || "";
            render();
        });

        borrowForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const formData = new FormData(borrowForm);
            const payload = {
                studentId: formData.get("studentId")?.toString(),
                bookId: formData.get("bookId")?.toString(),
            };

            try {
                await apiRequest("/borrow", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                borrowForm.reset();
                showMessage("Book issued successfully.", "success");
                await refreshAllData();
            } catch (error) {
                showMessage(`Unable to issue book: ${error.message}`, "error");
            }
        });
    }
}

window.addEventListener("hashchange", () => {
    setRoute(getRouteFromHash());
});

document.addEventListener("DOMContentLoaded", async () => {
    renderMessage();
    render();
    await refreshAllData();
});