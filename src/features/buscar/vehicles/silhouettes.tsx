import React from 'react';
import { G, Line, Path } from 'react-native-svg';

import {
  BodyPath,
  DoorLine,
  Glass,
  Handle,
  LOWER_BODY_WITH_ARCHES,
  type SilhouetteProps,
  Wheels,
} from './VehicleParts';

/**
 * One silhouette per body type, in the visual style of the original default car.
 * Front of the vehicle faces right (headlight), rear faces left (taillight).
 */

/** The original illustration, unchanged (used when bodyType is unknown). */
export function DefaultCar({ paint }: SilhouetteProps) {
  return (
    <G>
      <BodyPath
        paint={paint}
        d="M 38 108 L 32 98 C 30 92, 34 84, 42 82 L 65 80 L 92 56 C 98 50, 108 48, 120 48 L 182 48 C 192 48, 202 54, 210 64 L 228 80 L 242 82 C 248 83, 252 88, 252 94 L 248 108 C 246 110, 240 110, 236 108 C 230 96, 218 88, 204 88 C 190 88, 178 96, 172 108 L 108 108 C 102 96, 90 88, 76 88 C 62 88, 50 96, 44 108 Z"
      />
      <Glass paint={paint} d="M 122 53 L 99 78 L 142 78 L 142 53 Z" />
      <Glass paint={paint} d="M 148 53 L 148 78 L 218 78 L 202 56 C 196 54, 190 53, 184 53 Z" />
      <DoorLine paint={paint} x={145} y1={53} y2={106} />
      <Handle paint={paint} x={152} y={84} />
      <Path d="M 242 84 L 250 86 L 247 92 L 240 90 Z" fill={paint.headlight} />
      <Path d="M 33 86 L 39 85 L 39 92 L 32 91 Z" fill={paint.taillight} />
      <Wheels paint={paint} />
    </G>
  );
}

/** Three-box sedan: long hood, cabin, separate trunk deck. */
export function SedanCar({ paint }: SilhouetteProps) {
  return (
    <G>
      <BodyPath
        paint={paint}
        d={`M 38 108 L 32 98 C 30 90, 34 82, 42 79 L 72 76 L 98 54 C 103 49, 110 47, 120 47 L 170 47 C 181 47, 190 51, 198 58 L 220 79 L 242 82 C 248 83, 252 88, 252 94 ${LOWER_BODY_WITH_ARCHES}`}
      />
      <Glass paint={paint} d="M 121 52 L 102 74 L 142 74 L 142 52 Z" />
      <Glass paint={paint} d="M 148 52 L 148 74 L 210 74 L 194 57 C 188 53, 182 52, 176 52 Z" />
      <DoorLine paint={paint} x={145} y1={52} y2={106} />
      <Handle paint={paint} x={152} y={82} />
      <Path d="M 242 84 L 250 86 L 247 92 L 240 90 Z" fill={paint.headlight} />
      <Path d="M 33 85 L 40 84 L 40 91 L 32 90 Z" fill={paint.taillight} />
      <Wheels paint={paint} />
    </G>
  );
}

/** Compact hatchback: short rear overhang and steep rear hatch. */
export function HatchbackCar({ paint }: SilhouetteProps) {
  return (
    <G>
      <BodyPath
        paint={paint}
        d={`M 40 108 L 36 98 C 34 90, 36 84, 42 80 L 62 54 C 66 49, 72 47, 80 47 L 160 47 C 172 47, 182 52, 190 60 L 214 80 L 240 83 C 247 84, 252 89, 252 95 ${LOWER_BODY_WITH_ARCHES}`}
      />
      <Glass paint={paint} d="M 81 52 L 65 75 L 122 75 L 122 52 Z" />
      <Glass paint={paint} d="M 128 52 L 128 75 L 206 75 L 186 57 C 180 53, 172 52, 164 52 Z" />
      <DoorLine paint={paint} x={125} y1={52} y2={106} />
      <Handle paint={paint} x={132} y={83} />
      <Path d="M 241 85 L 249 87 L 246 93 L 239 91 Z" fill={paint.headlight} />
      <Path d="M 37 84 L 43 83 L 42 91 L 36 90 Z" fill={paint.taillight} />
      <Wheels paint={paint} />
    </G>
  );
}

/** SUV / crossover: tall, boxy greenhouse and roof rails. */
export function SuvCar({ paint }: SilhouetteProps) {
  return (
    <G>
      <BodyPath
        paint={paint}
        d={`M 36 108 L 32 96 C 30 86, 32 78, 36 74 L 44 44 C 46 38, 50 36, 58 36 L 176 36 C 186 36, 192 40, 198 46 L 222 72 L 244 78 C 249 80, 253 86, 252 94 ${LOWER_BODY_WITH_ARCHES}`}
      />
      <Line
        x1="64"
        y1="33"
        x2="172"
        y2="33"
        stroke={paint.trim}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Glass paint={paint} d="M 60 42 L 53 68 L 116 68 L 116 42 Z" />
      <Glass paint={paint} d="M 122 42 L 122 68 L 214 68 L 194 46 C 190 43, 184 42, 178 42 Z" />
      <DoorLine paint={paint} x={119} y1={42} y2={106} />
      <Handle paint={paint} x={128} y={78} />
      <Path d="M 242 80 L 250 83 L 248 90 L 240 88 Z" fill={paint.headlight} />
      <Path d="M 33 80 L 39 79 L 39 88 L 32 87 Z" fill={paint.taillight} />
      <Wheels paint={paint} />
    </G>
  );
}

/** Pickup: cab over the front axle and an open cargo bed at the rear. */
export function PickupCar({ paint }: SilhouetteProps) {
  return (
    <G>
      <BodyPath
        paint={paint}
        d={`M 34 108 L 30 96 C 29 88, 31 80, 36 78 L 120 78 L 124 46 C 125 41, 128 40, 134 40 L 176 40 C 186 40, 192 44, 198 50 L 222 74 L 244 79 C 249 81, 253 87, 252 94 ${LOWER_BODY_WITH_ARCHES}`}
      />
      <Line x1="40" y1="84" x2="116" y2="84" stroke={paint.detail} strokeWidth="1.5" />
      <Glass paint={paint} d="M 132 46 L 130 70 L 214 70 L 196 50 C 192 47, 186 46, 180 46 Z" />
      <DoorLine paint={paint} x={124} y1={78} y2={106} />
      <Handle paint={paint} x={136} y={80} />
      <Path d="M 242 81 L 250 84 L 248 91 L 240 89 Z" fill={paint.headlight} />
      <Path d="M 31 84 L 37 83 L 37 92 L 30 91 Z" fill={paint.taillight} />
      <Wheels paint={paint} />
    </G>
  );
}

/** Van / minivan: tall box body with three side windows and a sliding-door line. */
export function VanCar({ paint }: SilhouetteProps) {
  return (
    <G>
      <BodyPath
        paint={paint}
        d={`M 34 108 L 30 96 L 30 40 C 30 32, 36 28, 44 28 L 186 28 C 196 28, 202 32, 208 40 L 232 74 L 244 78 C 249 80, 253 86, 252 94 ${LOWER_BODY_WITH_ARCHES}`}
      />
      <Glass paint={paint} d="M 42 36 L 42 66 L 100 66 L 100 36 Z" />
      <Glass paint={paint} d="M 108 36 L 108 66 L 160 66 L 160 36 Z" />
      <Glass paint={paint} d="M 168 36 L 168 66 L 222 66 L 202 40 C 199 37, 195 36, 190 36 Z" />
      <DoorLine paint={paint} x={104} y1={36} y2={106} />
      <DoorLine paint={paint} x={164} y1={36} y2={106} />
      <Handle paint={paint} x={112} y={76} />
      <Path d="M 242 80 L 250 83 L 248 90 L 240 88 Z" fill={paint.headlight} />
      <Path d="M 31 76 L 37 76 L 37 88 L 31 88 Z" fill={paint.taillight} />
      <Wheels paint={paint} />
    </G>
  );
}
