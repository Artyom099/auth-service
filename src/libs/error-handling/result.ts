// todo - уйти от Result и перейти на ексепшены
export class Result {
  public hasError: boolean;
}

export class SuccessResult<T> extends Result implements SuccessResultType<T> {
  public hasError = false as const;

  constructor(public payload: T) {
    super();
  }
}

export class ErrorResult extends Result implements ErrorResultType {
  public hasError = true as const;
  public error: ErrorType;

  constructor(error: ErrorType) {
    super();
    this.error = error;
  }
}

export type ResultType<T> = SuccessResult<T> | ErrorResult;

export type SuccessResultType<T> = {
  readonly hasError: false;
  payload: T;
};

export type ErrorResultType = {
  readonly hasError: true;
  error: ErrorType;
};

export type ErrorType = {
  code: InternalErrorCode;
  extensions: ErrorExtensionType[];
};

export type ErrorExtensionType = { field: string; message: string };

export enum InternalErrorCode {
  Unauthorized = -3,
  Forbidden = -1,
  BadRequest = -2,
  Internal_Server = -4,
  Expired = -5,
  NotFound = -6,
  ValidationError = -7,
}
