import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { colors } from '../theme/colors';

function money(value) {
  return `₹ ${Number(value || 0).toFixed(2)}`;
}

export default function OverdueScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOverdues = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/loans/overdue');
      setData(response.data || []);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Unable to fetch overdue loans');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOverdues();
    }, [fetchOverdues])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Overdue Customers</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOverdues} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.customer_name}</Text>
            <Text style={styles.text}>Phone: {item.customer_phone}</Text>
            <Text style={styles.text}>Balance: {money(item.balance)}</Text>
            <Text style={[styles.text, styles.overdue]}>Overdue Days: {item.overdue_days}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No overdue customers found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 14
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10
  },
  card: {
    backgroundColor: '#fff7f7',
    borderWidth: 1,
    borderColor: '#ffd9d9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  text: {
    marginTop: 2,
    color: colors.textSecondary
  },
  overdue: {
    color: colors.danger,
    fontWeight: '700'
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.textSecondary
  }
});
