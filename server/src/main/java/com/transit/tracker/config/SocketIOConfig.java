package com.transit.tracker.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.Transport;
import com.corundumstudio.socketio.protocol.JacksonJsonSupport;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SocketIOConfig {

    @Value("${socketio.host:0.0.0.0}")
    private String host;

    @Value("${socketio.port:3001}")
    private int port;

    private SocketIOServer server;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin("*");
        config.setTransports(Transport.WEBSOCKET, Transport.POLLING);
        config.setPingInterval(25000);
        config.setPingTimeout(60000);
        config.setAllowCustomRequests(true);
        config.setJsonSupport(new JacksonJsonSupport(new JavaTimeModule()));

        server = new SocketIOServer(config);
        return server;
    }

    @PreDestroy
    public void stopSocketIOServer() {
        if (server != null) {
            server.stop();
        }
    }
}
