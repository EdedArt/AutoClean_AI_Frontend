import { WashPhaseCode } from '@/theme/tokens';

export type PhaseIconName = 'Hourglass' | 'Droplets' | 'Sparkles' | 'Wind' | 'CircleCheck';

export interface WashPhase {
  code: WashPhaseCode;
  key: WashPhaseCode;
  percent: number;
  icon: PhaseIconName;
  order: number;
}

export const WASH_PHASES: readonly WashPhase[] = [
  {
    code: 'PENDIENTE',
    key: 'PENDIENTE',
    percent: 10,
    icon: 'Hourglass',
    order: 1,
  },
  {
    code: 'REMOJO',
    key: 'REMOJO',
    percent: 30,
    icon: 'Droplets',
    order: 2,
  },
  {
    code: 'LAVADO',
    key: 'LAVADO',
    percent: 55,
    icon: 'Sparkles',
    order: 4,
  },
  {
    code: 'SECADO',
    key: 'SECADO',
    percent: 80,
    icon: 'Wind',
    order: 5,
  },
  {
    code: 'POLICHADO',
    key: 'POLICHADO',
    percent: 85,
    icon: 'Sparkles',
    order: 6,
  },
  {
    code: 'LISTO',
    key: 'LISTO',
    percent: 100,
    icon: 'CircleCheck',
    order: 7,
  },
] as const;

export const WASH_PHASES_WITHOUT_POLICHADO: readonly WashPhase[] = WASH_PHASES.filter(
  (phase) => phase.code !== 'POLICHADO',
);

export function getPhasesForOrder(incluyePolichado = false): readonly WashPhase[] {
  return incluyePolichado ? WASH_PHASES : WASH_PHASES_WITHOUT_POLICHADO;
}

export function getPhase(code: string): WashPhase | undefined {
  return WASH_PHASES.find((phase) => phase.code === code);
}

export function getPhaseIndex(code: string, incluyePolichado?: boolean): number {
  const shouldIncludePolichado = Boolean(incluyePolichado) || code === 'POLICHADO';
  const list = getPhasesForOrder(shouldIncludePolichado);
  return list.findIndex((phase) => phase.code === code);
}
