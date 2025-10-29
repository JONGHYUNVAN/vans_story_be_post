/**
 * 카테고리 업데이트 DTO
 * 
 * 기존 카테고리를 업데이트할 때 사용되는 데이터 전송 객체입니다.
 * 모든 필드가 선택적이며, 제공된 필드만 업데이트됩니다.
 * 
 * @module dto/update-category.dto
 */

import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * 카테고리 업데이트 DTO
 * 
 * CreateCategoryDto의 모든 필드를 선택적으로 만든 DTO입니다.
 * 부분 업데이트를 지원하여 필요한 필드만 수정할 수 있습니다.
 * 
 * @class UpdateCategoryDto
 * @extends {PartialType<CreateCategoryDto>}
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

