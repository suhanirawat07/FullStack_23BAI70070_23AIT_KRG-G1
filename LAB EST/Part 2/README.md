# Appointments Search Demo

Spring Boot + Spring Data JPA project with a custom JPQL query that searches appointments by doctor name case-insensitively.

## Endpoint

`GET /appointments/search?doctor=name`

Examples:

- `GET /appointments/search?doctor=dr. smith`
- `GET /appointments/search?doctor=DR. ADAMS`

## Run

```bash
mvn spring-boot:run
```

## Postman test data

The app seeds sample appointments for these doctor names:

- Dr. Smith
- Dr. Adams
- Dr. Brown

Use two different values in Postman to confirm the case-insensitive match.
