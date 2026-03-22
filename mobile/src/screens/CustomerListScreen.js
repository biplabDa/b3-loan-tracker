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

  const clearSearch = () => {
    setSearch('');
    fetchCustomers('');
  };

  const renderCustomer = ({ item }) => {
    const initial = String(item.name || '?').trim().charAt(0).toUpperCase();

    return (
      <Pressable
        onPress={() => navigation.navigate('Loan Details', { customerId: item.id, customerName: item.name })}
        style={styles.card}
      >
        <View style={styles.cardTop}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.nameWrap}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.customerId}>Customer ID: {item.id}</Text>
          </View>
          <View style={styles.loanTag}>
            <Text style={styles.loanTagText}>Open</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{item.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address</Text>
          <Text style={styles.infoValue}>{item.address}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Tap to create or manage loan</Text>
          <Text style={styles.footerAction}>View</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heading}>Customer Directory</Text>
        <Text style={styles.subHeading}>Search, review, and open customer loan records</Text>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, phone, or address"
            placeholderTextColor="#77829a"
          />
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.searchButton} onPress={() => fetchCustomers(search)}>
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
          <Pressable style={styles.clearButton} onPress={clearSearch}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Customers</Text>
        <Text style={styles.listCount}>{customers.length}</Text>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchCustomers(search)} />}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No customers found</Text>
            <Text style={styles.emptySubTitle}>Try a different keyword or clear filters.</Text>
          </View>
        }
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
    heroCard: {
      backgroundColor: '#edf4fb',
      borderWidth: 1,
      borderColor: '#cddbeb',
      borderRadius: 16,
      padding: 14,
      marginBottom: 12
    },
    heading: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary
    },
    subHeading: {
      marginTop: 4,
      marginBottom: 12,
      color: colors.textSecondary,
      fontSize: 13
    },
    backgroundColor: colors.surface,
      marginBottom: 10
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 10,
    justifyContent: 'center',
    paddingHorizontal: 16
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
  },
      width: '48%',
    color: '#fff',
    fontWeight: '700'
  },
      alignItems: 'center',
      paddingVertical: 10
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    clearButton: {
      width: '48%',
      backgroundColor: '#dae4ef',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10
    },
    clearButtonText: {
      color: '#34506b',
      fontWeight: '700'
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    },
    listTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary
    },
    listCount: {
      minWidth: 30,
      textAlign: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: '#e8eef6',
      borderRadius: 999,
      color: '#2f455f',
      fontWeight: '700'
    },
    listContent: {
      paddingBottom: 18
    },
    marginBottom: 10
  },
  name: {
    fontSize: 17,
      borderRadius: 14,
    color: colors.textPrimary
  },
  text: {
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10
    },
    avatarWrap: {
      height: 40,
      width: 40,
      borderRadius: 20,
      backgroundColor: '#dbe8f5',
      alignItems: 'center',
      justifyContent: 'center'
    },
    avatarText: {
      color: '#2f4f6f',
      fontWeight: '800'
    },
    nameWrap: {
      flex: 1,
      marginLeft: 10
    },
    color: colors.textSecondary,
    marginTop: 2
      fontWeight: '800',
  empty: {
    textAlign: 'center',
    customerId: {
      color: colors.textSecondary,
      marginTop: 1,
      fontSize: 12
    },
    loanTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: '#e7f4ed'
    },
    loanTagText: {
      color: '#1c6a45',
      fontWeight: '700',
      fontSize: 12
    },
    infoRow: {
      marginTop: 4
    },
    infoLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.3
    },
    infoValue: {
      color: colors.textPrimary,
    marginTop: 20
  }
    cardFooter: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 12
    },
    footerAction: {
      color: colors.primary,
      fontWeight: '700'
    },
    emptyCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 18,
      marginTop: 8,
      alignItems: 'center'
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontWeight: '700'
    },
    emptySubTitle: {
      marginTop: 4,
      color: colors.textSecondary
