export type TokenInfoType<T> = {
  payload: T;
  iat: number;
  exp: number;
};
