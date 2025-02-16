import 'reflect-metadata';

export function Field(target: any, key: string) {
  const fields = Reflect.getMetadata('fields', target) || [];

  fields.push(key);

  Reflect.defineMetadata('fields', fields, target);
}