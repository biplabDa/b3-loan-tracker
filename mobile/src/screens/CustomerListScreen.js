import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import client from '../api/client';
import { colors } from '../theme/colors';

export default function CustomerListScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(async (term = '') => {
    try {
      setLoading(true);
      const response = await client.get('/customers', { params: { search: term } });
      setCustomers(response.data || []);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Unable to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCustomers(search);
    }, [fetchCustomers, search])
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, phone, address"
          placeholderTextColor="#77829a"
        />
        <Pressable style={styles.searchButton} onPress={() => fetchCustomers(search)}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchCustomers(search)} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('Loan Details', { customerId: item.id, customerName: item.name })}
            style={styles.card}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.text}>{item.phone}</Text>
            <Text style={styles.text}>{item.address}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No customers found</Text>}
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
  searchWrap: {
    flexDirection: 'row',
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.textPrimary
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary
  },
  text: {
    color: colors.textSecondary,
    marginTop: 2
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20
  }
});
