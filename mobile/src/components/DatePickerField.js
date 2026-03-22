import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const selectedDate = useMemo(() => parseDateString(value), [value]);

  const onChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (date) {
      onChangeText(formatDate(date));
    }
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
        <Text style={styles.valueText}>{value || 'Select date'}</Text>
      </Pressable>

      {showPicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable style={styles.doneButton} onPress={() => setShowPicker(false)}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          ) : null}
        </View>
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
