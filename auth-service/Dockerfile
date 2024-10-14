FROM python:3.9-alpine
WORKDIR /app
COPY requirements.txt requirements.txt
RUN apk add --no-cache gcc musl-dev python3-dev linux-headers
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
COPY src/ src/
COPY .env .env
EXPOSE 5000
CMD ["sh", "-c", "python ./src/consul-register.py && python ./src/app.py"]