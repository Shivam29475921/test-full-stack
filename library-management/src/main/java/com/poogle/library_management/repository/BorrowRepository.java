package com.poogle.library_management.repository;

import com.poogle.library_management.entity.Borrow;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BorrowRepository extends MongoRepository<Borrow, ObjectId> {
}