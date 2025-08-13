export async function getNearbyLibraries(lat: number, lng: number) {
  try {
    const response = await fetch(`/api/libraries?lat=${lat}&lng=${lng}`);
    
    if (!response.ok) {
      console.error(`도서관 API 호출 실패: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('도서관 조회 실패:', error);
    return [];
  }
}