import { status } from '@grpc/grpc-js';

export function mapHttpToGrpcStatus(httpCode: number): status {
  const httpToGrpc: { [key: number]: status } = {
    400: status.INVALID_ARGUMENT,
    401: status.UNAUTHENTICATED,
    403: status.PERMISSION_DENIED,
    404: status.NOT_FOUND,
    409: status.ALREADY_EXISTS,
    500: status.INTERNAL,
    503: status.UNAVAILABLE,
  };
  return httpToGrpc[httpCode] || status.UNKNOWN;
}