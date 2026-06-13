import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AppButton from '../components/AppButton';
import { hasErrors, normalizeEmail, validateRegistration } from '../utils/validation';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    const errors = validateRegistration({ displayName, email, password, confirm });
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      Alert.alert('Check your details', 'Fix the highlighted fields and try again.');
      return;
    }

    setLoading(true);
    try {
      await register(normalizeEmail(email), password, displayName.trim());
    } catch (err) {
      Alert.alert('Registration Failed', friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Create your profile</Text>
          <Text style={styles.title}>Start your next level</Text>
          <Text style={styles.subtitle}>
            Set up the account and we will drop you straight into the workout flow.
          </Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            style={[styles.input, fieldErrors.displayName && styles.inputError]}
            placeholder="Display Name"
            placeholderTextColor={colors.textSoft}
            autoComplete="name"
            textContentType="name"
            accessibilityLabel="Display name"
            value={displayName}
            onChangeText={(value) => {
              setDisplayName(value);
              if (fieldErrors.displayName) setFieldErrors(current => ({ ...current, displayName: undefined }));
            }}
          />
          {fieldErrors.displayName && <Text style={styles.errorText}>{fieldErrors.displayName}</Text>}
          <TextInput
            style={[styles.input, fieldErrors.email && styles.inputError]}
            placeholder="Email"
            placeholderTextColor={colors.textSoft}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Email address"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (fieldErrors.email) setFieldErrors(current => ({ ...current, email: undefined }));
            }}
          />
          {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
          <TextInput
            style={[styles.input, fieldErrors.password && styles.inputError]}
            placeholder="Password (min 6 chars)"
            placeholderTextColor={colors.textSoft}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (fieldErrors.password) setFieldErrors(current => ({ ...current, password: undefined }));
            }}
          />
          {fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
          <TextInput
            style={[styles.input, fieldErrors.confirm && styles.inputError]}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textSoft}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="Confirm password"
            value={confirm}
            onChangeText={(value) => {
              setConfirm(value);
              if (fieldErrors.confirm) setFieldErrors(current => ({ ...current, confirm: undefined }));
            }}
          />
          {fieldErrors.confirm && <Text style={styles.errorText}>{fieldErrors.confirm}</Text>}

          <AppButton
            label={loading ? 'Creating account...' : 'Sign Up'}
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
            accessibilityLabel="Create FitQuest account"
          />

          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.linkWrap, pressed && styles.linkPressed]}
          >
            <Text style={styles.link}>
              Already have an account? <Text style={styles.linkAccent}>Log In</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
      gap: 20,
    },
    hero: {
      width: '100%',
      maxWidth: 560,
      marginBottom: 10,
    },
    eyebrow: {
      color: colors.brand,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.4,
      marginBottom: 10,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      maxWidth: 320,
    },
    formCard: {
      width: '100%',
      maxWidth: 560,
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 22,
      gap: 14,
    },
    input: {
      backgroundColor: colors.backgroundAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 15,
    },
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: 12,
      lineHeight: 17,
      marginTop: -8,
    },
    button: {
      marginTop: 4,
    },
    link: {
      color: colors.textMuted,
      textAlign: 'center',
      fontSize: 13,
    },
    linkWrap: {
      marginTop: 8,
      alignSelf: 'center',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 8,
    },
    linkPressed: {
      opacity: 0.75,
    },
    linkAccent: {
      color: colors.brand,
      fontWeight: '700',
    },
  });
}
