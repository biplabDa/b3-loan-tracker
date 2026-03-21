import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

function formatCurrency(value) {
  return `₹ ${Number(value || 0).toFixed(2)}`;
}

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/dashboard');
      setStats(response.data);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} />}
    >
      <View style={styles.row}>
        <Text style={styles.heading}>Business Snapshot</Text>
        <Pressable onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <StatCard title="Total Customers" value={stats ? String(stats.total_customers) : '-'} />
      <StatCard title="Total Loan Amount" value={stats ? formatCurrency(stats.total_loan_amount) : '-'} />
      <StatCard title="Total Collected" value={stats ? formatCurrency(stats.total_collected) : '-'} />
      <StatCard title="Total Profit" value={stats ? formatCurrency(stats.total_profit) : '-'} />
      <StatCard
        title="Total Overdue Amount"
        value={stats ? formatCurrency(stats.total_overdue_amount) : '-'}
      />
      <StatCard
        title="Outstanding Balance"
        value={stats ? formatCurrency(stats.total_outstanding_balance) : '-'}
      />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary
  },
  logoutButton: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700'
  }
});
