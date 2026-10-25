import { WashPhaseCode } from '@/theme/tokens';

export type PhaseIconName = 'Hourglass' | 'Droplets' | 'Sparkles' | 'Wind' | 'CircleCheck';

export interface WashPhase {
  code: WashPhaseCode;
  label: string;
  percent: number;
  icon: PhaseIconName;
}

export const WASH_PHASES: readonly WashPhase[] = [
  {
    code: 'PENDIENTE',
    label: 'En espera',
    percent: 10,
    icon: 'Hourglass',
  },
  {
    code: 'REMOJO',
    label: 'Remojo',
    percent: 30,
    icon: 'Droplets',
  },
  {
    code: 'LAVADO',
    label: 'Enjabonado',
    percent: 55,
    icon: 'Sparkles',
  },
  {
    code: 'SECADO',
    label: 'Secado',
    percent: 80,
    icon: 'Wind',
  },
  {
    code: 'LISTO',
    label: 'Listo',
    percent: 100,
    icon: 'CircleCheck',
  },
] as const;

export function getPhase(code: string): WashPhase | undefined {
  return WASH_PHASES.find((phase) => phase.code === code);
}

export function getPhaseIndex(code: string): number {
  return WASH_PHASES.findIndex((phase) => phase.code === code);
}
