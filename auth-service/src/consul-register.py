import os
import requests
import socket

def register_service():
  consul_host = os.getenv('CONSUL_HOST')
  consul_port = os.getenv('CONSUL_PORT')
  service_name = 'Auth Service'
  service_port = int(os.getenv('SERVICE_PORT'))
  service_prefix = os.getenv('SERVICE_PREFIX')
  service_id = f"{service_name}-{socket.gethostbyname(socket.gethostname())}"

  url = f"http://{consul_host}:{consul_port}/v1/agent/service/{service_id}"
  response = requests.get(url)
  if response.status_code == 200:
    print(f"(STATUS): Service {service_name} is already registered.")
    return

  service_registration = {
    "ID": service_id,
    "Name": service_name,
    "Address": socket.gethostbyname(socket.gethostname()),
    "Port": service_port,
    "Tags": ["auth"],
    "Check": {
        "HTTP": f"http://{socket.gethostbyname(socket.gethostname())}:{service_port}/{service_prefix}/status",
        "Interval": "10s"
    }
  }

  url = f"http://{consul_host}:{consul_port}/v1/agent/service/register"
  response = requests.put(url, json=service_registration)
  if response.status_code == 200:
    print(f"(STATUS): Service {service_name} registered successfully.")
  else:
    print(f"(ERROR): Failed to register service {service_name}. Status code: {response.status_code}")

if __name__ == "__main__":
    register_service()