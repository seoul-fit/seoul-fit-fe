import { CoolingCenter, Facility, FACILITY_CATEGORIES } from '@/lib/types';

/**
 * 모든 무더위 쉼터 조회
 */
export async function getAllCoolingShelters(): Promise<CoolingCenter[]> {
    try {
        const response = await fetch('/api/cooling-shelter', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'default',
        });

        if (!response.ok) {
            console.error(`무더위 쉼터 API 호출 실패: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('무더위 쉼터 조회 실패:', error);
        return [];
    }
}

/**
 * 무더위 쉼터 데이터를 Facility 형태로 변환
 */
export function convertCoolingShelterToFacility(shelter: CoolingCenter): Facility {
    return {
        id: shelter.id.toString(),
        name: shelter.name,
        category: FACILITY_CATEGORIES.COOLING_SHELTER,
        position: { 
            lat: shelter.latitude || 0, 
            lng: shelter.longitude || 0 
        },
        address: shelter.roadAddress || shelter.lotAddress || '',
        congestionLevel: 'low',
        description: `${shelter.facilityType1 || ''} ${shelter.facilityType2 || ''}`.trim(),
        operatingHours: '운영시간 확인 필요',
        coolingShelter: {
            facilityType1: shelter.facilityType1,
            facilityType2: shelter.facilityType2,
            capacity: shelter.capacity,
            areaSize: shelter.areaSize,
            remarks: shelter.remarks
        }
    };
}