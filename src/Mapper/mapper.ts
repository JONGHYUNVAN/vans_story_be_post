export function mapToDto<Entity, Dto>(entity: Entity, dtoClass: new () => Dto): Dto {
  const dto = new dtoClass();
  const fields: string[] = Reflect.getMetadata('fields', dtoClass.prototype) || [];

  fields.forEach((field) => {
    if (entity.hasOwnProperty(field)) {
      const fieldValue = (entity as any)[field];
      if (fieldValue instanceof Date) {
        (dto as any)[field] = fieldValue.toLocaleString();
      }
      else {
        (dto as any)[field] = fieldValue;
      }
    }
  });

  return dto;
}