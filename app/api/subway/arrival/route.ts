import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.SEOUL_API_KEY || '6a4166475a7065613533747a62786a';
const BASE_URL = 'http://swopenapi.seoul.go.kr/api/subway';

function formatArrivalMessage(message: string): string {
  return message.replace(/\[(\d+)]번째 전역/g, '$1번째 전역');
}

function formatTime(seconds: string): string {
  if (seconds.includes('분') || seconds.includes('초')) {
    return seconds;
  }

  const sec = parseInt(seconds);
  if (sec === 0) return seconds;

  const minutes = Math.floor(sec / 60);
  const remainingSeconds = sec % 60;

  if (minutes > 0 && remainingSeconds > 0) {
    return `${minutes}분 ${remainingSeconds}초`;
  } else if (minutes > 0) {
    return `${minutes}분`;
  } else {
    return `${remainingSeconds}초`;
  }
}

interface SubwayArrivalRow {
  subwayId: string;
  updnLine: string;
  trainLineNm: string;
  statnNm: string;
  barvlDt: string;
  btrainNo: string;
  bstatnNm: string;
  recptnDt: string;
  arvlMsg2: string;
  arvlMsg3: string;
  arvlCd: string;
}

interface SubwayArrivalResponse {
  errorMessage?: {
    status: number;
    code: string;
    message: string;
    link: string;
    developerMessage: string;
    total: number;
  };
  realtimeArrivalList?: SubwayArrivalRow[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationName = searchParams.get('stationName');

    if (!stationName) {
      return NextResponse.json(
        { error: '지하철역명(stationName) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // "역" 접미사 제거 (서울시 API는 역명만 받음)
    const cleanStationName = stationName.replace(/역$/, '');
    const apiUrl = `${BASE_URL}/${API_KEY}/json/realtimeStationArrival/0/10/${encodeURIComponent(cleanStationName)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `지하철 도착 정보 API 호출 실패: ${response.status}` },
        { status: 502 }
      );
    }

    const data: SubwayArrivalResponse = await response.json();

    if (data.errorMessage && data.errorMessage.code !== 'INFO-000') {
      return NextResponse.json({ error: data.errorMessage.message }, { status: 502 });
    }

    const arrivals = data.realtimeArrivalList || [];

    return NextResponse.json({
      success: true,
      data: {
        stationName,
        arrivals: arrivals.map(arrival => ({
          subwayId: arrival.subwayId,
          updnLine: arrival.updnLine,
          trainLineNm: arrival.trainLineNm,
          statnNm: arrival.statnNm,
          barvlDt: formatTime(arrival.barvlDt),
          btrainNo: arrival.btrainNo,
          bstatnNm: arrival.bstatnNm,
          arvlMsg2: formatArrivalMessage(arrival.arvlMsg2),
          arvlMsg3: arrival.arvlMsg3,
          arvlCd: arrival.arvlCd,
        })),
      },
    });
  } catch (error) {
    console.error('지하철 도착 정보 조회 중 오류:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
