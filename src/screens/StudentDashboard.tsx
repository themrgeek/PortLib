import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  type DimensionValue,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../theme/ThemeContext";
import { useWindowDimensions } from "react-native";
import { format, differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { Button } from "../components/Button";
import { useDashboardData } from "../hooks/useDashboardData";
import type { Borrow } from "../services/borrowService";

type StatCard = {
  label: string;
  value: string;
  emphasis?: "current" | "fines";
};

type QuickAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
};

type ActivityItem = {
  title: string;
  subtitle: string;
  timestamp: string;
  tone: "info" | "success" | "warning";
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const parseDate = (value?: string | Date) => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : new Date();
};

const formatDueDate = (value?: string) => format(parseDate(value), "MMM d");
const getDaysLeft = (dueDate?: string) =>
  Math.max(0, differenceInCalendarDays(parseDate(dueDate), new Date()));
const getDaysOverdue = (dueDate?: string) =>
  Math.max(0, differenceInCalendarDays(new Date(), parseDate(dueDate)));
const getDayLabel = (days: number) =>
  days === 1 ? "1 DAY LEFT" : `${days} DAYS LEFT`;

const LoadingSkeleton: React.FC<{
  palette: ReturnType<typeof useThemeMode>["palette"];
  contentMaxWidth: number;
  isTablet: boolean;
}> = ({ palette, contentMaxWidth, isTablet }) => {
  const block = (width: DimensionValue, height: number) => (
    <View
      style={{
        width,
        height,
        backgroundColor: palette.border,
        borderRadius: 10,
      }}
    />
  );

  return (
    <View style={{ width: contentMaxWidth, gap: isTablet ? 20 : 14 }}>
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 16,
          gap: 12,
        }}
      >
        {block(140, 16)}
        {block("80%", 12)}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {block("30%", 28)}
          {block("30%", 28)}
          {block("30%", 28)}
        </View>
      </View>
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 16,
          gap: 12,
        }}
      >
        {block(160, 16)}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {block("30%", 60)}
          {block("30%", 60)}
          {block("30%", 60)}
        </View>
      </View>
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 16,
          gap: 10,
        }}
      >
        {block(140, 16)}
        {block("100%", 90)}
        {block("100%", 90)}
      </View>
    </View>
  );
};

const EmptyStateCard: React.FC<{
  palette: ReturnType<typeof useThemeMode>["palette"];
  title: string;
  description?: string;
  onRetry?: () => void;
}> = ({ palette, title, description, onRetry }) => {
  return (
    <View
      style={[
        styles.emptyState,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <Ionicons name="book-outline" size={32} color={palette.textSecondary} />
      <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
        {title}
      </Text>
      {description ? (
        <Text
          style={[styles.emptyDescription, { color: palette.textSecondary }]}
        >
          {description}
        </Text>
      ) : null}
      {onRetry ? (
        <Button title="Refresh" onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
};

export const StudentDashboard: React.FC = () => {
  const { palette, mode, toggleTheme } = useThemeMode();
  const { width } = useWindowDimensions();
  const {
    data: dashboardData,
    isLoading,
    isRefreshing,
    isPaying,
    error,
    payError,
    refresh,
    payFine,
  } = useDashboardData();

  const isTablet = width >= 768;
  const contentMaxWidth = Math.min(width - 32, 900);
  const headerPadding = isTablet ? 32 : 20;
  const sectionGap = isTablet ? 24 : 20;
  const quickCardSize = isTablet ? 110 : 90;

  const currentBorrows = dashboardData?.currentBorrows ?? [];
  const overdueBooks = dashboardData?.overdueBooks ?? [];
  const totalBorrows = dashboardData?.totalBorrows ?? currentBorrows.length;
  const activeBorrows = dashboardData?.activeBorrows ?? currentBorrows.length;
  const totalFines =
    dashboardData?.totalFines ??
    overdueBooks.reduce((sum, borrow) => {
      const fine = (borrow as any)?.fine ?? borrow.book?.fineAmount ?? 0;
      return sum + (Number.isFinite(fine) ? (fine as number) : 0);
    }, 0);
  const studentName = dashboardData?.studentName || "Student";
  const studentId = dashboardData?.studentId || "N/A";
  const major = dashboardData?.major || "Major not set";

  const stats: StatCard[] = useMemo(
    () => [
      { label: "Total Borrows", value: `${totalBorrows}` },
      {
        label: "Current",
        value: `${activeBorrows}`,
        emphasis: "current",
      },
      {
        label: "Fines Due",
        value: formatCurrency(totalFines),
        emphasis: "fines",
      },
    ],
    [activeBorrows, totalBorrows, totalFines]
  );

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        label: "Borrow",
        icon: "scan-outline",
        onPress: () => console.log("Go to Borrow"),
      },
      {
        label: "My Books",
        icon: "book-outline",
        onPress: () => console.log("Go to My Books"),
      },
      {
        label: `Fines ${formatCurrency(totalFines)}`,
        icon: "card-outline",
        onPress: () => console.log("Go to Fines"),
      },
    ],
    [totalFines]
  );

  const getProgress = useCallback(
    (borrow: Borrow) => {
      const dueDate = parseDate(borrow.dueDate || borrow.book.dueDate);
      const borrowedOn = borrow.borrowDate
        ? parseDate(borrow.borrowDate)
        : new Date();
      const totalDays = Math.max(
        differenceInCalendarDays(dueDate, borrowedOn),
        1
      );
      const daysLeft = getDaysLeft(borrow.dueDate || borrow.book.dueDate);
      const elapsed = Math.min(totalDays, Math.max(totalDays - daysLeft, 0));
      const progress = Math.min(elapsed / totalDays, 1);
      const isUrgent = daysLeft <= 2;
      return {
        widthPercent: `${progress * 100}%` as `${number}%`,
        barColor: isUrgent ? palette.accentYellow : palette.accentGreen,
        chipText: getDayLabel(daysLeft),
        chipBg: palette.chipBackground,
        chipTextColor: isUrgent ? palette.accentYellow : palette.accentBlue,
      };
    },
    [palette]
  );

  const navItems = useMemo<NavItem[]>(
    () => [
      { label: "Home", icon: "home-outline", active: false },
      { label: "Search", icon: "search-outline", active: false },
      { label: "Book", icon: "qr-code-outline", active: true },
      { label: "Saved", icon: "bookmark-outline", active: false },
      { label: "Profile", icon: "person-outline", active: false },
    ],
    []
  );

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handlePayFine = useCallback(
    async (borrow: Borrow) => {
      const fineAmount = (borrow as any)?.fine ?? borrow.book?.fineAmount ?? 0;
      await payFine(borrow.id, fineAmount);
    },
    [payFine]
  );

  const recentActivity: ActivityItem[] = useMemo(() => {
    const activity: ActivityItem[] = [];
    overdueBooks.slice(0, 2).forEach((borrow) => {
      activity.push({
        title: `Overdue: ${borrow.book.title}`,
        subtitle: `${getDaysOverdue(
          borrow.dueDate || borrow.book.dueDate || ""
        )} days overdue`,
        timestamp: formatDueDate(borrow.dueDate || borrow.book.dueDate || ""),
        tone: "warning",
      });
    });

    currentBorrows.slice(0, 3).forEach((borrow) => {
      activity.push({
        title: borrow.book.title,
        subtitle: `Due ${formatDueDate(
          borrow.dueDate || borrow.book.dueDate || borrow.borrowDate
        )}`,
        timestamp: formatDueDate(borrow.borrowDate || borrow.dueDate),
        tone: "info",
      });
    });

    if (!activity.length) {
      activity.push({
        title: "No recent activity",
        subtitle: "Borrow a book to see updates here.",
        timestamp: format(new Date(), "MMM d"),
        tone: "info",
      });
    }

    return activity;
  }, [currentBorrows, overdueBooks]);

  const hasContent = currentBorrows.length > 0 || overdueBooks.length > 0;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.surface,
            paddingHorizontal: headerPadding,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => console.log("Open menu")}
          >
            <Ionicons name="menu" size={22} color={palette.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.logoText, { color: palette.primary }]}>
            PortLib
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
            <Ionicons
              name={mode === "light" ? "moon" : "sunny"}
              size={22}
              color={palette.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="person-circle"
              size={26}
              color={palette.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 90, gap: sectionGap, alignItems: "center" },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={palette.primary}
          />
        }
      >
        {isLoading ? (
          <LoadingSkeleton
            palette={palette}
            contentMaxWidth={contentMaxWidth}
            isTablet={isTablet}
          />
        ) : null}
        {!isLoading && error ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: palette.warningBackground },
            ]}
          >
            <Text style={[styles.errorText, { color: palette.warningText }]}>
              {error}
            </Text>
          </View>
        ) : null}
        {!isLoading && payError ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: palette.warningBackground },
            ]}
          >
            <Text style={[styles.errorText, { color: palette.warningText }]}>
              {payError}
            </Text>
          </View>
        ) : null}

        {!isLoading && !hasContent ? (
          <EmptyStateCard
            palette={palette}
            title="No dashboard data yet"
            description="Pull to refresh or try again later."
            onRetry={handleRefresh}
          />
        ) : null}

        {!isLoading ? (
          <>
            <View
              style={[
                styles.profileCard,
                { backgroundColor: palette.surface, width: contentMaxWidth },
              ]}
            >
              <View style={styles.profileRow}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60",
                    }}
                    style={styles.avatar}
                  />
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: palette.accentGreen },
                    ]}
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text
                    style={[styles.greeting, { color: palette.textPrimary }]}
                  >
                    Good Morning, {studentName}
                  </Text>
                  <Text
                    style={[styles.subInfo, { color: palette.textSecondary }]}
                  >
                    {major} • ID: {studentId}
                  </Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                {stats.map((stat, index) => {
                  const isLast = index === stats.length - 1;
                  return (
                    <View
                      key={stat.label}
                      style={[
                        styles.statCard,
                        { backgroundColor: palette.surface },
                        !isLast && styles.statSpacing,
                      ]}
                    >
                      <View style={styles.statHeader}>
                        <Text
                          style={[
                            styles.statLabel,
                            { color: palette.textSecondary },
                          ]}
                        >
                          {stat.label}
                        </Text>
                        {stat.emphasis === "current" && (
                          <View
                            style={[
                              styles.dot,
                              { backgroundColor: palette.accentBlue },
                            ]}
                          />
                        )}
                        {stat.emphasis === "fines" && (
                          <Ionicons
                            name="cash"
                            size={16}
                            color={palette.accentGreen}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.statValue,
                          {
                            color:
                              stat.emphasis === "fines"
                                ? palette.accentGreen
                                : palette.textPrimary,
                          },
                        ]}
                      >
                        {stat.value}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.sectionHeader, { width: contentMaxWidth }]}>
              <Text
                style={[styles.sectionTitle, { color: palette.textPrimary }]}
              >
                Quick Actions
              </Text>
            </View>
            <View
              style={[
                styles.quickActionsRow,
                { width: contentMaxWidth, gap: isTablet ? 18 : 12 },
              ]}
            >
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={[
                    styles.quickActionCard,
                    { backgroundColor: palette.surface },
                    { width: quickCardSize, height: quickCardSize },
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.quickIconCircle,
                      {
                        backgroundColor: palette.surfaceAlt,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={action.icon}
                      size={28}
                      color={palette.primary}
                    />
                  </View>
                  <Text
                    style={[styles.quickLabel, { color: palette.textPrimary }]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {overdueBooks.length ? (
              <View
                style={[
                  styles.overdueCard,
                  { backgroundColor: palette.warningBackground },
                  { width: contentMaxWidth },
                ]}
              >
                {overdueBooks.map((borrow) => (
                  <View key={borrow.id} style={styles.overdueRow}>
                    <Ionicons
                      name="warning"
                      size={20}
                      color={palette.warningText}
                    />
                    <View style={styles.overdueTextWrapper}>
                      <Text
                        style={[
                          styles.overdueTitle,
                          { color: palette.warningText },
                        ]}
                      >
                        Overdue: {borrow.book.title}
                      </Text>
                      <Text
                        style={[
                          styles.overdueSubtitle,
                          { color: palette.warningText },
                        ]}
                      >
                        Item is{" "}
                        {getDaysOverdue(
                          borrow.dueDate || borrow.book.dueDate || ""
                        )}{" "}
                        days overdue. Current fine:{" "}
                        {formatCurrency(
                          (borrow as any)?.fine ?? borrow.book.fineAmount ?? 0
                        )}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.payButton,
                          { backgroundColor: palette.accentRed },
                          isPaying && { opacity: 0.7 },
                        ]}
                        onPress={() => handlePayFine(borrow)}
                        activeOpacity={0.9}
                        disabled={isPaying}
                      >
                        <Text style={styles.payButtonText}>
                          {isPaying ? "Processing..." : "Pay Fine Now"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={[styles.sectionHeader, { width: contentMaxWidth }]}>
              <Text
                style={[styles.sectionTitle, { color: palette.textPrimary }]}
              >
                Current Borrows
              </Text>
              <TouchableOpacity onPress={() => console.log("View all borrows")}>
                <Text style={[styles.sectionLink, { color: palette.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.cardStack, { width: contentMaxWidth }]}>
              {currentBorrows.map((borrow) => {
                const {
                  widthPercent,
                  barColor,
                  chipText,
                  chipBg,
                  chipTextColor,
                } = getProgress(borrow);
                const coverImage =
                  (borrow as any)?.bookCover ||
                  (borrow.book as any)?.cover ||
                  (borrow.book as any)?.coverImage ||
                  "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=240&q=60";
                return (
                  <View
                    key={borrow.id}
                    style={[
                      styles.borrowCard,
                      { backgroundColor: palette.surface },
                    ]}
                  >
                    <Image
                      source={{ uri: coverImage }}
                      style={styles.bookCover}
                    />
                    <View style={styles.borrowInfo}>
                      <Text
                        style={[
                          styles.bookTitle,
                          { color: palette.textPrimary },
                        ]}
                        numberOfLines={2}
                      >
                        {borrow.book.title}
                      </Text>
                      <Text
                        style={[
                          styles.bookAuthor,
                          { color: palette.textSecondary },
                        ]}
                      >
                        {borrow.book.author}
                      </Text>
                      <View style={styles.borrowMetaRow}>
                        <View style={[styles.tag, { backgroundColor: chipBg }]}>
                          <Text
                            style={[styles.tagText, { color: chipTextColor }]}
                          >
                            {chipText}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.dueDate,
                            { color: palette.textSecondary },
                          ]}
                        >
                          {formatDueDate(borrow.dueDate || borrow.book.dueDate)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: palette.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            { width: widthPercent, backgroundColor: barColor },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.sectionHeader, { width: contentMaxWidth }]}>
              <Text
                style={[styles.sectionTitle, { color: palette.textPrimary }]}
              >
                Recent Activity
              </Text>
            </View>
            <View style={[styles.cardStack, { width: contentMaxWidth }]}>
              {recentActivity.map((item) => (
                <View
                  key={`${item.title}-${item.timestamp}`}
                  style={[
                    styles.activityCard,
                    { backgroundColor: palette.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.activityIcon,
                      {
                        backgroundColor:
                          item.tone === "success"
                            ? "rgba(16,185,129,0.15)"
                            : item.tone === "warning"
                            ? "rgba(234,179,8,0.2)"
                            : "rgba(37,99,235,0.15)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        item.tone === "warning"
                          ? "warning-outline"
                          : "book-outline"
                      }
                      size={16}
                      color={
                        item.tone === "success"
                          ? palette.accentGreen
                          : item.tone === "warning"
                          ? palette.accentYellow
                          : palette.primary
                      }
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text
                      style={[
                        styles.activityTitle,
                        { color: palette.textPrimary },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.activitySubtitle,
                        { color: palette.textSecondary },
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                  <Text style={[styles.activityTime, { color: palette.muted }]}>
                    {item.timestamp}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View
        style={[styles.bottomNav, { backgroundColor: palette.navBackground }]}
      >
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.navItem,
              item.active && { backgroundColor: palette.navActiveBackground },
            ]}
            onPress={() => console.log(`${item.label} pressed`)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={
                item.active ? palette.navIconActive : palette.navIconInactive
              }
            />
            <Text
              style={[
                styles.navLabel,
                {
                  color: item.active
                    ? palette.navIconActive
                    : palette.navIconInactive,
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 6,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 6,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  errorBanner: {
    width: "100%",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
  },
  profileCard: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subInfo: {
    fontSize: 12,
    fontWeight: "400",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "transparent",
  },
  statSpacing: {
    marginRight: 10,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "400",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "500",
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: 90,
    height: 90,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  overdueCard: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  overdueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  overdueTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  overdueTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  overdueSubtitle: {
    fontSize: 12,
    fontWeight: "400",
  },
  payButton: {
    marginTop: 10,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cardStack: {
    gap: 12,
  },
  borrowCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 15,
  },
  bookCover: {
    width: 60,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  borrowInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 8,
  },
  borrowMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  dueDate: {
    fontSize: 12,
    fontWeight: "400",
  },
  progressBar: {
    height: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    fontWeight: "400",
  },
  activityTime: {
    fontSize: 12,
    fontWeight: "400",
  },
  emptyState: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 68,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
});
