package com.mycom.myapp.team5.domain.example.controller;

import com.mycom.myapp.team5.domain.example.dto.ExampleResponse;
import com.mycom.myapp.team5.domain.example.service.ExampleService;
import com.mycom.myapp.team5.global.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ExampleController {

    private final ExampleService exampleService;

    @GetMapping("/examples/{id}")
    public ResponseEntity<ApiResponse<ExampleResponse>> getExamples(@PathVariable("id") Long id) {
        ExampleResponse res = exampleService.getExampleById(id);

        return ResponseEntity.ok(ApiResponse.success(res));
    }

}
