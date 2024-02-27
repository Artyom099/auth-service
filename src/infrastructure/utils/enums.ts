export enum InternalCode {
  Success = 1,
  NotFound = 0,
  Forbidden = -1,
  Unauthorized = -2,
  Internal_Server = -3,
  Expired = -4,
  DbError = -5,
}

export enum ApproachType {
  http = 'selectHttpException',
  tcp = 'selectTcpExceptions',
  graphql = 'selectGraphQLExceptions',
}

export enum EmailEvent {
  EmailConfirmation,
  PasswordRecovery,
}
