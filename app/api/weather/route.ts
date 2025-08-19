import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.SEOUL_API_KEY || '4b46766a7673706939395769456b6b';
const BASE_URL = 'http://openapi.seoul.go.kr:8088';

// 캐시 설정
const CACHE_DURATION = 60 * 1000; // 1분
const weatherCache = new Map(); // areaCode별로 캐시

/**
 * 서울 열린 데이터 광장에서 제공한 서울시 주요 120 장소 목록
 */
const LOCATIONS = [
  // 관광특구
  { code: 'POI001', name: '강남 MICE 관광특구', lat: 37.5175, lng: 127.0473 },
  { code: 'POI002', name: '동대문 관광특구', lat: 37.5663, lng: 127.0092 },
  { code: 'POI003', name: '명동 관광특구', lat: 37.5636, lng: 126.9824 },
  { code: 'POI004', name: '이태원 관광특구', lat: 37.5344, lng: 126.9957 },
  { code: 'POI005', name: '잠실 관광특구', lat: 37.5133, lng: 127.1028 },
  { code: 'POI006', name: '종로·청계 관광특구', lat: 37.57, lng: 126.992 },
  { code: 'POI007', name: '홍대 관광특구', lat: 37.5519, lng: 126.9245 },

  // 고궁·문화유산
  { code: 'POI008', name: '경복궁', lat: 37.5788, lng: 126.977 },
  { code: 'POI009', name: '광화문·덕수궁', lat: 37.5658, lng: 126.9756 },
  { code: 'POI010', name: '보신각', lat: 37.5693, lng: 126.9833 },
  { code: 'POI011', name: '서울 암사동 유적', lat: 37.5525, lng: 127.1311 },
  { code: 'POI012', name: '창덕궁·종묘', lat: 37.5755, lng: 126.9946 },

  // 지하철역
  { code: 'POI013', name: '가산디지털단지역', lat: 37.4817, lng: 126.8824 },
  { code: 'POI014', name: '강남역', lat: 37.4979, lng: 127.0276 },
  { code: 'POI015', name: '건대입구역', lat: 37.5401, lng: 127.0701 },
  { code: 'POI016', name: '고덕역', lat: 37.5559, lng: 127.1544 },
  { code: 'POI017', name: '고속터미널역', lat: 37.5047, lng: 127.0046 },
  { code: 'POI018', name: '교대역', lat: 37.4934, lng: 127.0146 },
  { code: 'POI019', name: '구로디지털단지역', lat: 37.4851, lng: 126.9015 },
  { code: 'POI020', name: '구로역', lat: 37.5034, lng: 126.8876 },
  { code: 'POI021', name: '군자역', lat: 37.5573, lng: 127.0793 },
  { code: 'POI023', name: '대림역', lat: 37.4933, lng: 126.8964 },
  { code: 'POI024', name: '동대문역', lat: 37.5713, lng: 127.0095 },
  { code: 'POI025', name: '뚝섬역', lat: 37.5472, lng: 127.0477 },
  { code: 'POI026', name: '미아사거리역', lat: 37.6133, lng: 127.0302 },
  { code: 'POI027', name: '발산역', lat: 37.5583, lng: 126.8374 },
  { code: 'POI029', name: '사당역', lat: 37.4766, lng: 126.9816 },
  { code: 'POI030', name: '삼각지역', lat: 37.5346, lng: 126.9734 },
  { code: 'POI031', name: '서울대입구역', lat: 37.4813, lng: 126.9527 },
  { code: 'POI032', name: '서울식물원·마곡나루역', lat: 37.564, lng: 126.8337 },
  { code: 'POI033', name: '서울역', lat: 37.5547, lng: 126.9706 },
  { code: 'POI034', name: '선릉역', lat: 37.5048, lng: 127.0493 },
  { code: 'POI035', name: '성신여대입구역', lat: 37.5927, lng: 127.0165 },
  { code: 'POI036', name: '수유역', lat: 37.6369, lng: 127.0259 },
  { code: 'POI037', name: '신논현역·논현역', lat: 37.5047, lng: 127.0245 },
  { code: 'POI038', name: '신도림역', lat: 37.5089, lng: 126.8913 },
  { code: 'POI039', name: '신림역', lat: 37.4844, lng: 126.9298 },
  { code: 'POI040', name: '신촌·이대역', lat: 37.5561, lng: 126.9364 },
  { code: 'POI041', name: '양재역', lat: 37.4844, lng: 127.0344 },
  { code: 'POI042', name: '역삼역', lat: 37.5, lng: 127.0364 },
  { code: 'POI043', name: '연신내역', lat: 37.619, lng: 126.9211 },
  { code: 'POI044', name: '오목교역·목동운동장', lat: 37.524, lng: 126.8748 },
  { code: 'POI045', name: '왕십리역', lat: 37.5612, lng: 127.0375 },
  { code: 'POI046', name: '용산역', lat: 37.5299, lng: 126.9649 },
  { code: 'POI047', name: '이태원역', lat: 37.5344, lng: 126.9944 },
  { code: 'POI048', name: '장지역', lat: 37.4781, lng: 127.1264 },
  { code: 'POI049', name: '장한평역', lat: 37.5611, lng: 127.0642 },
  { code: 'POI050', name: '천호역', lat: 37.5388, lng: 127.1239 },
  { code: 'POI051', name: '총신대입구(이수)역', lat: 37.4869, lng: 126.9817 },
  { code: 'POI052', name: '충정로역', lat: 37.5596, lng: 126.9632 },
  { code: 'POI053', name: '합정역', lat: 37.5496, lng: 126.9137 },
  { code: 'POI054', name: '혜화역', lat: 37.5823, lng: 127.0017 },
  { code: 'POI055', name: '홍대입구역(2호선)', lat: 37.5577, lng: 126.924 },
  { code: 'POI056', name: '회기역', lat: 37.5895, lng: 127.0575 },

  // 시장·상업지역
  { code: 'POI058', name: '가락시장', lat: 37.4922, lng: 127.1182 },
  { code: 'POI059', name: '가로수길', lat: 37.5194, lng: 127.0233 },
  { code: 'POI060', name: '광장(전통)시장', lat: 37.5663, lng: 127.0092 },
  { code: 'POI061', name: '김포공항', lat: 37.5586, lng: 126.7909 },
  { code: 'POI063', name: '노량진', lat: 37.513, lng: 126.9426 },
  { code: 'POI064', name: '덕수궁길·정동길', lat: 37.5658, lng: 126.9756 },
  { code: 'POI066', name: '북촌한옥마을', lat: 37.5816, lng: 126.9841 },
  { code: 'POI067', name: '서촌', lat: 37.5834, lng: 126.9734 },
  { code: 'POI068', name: '성수카페거리', lat: 37.5444, lng: 127.0557 },
  { code: 'POI070', name: '쌍문역', lat: 37.6519, lng: 127.0297 },
  { code: 'POI071', name: '압구정로데오거리', lat: 37.527, lng: 127.0386 },
  { code: 'POI072', name: '여의도', lat: 37.5216, lng: 126.9244 },
  { code: 'POI073', name: '연남동', lat: 37.5606, lng: 126.9217 },
  { code: 'POI074', name: '영등포 타임스퀘어', lat: 37.517, lng: 126.9063 },
  { code: 'POI076', name: '용리단길', lat: 37.5309, lng: 126.9723 },
  { code: 'POI077', name: '이태원 앤틱가구거리', lat: 37.5344, lng: 126.9957 },
  { code: 'POI078', name: '인사동', lat: 37.5759, lng: 126.9852 },
  { code: 'POI079', name: '창동 신경제 중심지', lat: 37.6543, lng: 127.047 },
  { code: 'POI080', name: '청담동 명품거리', lat: 37.5195, lng: 127.0569 },
  { code: 'POI081', name: '청량리 제기동 일대 전통시장', lat: 37.5803, lng: 127.0255 },
  { code: 'POI082', name: '해방촌·경리단길', lat: 37.5309, lng: 126.9723 },

  // 랜드마크·복합시설
  { code: 'POI083', name: 'DDP(동대문디자인플라자)', lat: 37.5663, lng: 127.0092 },
  { code: 'POI084', name: 'DMC(디지털미디어시티)', lat: 37.58, lng: 126.8895 },

  // 공원·자연
  { code: 'POI085', name: '강서한강공원', lat: 37.5586, lng: 126.8166 },
  { code: 'POI086', name: '고척돔', lat: 37.4985, lng: 126.8669 },
  { code: 'POI087', name: '광나루한강공원', lat: 37.5494, lng: 127.1188 },
  { code: 'POI088', name: '광화문광장', lat: 37.5729, lng: 126.9769 },
  { code: 'POI089', name: '국립중앙박물관·용산가족공원', lat: 37.524, lng: 126.9803 },
  { code: 'POI090', name: '난지한강공원', lat: 37.5664, lng: 126.8752 },
  { code: 'POI091', name: '남산공원', lat: 37.5538, lng: 126.981 },
  { code: 'POI092', name: '노들섬', lat: 37.5175, lng: 126.9507 },
  { code: 'POI093', name: '뚝섬한강공원', lat: 37.5303, lng: 127.0665 },
  { code: 'POI094', name: '망원한강공원', lat: 37.5555, lng: 126.8947 },
  { code: 'POI095', name: '반포한강공원', lat: 37.5133, lng: 126.9965 },
  { code: 'POI096', name: '북서울꿈의숲', lat: 37.6206, lng: 127.0411 },
  { code: 'POI098', name: '서리풀공원·몽마르뜨공원', lat: 37.4954, lng: 127.0093 },
  { code: 'POI099', name: '서울광장', lat: 37.5658, lng: 126.978 },
  { code: 'POI100', name: '서울대공원', lat: 37.4349, lng: 126.9878 },
  { code: 'POI101', name: '서울숲공원', lat: 37.5448, lng: 127.0374 },
  { code: 'POI102', name: '아차산', lat: 37.5546, lng: 127.1034 },
  { code: 'POI103', name: '양화한강공원', lat: 37.5347, lng: 126.8974 },
  { code: 'POI104', name: '어린이대공원', lat: 37.5481, lng: 127.0811 },
  { code: 'POI105', name: '여의도한강공원', lat: 37.5282, lng: 126.9328 },
  { code: 'POI106', name: '월드컵공원', lat: 37.5681, lng: 126.8975 },
  { code: 'POI107', name: '응봉산', lat: 37.5546, lng: 127.0199 },
  { code: 'POI108', name: '이촌한강공원', lat: 37.5213, lng: 126.9697 },
  { code: 'POI109', name: '잠실종합운동장', lat: 37.5133, lng: 127.0719 },
  { code: 'POI110', name: '잠실한강공원', lat: 37.52, lng: 127.0829 },
  { code: 'POI111', name: '잠원한강공원', lat: 37.52, lng: 127.011 },
  { code: 'POI112', name: '청계산', lat: 37.4348, lng: 127.0569 },
  { code: 'POI113', name: '청와대', lat: 37.5862, lng: 126.9746 },

  // 추가 상업지역
  { code: 'POI114', name: '북창동 먹자골목', lat: 37.5636, lng: 126.9824 },
  { code: 'POI115', name: '남대문시장', lat: 37.5583, lng: 126.9775 },
  { code: 'POI116', name: '익선동', lat: 37.5724, lng: 126.9913 },
  { code: 'POI117', name: '신정네거리역', lat: 37.5252, lng: 126.8627 },
  { code: 'POI118', name: '잠실새내역', lat: 37.5112, lng: 127.0861 },
  { code: 'POI119', name: '잠실역', lat: 37.5133, lng: 127.1 },
  { code: 'POI120', name: '잠실롯데타워 일대', lat: 37.5133, lng: 127.1025 },
  { code: 'POI121', name: '송리단길·호수단길', lat: 37.5133, lng: 127.105 },
  { code: 'POI122', name: '신촌 스타광장', lat: 37.5561, lng: 126.9364 },
  { code: 'POI123', name: '보라매공원', lat: 37.4858, lng: 126.9242 },
  { code: 'POI124', name: '서대문독립공원', lat: 37.5748, lng: 126.9586 },
  { code: 'POI125', name: '안양천', lat: 37.517, lng: 126.852 },
  { code: 'POI126', name: '여의서로', lat: 37.5216, lng: 126.92 },
  { code: 'POI127', name: '올림픽공원', lat: 37.5219, lng: 127.1227 },
  { code: 'POI128', name: '홍제폭포', lat: 37.5906, lng: 126.9451 },
];

/**
 * 현재 위치에서 가장 가까운 장소 코드 찾기
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @return 가장 가까운 장소 코드 (POI001~POI128)
 */
function findNearestAreaCode(lat: number, lng: number): string {
  let minDistance = Infinity;
  let nearestCode = 'POI001'; // 기본값은 강남

  // 유클리드 거리 계산
  for (const location of LOCATIONS) {
    const distance = Math.sqrt(Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2));

    if (distance < minDistance) {
      minDistance = distance;
      nearestCode = location.code;
    }
  }

  return nearestCode;
}

/**
 * GET 서울시 실시간 도시데이터 API 호출
 * Query Parameters: lat(위도), lng(경도)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    // 필수 파라미터 검증
    if (!latParam || !lngParam) {
      return NextResponse.json(
        {
          error: '위도(lat)와 경도(lng) 파라미터가 없습니다.',
          code: 'MISSING_PARAMETERS',
        },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        {
          error: '올바른 좌표 형식이 아닙니다.',
          code: 'INVALID_COORDINATES',
        },
        { status: 400 }
      );
    }

    // 가장 가까운 장소 코드 찾기
    const nearestAreaCode = findNearestAreaCode(lat, lng);

    // 캐시 확인
    const now = Date.now();
    const cacheKey = nearestAreaCode;
    const cachedData = weatherCache.get(cacheKey);

    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      console.log(`날씨 데이터 캐시 사용: ${nearestAreaCode}`);
      return NextResponse.json({
        success: true,
        data: {
          ...cachedData.data,
          cached: true,
        },
      });
    }

    // 캐시가 없거나 만료된 경우 API 호출
    console.log(`날씨 데이터 API 호출: ${nearestAreaCode}`);
    const apiUrl = `${BASE_URL}/${API_KEY}/json/citydata/1/1/${nearestAreaCode}`;
    const fetchTime = new Date().toISOString();

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(
        `서울시 실시간 도시데이터 API 호출 실패: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        {
          error: `서울시 실시간 도시데이터 API 호출 실패: ${response.status}`,
          code: 'API_REQUEST_FAILED',
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    // API 응답 결과 코드 확인
    if (data.RESULT?.['RESULT.CODE'] !== 'INFO-000') {
      console.error(`API 응답 에러: ${data.RESULT?.['RESULT.MESSAGE']}`);
      return NextResponse.json(
        {
          error: `서울시 실시간 도시데이터 API 응답 에러: ${data.RESULT?.['RESULT.MESSAGE']}`,
          code: 'API_ERROR',
        },
        { status: 502 }
      );
    }

    const cityData = data.CITYDATA;
    if (!cityData) {
      return NextResponse.json(
        {
          success: false,
          error: `${nearestAreaCode}에 대한 도시 데이터가 없습니다.`,
          code: 'NO_DATA',
          data: null,
        },
        { status: 404 }
      );
    }

    const weatherArray = cityData.WEATHER_STTS;
    if (!weatherArray || weatherArray.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `${nearestAreaCode}에 대한 날씨 데이터가 없습니다.`,
          code: 'NO_WEATHER_DATA',
          data: null,
        },
        { status: 404 }
      );
    }

    const weatherData = weatherArray[0];

    // UI와 호환되는 원시 API 형식으로 반환
    const responseData = {
      AREA_CD: nearestAreaCode,
      AREA_NM: cityData.AREA_NM,
      WEATHER_STTS: weatherData.WEATHER_STTS,
      TEMP: weatherData.TEMP,
      SENSIBLE_TEMP: weatherData.SENSIBLE_TEMP,
      MAX_TEMP: weatherData.MAX_TEMP,
      MIN_TEMP: weatherData.MIN_TEMP,
      HUMIDITY: weatherData.HUMIDITY,
      PRECIPITATION: weatherData.PRECIPITATION,
      PCP_MSG: weatherData.PCP_MSG,
      UV_INDEX_LVL: weatherData.UV_INDEX_LVL,
      UV_MSG: weatherData.UV_MSG,
      PM25_INDEX: weatherData.PM25_INDEX,
      PM10_INDEX: weatherData.PM10_INDEX,
      timestamp: fetchTime,
      cached: false,
    };

    // 캐시 업데이트
    weatherCache.set(cacheKey, {
      data: responseData,
      timestamp: now,
    });

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('서울시 실시간 도시데이터 API 처리 중 오류 : ', error);
    return NextResponse.json(
      {
        error: '서버 내부 오류가 발생했습니다.',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
