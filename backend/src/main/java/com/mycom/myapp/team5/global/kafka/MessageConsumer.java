package com.mycom.myapp.team5.global.kafka;

import lombok.Getter;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Getter
@Component
public class MessageConsumer {

    private final List<String> receivedMessages = new ArrayList<>();

    @KafkaListener(topics = "test-topic", groupId = "test-group")
    public void setReceivedMessages(String message) {
        receivedMessages.add(message);
    }

}
