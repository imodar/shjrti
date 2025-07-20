// Utility functions for handling multilingual package data

export const getLocalizedText = (
  data: any, 
  languageCode: string = 'en', 
  fallback: string = ''
): string => {
  if (!data) return fallback;
  
  // If it's already a string, return it
  if (typeof data === 'string') return data;
  
  // If it's an object with language codes
  if (typeof data === 'object' && data !== null) {
    // Try the requested language first
    if (data[languageCode]) return data[languageCode];
    
    // Fallback to English
    if (data.en) return data.en;
    
    // Fallback to first available language
    const firstKey = Object.keys(data)[0];
    if (firstKey && data[firstKey]) return data[firstKey];
  }
  
  return fallback;
};

export const getLocalizedFeatures = (
  features: any,
  languageCode: string = 'en'
): string[] => {
  if (!features) return [];
  
  // If it's a string, try to parse it
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return getLocalizedFeatures(parsed, languageCode);
    } catch {
      return [];
    }
  }
  
  // If it's an object with language codes
  if (typeof features === 'object' && features !== null) {
    // Try the requested language first
    if (Array.isArray(features[languageCode])) {
      return features[languageCode];
    }
    
    // Fallback to English
    if (Array.isArray(features.en)) {
      return features.en;
    }
    
    // Fallback to first available language
    const firstKey = Object.keys(features)[0];
    if (firstKey && Array.isArray(features[firstKey])) {
      return features[firstKey];
    }
  }
  
  return [];
};

export const formatPackageForDisplay = (pkg: any, languageCode: string = 'en') => {
  return {
    ...pkg,
    name: getLocalizedText(pkg.name, languageCode),
    description: getLocalizedText(pkg.description, languageCode),
    features: getLocalizedFeatures(pkg.features, languageCode)
  };
};