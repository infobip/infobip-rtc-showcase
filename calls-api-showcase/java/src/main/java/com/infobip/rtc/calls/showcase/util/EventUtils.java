package com.infobip.rtc.calls.showcase.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infobip.rtc.calls.showcase.model.EventType;
import jakarta.annotation.Nullable;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

@Slf4j
public class EventUtils {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public static Optional<EventType> getEventType(Map<String, Object> body) {
        return Stream.of(EventType.values())
                .filter(eventType -> eventType.name().equals(body.get("type")))
                .findFirst();
    }

    public static <T> T convert(Map<String, Object> body, Class<T> clazz) {
        return OBJECT_MAPPER.convertValue(body, clazz);
    }
}
