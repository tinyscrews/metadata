export const getTargetName = (target: Object, member?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number) => {
  let name = target instanceof Function ? target.name : `${target.constructor.name}.prototype`;

  if (member == null && descriptorOrIndex == null) {
    return `class ${name}`;
  }

  if (member == null || member === '') member = 'constructor';

  const memberAccessor = typeof member === 'symbol' ? '[' + member.toString() + ']' : '.' + member;

  if (typeof descriptorOrIndex === 'number') {
    return `${name}${memberAccessor}[${descriptorOrIndex}]`; // Parameter
  }

  if (descriptorOrIndex != null) {
    return `${name}${memberAccessor}()`;
  }

  return `${name}${memberAccessor}`;
}
