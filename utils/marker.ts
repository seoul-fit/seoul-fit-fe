// utils/marker.ts
import type { FacilityCategory } from '@/lib/types';
import { getFacilityIconSVG, getCrowdColor } from '@/lib/facilityIcons';

/**
 * 카카오맵 커스텀 마커 HTML 컨텐츠 생성
 * @param facilityCategory - 시설 카테고리
 * @param crowdLevel - 혼잡도 레벨
 * @param facilityId - 시설 ID (DOM 요소 식별용)
 * @returns HTML 문자열
 */
export const createCustomMarkerContent = (
  facilityCategory: FacilityCategory,
  crowdLevel: 'low' | 'medium' | 'high',
  facilityId: string
): string => {
  const crowdBgColor = getCrowdColor(crowdLevel);
  const iconSVG = getFacilityIconSVG(facilityCategory);

  return `
    <div 
      id="marker-${facilityId}" 
      class="custom-marker" 
      data-facility-id="${facilityId}"
      data-category="${facilityCategory}"
      data-crowd-level="${crowdLevel}"
      style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background-color: ${crowdBgColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        z-index: 1000;
        user-select: none;
      "
    >
      <div style="
        color: white; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        pointer-events: none;
      ">
        ${iconSVG}
      </div>
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${crowdBgColor};
        pointer-events: none;
      "></div>
    </div>
  `;
};

/**
 * 혼잡도에 따른 마커 스타일 클래스 반환
 * @param crowdLevel - 혼잡도 레벨
 * @returns CSS 클래스명
 */
export const getCrowdLevelClass = (crowdLevel: 'low' | 'medium' | 'high'): string => {
  const classMap = {
    low: 'marker-crowd-low',
    medium: 'marker-crowd-medium', 
    high: 'marker-crowd-high'
  };
  return classMap[crowdLevel];
};

/**
 * 마커 애니메이션 효과 적용
 * @param markerId - 마커 DOM 요소 ID
 * @param animation - 적용할 애니메이션 타입
 */
export const applyMarkerAnimation = (
  markerId: string, 
  animation: 'bounce' | 'pulse' | 'shake' | 'none'
): void => {
  const markerElement = document.getElementById(`marker-${markerId}`);
  if (!markerElement) return;

  // 기존 애니메이션 클래스 제거
  markerElement.classList.remove('marker-bounce', 'marker-pulse', 'marker-shake');

  // 새 애니메이션 적용
  if (animation !== 'none') {
    markerElement.classList.add(`marker-${animation}`);
    
    // 일정 시간 후 애니메이션 제거 (bounce, shake의 경우)
    if (animation === 'bounce' || animation === 'shake') {
      setTimeout(() => {
        markerElement.classList.remove(`marker-${animation}`);
      }, 1000);
    }
  }
};

/**
 * 마커 툴팁 표시
 * @param markerId - 마커 DOM 요소 ID
 * @param content - 툴팁 내용
 * @param show - 표시 여부
 */
export const toggleMarkerTooltip = (
  markerId: string, 
  content: string, 
  show: boolean = true
): void => {
  const markerElement = document.getElementById(`marker-${markerId}`);
  if (!markerElement) return;

  const existingTooltip = markerElement.querySelector('.marker-tooltip');
  
  if (!show && existingTooltip) {
    existingTooltip.remove();
    return;
  }

  if (show && !existingTooltip) {
    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip';
    tooltip.innerHTML = content;
    tooltip.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      margin-bottom: 8px;
      pointer-events: none;
      z-index: 1001;
    `;
    
    markerElement.appendChild(tooltip);
  }
};