export interface FacilityType {
    id: string
    name: string
    category: FacilityCategory
    icon: string
    color: string
}

export enum FacilityCategory {
    SPORTS = 'sports',
    CULTURE = 'culture',
    RESTAURANT = 'restaurant',
    LIBRARY = 'library',
    PARK = 'park'
}

export interface Facility {
    type: FacilityType
    id: string
    name: string
    category: FacilityCategory
    position: {
        lat: number
        lng: number
    }
    address: string
    phone?: string
    website?: string
    operatingHours?: string
    congestionLevel: 'low' | 'medium' | 'high'
    currentUsers?: number
    maxCapacity?: number
    distance?: number // 사용자 위치로부터의 거리 (km)

    // 시설별 특화 정보
    sportsFacility?: {
        facilityType: string // 농구장, 축구장, 헬스장 등
        reservationUrl?: string
        availableSlots?: TimeSlot[]
        equipment?: string[]
    }

    culturalFacility?: {
        currentEvents?: Event[]
        ticketUrl?: string
        programs?: Program[]
    }

    restaurant?: {
        cuisine: string
        priceRange: 'low' | 'medium' | 'high'
        rating?: number
        reviewSummary?: string
        waitTime?: number // 분 단위
    }

    library?: {
        availableSeats?: number
        totalSeats?: number
        studyRooms?: StudyRoom[]
        openingHours?: string
    }
}

export interface TimeSlot {
    time: string
    available: boolean
    price?: number
}

export interface Event {
    id: string
    title: string
    startDate: string
    endDate: string
    description?: string
    ticketUrl?: string
}

export interface Program {
    id: string
    name: string
    schedule: string
    instructor?: string
    capacity?: number
    enrolled?: number
}

export interface StudyRoom {
    id: string
    name: string
    capacity: number
    available: boolean
    reservationUrl?: string
}

export interface UserPreferences {
    sports: boolean
    culture: boolean
    restaurant: boolean
    library: boolean
    park: boolean
}

export interface UserLocation {
    lat: number
    lng: number
    address?: string
    timestamp: number
}

export interface MapState {
    isLoaded: boolean
    isLoading: boolean
    error: string | null
    mapInstance: any
    userLocation: UserLocation | null
    selectedFacility: Facility | null
    visibleFacilities: Facility[]
    mapLevel: number
    preferences: UserPreferences
    isLocationPermissionGranted: boolean
}