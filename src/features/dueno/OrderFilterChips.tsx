import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { type ServiceOrder } from '@/api/orders';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export type OrderFilterType = 'ALL' | 'IN_BAY' | 'WAITING';

export function isOrderWaiting(order: ServiceOrder): boolean {
  return order.faseActual === 'PENDIENTE' || !order.listoParaLavar;
}

export function filterActiveOrders(
  orders: ServiceOrder[],
  filter: OrderFilterType,
): ServiceOrder[] {
  if (filter === 'WAITING') {
    return orders.filter((order) => isOrderWaiting(order));
  }
  if (filter === 'IN_BAY') {
    return orders.filter((order) => !isOrderWaiting(order));
  }
  return orders;
}

export interface OrderFilterChipsProps {
  selected: OrderFilterType;
  onSelect: (filter: OrderFilterType) => void;
  orders: ServiceOrder[];
}

export function OrderFilterChips({ selected, onSelect, orders }: OrderFilterChipsProps) {
  const { colors } = useTheme();

  const waitingCount = orders.filter((o) => isOrderWaiting(o)).length;
  const inBayCount = orders.length - waitingCount;

  const chips: { key: OrderFilterType; label: string; count: number }[] = [
    { key: 'ALL', label: 'Todos', count: orders.length },
    { key: 'IN_BAY', label: 'En bahía', count: inBayCount },
    { key: 'WAITING', label: 'En espera', count: waitingCount },
  ];

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {chips.map((chip) => {
        const isSelected = selected === chip.key;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onSelect(chip.key)}
            accessible
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Filtro ${chip.label}: ${chip.count} órdenes`}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <AppText
              variant="caption"
              weight={isSelected ? 'semiBold' : 'medium'}
              style={{ color: isSelected ? colors.onPrimary : colors.text }}
            >
              {chip.label} ({chip.count})
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginBottom: spacing[16],
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
