package com.careerreadiness.gateway.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;

@RestController
@RequestMapping("/api/ai")
@Slf4j
public class AiGatewayController {

    private final RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Value("${RAG_SERVICE_URL:http://localhost:8001}")
    private String ragServiceUrl;

    @org.springframework.beans.factory.annotation.Value("${VISION_SERVICE_URL:http://localhost:8002}")
    private String visionServiceUrl;

    public AiGatewayController() {
        this.restTemplate = new RestTemplate();
        // Set 30s timeout as requested
        this.restTemplate.setRequestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory() {{
            setConnectTimeout(5000);
            setReadTimeout(30000);
        }});
    }

    @RequestMapping(value = "/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
    public ResponseEntity<byte[]> proxy(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        String originalPath = request.getRequestURI();
        String path = originalPath.replace("/api/ai", "");
        String query = request.getQueryString() != null ? "?" + request.getQueryString() : "";
        
        // Dynamic Routing Logic
        String targetBaseUrl;
        if (originalPath.contains("/api/chat") || originalPath.contains("/chat")) {
            targetBaseUrl = ragServiceUrl;
        } else if (originalPath.contains("/api/vision") || originalPath.contains("/vision")) {
            targetBaseUrl = visionServiceUrl;
        } else {
            targetBaseUrl = ragServiceUrl; // Default to RAG for generic /api/ai calls
        }

        String url = targetBaseUrl + path + query;

        log.debug("[{}] Gateway Routing: {} {} -> {}", 
                LocalDateTime.now(), request.getMethod(), request.getRequestURI(), url);

        HttpHeaders headers = new HttpHeaders();
        Collections.list(request.getHeaderNames()).forEach(headerName -> {
            headers.add(headerName, request.getHeader(headerName));
        });

        // Add mandatory header
        headers.set("X-Gateway-Version", "1.0");

        HttpEntity<byte[]> entity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(url, HttpMethod.valueOf(request.getMethod()), entity, byte[].class);
        } catch (ResourceAccessException e) {
            log.error("AI Service Unreachable: {}", url);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("{\"error\": \"AI service unavailable (503)\"}".getBytes());
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsByteArray());
        } catch (Exception e) {
            log.error("Gateway error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Internal Gateway Error\"}".getBytes());
        }
    }
}
