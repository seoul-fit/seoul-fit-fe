export interface InterestCategory {
  id: number;
  interestCategory: string;
}

export interface UserInterestResponse {
  userId: number;
  interests: {
    category: string;
    displayName: string;
    description: string;
    emoji: string;
    isLocationBased: boolean;
    isRealtimeNotificationRequired: boolean;
  }[];
  totalCount: number;
  lastUpdated: string;
  isCompleted: boolean;
}

export const getUserInterests = async (userId: number): Promise<UserInterestResponse> => {
  const response = await fetch('http://localhost:8080/api/users/interests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userId),
  });

  if (!response.ok) {
    throw new Error('사용자 관심사를 가져올 수 없습니다.');
  }

  return response.json();
};

export const updateUserInterests = async (userId: number, interests: string[]): Promise<void> => {
  const response = await fetch('http://localhost:8080/api/users/interests', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      interests,
    }),
  });

  if (!response.ok) {
    throw new Error('사용자 선호도 업데이트에 실패했습니다.');
  }
};
