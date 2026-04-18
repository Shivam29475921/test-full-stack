package com.poogle.library_management.repository;

import com.poogle.library_management.entity.Student;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface StudentRepository extends MongoRepository<Student, ObjectId> {
    List<Student> findByNameContainingIgnoreCaseOrRollContainingIgnoreCase(String name, String roll);
}