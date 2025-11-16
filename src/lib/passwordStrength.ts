export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
  color: string;
  label: string;
  percentage: number;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];
  
  if (!password) {
    return {
      score: 0,
      feedback: ['أدخل كلمة مرور'],
      color: 'bg-gray-300',
      label: 'لا يوجد',
      percentage: 0
    };
  }

  // 1. الطول
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('يجب أن تكون 8 أحرف على الأقل');
  }
  
  if (password.length >= 12) {
    score++;
  }

  // 2. حروف كبيرة
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('أضف حرفاً كبيراً (A-Z)');
  }

  // 3. حروف صغيرة
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('أضف حرفاً صغيراً (a-z)');
  }

  // 4. أرقام
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('أضف رقماً (0-9)');
  }

  // 5. رموز خاصة
  if (/[@$!%*?&#]/.test(password)) {
    score++;
  } else {
    feedback.push('أضف رمزاً خاصاً (@$!%*?&#)');
  }

  // تحديد المستوى
  const levels = {
    0: { color: 'bg-red-500', label: 'ضعيفة جداً', textColor: 'text-red-500' },
    1: { color: 'bg-red-400', label: 'ضعيفة', textColor: 'text-red-400' },
    2: { color: 'bg-orange-400', label: 'متوسطة', textColor: 'text-orange-400' },
    3: { color: 'bg-yellow-400', label: 'مقبولة', textColor: 'text-yellow-400' },
    4: { color: 'bg-green-500', label: 'جيدة', textColor: 'text-green-500' },
    5: { color: 'bg-green-600', label: 'قوية جداً', textColor: 'text-green-600' }
  };

  const level = Math.min(score, 5) as 0 | 1 | 2 | 3 | 4 | 5;
  const percentage = (score / 5) * 100;

  return {
    score,
    feedback,
    color: levels[level].color,
    label: levels[level].label,
    percentage
  };
}
