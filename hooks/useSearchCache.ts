import { useState, useEffect, useCallback } from 'react';

// 검색 스코어를 포함한 검색 아이템
interface SearchItemWithScore extends SearchItem {
  score: number;
}

// 고급 검색 유틸리티 함수들
const searchUtils = {
  // 한글 → 초성 변환
  getChosung: (str: string): string => {
    const chosung = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
    return str.replace(/[가-힣]/g, (char) => {
      const code = char.charCodeAt(0) - 44032;
      if (code >= 0 && code <= 11171) {
        return chosung[Math.floor(code / 588)];
      }
      return char;
    });
  },

  // 텍스트 정규화 (띄어쓰기, 특수문자 제거)
  normalize: (str: string): string => {
    return str.toLowerCase().replace(/[\s\-_()]/g, '');
  },

  // 매치 스코어 계산
  getMatchScore: (text: string, query: string): number => {
    const normalizedText = searchUtils.normalize(text);
    const normalizedQuery = searchUtils.normalize(query);
    const chosungText = searchUtils.getChosung(text);
    const chosungQuery = searchUtils.getChosung(query);

    // 1. 완전일치 (100점)
    if (normalizedText === normalizedQuery) return 100;
    
    // 2. 시작매치 (90점)
    if (normalizedText.startsWith(normalizedQuery)) return 90;
    
    // 3. 포함매치 (70점)
    if (normalizedText.includes(normalizedQuery)) return 70;
    
    // 4. 초성 완전매치 (60점)
    if (chosungText === chosungQuery) return 60;
    
    // 5. 초성 시작매치 (50점)
    if (chosungText.startsWith(chosungQuery)) return 50;
    
    // 6. 초성 포함매치 (40점)
    if (chosungText.includes(chosungQuery)) return 40;
    
    // 7. 부분 단어 매치 (30점)
    const words = normalizedText.split(/[\s\-_]/);
    for (const word of words) {
      if (word.startsWith(normalizedQuery)) return 30;
    }
    
    return 0;
  },

  // 카테고리 우선순위
  getCategoryPriority: (category: SearchItem['category']): number => {
    const priorities = {
      'subway': 1,
      'bike': 2,
      'library': 3,
      'park': 4,
      'cultural_event': 5,
      'cultural_reservation': 6,
      'cooling_center': 7,
      'restaurant': 8
    };
    return priorities[category] || 9;
  }
};

// 통합 검색 아이템 타입
export interface SearchItem {
  id: string;
  name: string;
  address?: string;
  remark?: string;
  aliases?: string;
  category: 'subway' | 'bike' | 'library' | 'park' | 'cultural_event' | 'cultural_reservation' | 'cooling_center' | 'restaurant';
  ref_table?: string;
  ref_id?: number;
}

// POI API 응답 타입
interface POIItem {
  id: number;
  name: string;
  address?: string;
  remark?: string;
  aliases?: string;
  ref_table: string;
  ref_id: number;
}

export const useSearchCache = () => {
  const [searchCache, setSearchCache] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 매핑 함수
  const getCategoryFromRefTable = (refTable: string): SearchItem['category'] => {
    switch (refTable) {
      case 'libraries': return 'library';
      case 'park': return 'park';
      case 'cultural_events': return 'cultural_event';
      case 'cultural_reservation': return 'cultural_reservation';
      case 'cooling_centers': return 'cooling_center';
      case 'restaurants': return 'restaurant';
      default: return 'library'; // fallback
    }
  };

  // 데이터 로드 함수
  const loadSearchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('검색 데이터 로딩 시작...');

      // 3개 API 병렬 호출
      const [subwayRes, bikeRes, poiRes] = await Promise.allSettled([
        fetch('/api/subway?lat=37.5665&lng=126.9780'), // 서울 중심 좌표로 지하철 전체 데이터 요청
        fetch('/api/bike-stations?lat=37.5665&lng=126.9780&radius=30'), // 서울 전체를 포함하는 큰 반경 (30km)
        fetch('/api/search/index?page=0&size=20000')
      ]);

      const combinedData: SearchItem[] = [];

      // 지하철 데이터 처리
      if (subwayRes.status === 'fulfilled' && subwayRes.value.ok) {
        try {
          const subwayData = await subwayRes.value.json();
          console.log('지하철 API 응답 구조:', subwayData);
          
          if (subwayData.success && subwayData.data?.stations) {
            const subwayItems: SearchItem[] = subwayData.data.stations.map((station: any) => ({
              id: station.code || `subway_${station.stationId}`,
              name: station.name,
              category: 'subway' as const,
              remark: station.route || station.line
            }));
            combinedData.push(...subwayItems);
            console.log(`지하철 데이터 로드 성공: ${subwayItems.length}개`);
            console.log('지하철 샘플 데이터:', subwayItems.slice(0, 3));
          } else {
            console.warn('지하철 데이터 구조 이상:', subwayData);
          }
        } catch (parseError) {
          console.error('지하철 데이터 JSON 파싱 실패:', parseError);
        }
      } else if (subwayRes.status === 'fulfilled') {
        console.warn(`지하철 API 호출 실패: ${subwayRes.value.status} ${subwayRes.value.statusText}`);
      } else {
        console.warn('지하철 API 호출 rejected:', subwayRes.reason);
      }

      // 따릉이 데이터 처리
      if (bikeRes.status === 'fulfilled' && bikeRes.value.ok) {
        const bikeData = await bikeRes.value.json();
        if (bikeData.success && bikeData.data?.stations) {
          const bikeItems: SearchItem[] = bikeData.data.stations.map((station: any) => ({
            id: station.code || `bike_${station.stationId}`,
            name: station.name,
            category: 'bike' as const
          }));
          combinedData.push(...bikeItems);
          console.log(`따릉이 데이터 로드: ${bikeItems.length}개`);
        }
      } else {
        console.warn('따릉이 데이터 로드 실패');
      }

      // POI 데이터 처리
      if (poiRes.status === 'fulfilled' && poiRes.value.ok) {
        try {
          const poiData = await poiRes.value.json();
          console.log('POI API 응답 형태:', typeof poiData, Array.isArray(poiData) ? `배열 길이: ${poiData.length}` : '배열 아님');
          
          if (Array.isArray(poiData)) {
            const poiItems: SearchItem[] = poiData.map((item: POIItem) => ({
              id: `poi_${item.id}`,
              name: item.name,
              address: item.address,
              remark: item.remark,
              aliases: item.aliases,
              category: getCategoryFromRefTable(item.ref_table),
              ref_table: item.ref_table,
              ref_id: item.ref_id
            }));
            combinedData.push(...poiItems);
            console.log(`POI 데이터 로드 성공: ${poiItems.length}개`);
          } else {
            console.warn('POI 데이터가 배열 형태가 아님:', poiData);
          }
        } catch (parseError) {
          console.error('POI 데이터 JSON 파싱 실패:', parseError);
        }
      } else if (poiRes.status === 'fulfilled') {
        console.warn(`POI API 호출 실패: ${poiRes.value.status} ${poiRes.value.statusText}`);
      } else {
        console.warn('POI API 호출 rejected:', poiRes.reason);
      }

      setSearchCache(combinedData);
      console.log(`총 검색 데이터: ${combinedData.length}개`);

    } catch (err) {
      console.error('검색 데이터 로드 중 오류:', err);
      setError('검색 데이터 로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 고급 검색 함수
  const search = useCallback((query: string, limit: number = 10): SearchItem[] => {
    if (!query.trim() || query.length < 1) return []; // 1글자부터 검색 가능

    const trimmedQuery = query.trim();
    
    // 각 항목에 스코어를 계산하여 SearchItemWithScore 배열 생성
    const itemsWithScores: SearchItemWithScore[] = searchCache
      .map(item => {
        // 검색 대상 필드들 수집
        const searchFields: string[] = [item.name];
        
        // 주소가 있으면 주소도 검색 (,로 분리)
        if (item.address) {
          searchFields.push(...item.address.split(',').map(addr => addr.trim()));
        }
        
        // remark가 있으면 remark도 검색 (,로 분리)
        if (item.remark) {
          searchFields.push(...item.remark.split(',').map(remark => remark.trim()));
        }
        
        // aliases가 있으면 별칭도 검색 (,로 분리)
        if (item.aliases) {
          searchFields.push(...item.aliases.split(',').map(alias => alias.trim()));
        }
        
        // 모든 필드에서 최고 점수 계산
        let maxScore = 0;
        for (const field of searchFields) {
          const score = searchUtils.getMatchScore(field, trimmedQuery);
          maxScore = Math.max(maxScore, score);
        }
        
        return {
          ...item,
          score: maxScore
        };
      })
      .filter(item => item.score > 0) // 매치되는 항목만 필터링
      .sort((a, b) => {
        // 1차: 스코어 순 정렬 (내림차순)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // 2차: 카테고리 우선순위 (오름차순)
        const aPriority = searchUtils.getCategoryPriority(a.category);
        const bPriority = searchUtils.getCategoryPriority(b.category);
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        // 3차: 이름 길이 (짧은 것 우선)
        return a.name.length - b.name.length;
      });

    // 개발환경에서는 스코어 정보 로깅
    if (process.env.NODE_ENV === 'development' && itemsWithScores.length > 0) {
      console.log(`검색어 "${trimmedQuery}" 결과 (상위 5개):`, 
        itemsWithScores.slice(0, 5).map(item => ({
          name: item.name,
          score: item.score,
          category: item.category
        }))
      );
    }

    // 스코어 정보 제거하고 SearchItem[] 형태로 반환
    return itemsWithScores.slice(0, limit).map(({ score, ...item }) => item);
  }, [searchCache]);

  // 카테고리별 검색
  const searchByCategory = useCallback((query: string, categories: SearchItem['category'][], limit: number = 10): SearchItem[] => {
    if (!query.trim() || query.length < 1) return [];

    return search(query, searchCache.length)
      .filter(item => categories.includes(item.category))
      .slice(0, limit);
  }, [search, searchCache]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadSearchData();
  }, [loadSearchData]);

  return {
    searchCache,
    isLoading,
    error,
    search,
    searchByCategory,
    reloadData: loadSearchData,
    totalCount: searchCache.length
  };
};