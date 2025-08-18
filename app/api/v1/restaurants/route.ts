import { NextRequest, NextResponse } from 'next/server';

// 맛집 API 응답 타입
interface RestaurantRaw {
  id: number;
  postSn: string;
  langCodeId: string;
  name: string;
  postUrl: string;
  address: string;
  newAddress: string;
  phone: string;
  website: string;
  operatingHours: string;
  subwayInfo: string;
  homepageLang: string;
  representativeMenu: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

// 프론트엔드용 맛집 데이터 타입
interface Restaurant {
  id: string;
  name: string;
  address: string;
  newAddress: string;
  phone: string;
  website: string;
  operatingHours: string;
  subwayInfo: string;
  representativeMenu: string;
  latitude: number;
  longitude: number;
  postUrl: string;
}

/**
 * GET 위치 기준 반경 내 맛집 정보 조회
 * Query Parameters: lat(위도), lng(경도), all(전체 데이터 조회)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const all = searchParams.get('all');

    // 전체 데이터 요청
    if (all === 'true') {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/restaurants/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`전체 맛집 API 호출 실패: ${response.status}`);
          return NextResponse.json([]);
        }

        const rawData: RestaurantRaw[] = await response.json();

        // 한국어 데이터만 필터링하고 변환
        const restaurants: Restaurant[] = rawData
          .filter(item => item.langCodeId === 'ko')
          .map(item => ({
            id: `restaurant_${item.id}`,
            name: item.name,
            address: item.address,
            newAddress: item.newAddress,
            phone: item.phone,
            website: item.website,
            operatingHours: item.operatingHours,
            subwayInfo: item.subwayInfo,
            representativeMenu: item.representativeMenu,
            latitude: item.latitude,
            longitude: item.longitude,
            postUrl: item.postUrl,
          }));

        return NextResponse.json(restaurants);
      } catch (backendError) {
        console.warn('전체 맛집 백엔드 서버 연결 실패:', backendError);
        return NextResponse.json([]);
      }
    }

    // 위치 기반 조회
    if (!latParam || !lngParam) {
      return NextResponse.json(
        { error: '위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: '올바른 좌표 형식이 아닙니다.' }, { status: 400 });
    }

    // 백엔드 맛집 API 호출
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/restaurants/nearby?latitude=${lat}&longitude=${lng}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`맛집 API 호출 실패: ${response.status}`);
        return NextResponse.json([]);
      }

      const rawData: RestaurantRaw[] = await response.json();

      // 한국어 데이터만 필터링하고 변환
      const restaurants: Restaurant[] = rawData
        .filter(item => item.langCodeId === 'ko')
        .map(item => ({
          id: `restaurant_${item.id}`,
          name: item.name,
          address: item.address,
          newAddress: item.newAddress,
          phone: item.phone,
          website: item.website,
          operatingHours: item.operatingHours,
          subwayInfo: item.subwayInfo,
          representativeMenu: item.representativeMenu,
          latitude: item.latitude,
          longitude: item.longitude,
          postUrl: item.postUrl,
        }));

      return NextResponse.json(restaurants);
    } catch (backendError) {
      // 백엔드 연결 실패 시 빈 배열 반환 (프론트엔드 동작 유지)
      console.warn('맛집 백엔드 서버 연결 실패:', backendError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('맛집 API 조회 중 오류:', error);
    return NextResponse.json([]);
  }
}
