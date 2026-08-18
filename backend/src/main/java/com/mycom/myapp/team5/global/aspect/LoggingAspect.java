package com.mycom.myapp.team5.global.aspect;

import com.mycom.myapp.team5.global.common.util.MaskingUtils;
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

    private static final String POINTCUT =
            "execution(* com.mycom.myapp.team5.domain..controller..*(..)) "
                    + "|| execution(* com.mycom.myapp.team5.domain..service..*(..))";

    @Before(POINTCUT)
    public void logBefore(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getName();
        String maskedArgs = MaskingUtils.maskForLog(joinPoint.getArgs());

        log.info("{} {} args={}", methodName, className, maskedArgs);
    }

    @AfterThrowing(pointcut = POINTCUT, throwing = "ex")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable ex) {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getName();
        String maskedArgs = MaskingUtils.maskForLog(joinPoint.getArgs());

        log.error("{} {} args={} error={}", methodName, className, maskedArgs, ex.toString());
    }
}
