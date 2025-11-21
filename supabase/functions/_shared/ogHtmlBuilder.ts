/**
 * Open Graph HTML Builder
 * Builds complete HTML with OG tags for social media bots
 */

export function buildOGHtml(
  title: string,
  description: string,
  imageUrl: string,
  siteName: string,
  currentUrl: string,
  twitterHandle?: string
): string {
  // Escape HTML special characters
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImageUrl = escapeHtml(imageUrl);
  const safeSiteName = escapeHtml(siteName);
  const safeCurrentUrl = escapeHtml(currentUrl);
  const safeTwitterHandle = twitterHandle ? escapeHtml(twitterHandle) : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:image" content="${safeImageUrl}" />
  <meta property="og:url" content="${safeCurrentUrl}" />
  <meta property="og:site_name" content="${safeSiteName}" />
  <meta property="og:locale" content="ar_AR" />
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${safeImageUrl}" />
  ${safeTwitterHandle ? `<meta name="twitter:site" content="${safeTwitterHandle}" />` : ''}
  
  <!-- Additional SEO -->
  <meta name="description" content="${safeDescription}" />
  
  <!-- Redirect script for regular users who somehow end up here -->
  <script>
    // Only redirect if not a bot/crawler
    if (!navigator.userAgent.match(/bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp/i)) {
      window.location.href = '${safeCurrentUrl}';
    }
  </script>
  
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
      direction: rtl;
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 20px;
    }
    p {
      color: #7f8c8d;
      line-height: 1.6;
    }
    .loading {
      margin-top: 30px;
      font-size: 18px;
      color: #3498db;
    }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeDescription}</p>
  <p class="loading">جاري التحميل...</p>
</body>
</html>`;
}
