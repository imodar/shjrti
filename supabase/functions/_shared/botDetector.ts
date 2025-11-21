/**
 * Bot Detection Utility
 * Detects social media crawlers and bots based on User-Agent
 */

export function isSocialMediaBot(userAgent: string): boolean {
  if (!userAgent) return false;
  
  const botPatterns = [
    'facebookexternalhit',
    'Facebot',
    'WhatsApp',
    'Twitterbot',
    'TelegramBot',
    'LinkedInBot',
    'Discordbot',
    'Slackbot',
    'pinterest',
    'google-structured-data-testing-tool',
    'Slurp', // Yahoo
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'Sogou',
    'Exabot',
    'ia_archiver', // Alexa
    'SkypeUriPreview',
    'vkShare',
    'redditbot',
  ];
  
  const lowerUserAgent = userAgent.toLowerCase();
  return botPatterns.some(pattern => 
    lowerUserAgent.includes(pattern.toLowerCase())
  );
}
