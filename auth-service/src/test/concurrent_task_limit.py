import requests
from time import sleep

BASE_URL = "http://localhost:5001/users/"

def test_rate_limiting():
    # Make 5 requests within the limit
    for _ in range(5):
        response = requests.get(BASE_URL)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    # The 6th request should be rate limited
    response = requests.get(BASE_URL)
    assert response.status_code == 429, f"Expected 429, got {response.status_code}"

    # Wait for the rate limit to reset
    sleep(60)
    response = requests.get(BASE_URL)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

if __name__ == "__main__":
    test_rate_limiting()
    print("Rate limiting test passed.")