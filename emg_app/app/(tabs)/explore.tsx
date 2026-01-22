import { AppColors } from '@/constants/styles';
import { useAuth } from '@/context/auth-context-enhanced';
import { useEMGManager } from '@/hooks/use-emg-manager';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StatsScreen() {
  const { user } = useAuth();
  const { sessions } = useEMGManager(user?.id || null);

  // Mock stats data - in real app, calculate from sessions
  const stats = {
    avgActivation: 72,
    activationChange: 5,
    totalSessions: sessions.length || 14,
    sessionsPerDay: 2,
    peakOutput: 98,
    peakDay: 'Sunday',
    streakDays: 7,
    totalMinutes: 156,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Stats</Text>
          <Text style={styles.subtitle}>Your performance summary for the past 7 days</Text>
        </View>

        {/* Main Stats Grid */}
        <View style={styles.mainStatsRow}>
          <View style={styles.mainStatCard}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.mainStatGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.mainStatIconContainer}>
                <Ionicons name="flash" size={24} color={AppColors.white} />
              </View>
              <Text style={styles.mainStatValue}>{stats.avgActivation}%</Text>
              <Text style={styles.mainStatLabel}>Avg Activation</Text>
              <View style={styles.changeBadge}>
                <Ionicons name="arrow-up" size={12} color={AppColors.success} />
                <Text style={styles.changeText}>{stats.activationChange}%</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.mainStatCard}>
            <LinearGradient
              colors={['#06B6D4', '#3B82F6']}
              style={styles.mainStatGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.mainStatIconContainer}>
                <Ionicons name="pulse" size={24} color={AppColors.white} />
              </View>
              <Text style={styles.mainStatValue}>{stats.peakOutput}</Text>
              <Text style={styles.mainStatLabel}>Peak µV</Text>
              <View style={styles.dayBadge}>
                <Text style={styles.dayText}>{stats.peakDay}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Detail Cards */}
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View style={[styles.detailIcon, { backgroundColor: AppColors.primaryLight + '30' }]}>
              <Ionicons name="calendar" size={22} color={AppColors.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Total Sessions</Text>
              <Text style={styles.detailValue}>{stats.totalSessions}</Text>
            </View>
          </View>
          <Text style={styles.detailSubtext}>~{stats.sessionsPerDay} sessions per day</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View style={[styles.detailIcon, { backgroundColor: AppColors.successLight }]}>
              <Ionicons name="flame" size={22} color={AppColors.success} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Current Streak</Text>
              <Text style={styles.detailValue}>{stats.streakDays} days</Text>
            </View>
          </View>
          <View style={styles.streakProgress}>
            {[...Array(7)].map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.streakDot, 
                  i < stats.streakDays && styles.streakDotActive
                ]} 
              />
            ))}
          </View>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View style={[styles.detailIcon, { backgroundColor: AppColors.warningLight }]}>
              <Ionicons name="time" size={22} color={AppColors.warning} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Total Time</Text>
              <Text style={styles.detailValue}>{stats.totalMinutes} min</Text>
            </View>
          </View>
          <Text style={styles.detailSubtext}>This week's total recording time</Text>
        </View>

        {/* Weekly Chart Placeholder */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="bar-chart" size={20} color={AppColors.gray700} />
              <Text style={styles.chartTitle}>Weekly Activity</Text>
            </View>
          </View>
          <View style={styles.chartPlaceholder}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <View key={i} style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { height: [60, 80, 45, 90, 70, 50, 85][i] }
                  ]} 
                />
                <Text style={styles.barLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color={AppColors.warning} />
            <Text style={styles.tipsTitle}>Pro Tip</Text>
          </View>
          <Text style={styles.tipsText}>
            Consistent daily sessions of 15-20 minutes yield the best muscle tracking results. 
            Keep up the great work!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.gray900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.gray500,
  },
  mainStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mainStatCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  mainStatGradient: {
    padding: 20,
    alignItems: 'center',
  },
  mainStatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: AppColors.white,
  },
  mainStatLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: 4,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.white,
  },
  dayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.white,
  },
  detailCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: AppColors.gray500,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.gray900,
  },
  detailSubtext: {
    marginTop: 12,
    fontSize: 13,
    color: AppColors.gray400,
  },
  streakProgress: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  streakDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.gray200,
  },
  streakDotActive: {
    backgroundColor: AppColors.success,
  },
  chartCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.gray800,
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  bar: {
    width: 24,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.gray500,
  },
  tipsCard: {
    backgroundColor: AppColors.warningLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.gray800,
  },
  tipsText: {
    fontSize: 14,
    color: AppColors.gray600,
    lineHeight: 20,
  },
});
