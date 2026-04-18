package com.poogle.library_management.controller;


import com.mongodb.DuplicateKeyException;
import com.poogle.library_management.entity.Book;
import com.poogle.library_management.entity.Student;
import com.poogle.library_management.service.BookService;
import com.poogle.library_management.service.StudentService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("book")
public class BookController {

    @Autowired
    BookService bookService;

    @Autowired
    StudentService studentService;

    @PostMapping
    public ResponseEntity<?> postBookToLibrary(@RequestBody Book book){
        try{
            bookService.postBookToLibrary(book);
            return new ResponseEntity<>(book, HttpStatus.CREATED);
        }
        catch(DuplicateKeyException e){
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllBooks(){

        List<Book> allBooks = bookService.getAllBooks();
        if(allBooks.isEmpty()) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        return new ResponseEntity<>(allBooks, HttpStatus.OK);

    }

    @GetMapping("id/{bookId}")
    public ResponseEntity<?> getBookById(@PathVariable ObjectId bookId){
        Book book = bookService.getBookById(bookId);
        return new ResponseEntity<>(book, HttpStatus.OK);
    }

    @GetMapping("student/{studentId}")
    public ResponseEntity<?> getBookByStudentId(@PathVariable ObjectId studentId){
        Student student = studentService.getStudentById(studentId);
        List<Book> issuedBooks = student.getBorrowedBooks();
        return new ResponseEntity<>(issuedBooks, HttpStatus.OK);
    }

    @DeleteMapping("{id}")
    public ResponseEntity<?> deleteBookById(@PathVariable ObjectId id){
        bookService.deleteBookById(id);
        List<Student> students = studentService.getAllStudents();
        for(Student student : students){
            List<Book> issuedBooks = student.getBorrowedBooks();
            if(issuedBooks.stream().anyMatch(b -> b.getId().equals(id))){
                issuedBooks.removeIf(b -> b.getId().equals(id));
                studentService.putStudent(student);
            }
        }
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchBooks(@RequestParam String query){
        // We pass the same query to both title and author
        List<Book> books = bookService.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(query, query);
        return new ResponseEntity<>(books, HttpStatus.OK);
    }

}