FROM python:3.9-alpine
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
COPY src/ src/
COPY .env .env
EXPOSE 5001
CMD ["python", "./src/app.py"]