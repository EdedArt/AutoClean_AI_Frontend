import { WashPhaseCode } from '@/theme/tokens';

export type PhaseIconName = 'Hourglass' | 'Droplets' | 'Sparkles' | 'Wind' | 'CircleCheck';

export interface WashPhase {
  code: WashPhaseCode;
  key: WashPhaseCode;
  label: string;
  description: string;
  percent: number;
  icon: PhaseIconName;
  order: number;
}

export const WASH_PHASES: readonly WashPhase[] = [
  {
    code: 'PENDIENTE',
    key: 'PENDIENTE',
    label: 'En espera',
    description: 'Tu vehículo está en espera para iniciar el lavado',
    percent: 10,
    icon: 'Hourglass',
    order: 1,
  },
  {
    code: 'REMOJO',
    key: 'REMOJO',
    label: 'Remojo',
    description: 'Tu vehículo está en etapa de remojo inicial',
    percent: 30,
    icon: 'Droplets',
    order: 2,
  },
  {
    code: 'LAVADO',
    key: 'LAVADO',
    label: 'Enjabonado',
    description: 'Tu vehículo está siendo enjabonado y lavado',
    percent: 55,
    icon: 'Sparkles',
    order: 4,
  },
  {
    code: 'SECADO',
    key: 'SECADO',
    label: 'Secado',
    description: 'Tu vehículo está en proceso de secado',
    percent: 80,
    icon: 'Wind',
    order: 5,
  },
  {
    code: 'POLICHADO',
    key: 'POLICHADO',
    label: 'Polichando',
    description: 'Tu vehículo está siendo polichado',
    percent: 85,
    icon: 'Sparkles',
    order: 6,
  },
  {
    code: 'LISTO',
    key: 'LISTO',
    label: 'Listo',
    description: 'Tu vehículo está listo para entrega',
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
