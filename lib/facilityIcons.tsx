// lib/facilityIcons.tsx
import React from 'react';
import { Dumbbell, Calendar, UtensilsCrossed, BookOpen, TreePine } from 'lucide-react';
import { FACILITY_CATEGORIES, type FacilityCategory } from '@/lib/types';

export interface FacilityConfig {
  icon: React.ReactNode;
  color: string;
  label: string;
  description: string;
  svgIcon: string; // 카카오맵 마커용 SVG
}

export const FACILITY_CONFIGS: Record<FacilityCategory, FacilityConfig> = {
  [FACILITY_CATEGORIES.SPORTS]: {
    icon: <Dumbbell className="w-5 h-5" />,
    color: 'bg-blue-500',
    label: '체육시설',
    description: '헬스장, 수영장, 테니스장 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`
  },
  [FACILITY_CATEGORIES.CULTURE]: {
    icon: <Calendar className="w-5 h-5" />,
    color: 'bg-purple-500',
    label: '문화시설',
    description: '공연장, 전시관, 미술관 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`
  },
  [FACILITY_CATEGORIES.RESTAURANT]: {
    icon: <UtensilsCrossed className="w-5 h-5" />,
    color: 'bg-red-500',
    label: '맛집',
    description: '음식점, 카페, 디저트 매장 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M15 2h4v6h-4z"/></svg>`
  },
  [FACILITY_CATEGORIES.LIBRARY]: {
    icon: <BookOpen className="w-5 h-5" />,
    color: 'bg-green-500',
    label: '도서관',
    description: '공공도서관, 학습실 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`
  },
  [FACILITY_CATEGORIES.PARK]: {
    icon: <TreePine className="w-5 h-5" />,
    color: 'bg-emerald-600',
    label: '공원',
    description: '도시공원, 산책로, 쉼터 등',
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8"/><path d="m12 3 4 4H8l4-4Z"/><path d="m12 3 4 4H8l4-4Z"/><path d="M8 7h8v4H8z"/></svg>`
  }
};

// 카카오맵 마커용 아이콘 SVG 생성 함수
export const getFacilityIconSVG = (facilityType: FacilityCategory): string => {
  return FACILITY_CONFIGS[facilityType]?.svgIcon || '';
};

// 혼잡도별 색상 반환 함수
export const getCrowdColor = (crowdLevel: 'low' | 'medium' | 'high'): string => {
  switch (crowdLevel) {
    case 'low': return '#10B981';
    case 'medium': return '#F59E0B';
    case 'high': return '#EF4444';
    default: return '#6B7280';
  }
};