import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const toneStyles = {
  neutral: {
    chipBg: '#e8eef6',
    chipText: '#1f3b5a'
  },
  success: {
    chipBg: '#e6f5ee',
    chipText: '#145a3c'
  },
  warning: {
    chipBg: '#fff1de',
    chipText: '#8c4a00'
  },
  danger: {
    chipBg: '#fde8e8',
    chipText: '#8a1c1c'
  }
};

export default function StatCard({ title, value, helper, tone = 'neutral' }) {
  const toneStyle = toneStyles[tone] || toneStyles.neutral;

  return (
    <View style={styles.card}>
      <View style={[styles.chip, { backgroundColor: toneStyle.chipBg }]}> 
        <Text style={[styles.chipText, { color: toneStyle.chipText }]}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700'
  },
  value: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700'
  },
  helper: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 12
  }
});
