# Build stage
FROM gradle:9.2.1-jdk21 AS build
WORKDIR /app
COPY backend/build.gradle backend/settings.gradle ./backend/
COPY backend/src ./backend/src
COPY src ./src
WORKDIR /app/backend
RUN gradle clean bootJar --no-daemon

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/backend/build/libs/logistics-system-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
