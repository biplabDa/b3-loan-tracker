import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useRoute } from '@react-navigation/native';
import FormInput from '../components/FormInput';
import client from '../api/client';
import { colors } from '../theme/colors';

function currency(value) {
  return `₹ ${Number(value || 0).toFixed(2)}`;
}

export default function PaymentScreen() {
  const route = useRoute();
  const incomingLoanId = route.params?.loanId ? String(route.params.loanId) : '';

  const [loanId, setLoanId] = useState(incomingLoanId);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!loanId) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
      const response = await client.get(`/payments/${loanId}`);
      setHistory(response.data || []);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
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
      fetchHistory();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Unable to add payment');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.heading}>Record Payment</Text>
        <FormInput label="Loan ID" value={loanId} onChangeText={setLoanId} keyboardType="numeric" />
        <FormInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <FormInput label="Payment Date (YYYY-MM-DD)" value={paymentDate} onChangeText={setPaymentDate} />

        <Pressable style={styles.button} onPress={submitPayment}>
          <Text style={styles.buttonText}>Add Payment</Text>
        </Pressable>
      </View>

      <Text style={styles.listTitle}>Payment History</Text>
      <FlatList
        scrollEnabled={false}
        data={history}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} />}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Text style={styles.itemTitle}>Payment #{item.id}</Text>
            <Text style={styles.itemText}>Amount: {currency(item.amount)}</Text>
            <Text style={styles.itemText}>Date: {String(item.payment_date).slice(0, 10)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No payment history found</Text>}
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: colors.textPrimary
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  listTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 8
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10
  },
  itemTitle: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  itemText: {
    color: colors.textSecondary,
    marginTop: 2
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 10
  }
});
