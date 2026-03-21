import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FormInput from '../components/FormInput';
import client from '../api/client';
import { colors } from '../theme/colors';

export default function AddCustomerScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.post('/customers', { name, phone, address });
      setName('');
      setPhone('');
      setAddress('');
      Alert.alert('Success', 'Customer added successfully');
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.heading}>Add New Customer</Text>
        <FormInput label="Name" value={name} onChangeText={setName} />
        <FormInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <FormInput label="Address" value={address} onChangeText={setAddress} multiline numberOfLines={3} />

        <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Customer'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 14
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  }
});
