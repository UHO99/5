package com.mycom.myapp.team5.domain.k6test.service;

import com.mycom.myapp.team5.domain.k6test.dto.K6ScenarioResponse;
import com.mycom.myapp.team5.domain.k6test.dto.K6StatusResponse;
import com.mycom.myapp.team5.domain.k6test.exception.K6ErrorCode;
import com.mycom.myapp.team5.domain.k6test.exception.K6TestException;
import com.mycom.myapp.team5.global.common.enums.K6Scenario;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * "테스트 시작" 버튼 -> 호스트 도커 데몬에 형제 컨테이너({@code highfive-k6} 이미지)를 띄워 실제 k6 부하테스트를
 * 실행한다(Docker-outside-of-Docker, docker-compose.yml의 backend 서비스가 /var/run/docker.sock을 마운트).
 * 한 번에 하나만 실행되도록 컨테이너 이름을 고정({@link #CONTAINER_NAME})해서 동시 실행 자체를 막는다.
 *
 * <p>시나리오 목록/화이트리스트는 {@link K6Scenario} enum이 유일한 소스다 - 새 스크립트를 추가하려면
 * enum에도 상수를 추가하고 백엔드를 재빌드해야 한다({@link #ensureBakedIntoImage}가 이미지에도 반영됐는지
 * 별도로 확인해서, 이미지 재빌드를 깜빡했을 때 애매한 실패 대신 명확한 에러를 준다).</p>
 */
@Slf4j
@Service
public class K6TestServiceImpl implements K6TestService {

    private static final String CONTAINER_NAME = "highfive-k6-active";

    @Value("${app.k6.network}")
    private String network;

    @Value("${app.k6.image}")
    private String image;

    @Value("${app.k6.base-url}")
    private String baseUrl;

    private final Object lock = new Object();
    private volatile Run current;

    private record Run(K6Scenario scenario, long couponId, Instant startedAt, Process process, Integer exitCode) {
    }

    @Override
    public List<K6ScenarioResponse> listScenarios() {
        return Arrays.stream(K6Scenario.values())
                .map(K6ScenarioResponse::from)
                .toList();
    }

    @Override
    public K6StatusResponse start(String scenarioId, long couponId) {
        K6Scenario scenario = K6Scenario.fromId(scenarioId);

        synchronized (lock) {
            if (current != null && current.exitCode() == null) {
                throw new K6TestException(K6ErrorCode.ALREADY_RUNNING);
            }

            ensureBakedIntoImage(scenario.getFile());
            cleanupStaleContainer();
            Process process = launch(scenario, couponId);
            Run run = new Run(scenario, couponId, Instant.now(), process, null);
            current = run;
            watch(run);

            return toStatus(run);
        }
    }

    @Override
    public K6StatusResponse stop() {
        synchronized (lock) {
            if (current == null || current.exitCode() != null) {
                return current == null ? K6StatusResponse.idle() : toStatus(current);
            }
        }

        try {
            Process stopProcess = new ProcessBuilder("docker", "stop", CONTAINER_NAME)
                    .redirectErrorStream(true)
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .start();
            if (!stopProcess.waitFor(10, TimeUnit.SECONDS)) {
                stopProcess.destroyForcibly();
            }
        } catch (IOException e) {
            log.error("docker stop 실행 실패", e);
            throw new K6TestException(K6ErrorCode.STOP_FAILED);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new K6TestException(K6ErrorCode.STOP_FAILED);
        }

        return status();
    }

    @Override
    public K6StatusResponse status() {
        synchronized (lock) {
            return current == null ? K6StatusResponse.idle() : toStatus(current);
        }
    }

    /** enum엔 있는데 이미지 재빌드를 깜빡해서 실제 파일이 없는 경우를 미리 잡아 명확한 에러로 알려준다. */
    private void ensureBakedIntoImage(String file) {
        try {
            Process check = new ProcessBuilder(
                    "docker", "run", "--rm", "--entrypoint", "sh", image,
                    "-c", "test -f /scripts/" + file
            ).redirectErrorStream(true).redirectOutput(ProcessBuilder.Redirect.DISCARD).start();

            int exitCode = check.waitFor();
            if (exitCode != 0) {
                throw new K6TestException(K6ErrorCode.SCRIPT_NOT_IN_IMAGE);
            }
        } catch (IOException e) {
            log.error("k6 이미지 스크립트 확인 실패", e);
            throw new K6TestException(K6ErrorCode.START_FAILED);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new K6TestException(K6ErrorCode.START_FAILED);
        }
    }

    /** 이전 실행이 비정상 종료해서 --rm이 못 지운 동명 컨테이너가 남아있을 수 있어 실행 전에 미리 치운다. */
    private void cleanupStaleContainer() {
        try {
            Process process = new ProcessBuilder("docker", "rm", "-f", CONTAINER_NAME)
                    .redirectErrorStream(true)
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .start();
            process.waitFor(5, TimeUnit.SECONDS);
        } catch (IOException e) {
            log.warn("잔존 k6 컨테이너 정리 실패 (없었을 수도 있음)", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private Process launch(K6Scenario scenario, long couponId) {
        List<String> command = List.of(
                "docker", "run", "--rm",
                "--name", CONTAINER_NAME,
                "--network", network,
                "-e", "BASE_URL=" + baseUrl,
                "-e", "COUPON_ID=" + couponId,
                image, "run", "/scripts/" + scenario.getFile()
        );

        try {
            Path logFile = prepareLogFile(scenario);
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            pb.redirectOutput(ProcessBuilder.Redirect.to(logFile.toFile()));

            log.info("k6 실행 : scenario={} couponId={} log={}", scenario.getId(), couponId, logFile);
            return pb.start();
        } catch (IOException e) {
            log.error("k6 컨테이너 실행 실패", e);
            throw new K6TestException(K6ErrorCode.START_FAILED);
        }
    }

    private Path prepareLogFile(K6Scenario scenario) throws IOException {
        Path dir = Path.of(System.getProperty("java.io.tmpdir"), "highfive", "k6-logs");
        Files.createDirectories(dir);
        String timestamp = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").format(java.time.LocalDateTime.now());
        return dir.resolve(scenario.getId() + "-" + timestamp + ".log");
    }

    /** 컨테이너 종료를 기다렸다가 상태를 반영한다 - 그 사이 새 run이 시작됐으면(run != current) 자기 결과는 버린다. */
    private void watch(Run run) {
        Thread watcher = new Thread(() -> {
            int exitCode;
            try {
                exitCode = run.process().waitFor();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }

            synchronized (lock) {
                if (current == run) {
                    current = new Run(run.scenario(), run.couponId(), run.startedAt(), run.process(), exitCode);
                }
            }
            log.info("k6 종료 : scenario={} exitCode={}", run.scenario().getId(), exitCode);
        }, "k6-run-watcher");
        watcher.setDaemon(true);
        watcher.start();
    }

    private K6StatusResponse toStatus(Run run) {
        boolean running = run.exitCode() == null;
        return new K6StatusResponse(
                running,
                run.scenario().getId(),
                run.scenario().getFile(),
                run.couponId(),
                run.startedAt(),
                run.exitCode()
        );
    }
}
