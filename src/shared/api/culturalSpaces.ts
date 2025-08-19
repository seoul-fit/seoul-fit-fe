export async function getNearbyCulturalSpaces(lat: number, lng: number) {
  try {
    const response = await fetch(`/api/v1/cultural-spaces?lat=${lat}&lng=${lng}`);

    if (!response.ok) {
      console.error(`문화공간 API 호출 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('문화공간 조회 실패:', error);
    return [];
  }
}
