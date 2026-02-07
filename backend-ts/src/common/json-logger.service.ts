// backend-ts/src/common/json-logger.service.ts
import { LoggerService, LogLevel } from '@nestjs/common';

export class JsonLoggerService implements LoggerService {
  log(message: any, context?: string) {
    this.printJson('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.printJson('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.printJson('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.printJson('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.printJson('verbose', message, context);
  }

  private printJson(level: string, message: any, context?: string, trace?: string) {
    const entry: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level,
      context: context || 'Application',
      message: typeof message === 'object' ? JSON.stringify(message) : message,
    };
    if (trace) {
      entry.trace = trace;
    }
    const output = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }
}
