'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Calendar, MapPin, Heart, Edit2, Save, X } from 'lucide-react';
import { useAuthStore } from '@/shared/model/authStore';
import { useUser } from '@/shared/lib/hooks/useUser';
import { usePreferences } from '@/shared/lib/hooks/usePreferences';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Checkbox } from '@/shared/ui/checkbox';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/lib/utils/toast';
import type { FacilityCategory } from '@/lib/types';

const CATEGORY_LABELS: Record<FacilityCategory, string> = {
  subway: '지하철',
  bike: '따릉이',
  park: '공원',
  library: '도서관',
  cultural_event: '문화행사',
  cultural_reservation: '문화예약',
  cooling_shelter: '무더위쉼터',
  culture: '문화시설',
  restaurant: '맛집',
  sports: '체육시설',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { user: userData, isLoading: userLoading, error: userError, updateUser, getMyInfo } = useUser();
  const { preferences, togglePreference, refreshPreferences } = usePreferences();
  const [prefLoading, setPrefLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedCategories, setEditedCategories] = useState<FacilityCategory[]>([]);
  const [saving, setSaving] = useState(false);

  // 로그인 체크
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // 사용자 정보 로드
  useEffect(() => {
    if (isAuthenticated && user?.oauthUserId && user?.oauthProvider) {
      getMyInfo(user.oauthUserId, user.oauthProvider);
    }
  }, [isAuthenticated, user?.oauthUserId, user?.oauthProvider, getMyInfo]);

  // 편집 모드 초기화
  useEffect(() => {
    if (userData?.user) {
      setEditedName(userData.user.nickname || '');
    }
    if (preferences?.preferredCategories) {
      setEditedCategories(preferences.preferredCategories);
    }
  }, [userData, preferences]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(userData?.user?.nickname || '');
    setEditedCategories(preferences?.preferredCategories || []);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 이름 업데이트
      if (userData?.user && editedName !== userData.user.nickname) {
        await updateUser(userData.user.id, { nickname: editedName });
      }
      
      // 선호 카테고리 업데이트
      setPrefLoading(true);
      try {
        // 현재 선호도와 비교하여 토글
        const currentCategories = preferences?.preferredCategories || [];
        for (const category of editedCategories) {
          if (!currentCategories.includes(category)) {
            await togglePreference(category);
          }
        }
        for (const category of currentCategories) {
          if (!editedCategories.includes(category)) {
            await togglePreference(category);
          }
        }
      } finally {
        setPrefLoading(false);
      }
      
      toast.success('프로필이 업데이트되었습니다.');
      setIsEditing(false);
      
      // 데이터 새로고침
      if (user?.oauthUserId && user?.oauthProvider) {
        await getMyInfo(user.oauthUserId, user.oauthProvider);
      }
      await refreshPreferences();
    } catch (error) {
      toast.error('프로필 업데이트에 실패했습니다.');
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: FacilityCategory) => {
    setEditedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (userLoading || prefLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">사용자 정보를 불러오는데 실패했습니다.</p>
              <Button onClick={() => router.push('/')} className="mt-4">
                홈으로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">내 정보</h1>
          </div>
          
          {!isEditing ? (
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              수정
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button onClick={handleSave} size="sm" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              기본 정보
            </CardTitle>
            <CardDescription>
              계정의 기본 정보를 확인하고 수정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-md">
                  {userData?.user?.nickname || '이름 없음'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                이메일
              </Label>
              <p className="px-3 py-2 bg-gray-50 rounded-md">
                {userData?.user?.email || user?.email || '이메일 없음'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                가입일
              </Label>
              <p className="px-3 py-2 bg-gray-50 rounded-md">
                {userData?.user?.createdAt 
                  ? new Date(userData.user.createdAt).toLocaleDateString('ko-KR')
                  : '정보 없음'}
              </p>
            </div>

            {userData?.user?.oauthProvider && (
              <div className="space-y-2">
                <Label>로그인 방식</Label>
                <p className="px-3 py-2 bg-gray-50 rounded-md capitalize">
                  {userData.user.oauthProvider}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 선호 카테고리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              선호 카테고리
            </CardTitle>
            <CardDescription>
              지도에 표시할 시설 카테고리를 선택하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const category = key as FacilityCategory;
                const isChecked = editedCategories.includes(category);
                
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={isChecked}
                      onCheckedChange={() => toggleCategory(category)}
                      disabled={!isEditing}
                    />
                    <Label
                      htmlFor={key}
                      className={`cursor-pointer ${!isEditing ? 'opacity-75' : ''}`}
                    >
                      {label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 위치 정보 */}
        {userData?.user?.lastLocation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                마지막 위치
              </CardTitle>
              <CardDescription>
                최근에 확인된 위치 정보입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>위도</Label>
                  <p className="px-3 py-2 bg-gray-50 rounded-md">
                    {userData.user.lastLocation.latitude?.toFixed(6) || '정보 없음'}
                  </p>
                </div>
                <div>
                  <Label>경도</Label>
                  <p className="px-3 py-2 bg-gray-50 rounded-md">
                    {userData.user.lastLocation.longitude?.toFixed(6) || '정보 없음'}
                  </p>
                </div>
              </div>
              {userData.user.lastLocation.address && (
                <div className="mt-4">
                  <Label>주소</Label>
                  <p className="px-3 py-2 bg-gray-50 rounded-md">
                    {userData.user.lastLocation.address}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 계정 관리 */}
        <Card>
          <CardHeader>
            <CardTitle>계정 관리</CardTitle>
            <CardDescription>
              계정 관련 작업을 수행할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // 로그아웃 처리
                useAuthStore.getState().clearAuth();
                router.push('/');
              }}
            >
              로그아웃
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                if (confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                  // TODO: 계정 삭제 API 호출
                  toast.error('계정 삭제 기능은 준비 중입니다.');
                }
              }}
            >
              계정 삭제
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}