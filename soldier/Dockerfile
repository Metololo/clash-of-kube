FROM golang:1.25-alpine AS builder
WORKDIR /build
COPY . .
RUN go build -o /app .

FROM alpine:latest AS final
COPY --from=builder /app /bin/app
CMD ["bin/app"]