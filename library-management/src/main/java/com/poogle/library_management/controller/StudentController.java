package com.poogle.library_management.controller;


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
@RequestMapping("student")
public class StudentController {

    @Autowired
    StudentService studentService;

    @Autowired
    BookService bookService;

    @GetMapping
    public ResponseEntity<?> getAllStudents(){
        return new ResponseEntity<>(studentService.getAllStudents(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<?> postStudent(@RequestBody Student student){
        studentService.postStudent(student);
        return new ResponseEntity<>(student, HttpStatus.CREATED);
    }

    @DeleteMapping("{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable ObjectId id){
        studentService.deleteStudent(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PutMapping("{id}")
    public ResponseEntity<?> putStudent(@PathVariable ObjectId id, @RequestBody Student newStudent){
        Student oldStudent = studentService.getStudentById(id);
        oldStudent.setName(newStudent.getName().isEmpty()? oldStudent.getName() : newStudent.getName());
        oldStudent.setBorrowedBooks(newStudent.getBorrowedBooks().isEmpty()?oldStudent.getBorrowedBooks() : newStudent.getBorrowedBooks());

        studentService.putStudent(oldStudent);
        return new ResponseEntity<>(oldStudent, HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchStudents(@RequestParam String query){
        List<Student> students = studentService.findByNameContainingIgnoreCaseOrRollContainingIgnoreCase(query, query);
        return new ResponseEntity<>(students, HttpStatus.OK);
    }

}