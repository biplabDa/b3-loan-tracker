import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

export default function FormInput({ label, ...props }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#7c8da7" style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 12
  },
  label: {
    marginBottom: 6,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.textPrimary
  }
});
