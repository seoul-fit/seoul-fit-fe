import Cookies from 'js-cookie';

export interface InterestCategory {
  id: number;
  interestCategory: string;
}

export interface UserResult {
  id: number;
  authUserId: number;
  nickname: string;
  profileImageUrl: string;
  locationLatitude: number | null;
  locationLongitude: number | null;
  locationAddress: string | null;
  status: string;
  interests: InterestCategory[];
  createdAt: string;
  updatedAt: string;
}

export const getUserInfo = async (userId: number): Promise<UserResult> => {
  const accessToken = Cookies.get('access_token');
  
  if (!accessToken) {
    throw new Error('인증 토큰이 없습니다.');
  }

  const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('사용자 정보를 가져올 수 없습니다.');
  }

  return response.json();
};