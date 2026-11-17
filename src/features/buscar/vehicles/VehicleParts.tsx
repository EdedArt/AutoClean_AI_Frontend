import React from 'react';
import { Circle, G, Line, Path, Rect } from 'react-native-svg';

/**
 * Shared geometry for every vehicle silhouette.
 * All bodies are drawn in the same 280x140 viewBox, sit on the same ground line (y=126) and use
 * the same wheel centers, so the phase overlays in CarIllustration stay aligned for any body type.
 */
export const VEHICLE_VIEWBOX = '0 0 280 140';
export const REAR_WHEEL_CX = 76;
export const FRONT_WHEEL_CX = 204;
export const WHEEL_CY = 106;

/** Lower body from the front bumper through both wheel arches back to the rear bumper. */
export const LOWER_BODY_WITH_ARCHES =
  'L 248 108 C 246 110, 240 110, 236 108 C 230 96, 218 88, 204 88 C 190 88, 178 96, 172 108 ' +
  'L 108 108 C 102 96, 90 88, 76 88 C 62 88, 50 96, 44 108 Z';

/** Colors for one rendered vehicle. Only `body` takes the vehicle paint; the rest stay neutral. */
export interface VehiclePaint {
  body: string;
  outline: string;
  outlineWidth: number;
  glass: string;
  glassStroke: string;
  /** Lines drawn on the paint (door lines, bed edge): contrast with the paint itself. */
  detail: string;
  /** Neutral trim drawn off the body (roof rails): contrast with the card background. */
  trim: string;
  handle: string;
  tire: string;
  rim: string;
  hub: string;
  headlight: string;
  taillight: string;
}

export interface SilhouetteProps {
  paint: VehiclePaint;
}

export function BodyPath({ d, paint }: { d: string; paint: VehiclePaint }) {
  return <Path d={d} fill={paint.body} stroke={paint.outline} strokeWidth={paint.outlineWidth} />;
}

export function Glass({ d, paint }: { d: string; paint: VehiclePaint }) {
  return <Path d={d} fill={paint.glass} stroke={paint.glassStroke} strokeWidth="1" />;
}

export function DoorLine({
  x,
  y1,
  y2,
  paint,
}: {
  x: number;
  y1: number;
  y2: number;
  paint: VehiclePaint;
}) {
  return <Line x1={x} y1={y1} x2={x} y2={y2} stroke={paint.detail} strokeWidth="1.5" />;
}

export function Handle({ x, y, paint }: { x: number; y: number; paint: VehiclePaint }) {
  return <Rect x={x} y={y} width="12" height="3" rx="1.5" fill={paint.handle} />;
}

export function Wheels({ paint }: SilhouetteProps) {
  return (
    <G>
      {[FRONT_WHEEL_CX, REAR_WHEEL_CX].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={WHEEL_CY} r="18" fill={paint.tire} />
          <Circle cx={cx} cy={WHEEL_CY} r="11" fill={paint.rim} />
          <Circle cx={cx} cy={WHEEL_CY} r="5" fill={paint.hub} />
        </G>
      ))}
    </G>
  );
}
