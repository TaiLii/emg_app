/**
 * Shared styles and theme for the app
 */

import { StyleSheet } from 'react-native';

// Modern color palette
export const AppColors = {
  // Primary brand colors
  primary: '#6366F1', // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  
  // Accent colors
  accent: '#06B6D4', // Cyan
  accentDark: '#0891B2',
  
  // Semantic colors
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Backgrounds
  backgroundLight: '#F8FAFC',
  backgroundDark: '#0F172A',
  cardLight: '#FFFFFF',
  cardDark: '#1E293B',
};

// Gradient backgrounds
export const Gradients = {
  primary: ['#6366F1', '#8B5CF6'],
  accent: ['#06B6D4', '#3B82F6'],
  dark: ['#1E293B', '#0F172A'],
  sunset: ['#F59E0B', '#EF4444'],
};

// Shared component styles
export const SharedStyles = StyleSheet.create({
  // Containers
  screenContainer: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  
  // Typography
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    color: AppColors.gray900,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    color: AppColors.gray900,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.gray800,
  },
  bodyText: {
    fontSize: 16,
    color: AppColors.gray600,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    color: AppColors.gray500,
  },
  
  // Inputs
  input: {
    backgroundColor: AppColors.gray50,
    borderWidth: 1,
    borderColor: AppColors.gray200,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: AppColors.gray900,
  },
  inputFocused: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.white,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.gray700,
    marginBottom: 8,
  },
  
  // Buttons
  buttonPrimary: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimaryPressed: {
    backgroundColor: AppColors.primaryDark,
  },
  buttonPrimaryText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: AppColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Links
  link: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  
  // Feedback
  errorBox: {
    backgroundColor: AppColors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: AppColors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  successBox: {
    backgroundColor: AppColors.successLight,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.success,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: AppColors.success,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Spacing
  spacerSm: {
    height: 8,
  },
  spacerMd: {
    height: 16,
  },
  spacerLg: {
    height: 24,
  },
  spacerXl: {
    height: 32,
  },
});
