import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Edit,
  User,
  UserCheck,
  Book,
  Timer,
  GraduationCap,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  LogOut,
  AlertCircle,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient, handleApiError } from "../../lib/apiClient";
import { EmptyState } from "./EmptyState";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  studentId?: string;
  department?: string;
  year?: string;
  role?: string;
  totalBorrowed?: number;
  activeLoans?: number;
  avatar?: string;
}

interface PasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserProfilePageProps {
  onBack?: () => void;
  onMenu?: () => void;
  onAvatarChange?: () => void;
  onLogoutSuccess?: () => void;
  onProfileSaveOverride?: (payload: Partial<UserProfile>) => Promise<void>;
  onPasswordChangeOverride?: (payload: PasswordPayload) => Promise<void>;
  initialProfile?: UserProfile;
  forceLoading?: boolean;
}

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-slate-200 dark:bg-slate-700 rounded ${className} animate-pulse`} />
);

const ProfileSkeleton: React.FC = () => (
  <div className="pt-16 pb-24 px-md space-y-lg">
    <div className="flex flex-col items-center pt-lg space-y-sm">
      <SkeletonBlock className="w-28 h-28 rounded-full" />
      <SkeletonBlock className="w-48 h-8" />
      <SkeletonBlock className="w-24 h-6" />
    </div>
    <div className="grid grid-cols-2 gap-md">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div
          key={idx}
          className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm flex flex-col items-center space-y-xs"
        >
          <SkeletonBlock className="w-10 h-10 rounded-full" />
          <SkeletonBlock className="w-12 h-6" />
          <SkeletonBlock className="w-20 h-4" />
        </div>
      ))}
    </div>
    {Array.from({ length: 6 }).map((_, idx) => (
      <div
        key={idx}
        className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm flex items-center space-x-md"
      >
        <SkeletonBlock className="w-6 h-6 rounded" />
        <SkeletonBlock className="w-full h-10" />
      </div>
    ))}
  </div>
);

const Spinner: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={`animate-spin h-5 w-5 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    role="presentation"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  onBack,
  onMenu,
  onAvatarChange,
  onLogoutSuccess,
  onProfileSaveOverride,
  onPasswordChangeOverride,
  initialProfile,
  forceLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [profileForm, setProfileForm] = useState<UserProfile | null>(initialProfile || null);
  const [passwordForm, setPasswordForm] = useState<PasswordPayload>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiClient.get<UserProfile>("/profile"),
    enabled: !forceLoading && !initialProfile,
    initialData: initialProfile,
    onSuccess: (data) => setProfileForm(data),
  });

  const profileError = profileQuery.error ? handleApiError(profileQuery.error) : null;
  const profile = profileForm;

  const saveProfileMutation = useMutation({
    mutationFn: async (payload: Partial<UserProfile>) => {
      if (onProfileSaveOverride) {
        await onProfileSaveOverride(payload);
        return;
      }
      await apiClient.put("/profile", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (payload: PasswordPayload) => {
      if (onPasswordChangeOverride) {
        await onPasswordChangeOverride(payload);
        return;
      }
      await apiClient.post("/auth/password/change", payload);
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordPanel(false);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => apiClient.post("/auth/logout"),
    onSuccess: () => onLogoutSuccess?.(),
  });

  const stats = useMemo(
    () => [
      {
        label: "TOTAL BORROWED",
        value: profile?.totalBorrowed ?? 0,
        icon: <Book className="w-6 h-6 text-primary" />,
        bg: "bg-primary-100",
      },
      {
        label: "ACTIVE LOANS",
        value: profile?.activeLoans ?? 0,
        icon: <Timer className="w-6 h-6 text-success" />,
        bg: "bg-emerald-100",
      },
    ],
    [profile?.activeLoans, profile?.totalBorrowed]
  );

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfileForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = () => {
    if (!profileForm) return;
    saveProfileMutation.mutate({
      fullName: profileForm.fullName,
      email: profileForm.email,
      phone: profileForm.phone,
      department: profileForm.department,
      year: profileForm.year,
    });
  };

  const passwordError =
    passwordForm.newPassword &&
    passwordForm.confirmPassword &&
    passwordForm.newPassword !== passwordForm.confirmPassword
      ? "Passwords do not match"
      : null;

  if ((profileQuery.isLoading || forceLoading) && !profile) {
    return (
      <div className="bg-background dark:bg-slate-900 min-h-screen">
        <header className="fixed top-0 left-0 w-full h-16 bg-surface dark:bg-slate-800 flex items-center justify-between px-md shadow-sm z-10">
          <div className="w-6 h-6" />
          <h2 className="text-slate-900 dark:text-white font-bold text-h4">
            Profile
          </h2>
          <div className="w-6 h-6" />
        </header>
        <ProfileSkeleton />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="bg-background dark:bg-slate-900 min-h-screen">
        <header className="fixed top-0 left-0 w-full h-16 bg-surface dark:bg-slate-800 flex items-center justify-between px-md shadow-sm z-10">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
          </button>
          <h2 className="text-slate-900 dark:text-white font-bold text-h4">
            Profile
          </h2>
          <div className="w-6 h-6" />
        </header>
        <div className="pt-16">
          <EmptyState
            title="Profile unavailable"
            description={profileError?.message || "Please try again later."}
            icon={<AlertCircle className="w-16 h-16 text-error" />}
            actionLabel="Retry"
            onAction={() => queryClient.invalidateQueries({ queryKey: ["profile"] })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background dark:bg-slate-900 flex flex-col min-h-screen" role="main" aria-label="User profile page">
      <header className="fixed top-0 left-0 w-full h-16 bg-surface dark:bg-slate-800 flex items-center justify-between px-md shadow-sm z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
        <h2 className="text-slate-900 dark:text-white font-bold text-h4">
          Profile
        </h2>
        <button
          onClick={onMenu}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
      </header>

      <main className="pt-16 pb-24 px-md space-y-lg">
        <section className="flex flex-col items-center pt-lg relative">
          <div className="relative">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.fullName}
                className="w-28 h-28 rounded-full object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <User className="w-16 h-16 text-slate-400" />
              </div>
            )}
            <button
              onClick={onAvatarChange}
              className="absolute bottom-0 right-0 p-1 rounded-full bg-primary"
              aria-label="Change avatar"
            >
              <Edit className="w-6 h-6 text-white" />
            </button>
          </div>
          <h1 className="text-slate-900 dark:text-white font-bold text-h1 mt-md text-center">
            {profile.fullName}
          </h1>
          <span className="inline-flex items-center space-x-xs rounded-full px-sm py-xs mt-sm bg-primary-100 text-primary font-semibold text-sm">
            <UserCheck className="w-4 h-4 text-primary" />
            <span>{profile.role || "Student"}</span>
          </span>
        </section>

        <section className="grid grid-cols-2 gap-md">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm flex flex-col items-center"
            >
              <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <p className="text-slate-900 dark:text-white font-bold text-h2 mt-xs">
                {stat.value}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-900 dark:text-white font-bold text-h3">
              Personal Information
            </h3>
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="text-primary font-medium text-sm hover:underline"
              aria-label={isEditing ? "Stop editing" : "Edit information"}
            >
              {isEditing ? "Done" : "Edit"}
            </button>
          </div>

          {[
            {
              label: "Student ID",
              value: profile.studentId || "",
              icon: <GraduationCap className="w-5 h-5 text-slate-500" />,
              field: "studentId" as const,
            },
            {
              label: "Full Name",
              value: profile.fullName,
              icon: <User className="w-5 h-5 text-slate-500" />,
              field: "fullName" as const,
            },
            {
              label: "Email Address",
              value: profile.email,
              icon: <Mail className="w-5 h-5 text-slate-500" />,
              field: "email" as const,
            },
            {
              label: "Phone Number",
              value: profile.phone || "",
              icon: <Phone className="w-5 h-5 text-slate-500" />,
              field: "phone" as const,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm flex items-center space-x-md"
            >
              {item.icon}
              <input
                value={item.value}
                onChange={(e) => handleInputChange(item.field, e.target.value)}
                placeholder={item.label}
                className="flex-1 bg-transparent text-slate-900 dark:text-white text-body focus:outline-none"
                aria-label={item.label}
                readOnly={!isEditing}
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-md">
            {[
              {
                label: "Department",
                value: profile.department || "Computer Science",
                field: "department" as const,
              },
              { label: "Year", value: profile.year || "3rd", field: "year" as const },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm flex items-center space-x-md"
              >
                <span className="text-slate-700 dark:text-slate-300 text-body">
                  {item.label}
                </span>
                <input
                  value={item.value}
                  onChange={(e) => handleInputChange(item.field, e.target.value)}
                  className="flex-1 bg-transparent text-slate-900 dark:text-white text-body focus:outline-none text-right"
                  aria-label={item.label}
                  readOnly={!isEditing}
                />
                <ChevronDown className="w-5 h-5 text-slate-500" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-md">
          <div className="flex justify-between items-center bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm">
            <div>
              <p className="text-slate-900 dark:text-white font-semibold text-body">
                Change Password
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Update your security credentials
              </p>
            </div>
            <button
              onClick={() => setShowPasswordPanel((prev) => !prev)}
              aria-label="Toggle password section"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {showPasswordPanel ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>

          {showPasswordPanel && (
            <div className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm space-y-sm">
              {[
                { label: "Current Password", field: "currentPassword" as const },
                { label: "New Password", field: "newPassword" as const },
                { label: "Confirm Password", field: "confirmPassword" as const },
              ].map((item) => (
                <input
                  key={item.field}
                  type="password"
                  value={passwordForm[item.field]}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, [item.field]: e.target.value }))
                  }
                  placeholder={item.label}
                  className={`w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-body p-md rounded-lg focus:outline-none ${
                    passwordError ? "border border-error" : ""
                  }`}
                  aria-label={item.label}
                />
              ))}
              {passwordError && (
                <p className="text-error text-sm" role="alert">
                  {passwordError}
                </p>
              )}
              <button
                onClick={() => passwordMutation.mutate(passwordForm)}
                disabled={Boolean(passwordError) || passwordMutation.isPending}
                className="w-full bg-primary text-white py-md rounded-lg font-semibold text-body flex items-center justify-center space-x-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                aria-label="Save new password"
              >
                {passwordMutation.isPending ? <Spinner className="text-white" /> : null}
                <span>
                  {passwordMutation.isPending ? "Updating..." : "Update Password"}
                </span>
              </button>
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface dark:bg-slate-800 p-md shadow-lg flex flex-col items-center space-y-md z-10">
        <button
          onClick={handleSave}
          disabled={saveProfileMutation.isPending || !isEditing}
          className="w-full bg-primary text-white py-md rounded-lg font-semibold text-body flex items-center justify-center space-x-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          aria-label="Save profile changes"
        >
          {saveProfileMutation.isPending ? <Spinner className="text-white" /> : null}
          <span>{saveProfileMutation.isPending ? "Saving..." : "Save Changes"}</span>
        </button>
        <button
          onClick={() => logoutMutation.mutate()}
          className="w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white py-md rounded-lg font-semibold text-body flex items-center justify-center space-x-sm"
          aria-label="Log out"
        >
          <LogOut className="w-5 h-5 text-slate-900 dark:text-white" />
          <span>Log Out</span>
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 w-full h-16 bg-surface dark:bg-slate-800 flex justify-around items-center shadow-lg z-0 sm:hidden">
        {[
          { label: "Home", active: false },
          { label: "Search", active: false },
          { label: "My Books", active: false },
          { label: "Profile", active: true },
        ].map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center justify-center p-sm ${
              item.active
                ? "rounded-lg bg-primary-100 text-primary"
                : "text-slate-500 dark:text-slate-400"
            }`}
            aria-label={item.label}
          >
            <User className={`w-6 h-6 ${item.active ? "text-primary" : ""}`} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
