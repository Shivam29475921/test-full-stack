package com.poogle.library_management.controller;

import com.poogle.library_management.entity.Book;
import com.poogle.library_management.entity.Borrow;
import com.poogle.library_management.entity.Student;
import com.poogle.library_management.service.BookService;
import com.poogle.library_management.service.BorrowService;
import com.poogle.library_management.service.StudentService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("borrow")
public class BorrowController {

    @Autowired
    BorrowService borrowService;

    @Autowired
    StudentService studentService;

    @Autowired
    BookService bookService;

    @GetMapping
    public ResponseEntity<?> getAllBorrowings(){
        List<Borrow> borrows = borrowService.getAllBorrowings();
        return new ResponseEntity<>(borrows, HttpStatus.OK);
    }

    @GetMapping("{studentId}")
    public ResponseEntity<?> getBorrowingsOfStudent(@PathVariable ObjectId studentId){
        Student student = studentService.getStudentById(studentId);
        List<Borrow> studentBorrows = borrowService.getBorrowingsOfStudent(student);
        return new ResponseEntity<>(studentBorrows, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<?> postBorrowings(@RequestBody Map<String, String> map){
        ObjectId studentId = new ObjectId(map.get("studentId"));
        ObjectId bookId = new ObjectId(map.get("bookId"));

        Student student = studentService.getStudentById(studentId);
        Book book = bookService.getBookById(bookId);

        Borrow borrow = new Borrow();
        borrow.setStudent(student);
        borrow.setBook(book);
        borrow.setDateTime(LocalDateTime.now());
        borrowService.postBorrowing(borrow);

        List<Book> issuedBooks = student.getBorrowedBooks();
        issuedBooks.add(book);
        studentService.putStudent(student);

        book.setStock(book.getStock() - 1);
        bookService.putBook(book);

        return new ResponseEntity<>(borrow, HttpStatus.CREATED);

    }

    @GetMapping("/search")
    public ResponseEntity<?> searchBorrows(@RequestParam String query){
        List<Borrow> allBorrows = borrowService.getAllBorrowings();

        String lowerQuery = query.toLowerCase();
        List<Borrow> filtered = allBorrows.stream()
                .filter(b -> (b.getStudent() != null && b.getStudent().getName().toLowerCase().contains(lowerQuery)) ||
                        (b.getBook() != null && b.getBook().getTitle().toLowerCase().contains(lowerQuery)))
                .collect(Collectors.toList());

        return new ResponseEntity<>(filtered, HttpStatus.OK);
    }


}