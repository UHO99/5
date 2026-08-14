package com.mycom.myapp.team5.domain.user.repository;

import com.mycom.myapp.team5.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> { }
