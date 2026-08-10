# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy the POM first and pre-fetch dependencies into a layer that only
# invalidates when pom.xml changes, not on every source edit.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---------- Runtime stage ----------
# JRE, not JDK - the compiler/build tooling has no business existing in the
# running container, and it roughly halves the image size.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as a non-root user - a compromised process should not have root
# inside its own container, even though containers aren't a full sandbox boundary.
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Actuator's health endpoint is already exposed (see application.properties)
# and doubles as this container's own healthcheck and as the liveness/readiness
# probe most orchestrators (Kubernetes, ECS, Railway, Render) expect.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
