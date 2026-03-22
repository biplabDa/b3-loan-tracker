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
      <View style={styles.heroCard}>
        <View style={styles.row}>
          <View>
            <Text style={styles.heading}>Business Snapshot</Text>
            <Text style={styles.subHeading}>Live overview of collection and risk</Text>
          </View>
          <Pressable onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        <Text style={styles.heroLabel}>Total Profit</Text>
        <Text style={styles.heroValue}>{stats ? formatCurrency(stats.total_profit) : '-'}</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <StatCard
            title="Customer Count"
            value={stats ? String(stats.total_customers) : '-'}
            helper="All active customers"
            tone="neutral"
          />
        </View>
        <View style={styles.metricCell}>
          <StatCard
            title="Total Loan Amount"
            value={stats ? formatCurrency(stats.total_loan_amount) : '-'}
            helper="Principal disbursed"
            tone="neutral"
          />
        </View>
        <View style={styles.metricCell}>
          <StatCard
            title="Total Collected"
            value={stats ? formatCurrency(stats.total_collected) : '-'}
            helper="All payments received"
            tone="success"
          />
        </View>
        <View style={styles.metricCell}>
          <StatCard
            title="Total Overdue Amount"
            value={stats ? formatCurrency(stats.total_overdue_amount) : '-'}
            helper="Current overdue interest"
            tone="danger"
          />
        </View>
      </View>

      <StatCard
        title="Outstanding Balance"
        value={stats ? formatCurrency(stats.total_outstanding_balance) : '-'}
        helper="Remaining principal + unpaid amount"
        tone="warning"
      />

      <StatCard
        title="Total Profit"
        value={stats ? formatCurrency(stats.total_profit) : '-'}
        helper="Realized interest profit"
        tone="success"
      />
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
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c7d3e1',
    backgroundColor: '#eef4fb',
    padding: 14,
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  heading: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subHeading: {
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 12
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4
  },
  heroValue: {
    color: '#0b6e4f',
    fontSize: 30,
    fontWeight: '800'
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
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricCell: {
    width: '48%'
  }
});
