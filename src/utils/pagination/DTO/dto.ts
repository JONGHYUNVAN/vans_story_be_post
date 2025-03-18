/**
 * 페이지네이션 DTO 모듈
 * 
 * 페이지네이션 관련 데이터 전송 객체 인터페이스를 정의합니다.
 * 
 * @module utils/pagination/DTO/dto
 */

/**
 * 페이지네이션 메타데이터 인터페이스
 * 
 * 페이지네이션 관련 메타정보를 포함하는 객체 구조를 정의합니다.
 */
export interface PaginationMeta {
  /** 페이지당 항목 수 */
  itemsPerPage: number;
  
  /** 전체 항목 수 */
  totalItems: number;
  
  /** 현재 페이지 번호 */
  currentPage: number;
  
  /** 전체 페이지 수 */
  totalPages: number;
  
  /** 정렬 기준 */
  sortBy: Record<string, string>;
  
  /** 검색 대상 필드 */
  searchBy: string[];
  
  /** 검색어 */
  search: string;
  
  /** 필터링 조건 */
  filter: Record<string, string | string[]>;
}

/**
 * 페이지네이션 응답 DTO 인터페이스
 * 
 * 페이지네이션이 적용된 API 응답 형식을 정의합니다.
 * 
 * @template T - 페이지네이션 데이터 항목 타입
 */
export interface PaginatedResponseDto<T> {
  /** 페이지네이션된 데이터 배열 */
  data: T[];
  
  /** 페이지네이션 메타데이터 */
  meta: PaginationMeta;
}

