package com.mycom.myapp.team5.global.config;

import com.mycom.myapp.team5.global.kafka.CouponRequestProducer;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class CouponKafkaTopicConfig {

    @Bean
    public NewTopic couponIssueRequestTopic() {
        return TopicBuilder.name(CouponRequestProducer.TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

}
