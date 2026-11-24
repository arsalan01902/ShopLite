# Stage 1: Build the Go application
FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o inventory-service .

# Stage 2: Create a lightweight runtime image
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/inventory-service .

EXPOSE 8081

CMD ["./inventory-service"]
