import { Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';

interface DashboardSentryConfig {
  sentryDsn?: string;
  sentryEnabled?: boolean | string;
  sentryEnvironment?: string;
  sentryRelease?: string;
  sentryTracesSampleRate?: number | string;
}

@Injectable()
export class SentryService {
  private initialized = false;

  init(config: unknown): void {
    const sentryConfig = this.toSentryConfig(config);

    if (!this.isEnabled(sentryConfig.sentryEnabled) || !sentryConfig.sentryDsn) {
      return;
    }

    Sentry.init({
      dsn: sentryConfig.sentryDsn,
      environment: sentryConfig.sentryEnvironment || 'production',
      release: sentryConfig.sentryRelease || undefined,
      tracesSampleRate: this.toSampleRate(sentryConfig.sentryTracesSampleRate),
    });

    Sentry.setTag('chatcase.app', 'dashboard');
    this.initialized = true;
  }

  captureException(error: unknown): void {
    if (!this.initialized) {
      return;
    }

    Sentry.captureException(error);
  }

  private toSentryConfig(config: unknown): DashboardSentryConfig {
    if (!config || typeof config !== 'object') {
      return {};
    }

    return config as DashboardSentryConfig;
  }

  private isEnabled(value: boolean | string | undefined): boolean {
    return value === true || value === 'true' || value === '1' || value === 'yes';
  }

  private toSampleRate(value: number | string | undefined): number {
    const parsed = Number(value);

    if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
      return 0;
    }

    return parsed;
  }
}
