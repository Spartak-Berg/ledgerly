import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return { service: 'ledgerly-api', status: 'ok' } as const;
  }
}
