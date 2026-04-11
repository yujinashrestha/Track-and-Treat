export interface ProfileFormData {
  // Account
  username: string;
  password: string;
  // Basic
  dob: string;
  gender: 'male' | 'female' | 'other' | '';
  height: string;
  currentWeight: string;
  // Goals
  targetWeight: string;
  primaryGoal: string;
  // Diet
  dietType: string;
  dietaryLifestyle: string;
  // Restrictions
  allergies: string[];
  dislikedFoods: string[];
  eatingFrequency: string;
}
