import requests
import time

BASE_URL = "http://localhost:5001/users/"

def delayed_request(url, delay):
    start_time = time.time()
    # Simulate request processing time by delaying
    response = requests.get(url)
    time_to_sleep = delay - (time.time() - start_time)
    if time_to_sleep > 0:
        time.sleep(time_to_sleep)
    
    return response

def test_timeout():
    # Simulate a long-running request to trigger the timeout
    try:
        response = delayed_request(BASE_URL + "status", 7)  # Set delay longer than the timeout
        assert response.status_code == 504, f"Expected 504, got {response.status_code}"
        assert response.json().get('error') == 'Request timed out', "Expected timeout error message"
    except requests.exceptions.Timeout:
        print("Request timed out as expected")

if __name__ == "__main__":
    test_timeout()
    print("Timeout test passed.")