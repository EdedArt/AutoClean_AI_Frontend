import React from 'react';

import { DefaultCar, HatchbackCar, PickupCar, SedanCar, SuvCar, VanCar } from './silhouettes';
import type { SilhouetteProps, VehiclePaint } from './VehicleParts';
import type { VehicleBodyType } from '@/api/plates';
import { contrastRatio, relativeLuminance } from '@/lib/vehicleColor';
import type { ColorPalette } from '@/theme/tokens';

export { VEHICLE_VIEWBOX } from './VehicleParts';
export type { VehiclePaint } from './VehicleParts';

const SILHOUETTES: Record<VehicleBodyType, (props: SilhouetteProps) => React.JSX.Element> = {
  SEDAN: SedanCar,
  HATCHBACK: HatchbackCar,
  SUV: SuvCar,
  PICKUP: PickupCar,
  VAN: VanCar,
};

export function VehicleSilhouette({
  bodyType,
  paint,
}: {
  bodyType: VehicleBodyType | null | undefined;
  paint: VehiclePaint;
}) {
  const Silhouette = (bodyType && SILHOUETTES[bodyType]) || DefaultCar;
  return <Silhouette paint={paint} />;
}

/** Below this contrast against the card, the body gets a stronger outline (white on light, black on dark). */
const MIN_BODY_CONTRAST = 1.8;
/** Below this contrast between glass and body, window edges get a stronger stroke. */
const MIN_GLASS_CONTRAST = 1.4;

interface BuildPaintOptions {
  colors: ColorPalette;
  /** Vehicle paint (#RRGGBB) or null to keep the original untinted look. */
  bodyHex: string | null;
  /** Phase accent outline (POLICHADO highlights the body edge). */
  highlightOutline?: string | null;
}

/**
 * Colors for a vehicle. Without `bodyHex` this returns exactly the original illustration colors.
 * With a paint color, outlines and small details adapt so white/light cars stay readable in light
 * mode and black/dark cars in dark mode; windows, wheels and lights stay neutral.
 */
export function buildVehiclePaint({
  colors,
  bodyHex,
  highlightOutline,
}: BuildPaintOptions): VehiclePaint {
  const neutral = {
    glass: colors.surfaceAlt,
    tire: colors.text,
    rim: colors.surfaceAlt,
    hub: colors.border,
    trim: colors.textMuted,
    headlight: colors.warning,
    taillight: colors.danger,
  };

  if (!bodyHex) {
    return {
      ...neutral,
      body: colors.primary,
      outline: highlightOutline ?? colors.border,
      outlineWidth: highlightOutline ? 2 : 1.5,
      glassStroke: colors.border,
      detail: colors.border,
      handle: colors.onPrimary,
    };
  }

  const lowContrast = contrastRatio(bodyHex, colors.surface) < MIN_BODY_CONTRAST;
  const glassLowContrast = contrastRatio(bodyHex, colors.surfaceAlt) < MIN_GLASS_CONTRAST;
  const lightBody = relativeLuminance(bodyHex) > 0.35;
  // Details drawn on the paint (door line, handle, rails) contrast with the paint itself
  const onBody = lightBody ? 'rgba(15, 23, 42, 0.45)' : 'rgba(241, 245, 249, 0.55)';

  return {
    ...neutral,
    body: bodyHex,
    outline: highlightOutline ?? (lowContrast ? colors.textMuted : colors.border),
    outlineWidth: highlightOutline || lowContrast ? 2 : 1.5,
    glassStroke: glassLowContrast || lowContrast ? colors.textMuted : colors.border,
    detail: onBody,
    handle: onBody,
  };
}
