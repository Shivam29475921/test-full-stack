package com.poogle.library_management.service;
import com.poogle.library_management.entity.Book;
import com.poogle.library_management.repository.BookRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookService {

    @Autowired
    BookRepository bookRepository;

    public void postBookToLibrary(Book book){
            bookRepository.insert(book);
    }

    public List<Book> getAllBooks(){
        return bookRepository.findAll();
    }

    public void deleteBookById(ObjectId id){
        bookRepository.deleteById(id);
    }

    public Book getBookById(ObjectId id){
        return bookRepository.findById(id).orElse(null);
    }

    public void putBook(Book book){
        bookRepository.save(book);
    }

    public List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String query, String query1) {
        return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(query, query1);
    }
}