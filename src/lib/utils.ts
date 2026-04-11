import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasPlan(userPlan: string | undefined, requiredPlan: 'free' | 'basic' | 'pro' | 'ultimate'): boolean {
  const planLevels: Record<string, number> = {
    'free': 0,
    'basic': 1,
    'pro': 2,
    'ultimate': 3
  };
  const userLevel = planLevels[userPlan || 'free'] || 0;
  const requiredLevel = planLevels[requiredPlan] || 0;
  return userLevel >= requiredLevel;
}
