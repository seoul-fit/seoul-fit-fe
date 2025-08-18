// components/layout/Header.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Search,
  Menu,
  MapPin,
  X,
  Bell,
  Train,
  Bike,
  Book,
  Trees,
  Building,
  Loader2,
  Snowflake,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSearchCache, type SearchItem, type SearchHistoryItem } from '@/hooks/useSearchCache';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

export interface HeaderRef {
  closeSearchSuggestions: () => void;
  blurSearchInput: () => void;
}

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSelect?: (searchItem: SearchItem) => void;
  onSearchClear?: () => void;
  onMenuClick: () => void;
}

// 카테고리별 아이콘 매핑
const getCategoryIcon = (category: SearchItem['category']) => {
  switch (category) {
    case 'subway':
      return <Train className='w-4 h-4 text-blue-500' />;
    case 'bike':
      return <Bike className='w-4 h-4 text-green-500' />;
    case 'library':
      return <Book className='w-4 h-4 text-purple-500' />;
    case 'park':
      return <Trees className='w-4 h-4 text-emerald-500' />;
    case 'cultural_event':
    case 'cultural_reservation':
      return <Building className='w-4 h-4 text-orange-500' />;
    case 'cooling_center':
      return <Snowflake className='w-4 h-4 text-cyan-500' />;
    case 'restaurant':
      return <MapPin className='w-4 h-4 text-red-500' />;
    default:
      return <MapPin className='w-4 h-4 text-gray-400' />;
  }
};

const Header = React.forwardRef<HeaderRef, HeaderProps>(
  ({ searchQuery, onSearchChange, onSearchSelect, onSearchClear, onMenuClick }, ref) => {
    const { isAuthenticated, user, accessToken } = useAuthStore();
    const {
      unreadCount: notificationCount,
      notifications,
      isLoadingHistory,
      fetchUnreadCount,
      fetchNotificationHistory,
      markAsRead,
    } = useNotificationStore();
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 검색 캐시 훅 사용 (검색 히스토리 포함)
    const {
      search,
      isLoading: cacheLoading,
      error: cacheError,
      searchHistory,
      addToHistory,
      removeFromHistory,
      clearHistory,
      getRelevantHistory,
    } = useSearchCache();

    // 디바운싱된 검색 함수 (메모이제이션)
    const debouncedSearch = useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          try {
            const results = search(value, 10);
            setSuggestions(results);
            setShowSuggestions(results.length > 0 || getRelevantHistory(value).length > 0);
          } catch (error) {
            console.error('검색 중 오류:', error);
            setSuggestions([]);
            setShowSuggestions(getRelevantHistory(value).length > 0);
          }
        }, 200);
      };
    }, [search, getRelevantHistory]);

    // 검색어 변경 핸들러 (최적화됨)
    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearchChange(value);

        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        if (value.length > 0) {
          debouncedSearch(value);
        } else {
          setSuggestions([]);
          setShowSuggestions(searchHistory.length > 0);
          if (onSearchClear) {
            onSearchClear();
          }
        }
      },
      [onSearchChange, onSearchClear, debouncedSearch, searchHistory.length]
    );

    // 검색 제안 선택
    const handleSuggestionClick = async (suggestion: SearchItem) => {
      onSearchChange(suggestion.name);
      setShowSuggestions(false);
      searchRef.current?.blur();

      // 검색 히스토리에 추가
      addToHistory(suggestion.name, suggestion);

      // 검색 결과 선택 이벤트 발생
      if (onSearchSelect) {
        try {
          await onSearchSelect(suggestion);
        } catch (error) {
          console.error('검색 결과 선택 실패:', error);
        }
      }
    };

    // 검색 히스토리 아이템 클릭
    const handleHistoryClick = async (historyItem: SearchHistoryItem) => {
      onSearchChange(historyItem.query);
      setShowSuggestions(false);
      searchRef.current?.blur();

      // 히스토리를 최신으로 업데이트
      addToHistory(historyItem.query, historyItem.selectedItem);

      // 선택된 아이템이 있으면 해당 아이템으로 이동
      if (historyItem.selectedItem && onSearchSelect) {
        try {
          await onSearchSelect(historyItem.selectedItem);
        } catch (error) {
          console.error('검색 히스토리 선택 실패:', error);
        }
      }
    };

    // 검색 히스토리 개별 삭제
    const handleRemoveHistoryItem = (e: React.MouseEvent, historyId: string) => {
      e.stopPropagation(); // 부모 클릭 이벤트 방지
      removeFromHistory(historyId);
    };

    // 검색 초기화
    const handleClearSearch = () => {
      onSearchChange('');
      setShowSuggestions(false);
      searchRef.current?.focus();

      // 검색 초기화 이벤트 발생
      if (onSearchClear) {
        onSearchClear();
      }
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

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
      const currentTimeout = searchTimeoutRef.current;
      return () => {
        if (currentTimeout) {
          clearTimeout(currentTimeout);
        }
      };
    }, []);

    // 인증된 사용자의 알림 개수 초기 로드
    useEffect(() => {
      if (isAuthenticated && user && accessToken) {
        fetchUnreadCount(user.id, accessToken);
      }
    }, [isAuthenticated, user, accessToken, fetchUnreadCount]);

    // 알림 드롭다운 열릴 때 알림 히스토리 로드
    const handleNotificationDropdownOpen = () => {
      if (isAuthenticated && user && accessToken) {
        fetchNotificationHistory(user.id, accessToken);
      }
    };

    // 알림 클릭 시 읽음 처리
    const handleNotificationClick = async (notificationId: number) => {
      if (accessToken && user) {
        await markAsRead(notificationId, user.id, accessToken);
      }
    };

    // 알림 타입별 아이콘 가져오기
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'CONGESTION':
          return <div className='w-2 h-2 bg-orange-500 rounded-full' />;
        case 'LOCATION':
          return <div className='w-2 h-2 bg-blue-500 rounded-full' />;
        case 'EVENT':
          return <div className='w-2 h-2 bg-green-500 rounded-full' />;
        case 'SYSTEM':
          return <div className='w-2 h-2 bg-purple-500 rounded-full' />;
        default:
          return <div className='w-2 h-2 bg-gray-500 rounded-full' />;
      }
    };

    // 날짜 포맷팅 함수
    const formatNotificationDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) {
        return '방금 전';
      } else if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}일 전`;
      }
    };

    // 검색 제안 닫기 함수
    const closeSearchSuggestions = useCallback(() => {
      setShowSuggestions(false);
    }, []);

    // 검색창 포커스 해제 함수
    const blurSearchInput = useCallback(() => {
      searchRef.current?.blur();
    }, []);

    // ref로 외부 함수 노출
    React.useImperativeHandle(
      ref,
      () => ({
        closeSearchSuggestions,
        blurSearchInput,
      }),
      [closeSearchSuggestions, blurSearchInput]
    );

    return (
      <div className='p-4'>
        {/* 헤더 */}
        <header className='flex items-center justify-between gap-3'>
          {/* 검색바 영역 - 반응형으로 전체 너비 활용 */}
          <div className='flex items-center flex-1 relative'>
            <div
              className={`flex items-center w-full bg-gray-50 rounded-lg transition-all duration-200 ${
                isFocused ? 'ring-2 ring-blue-500 bg-white shadow-sm' : 'hover:bg-gray-100'
              }`}
            >
              <Search className='w-5 h-5 text-gray-400 ml-3 flex-shrink-0' />
              <input
                ref={searchRef}
                type='text'
                placeholder='장소, 주소 검색'
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  setIsFocused(true);
                  // 검색창 포커스 시 검색 히스토리 표시
                  if (!searchQuery && searchHistory.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => setIsFocused(false)}
                className='flex-1 bg-transparent px-3 py-2.5 outline-none text-gray-700 placeholder-gray-400 min-w-0'
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className='p-1 mr-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0'
                  aria-label='검색어 지우기'
                >
                  <X className='w-4 h-4 text-gray-400' />
                </button>
              )}
            </div>

            {/* 검색 제안 드롭다운 */}
            {(showSuggestions || cacheLoading) && (
              <div
                ref={suggestionRef}
                className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto'
              >
                {cacheLoading && (
                  <div className='px-4 py-3 text-center text-gray-500 flex items-center justify-center gap-2'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    데이터 로딩 중...
                  </div>
                )}

                {!cacheLoading &&
                  (() => {
                    const relevantHistory = getRelevantHistory(searchQuery);
                    const hasHistory = relevantHistory.length > 0;
                    const hasSuggestions = suggestions.length > 0;

                    return (
                      <>
                        {/* 검색 히스토리 섹션 */}
                        {hasHistory && (
                          <>
                            <div className='px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between'>
                              <span className='text-xs font-medium text-gray-600 flex items-center gap-1'>
                                <Clock className='w-3 h-3' />
                                최근 검색
                              </span>
                              {relevantHistory.length > 0 && (
                                <button
                                  onClick={() => clearHistory()}
                                  className='text-xs text-gray-400 hover:text-gray-600 transition-colors'
                                >
                                  전체 삭제
                                </button>
                              )}
                            </div>
                            {relevantHistory.slice(0, 5).map(historyItem => (
                              <div
                                key={historyItem.id}
                                onClick={() => handleHistoryClick(historyItem)}
                                className='w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 group cursor-pointer'
                              >
                                <Clock className='w-4 h-4 text-gray-400 flex-shrink-0' />
                                <div className='flex-1 min-w-0'>
                                  <div className='font-medium text-gray-700 truncate'>
                                    {historyItem.query}
                                  </div>
                                  {historyItem.selectedItem && (
                                    <div className='text-xs text-gray-400 truncate'>
                                      {historyItem.selectedItem.address?.split(',')[0] ||
                                        historyItem.selectedItem.name}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={e => handleRemoveHistoryItem(e, historyItem.id)}
                                  className='opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-all flex-shrink-0'
                                  aria-label='히스토리 삭제'
                                >
                                  <X className='w-3 h-3 text-gray-400' />
                                </button>
                              </div>
                            ))}
                          </>
                        )}

                        {/* 자동완성 결과 섹션 */}
                        {hasSuggestions && (
                          <>
                            {hasHistory && (
                              <div className='px-4 py-2 bg-gray-50 border-b border-gray-100'>
                                <span className='text-xs font-medium text-gray-600'>검색 결과</span>
                              </div>
                            )}
                            {suggestions.map(suggestion => (
                              <button
                                key={suggestion.id}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className='w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0'
                              >
                                {getCategoryIcon(suggestion.category)}
                                <div className='flex-1 min-w-0'>
                                  <div className='font-medium text-gray-900 truncate'>
                                    {suggestion.name}
                                    {suggestion.remark && (
                                      <span className='ml-2 text-xs text-gray-400'>
                                        ({suggestion.remark.split(',')[0]})
                                      </span>
                                    )}
                                  </div>
                                  {suggestion.address && (
                                    <div className='text-sm text-gray-500 truncate'>
                                      {suggestion.address.split(',')[0]}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </>
                        )}

                        {/* 결과 없음 메시지 */}
                        {!hasHistory && !hasSuggestions && searchQuery.length > 0 && (
                          <div className='px-4 py-3 text-center text-gray-500'>
                            검색 결과가 없습니다
                          </div>
                        )}
                      </>
                    );
                  })()}

                {cacheError && (
                  <div className='px-4 py-3 text-center text-red-500 text-sm'>{cacheError}</div>
                )}
              </div>
            )}
          </div>

          {/* 우측 버튼들 */}
          <div className='flex items-center gap-2 flex-shrink-0'>
            {/* 알림 버튼 - 로그인 상태에서만 표시 */}
            {isAuthenticated && (
              <div className='relative'>
                <DropdownMenu onOpenChange={open => open && handleNotificationDropdownOpen()}>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='icon' className='relative'>
                      <Bell className='h-4 w-4' />
                      {notificationCount > 0 && (
                        <div className='absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center min-w-[1.25rem]'>
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-80 max-h-96 overflow-y-auto'>
                    <DropdownMenuItem className='font-medium border-b'>알림 목록</DropdownMenuItem>

                    {isLoadingHistory ? (
                      <DropdownMenuItem>
                        <div className='flex items-center gap-2 w-full justify-center py-4'>
                          <Loader2 className='w-4 h-4 animate-spin' />
                          <span className='text-sm text-gray-500'>로딩 중...</span>
                        </div>
                      </DropdownMenuItem>
                    ) : notifications.length > 0 ? (
                      notifications.map(notification => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`cursor-pointer border-b last:border-b-0 ${
                            notification.status === 'SENT' ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <div className='flex items-start gap-3 w-full py-2'>
                            {getNotificationIcon(notification.type)}
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium text-sm truncate'>
                                {notification.title}
                              </div>
                              <div className='text-xs text-gray-600 mt-1 line-clamp-2'>
                                {notification.message}
                              </div>
                              <div className='flex items-center justify-between mt-2'>
                                <span className='text-xs text-gray-400'>
                                  {formatNotificationDate(notification.sentAt || notification.createdAt)}
                                </span>
                                {notification.status === 'SENT' && (
                                  <div className='w-2 h-2 bg-blue-500 rounded-full' />
                                )}
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem>
                        <div className='flex items-center justify-center w-full py-8'>
                          <span className='text-sm text-gray-500'>알림이 없습니다</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* 메뉴 버튼 */}
            <button
              onClick={onMenuClick}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              aria-label='메뉴 열기'
            >
              <Menu className='w-6 h-6 text-gray-700' />
            </button>
          </div>
        </header>
      </div>
    );
  }
);

Header.displayName = 'Header';

export default Header;
