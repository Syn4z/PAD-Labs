import { Injectable } from '@nestjs/common';

@Injectable()
export class RoundRobinService {
  private index = 0;

  getNextInstance(instances: string[]): string {
    if (instances.length === 0) {
      throw new Error('No available service instances');
    }
    const instance = instances[this.index];
    this.index = (this.index + 1) % instances.length;
    return instance;
  }
}
