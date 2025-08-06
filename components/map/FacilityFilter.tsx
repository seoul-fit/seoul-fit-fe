// components/map/FacilityFilter.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { X, CheckCircle, Circle, Filter } from 'lucide-react';

import type { UserPreferences, FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/lib/facilityIcons';

interface FacilityFilterProps {
  preferences: UserPreferences;
  facilityCountByCategory: Record<FacilityCategory, number>;
  onToggleCategory: (category: FacilityCategory) => void;
  onClose: () => void;
}

export const FacilityFilter: React.FC<FacilityFilterProps> = ({
  preferences,
  facilityCountByCategory,
  onToggleCategory,
  onClose
}) => {
  // 전체 선택/해제 핸들러
  const handleToggleAll = (enabled: boolean) => {
    Object.keys(preferences).forEach(category => {
      if (preferences[category as FacilityCategory] !== enabled) {
        onToggleCategory(category as FacilityCategory);
      }
    });
  };

  // 활성화된 카테고리 수
  const enabledCount = Object.values(preferences).filter(Boolean).length;
  const totalCount = Object.keys(preferences).length;
  const allEnabled = enabledCount === totalCount;
  const noneEnabled = enabledCount === 0;

  return (
    <Card className="shadow-lg w-72">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-lg">시설 필터</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 상태 표시 */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{enabledCount}개 카테고리 선택됨</span>
          <Badge variant="outline" className="text-xs">
            {Object.values(facilityCountByCategory).reduce((sum, count) => sum + count, 0)}개 시설
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 전체 선택/해제 버튼 */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(true)}
            disabled={allEnabled}
            className="flex-1"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            전체 선택
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(false)}
            disabled={noneEnabled}
            className="flex-1"
          >
            <Circle className="h-3 w-3 mr-1" />
            전체 해제
          </Button>
        </div>

        <Separator className="mb-4" />

        {/* 카테고리 목록 */}
        <div className="space-y-3">
          {Object.entries(preferences).map(([category, enabled]) => {
            const categoryKey = category as FacilityCategory;
            const config = FACILITY_CONFIGS[categoryKey];
            const count = facilityCountByCategory[categoryKey] || 0;
            
            return (
              <div
                key={category}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                  enabled 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* 카테고리 정보 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white flex-shrink-0`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900">
                      {config.label}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {config.description}
                    </p>
                  </div>
                </div>

                {/* 시설 수와 토글 */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge 
                    variant={enabled ? "default" : "outline"}
                    className="text-xs"
                  >
                    {count}개
                  </Badge>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => onToggleCategory(categoryKey)}
                    disabled={count === 0}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 도움말 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 leading-relaxed">
            💡 원하는 시설 유형을 선택하면 지도에서 해당 마커만 표시됩니다. 
            실시간으로 지도가 업데이트되어 더 쉽게 찾을 수 있어요.
          </p>
        </div>

        {/* 통계 정보 */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">전체</p>
              <p className="text-sm font-medium">
                {Object.values(facilityCountByCategory).reduce((sum, count) => sum + count, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">표시중</p>
              <p className="text-sm font-medium text-blue-600">
                {Object.entries(preferences)
                  .filter(([_, enabled]) => enabled)
                  .reduce((sum, [category]) => 
                    sum + (facilityCountByCategory[category as FacilityCategory] || 0), 0
                  )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">숨김</p>
              <p className="text-sm font-medium text-gray-400">
                {Object.entries(preferences)
                  .filter(([_, enabled]) => !enabled)
                  .reduce((sum, [category]) => 
                    sum + (facilityCountByCategory[category as FacilityCategory] || 0), 0
                  )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};