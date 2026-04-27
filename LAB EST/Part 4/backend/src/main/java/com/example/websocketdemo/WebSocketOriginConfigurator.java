package com.example.websocketdemo;

import jakarta.websocket.server.ServerEndpointConfig;

public class WebSocketOriginConfigurator extends ServerEndpointConfig.Configurator {

    @Override
    public boolean checkOrigin(String originHeaderValue) {
        return true;
    }
}