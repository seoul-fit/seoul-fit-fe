// components/layout/SideBar.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Check, LogOut, Settings, User } from 'lucide-react';
import { X } from 'lucide-react';
import type { UserPreferences, FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/lib/facilityIcons';
import { useAuthStore } from '@/store/authStore';
import WarningModal from '@/components/ui/warning-modal';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    preferences: UserPreferences;
    onPreferenceToggle: (type: FacilityCategory) => void;
    onLogin?: () => void;
    onLogout?: () => void;
    onPreferencesRefresh?: () => void;
    showWarning?: boolean;
    onWarningClose?: () => void;
}

export default function SideBar({ 
    isOpen, 
    onClose, 
    preferences, 
    onPreferenceToggle,
    onLogin,
    onLogout,
    onPreferencesRefresh,
    showWarning,
    onWarningClose
}: SidebarProps) {
  const { isAuthenticated, user } = useAuthStore();

  // 사이드바 클릭 시 사용자 관심사 조회
  React.useEffect(() => {
    if (isOpen && isAuthenticated && onPreferencesRefresh) {
      onPreferencesRefresh();
    }
  }, [isOpen, isAuthenticated, onPreferencesRefresh]);

  const selectedCount = Object.values(preferences).filter(Boolean).length;

  const handleToggle = (type: FacilityCategory) => {
    onPreferenceToggle(type);
  };

  // 키보드 접근성을 위한 핸들러
  const handleKeyDown = (e: React.KeyboardEvent, type: FacilityCategory) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(type);
    }
  };

  return (
    <>
      {/* 오버레이 배경 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-transparent z-[59]"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside className={`fixed inset-y-0 right-0 z-[60] w-80 max-w-[85vw] md:w-96 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-800">선호도 설정</h2>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {selectedCount}개 선택
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="메뉴 닫기"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* 로그인 영역 */}
            {!isAuthenticated ? (
              <button 
                onClick={onLogin}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
                <span>카카오로 로그인</span>
              </button>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  {user?.profileImageUrl ? (
                    <Image 
                      src={user.profileImageUrl}
                      alt="프로필" 
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {user?.nickname || '사용자'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 선호도 목록 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-3">
              {(Object.keys(preferences) as FacilityCategory[]).map((type) => {
                const config = FACILITY_CONFIGS[type];
                const isSelected = preferences[type];
                
                return (
                  <div 
                    key={type}
                    className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleToggle(type)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, type)}
                  >
                    {/* 시설 정보 */}
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-full ${config.color} flex items-center justify-center text-white`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 group-hover:text-gray-900 text-base">
                          {config.label}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {config.description}
                        </p>
                      </div>
                    </div>

                    {/* 체크박스 */}
                    <div className={`w-7 h-7 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 group-hover:border-gray-400'
                    }`}>
                      {isSelected && <Check className="w-5 h-5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>



          {/* 푸터 */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  <User className="w-4 h-4" />
                  <span>프로필 설정</span>
                </button>
                <button 
                  onClick={onLogout}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500">로그인하면 더 많은 기능을 이용할 수 있어요</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      <WarningModal 
        isOpen={showWarning || false} 
        onClose={onWarningClose || (() => {})} 
      />
    </>
  );
}