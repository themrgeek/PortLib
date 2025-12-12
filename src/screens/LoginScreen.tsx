import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";
import { colors, spacing, typography } from "../theme/colors";
import {
  validateEmailOrPhone,
  validatePassword,
  validatePhone,
} from "../utils/validation";
import { authService } from "../services/authService";
import { useAuthStore } from "../store/authStore";

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [emailOrPhoneError, setEmailOrPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleEmailOrPhoneChange = (value: string) => {
    setEmailOrPhone(value);
    if (emailOrPhoneError) {
      const validation = validateEmailOrPhone(value);
      setEmailOrPhoneError(validation.isValid ? "" : validation.error || "");
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) {
      const validation = validatePassword(value);
      setPasswordError(validation.isValid ? "" : validation.error || "");
    }
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailOrPhoneError("");
    setPasswordError("");

    // Validate email or phone (user can enter either)
    const emailOrPhoneValidation = validateEmailOrPhone(emailOrPhone);
    if (!emailOrPhoneValidation.isValid) {
      setEmailOrPhoneError(emailOrPhoneValidation.error || "");
      return;
    }

    // Extract phone number (API expects phone, not email)
    // If user entered email, we'll need to handle it differently
    // For now, validate that it's a phone number format
    const cleanPhone = emailOrPhone.replace(/[\s\-\(\)\+]/g, "");
    const phoneValidation = validatePhone(emailOrPhone);
    if (!phoneValidation.isValid) {
      setEmailOrPhoneError("Please enter a valid phone number for login");
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || "");
      return;
    }

    setIsLoading(true);

    try {
      // Login with phone and plaintext password
      // API endpoint: POST /api/auth/login/password
      const response = await authService.login({
        phone: cleanPhone, // API expects phone number
        password: password, // Plaintext password
      });

      const token = response.accessToken || response.token;
      if (!token) {
        Alert.alert(
          "Login Failed",
          "No token returned from server. Please try again."
        );
        return;
      }

      // Persist auth state for navigation guard
      setAuth({
        token,
        user: {
          id: (response as any)?.userId,
          email: (response as any)?.email,
          name: (response as any)?.name,
        },
      });
      // AppNavigator will switch stacks when isAuthenticated becomes true
    } catch (error: any) {
      // Don't navigate away on error - stay on login screen
      const errorMessage = error.message || "An error occurred during login";

      // Check if it's a network error
      if (
        errorMessage.includes("Network request failed") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        Alert.alert(
          "Connection Error",
          "Unable to connect to the server. Please check:\n\n" +
            "1. Your backend server is running\n" +
            "2. You're using the correct API URL\n" +
            "3. Your device/emulator can reach the server\n\n" +
            "For physical devices, use your computer's IP address instead of localhost."
        );
      } else {
        Alert.alert("Login Failed", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Handle Google login
    console.log("Google login pressed");
  };

  const handleAppleLogin = () => {
    // Handle Apple login
    console.log("Apple login pressed");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <View style={styles.logoIconContainer}>
                <Ionicons name="book" size={24} color={colors.primary} />
                <View style={styles.logoPersonCircle}>
                  <Ionicons name="person" size={12} color={colors.primary} />
                </View>
              </View>
            </View>
            <Text style={styles.appName}>PortLib</Text>
            <Text style={styles.tagline}>Smart Library Management</Text>
          </View>

          {/* Input Fields */}
          <View style={styles.formContainer}>
            <InputField
              label="Email or Phone"
              placeholder="Enter your email or phone"
              value={emailOrPhone}
              onChangeText={handleEmailOrPhoneChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailOrPhoneError}
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              showPasswordToggle
              error={passwordError}
            />

            {/* Remember Me and Forgot Password */}
            <View style={styles.optionsRow}>
              <View style={styles.rememberMeContainer}>
                <TouchableOpacity
                  style={styles.rememberMeCheckbox}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View
                    style={[
                      styles.checkboxCircle,
                      rememberMe && styles.checkboxCircleChecked,
                    ]}
                  >
                    {rememberMe && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.textWhite}
                      />
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => console.log("Forgot password")}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Button
              title="Login"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleLogin}
              >
                <Ionicons
                  name="logo-google"
                  size={20}
                  color={colors.textPrimary}
                />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleAppleLogin}
              >
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color={colors.textPrimary}
                />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                <Text style={styles.signUpLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: "100%",
    height: "100%",
  },
  keyboardView: {
    flex: 1,
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    paddingBottom: spacing.xxxl * 1.5,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  logoIconContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  logoPersonCircle: {
    position: "absolute",
    top: -8,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  formContainer: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  forgotPassword: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderInactive,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textPlaceholder,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderInactive,
    borderRadius: 8,
    height: 50,
    marginHorizontal: spacing.xs,
  },
  socialButtonText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  signUpText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  signUpLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeCheckbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderInactive,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.xs,
  },
  checkboxCircleChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberMeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
});
