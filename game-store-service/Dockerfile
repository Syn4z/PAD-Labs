FROM python:3.12
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
COPY src/ src/
COPY .env .env
EXPOSE 5000
CMD ["python", "./src/app.py"]