package com.poogle.library_management.service;
import com.poogle.library_management.entity.Student;
import com.poogle.library_management.repository.StudentRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StudentService {
    @Autowired
    StudentRepository studentRepository;

    public Student getStudentById(ObjectId id){
        return studentRepository.findById(id).orElse(new Student());
    }

    public List<Student> getAllStudents(){
        return studentRepository.findAll();
    }

    public void postStudent(Student student){
        studentRepository.insert(student);
    }

    public void putStudent(Student student){
        studentRepository.save(student);
    }

    public void deleteStudent(ObjectId id){
        studentRepository.deleteById(id);
    }

    public List<Student> findByNameContainingIgnoreCaseOrRollContainingIgnoreCase(String query, String query1) {
        return studentRepository.findByNameContainingIgnoreCaseOrRollContainingIgnoreCase(query, query1);
    }
}