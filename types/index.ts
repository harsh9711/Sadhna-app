export type Role = 'user' | 'admin';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  employee_code?: string;
  is_active: boolean;
  created_at: string;
  expo_push_token?: string | null;
}

export interface RoutineEntry {
  id: string;
  user_id: string;
  date: string;
  status: 'draft' | 'submitted';
  chant_before_ma?: number;
  rounds_till_730?: number;
  last_round_time?: string;
  total_rounds?: number;
  read_minutes?: number;
  book?: string;
  hear_minutes?: number;
  speaker?: string;
  topic?: string;
  slept_at?: string;
  wake_time?: string;
  day_rest_minutes?: number;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RoutineFormData {
  chant_before_ma: string;
  rounds_till_730: string;
  last_round_time: string;
  total_rounds: string;
  read_minutes: string;
  book: string;
  hear_minutes: string;
  speaker: string;
  topic: string;
  slept_at: string;
  wake_time: string;
  day_rest_minutes: string;
}

export interface AdminStats {
  total_users: number;
  submitted_today: number;
  missing_today: number;
  submission_rate: number;
}

export interface AdminEntryRow extends RoutineEntry {
  profile: Pick<Profile, 'name' | 'employee_code'>;
}

export interface UserComparisonRow {
  user: Profile;
  entry: RoutineEntry | null;
}

export interface Reminder {
  id: string;
  user_id: string;
  missed_dates: string[];
  message: string;
  created_at: string;
  read_at?: string | null;
}
