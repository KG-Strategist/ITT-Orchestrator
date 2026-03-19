# Multi-stage build for minimal production image
# Stage 1: Build
FROM rust:latest as builder

WORKDIR /app

# Install build dependencies (including cmake for rdkafka-sys)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    cmake \
    build-essential \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY backend/Cargo.toml backend/Cargo.toml
COPY backend/Cargo.lock backend/Cargo.lock
COPY sdk sdk
COPY backend/crates backend/crates

# Build dependencies (leverage caching)
WORKDIR /app/backend
RUN cargo build --release -p itt_api --jobs 1

# Stage 2: Runtime
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/backend/target/release/itt_api /app/itt_api

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/logs && \
    chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Configure signal handling for graceful shutdown
ENV RUST_BACKTRACE=1

CMD ["/app/itt_api"]
