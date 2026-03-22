import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import FormInput from '../components/FormInput';
import DatePickerField, { todayDateString } from '../components/DatePickerField';
import client from '../api/client';
import { colors } from '../theme/colors';

function currency(value) {
  return `₹ ${Number(value || 0).toFixed(2)}`;
}

function dateValue(value) {
  return value ? String(value).slice(0, 10) : '-';
}

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const incomingLoanId = route.params?.loanId ? String(route.params.loanId) : '';
  const incomingMonthlyInterestDue = route.params?.monthlyInterestDue;
  const incomingNextPaymentDate = route.params?.nextPaymentDate;
  const incomingCustomerName = route.params?.customerName || '';
  const incomingPaymentStatus = route.params?.paymentStatus || '';

  const [loanId, setLoanId] = useState(incomingLoanId);
  const [amount, setAmount] = useState(
    incomingMonthlyInterestDue !== undefined ? String(incomingMonthlyInterestDue) : ''
  );
  const [paymentDate, setPaymentDate] = useState(todayDateString());
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loanInfo, setLoanInfo] = useState(
    incomingLoanId
      ? {
          id: Number(incomingLoanId),
          customer_name: incomingCustomerName,
          monthly_interest_due: incomingMonthlyInterestDue,
          next_payment_date: incomingNextPaymentDate,
          payment_status: incomingPaymentStatus
        }
      : null
  );

  useEffect(() => {
    setLoanId(incomingLoanId);
    setAmount(incomingMonthlyInterestDue !== undefined ? String(incomingMonthlyInterestDue) : '');
    setLoanInfo(
      incomingLoanId
        ? {
            id: Number(incomingLoanId),
            customer_name: incomingCustomerName,
            monthly_interest_due: incomingMonthlyInterestDue,
            next_payment_date: incomingNextPaymentDate,
            payment_status: incomingPaymentStatus
          }
        : null
    );
  }, [
    incomingLoanId,
    incomingMonthlyInterestDue,
    incomingNextPaymentDate,
    incomingCustomerName,
    incomingPaymentStatus
  ]);

  const fetchLoanInfo = useCallback(async () => {
    if (!incomingLoanId) {
      setLoanInfo(null);
      return;
    }

    try {
      const response = await client.get('/loans');
      const selectedLoan = (response.data || []).find((item) => String(item.id) === String(incomingLoanId));
      setLoanInfo(selectedLoan || null);
    } catch (error) {
      setLoanInfo(null);
    }
  }, [incomingLoanId]);

  const fetchHistory = useCallback(async () => {
    if (!incomingLoanId) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
      const response = await client.get(`/payments/${incomingLoanId}`);
      setHistory(response.data || []);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [incomingLoanId]);

  useFocusEffect(
    useCallback(() => {
      fetchLoanInfo();
      fetchHistory();
    }, [fetchHistory, fetchLoanInfo])
  );

  const submitPayment = async () => {
    try {
      await client.post('/payments', {
        loan_id: Number(loanId),
        amount: Number(amount),
        payment_date: paymentDate
      });
      setAmount('');
      Alert.alert('Success', 'Payment added');
      fetchLoanInfo();
      fetchHistory();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Unable to add payment');
    }
  };

  const statusColor =
    loanInfo?.payment_status === 'PAID'
      ? '#166534'
      : loanInfo?.payment_status === 'PARTIAL'
        ? '#a16207'
        : '#6b7280';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Loan Details', { customerId: loanInfo?.customer_id, customerName: loanInfo?.customer_name })}>
          <Text style={styles.backBtnText}>← Back to Loans</Text>
        </Pressable>
        <Text style={styles.heading}>Payment Record</Text>
        <Text style={styles.subHeading}>Track interest collections and due schedule</Text>
      </View>

      {loanInfo ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryNameWrap}>
              <Text style={styles.summaryTitle}>{loanInfo.customer_name || `Loan #${loanInfo.id}`}</Text>
              <Text style={styles.summaryMeta}>Loan ID: {loanInfo.id || '-'}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
              <Text style={styles.statusPillText}>{loanInfo.payment_status || 'UNPAID'}</Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Monthly Due</Text>
              <Text style={styles.metricValue}>{currency(loanInfo.monthly_interest_due)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Interest</Text>
              <Text style={styles.metricValue}>{currency(loanInfo.total_interest)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Interest Paid</Text>
              <Text style={styles.metricValue}>{currency(loanInfo.total_interest_paid)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Remaining Interest</Text>
              <Text style={styles.metricValue}>
                {currency((Number(loanInfo.total_interest || 0) - Number(loanInfo.total_interest_paid || 0)) || 0)}
              </Text>
            </View>
          </View>

          <Text style={styles.summaryText}>Next Payment Date: {dateValue(loanInfo.next_payment_date)}</Text>
        </View>
      ) : null}

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Add Interest Payment</Text>
        <FormInput label="Loan ID" value={loanId} onChangeText={setLoanId} keyboardType="numeric" />
        <FormInput label="Interest Payment Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <DatePickerField label="Payment Date" value={paymentDate} onChangeText={setPaymentDate} />

        <Pressable style={styles.button} onPress={submitPayment}>
          <Text style={styles.buttonText}>Save Payment</Text>
        </Pressable>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Payment History</Text>
        <Text style={styles.historyCount}>{history.length}</Text>
      </View>

      <FlatList
        scrollEnabled={false}
        data={history}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} />}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemTop}>
              <Text style={styles.itemTitle}>Payment #{item.id}</Text>
              <Text style={styles.itemDate}>{dateValue(item.payment_date)}</Text>
            </View>
            <Text style={styles.itemAmount}>{currency(item.amount)}</Text>
            <Text style={styles.itemText}>Interest payment collected</Text>
          </View>
        )}
        contentContainerStyle={styles.historyListContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No payment history found</Text>
            <Text style={styles.empty}>Add the first payment from the form above.</Text>
          </View>
        }
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
    padding: 14,
    paddingBottom: 24
  },
  heroCard: {
    backgroundColor: '#edf4fb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cddbeb',
    padding: 14,
    marginBottom: 10
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  backBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary
  },
  subHeading: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13
  },
  formTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    alignItems: 'center'
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.surface
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  summaryNameWrap: {
    flex: 1,
    marginRight: 8
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 17
  },
  summaryMeta: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  statusPillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f3f7fa',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11
  },
  metricValue: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2
  },
  summaryText: {
    color: colors.textSecondary,
    marginTop: 2
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  listTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 0
  },
  historyCount: {
    minWidth: 30,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#e8eef6',
    borderRadius: 999,
    color: '#2f455f',
    fontWeight: '700'
  },
  historyListContent: {
    paddingBottom: 10
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  itemTitle: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  itemDate: {
    color: colors.textSecondary,
    fontSize: 12
  },
  itemAmount: {
    color: '#0b6e4f',
    fontWeight: '800',
    fontSize: 20,
    marginTop: 6
  },
  itemText: {
    color: colors.textSecondary,
    marginTop: 2
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 16,
    alignItems: 'center',
    marginTop: 4
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 4
  }
});
