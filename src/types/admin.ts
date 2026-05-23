export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

export type AccessLogResponse = {
  id: number;
  occurredAt: string;
  method: string;
  path: string;
  queryString?: string | null;
  statusCode: number;
  durationMs: number;
  principal?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  success: boolean;
};

export type FailureLogResponse = {
  id: number;
  occurredAt: string;
  method: string;
  path: string;
  queryString?: string | null;
  statusCode: number;
  principal?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  exceptionClass: string;
  message: string;
};

export type FailureLogDetailResponse = FailureLogResponse & {
  stackTrace?: string | null;
};

export type EmailSettingsResponse = {
  enabled: boolean;
  host: string;
  port: number;
  username?: string | null;
  passwordConfigured: boolean;
  fromAddress: string;
  smtpAuth: boolean;
  startTlsEnable: boolean;
  startTlsRequired: boolean;
  sslEnable: boolean;
  debug: boolean;
  connectionTimeoutMs: number;
  timeoutMs: number;
  writeTimeoutMs: number;
  confirmationBaseUrl: string;
  updatedAt?: string | null;
  usingDatabaseSettings: boolean;
};

export type EmailSettingsUpdateRequest = Omit<EmailSettingsResponse, "passwordConfigured" | "updatedAt" | "usingDatabaseSettings"> & {
  password?: string;
};
