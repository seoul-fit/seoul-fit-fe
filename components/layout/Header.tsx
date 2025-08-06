// components/layout/Header.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Menu, MapPin, X, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMenuClick: () => void;
}

interface SearchSuggestion {
  id: string;
  name: string;
  address: string;
  type: string;
}

export default function Header({ 
  searchQuery, 
  onSearchChange, 
  onMenuClick 
}: HeaderProps) {
  const [notificationCount] = useState<number>(3);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    
    // 실제 구현에서는 디바운싱된 API 호출
    if (value.length > 1) {
      // Mock 검색 결과
      setSuggestions([
        {
          id: '1',
          name: '서울체육관',
          address: '서울시 송파구 방이동',
          type: 'sports'
        },
        {
          id: '2',
          name: '국립중앙박물관',
          address: '서울시 용산구 서빙고로',
          type: 'culture'
        }
      ]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 검색 제안 선택
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSearchChange(suggestion.name);
    setShowSuggestions(false);
    searchRef.current?.blur();
  };

  // 검색 초기화
  const handleClearSearch = () => {
    onSearchChange('');
    setShowSuggestions(false);
    searchRef.current?.focus();
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node) &&
        !searchRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-4">
      {/* 헤더 */}
      <header className="flex items-center justify-between gap-3">
        {/* 검색바 영역 - 반응형으로 전체 너비 활용 */}
        <div className="flex items-center flex-1 relative">
          <div className={`flex items-center w-full bg-gray-50 rounded-lg transition-all duration-200 ${
            isFocused ? 'ring-2 ring-blue-500 bg-white shadow-sm' : 'hover:bg-gray-100'
          }`}>
            <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="장소, 주소 검색"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 bg-transparent px-3 py-2.5 outline-none text-gray-700 placeholder-gray-400 min-w-0"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="p-1 mr-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                aria-label="검색어 지우기"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* 검색 제안 드롭다운 */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{suggestion.name}</div>
                    <div className="text-sm text-gray-500 truncate">{suggestion.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 우측 버튼들 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 알림 버튼 */}
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center min-w-[1.25rem]">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem className="font-medium">
                  알림 목록
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">새로운 시설이 추가되었습니다</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">혼잡도 정보가 업데이트되었습니다</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">즐겨찾기 시설 이용 가능</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 메뉴 버튼 */}
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </header>
    </div>
  );
}