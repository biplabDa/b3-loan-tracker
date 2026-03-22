import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { colors } from '../theme/colors';

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateString(value) {
  if (!value || typeof value !== 'string') {
    return new Date();
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

export function todayDateString() {
  return formatDate(new Date());
}

export default function DatePickerField({ label, value, onChangeText }) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(parseDateString(value));
  const selectedDate = useMemo(() => parseDateString(value), [value]);

  const openPicker = () => {
    setPickerDate(selectedDate);
    setShowPicker(true);
  };

  const onConfirm = (date) => {
    setShowPicker(false);
    onChangeText(formatDate(date));
  };

  const onCancel = () => {
    setShowPicker(false);
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={openPicker}>
        <Text style={styles.valueText}>{value || 'Select date'}</Text>
      </Pressable>

      {showPicker ? (
        <DatePicker
          modal
          open={showPicker}
          date={pickerDate}
          mode="date"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ) : null}
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
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  valueText: {
    color: colors.textPrimary
  },
  pickerWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  doneButton: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center'
  },
  doneText: {
    color: colors.primary,
    fontWeight: '700'
  }
});
