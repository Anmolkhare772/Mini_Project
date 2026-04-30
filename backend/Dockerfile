# Build stage for Python dependencies
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies (for psycopg2, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Copy only the necessary files from the builder
COPY --from=builder /root/.local /root/.local
COPY . .

# Ensure scripts in .local/bin are in PATH
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Expose the port Gunicorn will run on
EXPOSE 5000

# Run the application using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "wsgi:app"]
