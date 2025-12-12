import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { LoginScreen } from "../screens/LoginScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { StudentDashboard } from "../screens/StudentDashboard";
import { useAuthStore } from "../store/authStore";

export type RootStackParamList = {
  AuthScreen: undefined;
  SignUp: undefined;
  StudentDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, hydrated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    hydrated: state.hydrated,
  }));

  if (!hydrated) {
    return (
      <NavigationContainer>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" />
        </View>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator
          initialRouteName="StudentDashboard"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          initialRouteName="AuthScreen"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="AuthScreen" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
