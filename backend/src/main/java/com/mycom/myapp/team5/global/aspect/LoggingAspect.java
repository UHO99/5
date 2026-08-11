package com.mycom.myapp.team5.global.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    @Before("execution(* com.mycom.app..*(..))")
    public void logBefore(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getName();
        String methodParams = joinPoint.getArgs().toString();
        String classParams = joinPoint.getArgs().toString();

        log.info("{} {} {} {}", methodName, className, methodParams, classParams);
    }

    @AfterThrowing(pointcut = "execution(* com.mycom.app..*(..))")
    public void logAfterThrowing(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getName();
        String methodParams = joinPoint.getArgs().toString();
        String classParams = joinPoint.getArgs().toString();

        log.info("{} {} {} {}", methodName, className, methodParams, classParams);
    }

}
