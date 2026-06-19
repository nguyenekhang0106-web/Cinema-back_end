FROM maven:3.9.9-eclipse-temurin-24 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:24-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 9090

ENTRYPOINT ["sh", "-c", "java -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-9090} -jar app.jar"]