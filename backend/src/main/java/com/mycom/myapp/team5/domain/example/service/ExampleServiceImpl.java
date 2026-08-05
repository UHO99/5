package com.mycom.myapp.team5.domain.example.service;

import com.mycom.myapp.team5.domain.example.dto.ExampleResponse;
import com.mycom.myapp.team5.domain.example.entity.Example;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExampleServiceImpl implements ExampleService {

    @Override
    public ExampleResponse getExampleById(Long id) {
        return ExampleResponse.from(new Example(1L, "example"));
    }

}
