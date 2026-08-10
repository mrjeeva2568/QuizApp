package com.examquizai.backend.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.util.concurrent.TimeUnit;

/**
 * WebClient configuration dedicated to the UiPath Agent integration: bounded
 * connect/read/write timeouts (so a hung agent call can never block a request
 * thread forever) and a larger in-memory buffer to comfortably hold generated
 * quiz JSON payloads.
 */
@Configuration
@RequiredArgsConstructor
public class UiPathWebClientConfig {

    private static final int MAX_IN_MEMORY_SIZE_BYTES = 4 * 1024 * 1024; // 4MB - generated quizzes can be sizable

    private final UiPathProperties uiPathProperties;

    @Bean
    public WebClient uiPathWebClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, (int) uiPathProperties.getConnectTimeoutMs())
                .responseTimeout(java.time.Duration.ofMillis(uiPathProperties.getResponseTimeoutMs()))
                .doOnConnected(connection -> connection
                        .addHandlerLast(new ReadTimeoutHandler(uiPathProperties.getResponseTimeoutMs(), TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(uiPathProperties.getResponseTimeoutMs(), TimeUnit.MILLISECONDS)));

        ExchangeStrategies exchangeStrategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE_BYTES))
                .build();

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .exchangeStrategies(exchangeStrategies)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
