import { LatLng } from "./haversine";
import { calculateRouteLongdo } from "../longdo/route";
import { LongdoRouteResult } from "../longdo/types";

export type RouteResult = LongdoRouteResult;

export async function calculateRoute(
  origin: LatLng,
  destination: LatLng,
  options?: {
    mode?: "t" | "m" | "w" | "p";
    routeType?: 0 | 1 | 25;
  }
): Promise<RouteResult> {
  return calculateRouteLongdo(origin, destination, options);
}
