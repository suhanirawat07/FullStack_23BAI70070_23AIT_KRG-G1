package com.example.websocketdemo;

import java.io.IOException;
import java.time.LocalDateTime;

import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;
import org.springframework.stereotype.Component;

@Component
@ServerEndpoint(value = "/ws/messages", configurator = WebSocketOriginConfigurator.class)
public class WebSocketEndpoint {

    @OnOpen
    public void onOpen(Session session) throws IOException {
        session.getBasicRemote().sendText("Server: connection opened at " + LocalDateTime.now());
    }

    @OnMessage
    public void onMessage(String message, Session session) throws IOException {
        session.getBasicRemote().sendText("Server echo: " + message);
    }

    @OnClose
    public void onClose(Session session) {
        // Demo endpoint, no cleanup required.
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        throwable.printStackTrace();
    }
}