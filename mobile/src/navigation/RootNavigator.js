import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CustomerListScreen from '../screens/CustomerListScreen';
import AddCustomerScreen from '../screens/AddCustomerScreen';
import LoanDetailsScreen from '../screens/LoanDetailsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OverdueScreen from '../screens/OverdueScreen';
import { colors } from '../theme/colors';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function DrawerStack() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        drawerActiveTintColor: colors.primary,
        drawerLabelStyle: { fontWeight: '600' }
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Customers" component={CustomerListScreen} />
      <Drawer.Screen name="Add Customer" component={AddCustomerScreen} />
      <Drawer.Screen name="Loan Details" component={LoanDetailsScreen} />
      <Drawer.Screen name="Payments" component={PaymentScreen} />
      <Drawer.Screen name="Overdue" component={OverdueScreen} />
    </Drawer.Navigator>
  );
}

export default function RootNavigator() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={DrawerStack} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
