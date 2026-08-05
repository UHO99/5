package com.mycom.myapp.team5.domain.example.repository;

import com.mycom.myapp.team5.domain.example.entity.Example;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExampleRepository extends JpaRepository<Example, Long> { }
