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
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editInterestRate, setEditInterestRate] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editStartDate, setEditStartDate] = useState('');

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

  const startEdit = (loan) => {
    setEditingLoanId(loan.id);
    setEditCustomerId(String(loan.customer_id || ''));
    setEditAmount(String(loan.amount || ''));
    setEditInterestRate(String(loan.interest_rate || ''));
    setEditDuration(String(loan.duration || ''));
    setEditStartDate(String(loan.start_date).slice(0, 10));
  };

  const cancelEdit = () => {
    setEditingLoanId(null);
    setEditCustomerId('');
    setEditAmount('');
    setEditInterestRate('');
    setEditDuration('');
    setEditStartDate('');
  };

  const saveEdit = async () => {
    try {
      await client.put(`/loans/${editingLoanId}`, {
        customer_id: Number(editCustomerId),
        amount: Number(editAmount),
        interest_rate: Number(editInterestRate),
        duration: Number(editDuration),
        start_date: editStartDate
      });
      Alert.alert('Success', 'Loan updated successfully');
      cancelEdit();
      fetchLoans();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Unable to update loan');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'PAID') {
      return '#188038';
    }

    if (status === 'PARTIAL') {
      return '#9c5f00';
    }

    return '#6b7280';
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
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment_status) }]}>
              <Text style={styles.statusText}>{item.payment_status || 'UNPAID'}</Text>
            </View>
            <Text style={styles.loanLine}>Principal: {money(item.amount)}</Text>
            <Text style={styles.loanLine}>Monthly Interest: {Number(item.interest_rate || 0).toFixed(2)}%</Text>
            <Text style={styles.loanLine}>Total: {money(item.total)}</Text>
            <Text style={styles.loanLine}>EMI: {money(item.emi)}</Text>
            <Text style={styles.loanLine}>Paid: {money(item.paid)}</Text>
            <Text style={styles.loanLine}>Balance: {money(item.balance)}</Text>
            <Text style={styles.loanLine}>Overdue Days: {item.overdue_days}</Text>

            {editingLoanId === item.id ? (
              <View style={styles.editSection}>
                <FormInput
                  label="Customer ID"
                  value={editCustomerId}
                  onChangeText={setEditCustomerId}
                  keyboardType="numeric"
                />
                <FormInput label="Loan Amount" value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" />
                <FormInput
                  label="Interest Rate (% monthly)"
                  value={editInterestRate}
                  onChangeText={setEditInterestRate}
                  keyboardType="numeric"
                />
                <FormInput
                  label="Duration (months)"
                  value={editDuration}
                  onChangeText={setEditDuration}
                  keyboardType="numeric"
                />
                <FormInput
                  label="Start Date (YYYY-MM-DD)"
                  value={editStartDate}
                  onChangeText={setEditStartDate}
                />
                <View style={styles.editActions}>
                  <Pressable style={[styles.smallButton, styles.saveButton]} onPress={saveEdit}>
                    <Text style={styles.smallButtonText}>Save</Text>
                  </Pressable>
                  <Pressable style={[styles.smallButton, styles.cancelButton]} onPress={cancelEdit}>
                    <Text style={styles.smallButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.editButton} onPress={() => startEdit(item)}>
                <Text style={styles.editButtonText}>Edit Loan</Text>
              </Pressable>
            )}

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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  loanLine: {
    color: colors.textSecondary
  },
  editSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  smallButton: {
    width: '48%',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: colors.primary
  },
  cancelButton: {
    backgroundColor: '#6b7280'
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  editButton: {
    marginTop: 8,
    backgroundColor: '#0d9488',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700'
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
