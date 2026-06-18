export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details: any[] = []
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: any[] = []) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication credentials are invalid or missing') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access to requested resource is forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Requested resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class UnprocessableError extends AppError {
  constructor(message: string, details: any[] = []) {
    super(422, 'UNPROCESSABLE_ENTITY', message, details);
  }
}
