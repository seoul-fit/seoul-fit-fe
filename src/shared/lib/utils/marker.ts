// utils/marker.ts
import type { FacilityCategory, Facility } from '@/lib/types';
import { getFacilityIcon } from '@/lib/facilityIcons';

/**
 * POI 마커 HTML 콘텐츠 생성
 * @param poiName POI 이름
 * @param poiCode POI 코드
 * @returns HTML 문자열
 */
export const createPOIMarkerContent = (poiName: string, poiCode: string): string => {
  return `
    <div 
      id="poi-marker-${poiCode}" 
      class="poi-marker"
      data-poi-code="${poiCode}"
      data-poi-name="${poiName}"
      style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 999;
        user-select: none;
      "
      title="${poiName}"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid #1d4ed8;
        pointer-events: none;
      "></div>
    </div>
  `;
};

/**
 * 시설 마커 HTML 콘텐츠 생성
 * @param facilityCategory - 시설 카테고리
 * @param crowdLevel - 혼잡도 레벨
 * @param facilityId - 시설 ID (DOM 요소 식별용)
 * @param facility - 시설 정보 (따릉이 상태 표시용)
 * @returns HTML 문자열
 */
export const createCustomMarkerContent = (
  facilityCategory: FacilityCategory,
  crowdLevel: 'low' | 'medium' | 'high',
  facilityId: string,
  facility?: Facility
): string => {
  // 지하철역인 경우 호선별 색상 적용, 그 외에는 기본 색상 사용
  const facilityIcon = getFacilityIcon(facilityCategory, facility);
  const categoryBgColor = facilityIcon.color;
  const iconSVG = facilityIcon.svg;

  // 따릉이 마커의 경우 상태 뱃지 추가
  let statusBadge = '';
  if (facilityCategory === 'bike' && facility?.bikeFacility) {
    const availableBikes = (facility.bikeFacility as any).availableBikes || 
                          facility.bikeFacility.parkingBikeTotCnt || 0;

    // 이용 가능한 자전거 수에 따른 색상 결정
    let badgeColor = '#EF4444'; // 빨간색: 이용불가 (0대)
    if (availableBikes > 5) {
      badgeColor = '#10B981'; // 초록색: 여유있음 (6대 이상)
    } else if (availableBikes > 2) {
      badgeColor = '#F59E0B'; // 주황색: 보통 (3-5대)
    } else if (availableBikes > 0) {
      badgeColor = '#EF4444'; // 빨간색: 부족 (1-2대)
    }

    statusBadge = `
      <div style="
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        background-color: ${badgeColor};
        border: 2px solid white;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1001;
      "></div>
    `;
  }

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
        background-color: ${categoryBgColor};
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
        border-top: 8px solid ${categoryBgColor};
        pointer-events: none;
      "></div>
      ${statusBadge}
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
    high: 'marker-crowd-high',
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

export interface MarkerInfo {
  name: string;
  address?: string;
  description?: string;
  type?: string;
  phone?: string;
  website?: string;
}

export function createMarkerElement(info: MarkerInfo): HTMLElement {
  const element = document.createElement('div');
  element.className = 'custom-marker';
  element.style.cssText = `
    width: 32px;
    height: 32px;
    background-color: #3b82f6;
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    cursor: pointer;
  `;
  
  const icon = document.createElement('span');
  icon.textContent = info.type === 'restaurant' ? '🍽️' : 
                    info.type === 'park' ? '🌳' :
                    info.type === 'library' ? '📚' :
                    info.type === 'bike' ? '🚲' :
                    info.type === 'cultural' ? '🎭' :
                    info.type === 'sports' ? '⚽' :
                    info.type === 'shelter' ? '🏠' : '📍';
  
  element.appendChild(icon);
  return element;
}

export function getMarkerImage(type: string): string {
  const baseUrl = '/images/markers';
  
  switch (type) {
    case 'restaurant':
      return `${baseUrl}/restaurant.png`;
    case 'park':
      return `${baseUrl}/park.png`;
    case 'library':
      return `${baseUrl}/library.png`;
    case 'bike':
      return `${baseUrl}/bike.png`;
    case 'cultural':
      return `${baseUrl}/cultural.png`;
    case 'sports':
      return `${baseUrl}/sports.png`;
    case 'shelter':
      return `${baseUrl}/shelter.png`;
    default:
      return `${baseUrl}/default.png`;
  }
}

export function formatInfoWindowContent(info: MarkerInfo): string {
  return `
    <div class="info-window" style="padding: 12px; min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #333;">
        ${info.name}
      </h3>
      ${info.address ? `
        <p style="margin: 4px 0; font-size: 14px; color: #666;">
          📍 ${info.address}
        </p>
      ` : ''}
      ${info.description ? `
        <p style="margin: 4px 0; font-size: 14px; color: #666;">
          ${info.description}
        </p>
      ` : ''}
      ${info.phone ? `
        <p style="margin: 4px 0; font-size: 14px; color: #666;">
          📞 ${info.phone}
        </p>
      ` : ''}
      ${info.website ? `
        <p style="margin: 4px 0; font-size: 14px;">
          <a href="${info.website}" target="_blank" style="color: #3b82f6; text-decoration: none;">
            🌐 웹사이트 방문
          </a>
        </p>
      ` : ''}
    </div>
  `;
}
