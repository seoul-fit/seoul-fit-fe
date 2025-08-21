'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Bell, 
  Edit2, 
  Save, 
  X, 
  User,
  Settings,
  LogOut,
  Trash2,
  CheckCircle,
  MapPin,
  Activity,
  BellRing,
  Info
} from 'lucide-react';
import { useAuthStore } from '@/shared/model/authStore';
import { useUser } from '@/shared/lib/hooks/useUser';
import { getUserInterests, updateUserInterests } from '@/shared/api/preference';
import { deleteUser } from '@/shared/api/user';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/lib/utils/toast';

// 백엔드 InterestCategory와 매핑
type InterestCategory = 
  | 'SPORTS' 
  | 'CULTURE' 
  | 'CULTURAL_EVENT' 
  | 'CULTURAL_RESERVATION'
  | 'RESTAURANTS' 
  | 'LIBRARY' 
  | 'PARK' 
  | 'SUBWAY' 
  | 'BIKE' 
  | 'WEATHER' 
  | 'CONGESTION' 
  | 'COOLING_SHELTER';

const INTEREST_CATEGORIES: Record<InterestCategory, {
  label: string;
  description: string;
  icon: string;
  color: string;
  isLocationBased: boolean;
  isRealtimeNotificationRequired: boolean;
}> = {
  WEATHER: { 
    label: '날씨', 
    description: '기상정보, 폭염, 한파, 미세먼지 등',
    icon: '🌤️', 
    color: 'bg-sky-100 hover:bg-sky-200',
    isLocationBased: false,
    isRealtimeNotificationRequired: true
  },
  CONGESTION: { 
    label: '인구혼잡도', 
    description: '유동인구, 혼잡 지역 정보',
    icon: '👥', 
    color: 'bg-red-100 hover:bg-red-200',
    isLocationBased: false,
    isRealtimeNotificationRequired: true
  },
  SPORTS: { 
    label: '체육시설', 
    description: '헬스장, 수영장, 테니스장 등',
    icon: '🏃', 
    color: 'bg-orange-100 hover:bg-orange-200',
    isLocationBased: true,
    isRealtimeNotificationRequired: false
  },
  CULTURE: { 
    label: '문화시설', 
    description: '공연장, 전시관, 미술관 등',
    icon: '🏛️', 
    color: 'bg-purple-100 hover:bg-purple-200',
    isLocationBased: true,
    isRealtimeNotificationRequired: false
  },
  CULTURAL_EVENT: { 
    label: '문화행사', 
    description: '공연, 전시회, 축제 등',
    icon: '🎭', 
    color: 'bg-pink-100 hover:bg-pink-200',
    isLocationBased: true,
    isRealtimeNotificationRequired: true
  },
  CULTURAL_RESERVATION: { 
    label: '문화예약', 
    description: '문화시설 및 행사 예약 정보',
    icon: '🎫', 
    color: 'bg-indigo-100 hover:bg-indigo-200',
    isLocationBased: true,
    isRealtimeNotificationRequired: true
  },
  RESTAURANTS: { 
    label: '맛집', 
    description: '유명 음식점, 디저트 카페 등',
    icon: '🍽️', 
    color: 'bg-amber-100 hover:bg-amber-200',
    isLocationBased: true,
    isRealtimeNotificationRequired: false
  },
  LIBRARY: { 
    label: '도서관', 
    description: '공공도서관 현황, 운영시간, 예약',
    icon: '📚', 
    color: 'bg-emerald-100 hover:bg-emerald-200',
    isLocationBased: true,
    isRealtimeNotificationRequired: false
  },
  PARK: { 
    label: '공원', 
    description: '주요 공원 현황, 시설 정보',
    icon: '🌳', 
    color: 'bg-green-100 hover:bg-green-200',
    isLocationBased: true,
    isRealtimeNotificationRequired: false
  },
  SUBWAY: { 
    label: '지하철', 
    description: '서울시 지하철 실시간 정보',
    icon: '🚇', 
    color: 'bg-blue-100 hover:bg-blue-200',
    isLocationBased: false,
    isRealtimeNotificationRequired: false
  },
  BIKE: { 
    label: '따릉이', 
    description: '따릉이 대여소 현황, 자전거 정보',
    icon: '🚲', 
    color: 'bg-teal-100 hover:bg-teal-200',
    isLocationBased: true,
    isRealtimeNotificationRequired: true
  },
  COOLING_SHELTER: { 
    label: '무더위쉼터', 
    description: '서울시 무더위 쉼터 정보',
    icon: '❄️', 
    color: 'bg-cyan-100 hover:bg-cyan-200',
    isLocationBased: false,
    isRealtimeNotificationRequired: false
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const { isLoading: userLoading, getMyInfo } = useUser();
  const [isPageReady, setIsPageReady] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedInterests, setEditedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 초기 마운트 시 인증 상태 확인
  useEffect(() => {
    if (authChecked) return;
    
    const checkAuth = () => {
      const currentAuth = useAuthStore.getState();
      const token = localStorage.getItem('access_token') || 
                   document.cookie.includes('access_token');
      
      if (currentAuth.isAuthenticated || currentAuth.user || token) {
        setIsPageReady(true);
        setAuthChecked(true);
      } else {
        setTimeout(() => {
          const retryAuth = useAuthStore.getState();
          const retryToken = localStorage.getItem('access_token');
          
          if (retryAuth.isAuthenticated || retryAuth.user || retryToken) {
            setIsPageReady(true);
            setAuthChecked(true);
          } else {
            router.push('/');
          }
        }, 500);
      }
    };
    
    setTimeout(checkAuth, 100);
  }, [authChecked, router]);

  // 사용자 정보 로드
  useEffect(() => {
    if (isPageReady) {
      const currentAuth = useAuthStore.getState();
      if (currentAuth.isAuthenticated && currentAuth.user?.oauthUserId && currentAuth.user?.oauthProvider) {
        getMyInfo(currentAuth.user.oauthUserId, currentAuth.user.oauthProvider);
      }
    }
  }, [isPageReady, getMyInfo]);

  // 사용자 관심사 로드
  useEffect(() => {
    const loadUserInterests = async () => {
      const currentAuth = useAuthStore.getState();
      if (isPageReady && currentAuth.user?.id) {
        setInterestsLoading(true);
        try {
          const response = await getUserInterests(currentAuth.user.id);
          const interests = response.interests.map(i => i.category);
          setUserInterests(interests);
          setEditedInterests(interests);
        } catch (error) {
          console.error('관심사 로드 실패:', error);
          // 사용자의 기본 관심사 설정
          const defaultInterests = currentAuth.user?.interests?.map(i => i.interestCategory) || [];
          setUserInterests(defaultInterests);
          setEditedInterests(defaultInterests);
        } finally {
          setInterestsLoading(false);
        }
      }
    };
    
    loadUserInterests();
  }, [isPageReady]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedInterests(userInterests);
  };

  const handleSave = async () => {
    const currentAuth = useAuthStore.getState();
    if (!currentAuth.user?.id) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setSaving(true);
    try {
      await updateUserInterests(currentAuth.user.id, editedInterests);
      setUserInterests(editedInterests);
      toast.success('관심사가 업데이트되었습니다.');
      setIsEditing(false);
    } catch (error) {
      toast.error('관심사 업데이트에 실패했습니다.');
      console.error('Interest update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (category: string) => {
    setEditedInterests(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // 로딩 상태
  if (!isPageReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (userLoading || interestsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const currentUser = useAuthStore.getState().user;

  // 실시간 알림이 필요한 관심사 개수 계산
  const realtimeInterestsCount = editedInterests.filter(
    interest => INTEREST_CATEGORIES[interest as InterestCategory]?.isRealtimeNotificationRequired
  ).length;

  // 위치 기반 관심사 개수 계산
  const locationBasedCount = editedInterests.filter(
    interest => INTEREST_CATEGORIES[interest as InterestCategory]?.isLocationBased
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                내 프로필
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* 프로필 정보 섹션 */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 사용자 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg">
              {currentUser?.profileImageUrl ? (
                <Image 
                  src={currentUser.profileImageUrl} 
                  alt="프로필" 
                  width={80}
                  height={80}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentUser?.nickname || '사용자'}
              </h2>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                서울 거주
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>활동중</span>
            </div>
          </div>

          {/* 간단한 통계 */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {editedInterests.length}
              </p>
              <p className="text-xs text-gray-600 mt-1">관심 카테고리</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {realtimeInterestsCount}
              </p>
              <p className="text-xs text-gray-600 mt-1">실시간 알림</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {locationBasedCount}
              </p>
              <p className="text-xs text-gray-600 mt-1">위치 기반</p>
            </div>
          </div>
        </div>

        {/* 알림 설정 정보 */}
        <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">알림 설정 안내</p>
            <p className="text-xs text-blue-700 mt-1">
              선택한 관심사를 기반으로 실시간 도시 정보를 알림으로 받을 수 있습니다.
              위치 기반 서비스는 현재 위치 주변의 정보를 제공합니다.
            </p>
          </div>
        </div>

        {/* 관심사 설정 카드 */}
        <Card className="rounded-2xl shadow-sm border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">관심사 & 알림 설정</h3>
                  <p className="text-white/80 text-sm mt-1">
                    실시간 도시 정보 알림을 받을 카테고리를 선택하세요
                  </p>
                </div>
              </div>
              {!isEditing ? (
                <Button 
                  onClick={handleEdit} 
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  수정
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCancel} 
                    variant="secondary"
                    size="sm" 
                    disabled={saving}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    size="sm" 
                    disabled={saving}
                    className="bg-white text-blue-600 hover:bg-white/90"
                  >
                    {saving ? (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <CardContent className="p-6 bg-gray-50">
            <div className="space-y-6">
              {/* 실시간 알림 카테고리 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  실시간 알림 카테고리
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(INTEREST_CATEGORIES)
                    .filter(([_, config]) => config.isRealtimeNotificationRequired)
                    .map(([key, config]) => {
                      const isChecked = editedInterests.includes(key);
                      
                      return (
                        <label
                          key={key}
                          className={`
                            relative flex items-start gap-3 p-4 rounded-xl cursor-pointer
                            transition-all duration-200 border-2
                            ${isChecked 
                              ? 'bg-white border-blue-500 shadow-md' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                            }
                            ${!isEditing ? 'opacity-75 cursor-not-allowed' : ''}
                          `}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => isEditing && toggleInterest(key)}
                            disabled={!isEditing}
                          />
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0
                            ${config.color}
                          `}>
                            {config.icon}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>
                              {config.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {config.description}
                            </p>
                          </div>
                          {isChecked && (
                            <CheckCircle className="h-5 w-5 text-blue-500 absolute top-2 right-2" />
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* 일반 카테고리 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  위치 기반 및 일반 카테고리
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(INTEREST_CATEGORIES)
                    .filter(([_, config]) => !config.isRealtimeNotificationRequired)
                    .map(([key, config]) => {
                      const isChecked = editedInterests.includes(key);
                      
                      return (
                        <label
                          key={key}
                          className={`
                            relative flex items-start gap-3 p-4 rounded-xl cursor-pointer
                            transition-all duration-200 border-2
                            ${isChecked 
                              ? 'bg-white border-blue-500 shadow-md' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                            }
                            ${!isEditing ? 'opacity-75 cursor-not-allowed' : ''}
                          `}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => isEditing && toggleInterest(key)}
                            disabled={!isEditing}
                          />
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0
                            ${config.color}
                          `}>
                            {config.icon}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>
                              {config.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {config.description}
                            </p>
                          </div>
                          {isChecked && (
                            <CheckCircle className="h-5 w-5 text-blue-500 absolute top-2 right-2" />
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 계정 관리 섹션 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 px-2">계정 설정</h3>
          
          <div className="bg-white rounded-2xl shadow-sm border divide-y">
            <button
              onClick={() => toast.info('설정 기능은 준비 중입니다.')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-gray-600" />
                </div>
                <span className="font-medium text-gray-900">앱 설정</span>
              </div>
              <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </button>

            <button
              onClick={() => {
                useAuthStore.getState().clearAuth();
                router.push('/');
              }}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-orange-600" />
                </div>
                <span className="font-medium text-gray-900">로그아웃</span>
              </div>
              <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </button>

            <button
              onClick={async () => {
                const currentAuth = useAuthStore.getState();
                if (!currentAuth.user?.id || !currentAuth.accessToken) {
                  toast.error('사용자 정보를 찾을 수 없습니다.');
                  return;
                }
                
                if (confirm('정말로 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 데이터가 삭제됩니다.')) {
                  if (confirm('마지막으로 한 번 더 확인합니다.\n정말로 회원 탈퇴를 진행하시겠습니까?')) {
                    try {
                      await deleteUser(currentAuth.user.id, currentAuth.accessToken);
                      toast.success('회원 탈퇴가 완료되었습니다.');
                      
                      // 로그아웃 처리 및 모든 토큰 삭제
                      currentAuth.clearAuth();
                      
                      // 카카오 OAuth 토큰도 삭제
                      localStorage.removeItem('kakao_auth_token');
                      localStorage.removeItem('access_token');
                      localStorage.removeItem('refresh_token');
                      
                      // 모든 쿠키 삭제
                      document.cookie.split(";").forEach(c => {
                        document.cookie = `${c.replace(/^ +/, "").replace(/=.*/, "=;expires=")}${new Date().toUTCString()};path=/`;
                      });
                      
                      // 홈으로 이동
                      router.push('/');
                    } catch (error) {
                      console.error('회원 탈퇴 실패:', error);
                      toast.error('회원 탈퇴에 실패했습니다. 다시 시도해주세요.');
                    }
                  }
                }
              }}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 transition-colors rounded-b-2xl group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <span className="font-medium text-red-600">회원탈퇴</span>
              </div>
              <ArrowLeft className="h-5 w-5 text-red-400 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}