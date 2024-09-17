FROM postgres:latest

# Set environment variables
ENV POSTGRES_USER postgres
ENV POSTGRES_PASSWORD sorin
ENV POSTGRES_DB userDetails

# Run the database initialization script
COPY userDetail.sql /docker-entrypoint-initdb.d/

# Expose the port
EXPOSE 5432