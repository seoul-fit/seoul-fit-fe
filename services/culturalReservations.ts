export async function getNearbyCulturalReservations(lat: number, lng: number) {
  try {
    const response = await fetch(`/api/v1/cultural-reservations?lat=${lat}&lng=${lng}`);

    if (!response.ok) {
      console.error(`문화예약 API 호출 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('문화예약 조회 실패:', error);
    return [];
  }
}
