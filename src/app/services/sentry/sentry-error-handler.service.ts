import { ErrorHandler, Injectable } from '@angular/core';
import { SentryService } from './sentry.service';

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor(private readonly sentryService: SentryService) {}

  handleError(error: unknown): void {
    this.sentryService.captureException(error);
    console.error(error);
  }
}
