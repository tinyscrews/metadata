export class NotImplementedError extends Error {
  constructor(decoratorName: string, message: string) {
    super(`not implemented for ${decoratorName}: ${message}`);
  }
}
