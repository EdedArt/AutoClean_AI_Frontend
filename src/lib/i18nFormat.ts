import type { TFunction } from 'i18next';

import { ApiError } from '@/api/client';
import type { VehicleBodyType } from '@/api/plates';
import { mapVehicleColor, normalizeText } from '@/lib/vehicleColor';

/**
 * Helpers that turn backend data (codes, numbers) into localized text.
 * Display strings coming from the database are only used as a fallback
 * when a translation key is missing.
 */

interface PackageLike {
  codigo?: string | null;
  nombre: string;
  descripcion: string;
}

/** Localized package name, keyed by the stable package `codigo` (falls back to the DB name). */
export function getPackageName(t: TFunction, pkg: PackageLike): string {
  if (!pkg.codigo) {
    return pkg.nombre;
  }
  return t(`packages.${pkg.codigo}.name`, { defaultValue: pkg.nombre });
}

/** Localized package description, keyed by `codigo` (falls back to the DB description). */
export function getPackageDescription(t: TFunction, pkg: PackageLike): string {
  if (!pkg.codigo) {
    return pkg.descripcion;
  }
  return t(`packages.${pkg.codigo}.description`, { defaultValue: pkg.descripcion });
}

/** "45 min", "2 h", "1 h 5 min" — localized. */
export function formatEtaDuration(t: TFunction, minutes: number): string {
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) {
    return t('eta.minutes', { minutes: mins });
  }
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? t('eta.hours', { hours }) : t('eta.hoursMinutes', { hours, minutes: rest });
}

interface EtaSource {
  fase?: string;
  faseActual?: string;
  etaMinutes?: number | null;
  listoParaLavar?: boolean;
  etaLabel?: string | null;
}

/**
 * Localized ETA label built from structured fields (mirrors backend eta.service rules).
 * Falls back to the backend `etaLabel` text when minutes are unavailable.
 */
export function getEtaLabel(t: TFunction, source: EtaSource): string | null {
  const phase = source.faseActual ?? source.fase;
  if (phase === 'LISTO') {
    return t('eta.readyForDelivery');
  }
  if (source.etaMinutes == null) {
    return source.etaLabel || null;
  }
  const duration = formatEtaDuration(t, source.etaMinutes);
  if (phase === 'PENDIENTE' && !source.listoParaLavar) {
    return t('eta.pendingApprox', { duration });
  }
  return t('eta.approx', { duration });
}

/** Backend default for vehicles registered without a color. */
const UNSPECIFIED_COLOR = 'sin especificar';

/**
 * Display name of a typed vehicle color: translated when the color mapper fully recognizes it
 * ("blanca" -> "White" / "Blanco", "gris plata" -> "Silver"), otherwise exactly as typed.
 */
export function getVehicleColorName(t: TFunction, color: string): string {
  if (normalizeText(color) === UNSPECIFIED_COLOR) {
    return t('vehicle.colorUnspecified');
  }
  const match = mapVehicleColor(color);
  if (match.exact && match.key) {
    return t(`vehicle.colors.${match.key}`, { defaultValue: color });
  }
  return color.trim();
}

/** Localized body type name, or null when unknown. */
export function getBodyTypeName(
  t: TFunction,
  bodyType: VehicleBodyType | null | undefined,
): string | null {
  return bodyType ? t(`vehicle.bodyTypes.${bodyType}`) : null;
}

interface VehicleLike {
  marca: string;
  modelo: string;
  color: string;
}

/** "Brand Model · Color" with the color translated when recognized. */
export function getVehicleSummary(t: TFunction, vehicle: VehicleLike): string {
  return t('vehicle.summary', {
    brand: vehicle.marca.trim(),
    model: vehicle.modelo.trim(),
    color: getVehicleColorName(t, vehicle.color),
  });
}

/** Milliseconds -> "m:ss" (e.g. 80000 -> "1:20"). */
export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Localized message for an API/client error, keyed by its error code.
 * Never shows raw backend text (which is English); uses `fallbackKey` for unknown codes.
 */
export function getApiErrorMessage(t: TFunction, err: unknown, fallbackKey: string): string {
  const fallback = t(fallbackKey);
  if (err instanceof ApiError && err.code) {
    return t(`apiErrors.${err.code}`, { defaultValue: fallback });
  }
  return fallback;
}
