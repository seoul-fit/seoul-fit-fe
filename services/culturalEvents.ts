export async function getNearbyCulturalEvents(lat: number, lng: number) {
  try {
    const response = await fetch(`/api/cultural-events?lat=${lat}&lng=${lng}`);
    
    if (!response.ok) {
      console.error(`문화행사 API 호출 실패: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('문화행사 조회 실패:', error);
    return [];
  }
}