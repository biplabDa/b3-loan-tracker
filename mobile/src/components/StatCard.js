import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function StatCard({ title, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
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
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8
  },
  value: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700'
  }
});
