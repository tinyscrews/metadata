import { getTargetName } from '../utils';

/**
 * Create an error to report if the decorator is applied to the target more than once
 *
 * @param target Decoration target
 * @param member Optional property or method
 * @param descriptorOrIndex Optional parameter index or method descriptor
 */
export class DuplicateDecorationError extends Error {
  constructor(decoratorName: string, target: Object, member?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number) {
    super(`duplicate ${decoratorName} on ${getTargetName(target, member, descriptorOrIndex)}`);
  }
}
