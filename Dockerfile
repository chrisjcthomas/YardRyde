# Stage 1: Build the React frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM eclipse-temurin:21-jdk-jammy AS backend-builder
WORKDIR /app
# Install findutils for mvnw and other tools (apt-get is available in jammy)
RUN apt-get update && apt-get install -y findutils
COPY server/ .
# Copy frontend build to static resources
COPY --from=frontend-builder /app/client/dist/ src/main/resources/static/
# Ensure mvnw is executable
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# Stage 3: Final runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=backend-builder /app/target/tracker-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
