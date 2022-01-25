import { Reflection } from './reflect';
import { MetadataKey, MetadataMap } from './types';

/**
 * Options for inspection
 */
export interface InspectionOptions {
  /**
   * Only inspect own metadata of a given target. The prototype chain will not
   * be checked. The implementation uses `Reflect.getOwnMetadata()` if the flag
   * is set to `true`. Otherwise, it uses `Reflect.getMetadata()`.
   *
   * The flag is `false` by default for `MetadataInspector`.
   */
  ownMetadataOnly?: boolean;
}

export class MetadataInspector {

  /**
   * Get the metadata associated with the given key for all methods of the target class or prototype
   *
   * @param key Metadata key
   * @param target Class for static methods or prototype for instance methods
   * @param options Options for inspection
   */
  public static getAllMethodMetadata<T>(key: MetadataKey<T, MethodDecorator>, target: Object, options?: InspectionOptions): MetadataMap<T> | undefined {
    return options?.ownMetadataOnly ? Reflection.getOwnMetadata(key.toString(), target) : Reflection.getMetadata(key.toString(), target);
  }

  /**
   * Get the metadata associated with the given key for a given method of the target class or prototype
   *
   * @param key - Metadata key
   * @param target - Class for static methods or prototype for instance methods
   * @param methodName - Method name. If not present, default to '' to use
   * the constructor
   * @param options - Options for inspection
   */
  public static getMethodMetadata<T>(key: MetadataKey<T, MethodDecorator>, target: Object, methodName?: string, options?: InspectionOptions): T | undefined {
    return MetadataInspector.getAllMethodMetadata(key, target, options)?.[methodName ?? ''];
  }
}
