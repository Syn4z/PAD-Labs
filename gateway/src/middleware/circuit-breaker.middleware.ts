export class CircuitBreaker {
    private failureCount = 0;
    private successCount = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private readonly failureThreshold: number;
    private readonly successThreshold: number;
    private readonly timeout: number;
    private nextAttempt = Date.now();
  
    constructor(failureThreshold: number, successThreshold: number, timeout: number) {
      this.failureThreshold = failureThreshold;
      this.successThreshold = successThreshold;
      this.timeout = timeout;
    }
  
    public async call(serviceCall: () => Promise<any>): Promise<any> {
      if (this.state === 'OPEN') {
        if (Date.now() > this.nextAttempt) {
          this.state = 'HALF_OPEN';
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
          this.fail();
          if (attempt < 2) {
            console.log(`Retrying service call, attempt ${attempt + 2}`);
          }
        }
      }
    
      throw lastError;
    }
  
    private success() {
      this.failureCount = 0;
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.state = 'CLOSED';
          console.log('Circuit breaker is: ', this.state);
          this.successCount = 0;
        }
      }
    }
  
    private fail() {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        console.log('Circuit breaker is: ', this.state);
        this.nextAttempt = Date.now() + this.timeout;
      }
    }
  }