export class CircuitBreaker {
  private failureCount = 0;
  public state: 'CLOSED' | 'OPEN' = 'CLOSED';
  private readonly failureThreshold: number;
  private readonly timeout: number;
  private nextAttempt = Date.now();
  private instanceFailures = 0;

  constructor(failureThreshold: number, timeout: number) {
    this.failureThreshold = failureThreshold;
    this.timeout = timeout;
  }

  public async call(serviceCall: () => Promise<any>): Promise<any> {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'CLOSED';
        console.log('Circuit breaker is: ', this.state);
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    let lastError: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await serviceCall();
        this.success();
        return response;
      } catch (error) {
        lastError = error;
        this.instanceFailures++;
        if (this.instanceFailures >= 3) {
          this.fail();
        }
        if (attempt < 2) {
          console.log(`Retrying service call, attempt ${attempt + 2}/3`);
        }
      }
    }

    throw lastError;
  }

  private success() {
    this.failureCount = 0;
    this.instanceFailures = 0;
  }

  protected fail() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log('Circuit breaker is: ', this.state);
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  public resetFailures() {
    // this.failureCount = 0;
    this.instanceFailures = 0;
  }
}