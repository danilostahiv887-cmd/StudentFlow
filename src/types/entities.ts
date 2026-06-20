export type Role = 'student' | 'teacher' | 'admin';
export type UserStatus = 'active' | 'inactive';
export type ActivityStatus =
  | 'published'
  | 'draft'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'archived';
export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'attended'
  | 'missed';
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'needs_changes';
export type ActivityFormat = 'offline' | 'online' | 'hybrid';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  groupId?: string;
  specialityId?: string;
  phone?: string;
  bio?: string;
  pointsTotal: number;
}
export interface Group {
  id: string;
  name: string;
  specialityId: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
}
export interface Speciality {
  id: string;
  code: string;
  name: string;
  description: string;
}
export interface MediaAsset {
  id: string;
  kind: 'activity' | 'club' | 'badge' | 'visual';
  imageKey: number;
  fileName: string;
  fileId?: string;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  width?: number;
  height?: number;
  dominantColor?: string;
}
export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  teacherId: string;
  imageKey: number;
  status: UserStatus;
}
export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  imageKey: number;
}
export interface Activity {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  clubId: string;
  teacherId: string | null;
  imageKey: number;
  format: ActivityFormat;
  location: string;
  startAt: string;
  endAt: string;
  maxParticipants: number;
  points: number;
  difficulty: Difficulty;
  status: ActivityStatus;
  requirements: string;
  resultDescription: string;
  skills: string[];
}
export interface Application {
  id: string;
  activityId: string;
  studentId: string;
  status: ApplicationStatus;
  motivation: string;
  teacherComment?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}
export interface ParticipationReport {
  id: string;
  applicationId: string;
  activityId: string;
  studentId: string;
  status: ReportStatus;
  reflection: string;
  hoursSpent: number;
  skillsGained: string;
  evidenceUrl?: string;
  teacherFeedback?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Badge {
  id: string;
  title: string;
  description: string;
  imageKey: number;
  color: string;
  conditionType: 'points' | 'category' | 'activities';
  conditionValue: number;
  categoryId?: string;
  isActive: boolean;
}
export interface StudentBadge {
  id: string;
  studentId: string;
  badgeId: string;
  unlockedAt: string;
}
export interface DatabaseSnapshot {
  profiles: Profile[];
  groups: Group[];
  specialities: Speciality[];
  mediaAssets: MediaAsset[];
  clubs: Club[];
  categories: Category[];
  activities: Activity[];
  applications: Application[];
  reports: ParticipationReport[];
  badges: Badge[];
  studentBadges: StudentBadge[];
}

export interface ActivityView extends Activity {
  category: Category;
  club: Club;
  teacher: Profile;
  approvedCount: number;
  availablePlaces: number;
  imageUrl?: string;
  imageAlt?: string;
}
