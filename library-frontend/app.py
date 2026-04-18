from flask import Flask, render_template, request, redirect, url_for, flash
import requests
import datetime

app = Flask(__name__)
app.secret_key = 'poogle_library_secret_key'  # Required for flash messages

# Configuration - Pointing to your Spring Boot Backend
API_BASE_URL = "http://localhost:8080"


# --- Helpers ---
def format_date(date_str):
    # Basic helper to make Spring Boot dates look nice
    try:
        # Spring often sends complex date objects or ISO strings
        if isinstance(date_str, str):
            # Check if it has a dot (milliseconds) or not to prevent parse errors
            if '.' in date_str:
                dt = datetime.datetime.strptime(date_str.split('.')[0], "%Y-%m-%dT%H:%M:%S")
            else:
                dt = datetime.datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
            return dt.strftime("%Y-%m-%d %H:%M")
        return date_str
    except Exception as e:
        return date_str


app.jinja_env.globals.update(format_date=format_date)


# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')


# --- BOOK ROUTES ---

@app.route('/books')
def books():
    # Check if there is a search query in the URL (e.g., /books?q=Harry)
    query = request.args.get('q')

    try:
        if query:
            # Call the Search Endpoint
            response = requests.get(f"{API_BASE_URL}/book/search", params={'query': query})
        else:
            # Call the Get All Endpoint
            response = requests.get(f"{API_BASE_URL}/book")

        books_data = response.json() if response.status_code == 200 else []
        if not isinstance(books_data, list): books_data = []

    except requests.exceptions.ConnectionError:
        flash("Error: Could not connect to Spring Boot Backend.", "error")
        books_data = []

    return render_template('books.html', books=books_data)


@app.route('/books/add', methods=['POST'])
def add_book():
    book_data = {
        "title": request.form.get('title'),
        "author": request.form.get('author'),
        "price": float(request.form.get('price')),
        "stock": int(request.form.get('stock'))
    }
    requests.post(f"{API_BASE_URL}/book", json=book_data)
    return redirect(url_for('books'))


@app.route('/books/delete/<id>', methods=['POST'])
def delete_book(id):
    requests.delete(f"{API_BASE_URL}/book/{id}")
    return redirect(url_for('books'))


# --- STUDENT ROUTES ---

@app.route('/students')
def students():
    query = request.args.get('q')

    try:
        if query:
            # Call the Search Endpoint
            response = requests.get(f"{API_BASE_URL}/student/search", params={'query': query})
        else:
            # Call the Get All Endpoint
            response = requests.get(f"{API_BASE_URL}/student")

        students_data = response.json() if response.status_code == 200 else []
        if not isinstance(students_data, list): students_data = []

    except requests.exceptions.ConnectionError:
        flash("Error: Could not connect to Spring Boot Backend.", "error")
        students_data = []

    return render_template('students.html', students=students_data)


@app.route('/students/add', methods=['POST'])
def add_student():
    student_data = {
        "name": request.form.get('name'),
        "roll": request.form.get('roll')
    }
    requests.post(f"{API_BASE_URL}/student", json=student_data)
    return redirect(url_for('students'))


@app.route('/students/delete/<id>', methods=['POST'])
def delete_student(id):
    requests.delete(f"{API_BASE_URL}/student/{id}")
    return redirect(url_for('students'))


@app.route('/students/edit/<id>', methods=['GET', 'POST'])
def edit_student(id):
    if request.method == 'POST':
        updated_data = {
            "name": request.form.get('name'),
            "borrowedBooks": []  # Sending empty list as per controller logic (it keeps old if empty)
        }
        requests.put(f"{API_BASE_URL}/student/{id}", json=updated_data)
        return redirect(url_for('students'))

    # Fetch specific student to pre-fill form
    # Note: Using GetAll and filtering is inefficient for production but works for this setup
    # ideally you would add a GET /student/{id} endpoint to your backend
    try:
        response = requests.get(f"{API_BASE_URL}/student")
        students = response.json()
        student = next((s for s in students if str(s.get('id')) == id), None)
    except:
        student = None

    return render_template('edit_student.html', student=student)


# --- BORROW ROUTES ---

@app.route('/borrow', methods=['GET'])
def borrow():
    query = request.args.get('q')

    # 1. Get Borrow History (Search or All)
    try:
        if query:
            borrow_resp = requests.get(f"{API_BASE_URL}/borrow/search", params={'query': query})
        else:
            borrow_resp = requests.get(f"{API_BASE_URL}/borrow")
        borrows = borrow_resp.json() if borrow_resp.status_code == 200 else []
    except:
        borrows = []

    # 2. Get Students (for the dropdown list - always need all students)
    try:
        std_resp = requests.get(f"{API_BASE_URL}/student")
        students = std_resp.json() if std_resp.status_code == 200 else []
    except:
        students = []

    # 3. Get Books (for the dropdown list - always need all books)
    try:
        bk_resp = requests.get(f"{API_BASE_URL}/book")
        books = bk_resp.json() if bk_resp.status_code == 200 else []
        # Only show books that have stock > 0
        available_books = [b for b in books if b.get('stock', 0) > 0]
    except:
        available_books = []

    return render_template('borrow.html', borrows=borrows, students=students, books=available_books)


@app.route('/borrow/add', methods=['POST'])
def add_borrow():
    payload = {
        "studentId": request.form.get('student_id'),
        "bookId": request.form.get('book_id')
    }

    try:
        resp = requests.post(f"{API_BASE_URL}/borrow", json=payload)
        if resp.status_code != 201:
            flash("Failed to issue book. Check if book is in stock.", "error")
    except:
        flash("Connection error while issuing book.", "error")

    return redirect(url_for('borrow'))


if __name__ == '__main__':
    app.run(debug=True, port=5000)