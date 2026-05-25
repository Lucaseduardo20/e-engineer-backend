export class Result<TValue, TError extends Error = Error> {
  private constructor(
    private readonly value: TValue | null,
    private readonly error: TError | null,
  ) {}

  static ok<TValue, TError extends Error = Error>(
    value: TValue,
  ): Result<TValue, TError> {
    return new Result<TValue, TError>(value, null);
  }

  static fail<TValue = never, TError extends Error = Error>(
    error: TError,
  ): Result<TValue, TError> {
    return new Result<TValue, TError>(null, error);
  }

  isOk(): boolean {
    return this.error === null;
  }

  isFail(): boolean {
    return this.error !== null;
  }

  unwrap(): TValue {
    if (this.error) {
      throw this.error;
    }

    return this.value as TValue;
  }

  unwrapError(): TError {
    if (!this.error) {
      throw new Error('Cannot unwrap error from a successful result');
    }

    return this.error;
  }
}
