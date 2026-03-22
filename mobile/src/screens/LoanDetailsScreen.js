import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import FormInput from '../components/FormInput';
import DatePickerField, { todayDateString } from '../components/DatePickerField';
import client from '../api/client';
import { colors } from '../theme/colors';

function money(value) {
  return `₹ ${Number(value || 0).toFixed(2)}`;
}

function dateValue(value) {
  return value ? String(value).slice(0, 10) : '-';
}

export default function LoanDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const selectedCustomerId = route.params?.customerId ? String(route.params.customerId) : '';
  const selectedCustomerName = route.params?.customerName || '';

  const [customerId, setCustomerId] = useState(selectedCustomerId);
  const [customerQuery, setCustomerQuery] = useState(selectedCustomerName);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('2');
  const [duration, setDuration] = useState('12');
  const [startDate, setStartDate] = useState(todayDateString());

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editCustomerQuery, setEditCustomerQuery] = useState('');
  const [editCustomerSuggestions, setEditCustomerSuggestions] = useState([]);
  const [editAmount, setEditAmount] = useState('');
  const [editInterestRate, setEditInterestRate] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editStartDate, setEditStartDate] = useState('');

  useEffect(() => {
    setCustomerId(selectedCustomerId);
    setCustomerQuery(selectedCustomerName);
    setCustomerSuggestions([]);
  }, [selectedCustomerId, selectedCustomerName]);

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
    if (!customerId) {
      Alert.alert('Customer Required', 'Please search and select a customer name first');
      return;
    }

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
    setEditCustomerQuery(String(loan.customer_name || ''));
    setEditCustomerSuggestions([]);
    setEditAmount(String(loan.amount || ''));
    setEditInterestRate(String(loan.interest_rate || ''));
    setEditDuration(String(loan.duration || ''));
    setEditStartDate(String(loan.start_date).slice(0, 10));
  };

  const cancelEdit = () => {
    setEditingLoanId(null);
    setEditCustomerId('');
    setEditCustomerQuery('');
    setEditCustomerSuggestions([]);
    setEditAmount('');
    setEditInterestRate('');
    setEditDuration('');
    setEditStartDate('');
  };

  const saveEdit = async () => {
    if (!editCustomerId) {
      Alert.alert('Customer Required', 'Please select a customer for this loan');
      return;
    }

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

  const fetchCustomerSuggestions = useCallback(async (term, forEdit = false) => {
    const trimmed = term.trim();
    if (!trimmed) {
      if (forEdit) {
        setEditCustomerSuggestions([]);
      } else {
        setCustomerSuggestions([]);
      }
      return;
    }

    try {
      const response = await client.get('/customers', {
        params: { search: trimmed, limit: 8 }
      });

      if (forEdit) {
        setEditCustomerSuggestions(response.data || []);
      } else {
        setCustomerSuggestions(response.data || []);
      }
    } catch (error) {
      if (forEdit) {
        setEditCustomerSuggestions([]);
      } else {
        setCustomerSuggestions([]);
      }
    }
  }, []);

  const onChangeCustomerQuery = (value) => {
    setCustomerQuery(value);
    setCustomerId('');
    fetchCustomerSuggestions(value, false);
  };

  const onSelectCustomer = (customer) => {
    setCustomerId(String(customer.id));
    setCustomerQuery(customer.name);
    setCustomerSuggestions([]);
  };

  const onChangeEditCustomerQuery = (value) => {
    setEditCustomerQuery(value);
    setEditCustomerId('');
    fetchCustomerSuggestions(value, true);
  };

  const onSelectEditCustomer = (customer) => {
    setEditCustomerId(String(customer.id));
    setEditCustomerQuery(customer.name);
    setEditCustomerSuggestions([]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.heading}>Create Loan</Text>
        {selectedCustomerName ? <Text style={styles.selected}>Customer: {selectedCustomerName}</Text> : null}
        <Text style={styles.label}>Customer Name</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer by name"
          placeholderTextColor="#7c8da7"
          value={customerQuery}
          onChangeText={onChangeCustomerQuery}
        />
        {customerSuggestions.length ? (
          <View style={styles.suggestionBox}>
            {customerSuggestions.map((customer) => (
              <Pressable
                key={String(customer.id)}
                style={styles.suggestionItem}
                onPress={() => onSelectCustomer(customer)}
              >
                <Text style={styles.suggestionName}>{customer.name}</Text>
                <Text style={styles.suggestionMeta}>ID {customer.id} - {customer.phone}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {customerId ? <Text style={styles.selectedMeta}>Selected ID: {customerId}</Text> : null}
        <FormInput label="Loan Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <FormInput
          label="Interest Rate (% monthly)"
          value={interestRate}
          onChangeText={setInterestRate}
          keyboardType="numeric"
        />
        <FormInput label="Duration (months)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
        <DatePickerField label="Start Date" value={startDate} onChangeText={setStartDate} />

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
            <View style={styles.loanTopRow}>
              <View style={styles.loanNameWrap}>
                <Text style={styles.loanHeading}>{item.customer_name}</Text>
                <Text style={styles.loanSubHeading}>Loan #{item.id}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment_status) }]}> 
                <Text style={styles.statusText}>{item.payment_status || 'UNPAID'}</Text>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Interest Summary</Text>
              <View style={styles.metricGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Monthly Interest</Text>
                  <Text style={styles.metricValue}>{Number(item.interest_rate || 0).toFixed(2)}%</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Monthly Due</Text>
                  <Text style={styles.metricValue}>{money(item.monthly_interest_due)}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Total Interest</Text>
                  <Text style={styles.metricValue}>{money(item.total_interest)}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Interest Paid</Text>
                  <Text style={styles.metricValue}>{money(item.total_interest_paid)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <Text style={styles.loanLine}>Paid Month Count: {item.paid_month_count}</Text>
              <Text style={styles.loanLine}>Last Payment Date: {item.last_payment_date ? dateValue(item.last_payment_date) : 'No payment yet'}</Text>
              <Text style={styles.loanLine}>Next Payment Date: {dateValue(item.next_payment_date)}</Text>
              <Text style={styles.loanLine}>Overdue Days: {item.overdue_days}</Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Loan Totals</Text>
              <Text style={styles.loanLine}>Principal Amount: {money(item.amount)}</Text>
              <Text style={styles.loanLine}>EMI: {money(item.emi)}</Text>
              <Text style={styles.loanLine}>Total Paid: {money(item.paid)}</Text>
              <Text style={styles.loanLine}>Outstanding Balance: {money(item.balance)}</Text>
              <Text style={styles.loanLine}>Current Cycle Paid: {money(item.current_cycle_paid)}</Text>
            </View>

            {editingLoanId === item.id ? (
              <View style={styles.editSection}>
                <Text style={styles.label}>Customer Name</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search customer by name"
                  placeholderTextColor="#7c8da7"
                  value={editCustomerQuery}
                  onChangeText={onChangeEditCustomerQuery}
                />
                {editCustomerSuggestions.length ? (
                  <View style={styles.suggestionBox}>
                    {editCustomerSuggestions.map((customer) => (
                      <Pressable
                        key={String(customer.id)}
                        style={styles.suggestionItem}
                        onPress={() => onSelectEditCustomer(customer)}
                      >
                        <Text style={styles.suggestionName}>{customer.name}</Text>
                        <Text style={styles.suggestionMeta}>ID {customer.id} - {customer.phone}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {editCustomerId ? <Text style={styles.selectedMeta}>Selected ID: {editCustomerId}</Text> : null}
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
                <DatePickerField label="Start Date" value={editStartDate} onChangeText={setEditStartDate} />
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
              <View style={styles.actionRow}>
                <Pressable style={styles.editButton} onPress={() => startEdit(item)}>
                  <Text style={styles.editButtonText}>Edit Loan</Text>
                </Pressable>

                <Pressable
                  style={styles.payButton}
                  onPress={() =>
                    navigation.navigate('Payments', {
                      loanId: item.id,
                      customerName: item.customer_name,
                      monthlyInterestDue: item.monthly_interest_due,
                      nextPaymentDate: item.next_payment_date,
                      paymentStatus: item.payment_status
                    })
                  }
                >
                  <Text style={styles.payButtonText}>Add Payment</Text>
                </Pressable>
              </View>
            )}
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
  label: {
    marginBottom: 6,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.textPrimary
  },
  suggestionBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginTop: 6,
    marginBottom: 8
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  suggestionName: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  suggestionMeta: {
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 12
  },
  selectedMeta: {
    color: colors.textSecondary,
    marginBottom: 8
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  loanTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  loanNameWrap: {
    flex: 1,
    marginRight: 10
  },
  loanHeading: {
    fontWeight: '800',
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 2
  },
  loanSubHeading: {
    color: colors.textSecondary,
    fontSize: 12
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 2
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  sectionBlock: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 13
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricBox: {
    width: '48%',
    backgroundColor: '#f2f6fa',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 2
  },
  metricValue: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  loanLine: {
    color: colors.textSecondary,
    marginTop: 2
  },
  editSection: {
    marginTop: 10,
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
    width: '48%',
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
    width: '48%',
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
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
