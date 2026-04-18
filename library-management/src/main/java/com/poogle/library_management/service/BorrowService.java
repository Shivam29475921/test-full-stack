package com.poogle.library_management.service;
import com.poogle.library_management.entity.Borrow;
import com.poogle.library_management.entity.Student;
import com.poogle.library_management.repository.BorrowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class BorrowService {

    @Autowired
    BorrowRepository borrowRepository;

    public List<Borrow> getAllBorrowings(){
        return borrowRepository.findAll();
    }

    public List<Borrow> getBorrowingsOfStudent(Student student){

        List<Borrow> borrowings = borrowRepository.findAll();
        List<Borrow> userBorrows = new ArrayList<>();
        for(Borrow borrow : borrowings){
            if(borrow.getStudent().getId().equals(student.getId())) userBorrows.add(borrow);
        }
        return userBorrows;
    }

    public void postBorrowing(Borrow borrow){
        borrowRepository.insert(borrow);
    }

    public void putBorrowing(Borrow borrow){
        borrowRepository.save(borrow);
    }
}