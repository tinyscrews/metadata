import { DuplicateDecorationError, NotImplementedError } from './errors';
import { Reflection } from './reflect';
import { DecoratorType, MetadataKey, MetadataMap } from './types';
import { cloneDeep } from './utils';

export interface DecoratorOptions {
  /**
   * Name of the decorator for debugging purpose
   */
  decoratorName?: string;

  allowInheritance?: boolean;

  cloneInputSpec?: boolean;
}

/**
 *
 */
export class DecoratorFactory<T, M extends T | MetadataMap<T> | MetadataMap<T[]>, D extends DecoratorType> {

  protected decoratorName: string;

  /**
   * A constant to reference the target of a decoration
   */
  private static TARGET = '__decoratorTarget';

  constructor(protected key: string, protected spec: T, protected options: DecoratorOptions = {}) {
    this.options = { allowInheritance: true, cloneInputSpec: true, ...options };
    this.decoratorName = this.options.decoratorName ?? this.constructor.name.replace(/Factory$/, '');
    if (this.options.cloneInputSpec) {
      this.spec = cloneDeep(spec);
    }
  }

  protected allowInheritance(): boolean {
    return !!this.options?.allowInheritance;
  }

  /**
   * Inherit metadata from base classes.
   *
   * By default, this method merges base metadata into the spec if `allowInheritance` is set to `true`.
   * To customize the behavior, this method can be overridden by sub classes.
   *
   * @param inheritedMetadata - Metadata from base classes for the member
   */
  protected inherit(inheritedMetadata: T | undefined | null): T {
    if (!this.allowInheritance()) return this.spec;
    if (inheritedMetadata == null) return this.spec;
    if (this.spec == null) return inheritedMetadata;
    if (typeof inheritedMetadata !== 'object') return this.spec;
    if (Array.isArray(inheritedMetadata) || Array.isArray(this.spec)) return this.spec; // For arrays, we don't merge
    return Object.assign(inheritedMetadata, this.spec);
  }

  /**
   * Set a reference to the target class or prototype for a given spec if it's an object
   *
   * @param spec - Metadata spec
   * @param target - Target of the decoration. It is a class or the prototype of a class.
   */
  protected withTarget(spec: T, target: Object): T {
    if (typeof spec === 'object' && spec != null) {
      // add a hidden property for the `target` (enumerable=false); make sure it won't be redefined on the same object (configurable: false)
      Object.defineProperty(spec, DecoratorFactory.TARGET, { value: target, enumerable: false, configurable: false });
    }
    return spec;
  }

  /**
   * Get the optional decoration target of a given spec
   *
   * @param spec - Metadata spec
   */
  protected getTarget(spec: T) {
    if (typeof spec === 'object' && spec != null) {
      const specWithTarget = spec as { [name: string]: any };
      return specWithTarget[DecoratorFactory.TARGET];
    } else {
      return undefined;
    }
  }

  /**
   *
   * @param inheritedMetadata
   * @param target
   * @param member
   * @param descriptorOrIndex
   */
  protected mergeWithInherited(inheritedMetadata: M | undefined, target: Object, member?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number): M {
    throw new NotImplementedError(this.decoratorName, 'mergeWithInherited()');
  }

  /**
   *
   * @param ownMetadata
   * @param target
   * @param member
   * @param descriptorOrIndex
   */
  protected mergeWithOwn(ownMetadata: M | undefined, target: Object, member?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number): M {
    throw new NotImplementedError(this.decoratorName, 'mergeWithOwn()');
  }

  /**
   * Create a decorator function of the given type. Each sub class MUST implement this method.
   */
  protected create(): D {
    throw new NotImplementedError(this.decoratorName, `create()`);
  }

  /**
   * Base implementation of the decorator function
   * @param target - Decorator target
   * @param member - Optional property or method
   * @param descriptorOrIndex - Optional method descriptor or parameter index
   */
  protected decorate(target: Object, member?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number) {
    let meta: M | undefined = Reflection.getOwnMetadata(this.key, target);
    if (!meta && this.allowInheritance()) {
      // Clone the base metadata so that it won't be accidentally mutated by sub classes
      meta = Reflection.getMetadata(this.key, target);
      meta = cloneDeep(meta);
      meta = this.mergeWithInherited(meta, target, member, descriptorOrIndex);
    } else {
      meta = this.mergeWithOwn(meta, target, member, descriptorOrIndex);
    }
    Reflection.defineMetadata(this.key, meta, target);
  }

  /**
   * Create a decorator function
   * @param key Metadata key
   * @param spec Metadata object from the decorator function
   * @param options Options for the decorator
   */
  protected static _createDecorator<S, MT extends S | MetadataMap<S> | MetadataMap<S[]>, DT extends DecoratorType>(key: MetadataKey<S, DT>, spec: S, options?: DecoratorOptions): DT {
    return new this<S, MT, DT>(key.toString(), spec, options).create();
  }
}

export class MethodDecoratorFactory<T> extends DecoratorFactory<T, MetadataMap<T>, MethodDecorator> {

  protected override mergeWithInherited(inheritedMetadata: MetadataMap<T> = {}, target: Object, methodName?: string, methodDescriptor?: TypedPropertyDescriptor<any> | number) {
    inheritedMetadata[methodName!] = this.withTarget(<T>this.inherit(inheritedMetadata[methodName!]), target);
    return inheritedMetadata;
  }

  protected override mergeWithOwn(ownMetadata: MetadataMap<T> = {}, target: Object, methodName?: string, methodDescriptor?: TypedPropertyDescriptor<any> | number) {
    if (this.getTarget(ownMetadata[methodName!]) === target) {
      throw new DuplicateDecorationError(this.decoratorName, target, methodName, methodDescriptor);
    }
    ownMetadata[methodName!] = this.withTarget(this.spec, target);
    return ownMetadata;
  }

  protected override create(): MethodDecorator {
    return (target: Object, methodName: string | symbol, descriptor: TypedPropertyDescriptor<any>) => this.decorate(target, methodName, descriptor);
  }

  /**
   * Create a method decorator function
   * @param key - Metadata key
   * @param spec - Metadata object from the decorator function
   * @param options - Options for the decorator
   */
  static createDecorator<S>(key: MetadataKey<S, MethodDecorator>, spec: S, options?: DecoratorOptions) {
    return super._createDecorator<S, MetadataMap<S>, MethodDecorator>(key, spec, options);
  }
}
