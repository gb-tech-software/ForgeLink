/**
 * ForgeLink Logger Utility
 * Provides structured logging with levels: DEBUG, INFO, WARN, ERROR
 */

class Logger {
  private static prefix = '[ForgeLink]';

  static debug(tag, message, data = null) {
    const timestamp = new Date().toISOString();
    const output = `${this.prefix} [${timestamp}] [DEBUG:${tag}] ${message}`;
    console.log(output, data ? data : '');
  }

  static info(tag, message, data = null) {
    const timestamp = new Date().toISOString();
    const output = `${this.prefix} [${timestamp}] [INFO:${tag}] ${message}`;
    console.info(output, data ? data : '');
  }

  static warn(tag, message, data = null) {
    const timestamp = new Date().toISOString();
    const output = `${this.prefix} [${timestamp}] [WARN:${tag}] ${message}`;
    console.warn(output, data ? data : '');
  }

  static error(tag, message, error = null) {
    const timestamp = new Date().toISOString();
    const output = `${this.prefix} [${timestamp}] [ERROR:${tag}] ${message}`;
    console.error(output, error ? error : '');
  }

  static group(label) {
    console.group(`${this.prefix} ${label}`);
  }

  static groupEnd() {
    console.groupEnd();
  }

  static time(label) {
    console.time(`${this.prefix} ${label}`);
  }

  static timeEnd(label) {
    console.timeEnd(`${this.prefix} ${label}`);
  }

  static table(data) {
    console.table(data);
  }
}

export default Logger;
