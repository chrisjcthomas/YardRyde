package com.transit.tracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.http.HttpClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MtaBusTimeHttpGatewayTest {

    @Test
    void trimsWhitespaceFromConfiguredApiKey() throws Exception {
        MtaBusTimeHttpGateway gateway = new MtaBusTimeHttpGateway(
                new ObjectMapper(),
                HttpClient.newHttpClient(),
                new MtaBusTimeParser());
        setPrivateField(gateway, "apiKey", "  test-key  ");

        String normalizedKey = invokeRequireApiKey(gateway);

        assertEquals("test-key", normalizedKey);
    }

    @Test
    void rejectsBlankApiKeyAfterTrimming() throws Exception {
        MtaBusTimeHttpGateway gateway = new MtaBusTimeHttpGateway(
                new ObjectMapper(),
                HttpClient.newHttpClient(),
                new MtaBusTimeParser());
        setPrivateField(gateway, "apiKey", "   ");

        InvocationTargetException error = assertThrows(InvocationTargetException.class, () -> invokeRequireApiKey(gateway));

        assertInstanceOf(MtaBusTimeException.class, error.getCause());
        assertEquals(MtaBusTimeException.Type.CONFIGURATION, ((MtaBusTimeException) error.getCause()).getType());
    }

    private String invokeRequireApiKey(MtaBusTimeHttpGateway gateway) throws Exception {
        Method method = MtaBusTimeHttpGateway.class.getDeclaredMethod("requireApiKey");
        method.setAccessible(true);
        return (String) method.invoke(gateway);
    }

    private void setPrivateField(MtaBusTimeHttpGateway gateway, String fieldName, String value) throws Exception {
        Field field = MtaBusTimeHttpGateway.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(gateway, value);
    }
}
