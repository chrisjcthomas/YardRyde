package com.transit.tracker.service;

public class MtaBusTimeException extends RuntimeException {

    public enum Type {
        CONFIGURATION,
        UPSTREAM
    }

    private final Type type;

    public MtaBusTimeException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public MtaBusTimeException(Type type, String message, Throwable cause) {
        super(message, cause);
        this.type = type;
    }

    public Type getType() {
        return type;
    }
}
