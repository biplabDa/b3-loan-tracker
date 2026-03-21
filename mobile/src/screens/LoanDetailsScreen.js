import React, { useCallback, useMemo, useState } from 'react';
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
import client from '../api/client';
import { colors } from '../theme/colors';

function money(value) {
  return `₹ ${Number(value || 0).toFixed(2)}`;
}

export default function LoanDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const selectedCustomerId = route.params?.customerId ? String(route.params.customerId) : '';
  const selectedCustomerName = route.params?.customerName || '';

  const [customerId, setCustomerId] = useState(selectedCustomerId);
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('2');
  const [duration, setDuration] = useState('12');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/loans');
      setLoans(response.data || []);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Unable to fetch loans');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLoans();
    }, [fetchLoans])
  );

  const visibleLoans = useMemo(() => {
    if (!customerId) {
      return loans;
    }
    return loans.filter((loan) => String(loan.customer_id) === String(customerId));
  }, [loans, customerId]);

  const createLoan = async () => {
    try {
      await client.post('/loans', {
        customer_id: Number(customerId),
        amount: Number(amount),
        interest_rate: Number(interestRate),
        duration: Number(duration),
        start_date: startDate
      });
      setAmount('');
      Alert.alert('Success', 'Loan created successfully');
      fetchLoans();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Unable to create loan');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.heading}>Create Loan</Text>
        {selectedCustomerName ? <Text style={styles.selected}>Customer: {selectedCustomerName}</Text> : null}
        <FormInput label="Customer ID" value={customerId} onChangeText={setCustomerId} keyboardType="numeric" />
        <FormInput label="Loan Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <FormInput
          label="Interest Rate (% monthly)"
          value={interestRate}
          onChangeText={setInterestRate}
          keyboardType="numeric"
        />
        <FormInput label="Duration (months)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
        <FormInput label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />

        <Pressable style={styles.button} onPress={createLoan}>
          <Text style={styles.buttonText}>Create Loan</Text>
        </Pressable>
      </View>

      <Text style={styles.listTitle}>Loan Records</Text>
      <FlatList
        scrollEnabled={false}
        data={visibleLoans}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLoans} />}
        renderItem={({ item }) => (
          <View style={styles.loanCard}>
            <Text style={styles.loanHeading}>#{item.id} - {item.customer_name}</Text>
            <Text style={styles.loanLine}>Principal: {money(item.amount)}</Text>
            <Text style={styles.loanLine}>Total: {money(item.total)}</Text>
            <Text style={styles.loanLine}>EMI: {money(item.emi)}</Text>
            <Text style={styles.loanLine}>Paid: {money(item.paid)}</Text>
            <Text style={styles.loanLine}>Balance: {money(item.balance)}</Text>
            <Text style={styles.loanLine}>Overdue Days: {item.overdue_days}</Text>

            <Pressable
              style={styles.payButton}
              onPress={() => navigation.navigate('Payments', { loanId: item.id })}
            >
              <Text style={styles.payButtonText}>Add Payment</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No loans found</Text>}
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surface,
    marginBottom: 14
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700'
  },
  selected: {
    marginTop: 4,
    marginBottom: 10,
    color: colors.textSecondary
  },
  button: {
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8
  },
  loanCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  loanHeading: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4
  },
  loanLine: {
    color: colors.textSecondary
  },
  payButton: {
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  empty: {
    textAlign: 'center',
    marginTop: 10,
    color: colors.textSecondary
  }
});
