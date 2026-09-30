/**
 * Longdo Map Integration Types
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LongdoAddressResult {
  subdistrict?: string;
  district?: string;
  province?: string;
  postcode?: string;
  country?: string;
  aoi?: string;
  road?: string;
  road_th?: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  raw?: any;
}

export interface LongdoPlaceItem {
  id: string;
  name: string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postcode?: string;
  phone?: string;
  website?: string;
  lat: number;
  lng: number;
  category?: string;
  distanceMeters?: number;
}

export interface LongdoPlaceSearchResult {
  keyword: string;
  total: number;
  places: LongdoPlaceItem[];
}

export interface LongdoSuggestItem {
  word: string;
  category?: string;
  lat?: number;
  lng?: number;
}

export interface RouteGuideStep {
  instruction: string;
  turn?: number;
  distanceMeters: number;
  durationSeconds: number;
}

export interface LongdoRouteResult {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  polyline: LatLng[];
  steps: RouteGuideStep[];
  mode: string;
  forecastMinutes?: number;
  trafficDelaySeconds?: number;
}

export interface DistanceMatrixItem {
  originIndex: number;
  destinationIndex: number;
  distanceMeters: number;
  durationSeconds: number;
}

export interface DistanceMatrixResult {
  origins: LatLng[];
  destinations: LatLng[];
  matrix: DistanceMatrixItem[][];
}

export interface CoverageAreaResult {
  center: LatLng;
  mode: "time" | "distance";
  value: number; // minutes or meters
  polygon: LatLng[];
}

export interface RoutePlanningInput {
  origin: LatLng;
  destinations: LatLng[];
  mode?: string;
}

export interface RoutePlanningResult {
  originalOrder: number[];
  optimizedOrder: number[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  savedDistanceKm: number;
  savedDurationMinutes: number;
  waypoints: LatLng[];
  routes: LongdoRouteResult[];
}

export type LongdoCategoryCode =
  | "hospital"
  | "police"
  | "fuel"
  | "school"
  | "restaurant"
  | "accommodation"
  | "atm"
  | "parking"
  | "warehouse"
  | "industrial";

export interface QuotaTrackerStatus {
  provider: "Longdo Map";
  enabled: boolean;
  browserKeyConfigured: boolean;
  serverKeyConfigured: boolean;
  dailyUsageCount: number;
  warningThreshold: number;
  lastCheckedAt: string;
  errorsCount: number;
}
