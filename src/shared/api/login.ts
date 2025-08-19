export const kakaoLogin = () => {
  const KAKAO_CLIENT_ID = '349f89103b32e7135ad6f15e0a73509b';
  const REDIRECT_URI = 'http://localhost:3000/auth/callback';
  window.location.href = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
};

export const kakaoLogout = async () => {
  const accessToken = localStorage.getItem('access_token');

  if (!accessToken) {
    throw new Error('인증 토큰이 없습니다.');
  }

  const response = await fetch('http://localhost:8080/api/auth/oauth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('로그아웃 요청에 실패했습니다.');
  }

  localStorage.removeItem('kakao_login_attempt');
  localStorage.removeItem('kakao_login_type');
};
