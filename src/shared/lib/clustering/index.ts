/**
 * @fileoverview 시설 클러스터링 유틸리티
 * @description 지도 상의 시설들을 효율적으로 클러스터링하는 알고리즘
 * @author Seoul Fit Team
 * @since 2.0.0
 */

import type { Facility, FacilityCategory, ClusteredFacility, Position } from '@/lib/types';

/**
 * 클러스터링 옵션
 */
export interface ClusteringOptions {
  /** 클러스터링 거리 임계값 (도 단위) */
  distanceThreshold?: number;
  /** 최소 클러스터 크기 */
  minClusterSize?: number;
  /** 거리 계산 정밀도 (소수점 자리수) */
  precision?: number;
}

/**
 * 두 위치 간의 거리 계산 (하버사인 공식)
 */
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLng = toRad(pos2.lng - pos1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 거리 (km)
};

/**
 * 도를 라디안으로 변환
 */
const toRad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * 위치 키 생성 (그리드 기반 클러스터링용)
 */
export const generateLocationKey = (position: Position, precision: number = 6): string => {
  return `${position.lat.toFixed(precision)},${position.lng.toFixed(precision)}`;
};

/**
 * 카테고리별 개수 계산
 */
export const countByCategory = (facilities: Facility[]): Record<FacilityCategory, number> => {
  const counts = {} as Record<FacilityCategory, number>;
  
  facilities.forEach(facility => {
    counts[facility.category] = (counts[facility.category] || 0) + 1;
  });
  
  return counts;
};

/**
 * 주요 카테고리 결정
 */
export const determinePrimaryCategory = (
  categoryCounts: Record<FacilityCategory, number>
): FacilityCategory => {
  return Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)[0][0] as FacilityCategory;
};

/**
 * 클러스터 생성
 */
export const createCluster = (
  facilities: Facility[],
  clusterId: string
): ClusteredFacility => {
  const categoryCounts = countByCategory(facilities);
  const primaryCategory = determinePrimaryCategory(categoryCounts);
  
  // 클러스터 중심점 계산 (평균 위치)
  const centerPosition = calculateCenterPosition(facilities.map(f => f.position));
  
  return {
    id: clusterId,
    position: centerPosition,
    facilities,
    count: facilities.length,
    radius: 0.1, // 기본 반경 설정
    primaryCategory,
  };
};

/**
 * 중심점 계산
 */
export const calculateCenterPosition = (positions: Position[]): Position => {
  if (positions.length === 0) {
    return { lat: 0, lng: 0 };
  }
  
  const sum = positions.reduce(
    (acc, pos) => ({
      lat: acc.lat + pos.lat,
      lng: acc.lng + pos.lng,
    }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / positions.length,
    lng: sum.lng / positions.length,
  };
};

/**
 * 그리드 기반 클러스터링 알고리즘
 */
export const gridBasedClustering = (
  facilities: Facility[],
  options: ClusteringOptions = {}
): { clusters: ClusteredFacility[]; singles: Facility[] } => {
  const {
    precision = 6,
    minClusterSize = 2,
  } = options;
  
  // 위치별로 시설 그룹화
  const locationGroups = new Map<string, Facility[]>();
  
  facilities.forEach(facility => {
    const key = generateLocationKey(facility.position, precision);
    if (!locationGroups.has(key)) {
      locationGroups.set(key, []);
    }
    locationGroups.get(key)!.push(facility);
  });
  
  const clusters: ClusteredFacility[] = [];
  const singles: Facility[] = [];
  
  // 그룹을 클러스터 또는 단일 시설로 분류
  locationGroups.forEach((groupFacilities, locationKey) => {
    if (groupFacilities.length >= minClusterSize) {
      const cluster = createCluster(
        groupFacilities,
        `cluster-${locationKey}`
      );
      clusters.push(cluster);
    } else {
      singles.push(...groupFacilities);
    }
  });
  
  return { clusters, singles };
};

/**
 * 거리 기반 클러스터링 알고리즘 (DBSCAN 변형)
 */
export const distanceBasedClustering = (
  facilities: Facility[],
  options: ClusteringOptions = {}
): { clusters: ClusteredFacility[]; singles: Facility[] } => {
  const {
    distanceThreshold = 0.1, // 100m (약 0.001도)
    minClusterSize = 2,
  } = options;
  
  const visited = new Set<string>();
  const clustered = new Set<string>();
  const clusters: ClusteredFacility[] = [];
  const singles: Facility[] = [];
  
  facilities.forEach(facility => {
    if (visited.has(facility.id)) return;
    
    visited.add(facility.id);
    const neighbors = findNeighbors(facility, facilities, distanceThreshold);
    
    if (neighbors.length < minClusterSize - 1) {
      singles.push(facility);
    } else {
      const clusterFacilities = expandCluster(
        facility,
        neighbors,
        facilities,
        distanceThreshold,
        visited,
        clustered
      );
      
      if (clusterFacilities.length >= minClusterSize) {
        const cluster = createCluster(
          clusterFacilities,
          `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        );
        clusters.push(cluster);
      }
    }
  });
  
  // 클러스터에 포함되지 않은 시설 추가
  facilities.forEach(facility => {
    if (!clustered.has(facility.id) && !singles.some(s => s.id === facility.id)) {
      singles.push(facility);
    }
  });
  
  return { clusters, singles };
};

/**
 * 이웃 시설 찾기
 */
const findNeighbors = (
  facility: Facility,
  allFacilities: Facility[],
  threshold: number
): Facility[] => {
  return allFacilities.filter(other => {
    if (other.id === facility.id) return false;
    const distance = calculateDistance(facility.position, other.position);
    return distance <= threshold;
  });
};

/**
 * 클러스터 확장
 */
const expandCluster = (
  seed: Facility,
  neighbors: Facility[],
  allFacilities: Facility[],
  threshold: number,
  visited: Set<string>,
  clustered: Set<string>
): Facility[] => {
  const cluster = [seed];
  clustered.add(seed.id);
  
  const queue = [...neighbors];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (!visited.has(current.id)) {
      visited.add(current.id);
      const currentNeighbors = findNeighbors(current, allFacilities, threshold);
      
      if (currentNeighbors.length >= 1) {
        queue.push(...currentNeighbors.filter(n => !visited.has(n.id)));
      }
    }
    
    if (!clustered.has(current.id)) {
      clustered.add(current.id);
      cluster.push(current);
    }
  }
  
  return cluster;
};

/**
 * 줌 레벨에 따른 동적 클러스터링
 */
export const dynamicClustering = (
  facilities: Facility[],
  zoomLevel: number,
  options: ClusteringOptions = {}
): { clusters: ClusteredFacility[]; singles: Facility[] } => {
  // 줌 레벨에 따라 클러스터링 정밀도 조정
  const precision = Math.max(2, Math.min(6, zoomLevel - 8));
  
  return gridBasedClustering(facilities, {
    ...options,
    precision,
  });
};

/**
 * 클러스터 병합
 */
export const mergeClusters = (
  clusters: ClusteredFacility[],
  threshold: number = 0.05
): ClusteredFacility[] => {
  const merged: ClusteredFacility[] = [];
  const used = new Set<string>();
  
  clusters.forEach(cluster => {
    if (used.has(cluster.id)) return;
    
    const nearbyClusters = clusters.filter(other => {
      if (other.id === cluster.id || used.has(other.id)) return false;
      const distance = calculateDistance(cluster.position, other.position);
      return distance <= threshold;
    });
    
    if (nearbyClusters.length > 0) {
      const allFacilities = [
        ...cluster.facilities,
        ...nearbyClusters.flatMap(c => c.facilities),
      ];
      
      const mergedCluster = createCluster(
        allFacilities,
        `merged-${cluster.id}`
      );
      
      merged.push(mergedCluster);
      used.add(cluster.id);
      nearbyClusters.forEach(c => used.add(c.id));
    } else {
      merged.push(cluster);
      used.add(cluster.id);
    }
  });
  
  return merged;
};

/**
 * 클러스터링 성능 메트릭
 */
export interface ClusteringMetrics {
  totalFacilities: number;
  totalClusters: number;
  totalSingles: number;
  averageClusterSize: number;
  largestClusterSize: number;
  processingTime: number;
}

/**
 * 클러스터링 성능 측정
 */
export const measureClusteringPerformance = (
  facilities: Facility[],
  clusteringFn: typeof gridBasedClustering,
  options?: ClusteringOptions
): ClusteringMetrics & { result: ReturnType<typeof gridBasedClustering> } => {
  const startTime = performance.now();
  const result = clusteringFn(facilities, options);
  const endTime = performance.now();
  
  const clusterSizes = result.clusters.map(c => c.count);
  
  return {
    totalFacilities: facilities.length,
    totalClusters: result.clusters.length,
    totalSingles: result.singles.length,
    averageClusterSize: clusterSizes.length > 0
      ? clusterSizes.reduce((a, b) => a + b, 0) / clusterSizes.length
      : 0,
    largestClusterSize: clusterSizes.length > 0
      ? Math.max(...clusterSizes)
      : 0,
    processingTime: endTime - startTime,
    result,
  };
};