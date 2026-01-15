import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, FileJson, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ApiDocs = () => {
  const { direction } = useLanguage();
  const navigate = useNavigate();
  const isRTL = direction === 'rtl';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <BackArrow className="h-4 w-4" />
                {isRTL ? 'رجوع' : 'Back'}
              </Button>
              <div className="flex items-center gap-2">
                <FileJson className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-foreground">
                  Shejrati API Documentation
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a 
                  href="/openapi.json" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  OpenAPI Spec
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Swagger UI */}
      <main className="swagger-wrapper">
        <SwaggerUI 
          url="/openapi.json"
          docExpansion="list"
          defaultModelsExpandDepth={1}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          tryItOutEnabled={false}
        />
      </main>

      {/* Custom Styles */}
      <style>{`
        .swagger-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .swagger-ui {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui .info .title {
          color: hsl(var(--foreground));
          font-size: 2rem;
        }
        
        .swagger-ui .info .description p {
          color: hsl(var(--muted-foreground));
        }
        
        .swagger-ui .scheme-container {
          background: hsl(var(--card));
          box-shadow: none;
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          padding: 20px;
        }
        
        .swagger-ui .opblock {
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          box-shadow: none;
          margin-bottom: 16px;
        }
        
        .swagger-ui .opblock .opblock-summary {
          border-radius: 8px;
        }
        
        .swagger-ui .opblock.opblock-post {
          border-color: hsl(142 76% 36%);
          background: hsl(142 76% 36% / 0.05);
        }
        
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: hsl(142 76% 36%);
        }
        
        .swagger-ui .opblock.opblock-get {
          border-color: hsl(217 91% 60%);
          background: hsl(217 91% 60% / 0.05);
        }
        
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: hsl(217 91% 60%);
        }
        
        .swagger-ui .opblock.opblock-delete {
          border-color: hsl(0 84% 60%);
          background: hsl(0 84% 60% / 0.05);
        }
        
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: hsl(0 84% 60%);
        }
        
        .swagger-ui .opblock.opblock-put {
          border-color: hsl(25 95% 53%);
          background: hsl(25 95% 53% / 0.05);
        }
        
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: hsl(25 95% 53%);
        }
        
        .swagger-ui .opblock .opblock-summary-method {
          border-radius: 4px;
          font-weight: 600;
          min-width: 80px;
        }
        
        .swagger-ui .opblock .opblock-summary-path {
          font-family: ui-monospace, monospace;
          font-weight: 500;
        }
        
        .swagger-ui .opblock-tag {
          border-bottom: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          font-size: 1.25rem;
        }
        
        .swagger-ui .opblock-tag:hover {
          background: hsl(var(--muted));
        }
        
        .swagger-ui .opblock-body {
          background: hsl(var(--card));
        }
        
        .swagger-ui .opblock-section-header {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        
        .swagger-ui .opblock-section-header h4 {
          color: hsl(var(--foreground));
        }
        
        .swagger-ui table thead tr td,
        .swagger-ui table thead tr th {
          color: hsl(var(--foreground));
          border-color: hsl(var(--border));
        }
        
        .swagger-ui .parameter__name,
        .swagger-ui .parameter__type {
          color: hsl(var(--foreground));
        }
        
        .swagger-ui .parameter__name.required:after {
          color: hsl(0 84% 60%);
        }
        
        .swagger-ui .model-title {
          color: hsl(var(--foreground));
        }
        
        .swagger-ui .model {
          color: hsl(var(--muted-foreground));
        }
        
        .swagger-ui .model-box {
          background: hsl(var(--muted));
          border-radius: 8px;
        }
        
        .swagger-ui .responses-inner {
          background: hsl(var(--card));
        }
        
        .swagger-ui .response-col_status {
          color: hsl(var(--foreground));
          font-weight: 600;
        }
        
        .swagger-ui .response-col_description {
          color: hsl(var(--muted-foreground));
        }
        
        .swagger-ui .btn {
          border-radius: 6px;
          font-weight: 500;
        }
        
        .swagger-ui .btn.execute {
          background: hsl(var(--primary));
          border-color: hsl(var(--primary));
        }
        
        .swagger-ui .btn.execute:hover {
          background: hsl(var(--primary) / 0.9);
        }
        
        .swagger-ui select {
          border-radius: 6px;
          border-color: hsl(var(--border));
        }
        
        .swagger-ui input[type=text] {
          border-radius: 6px;
          border-color: hsl(var(--border));
        }
        
        .swagger-ui .highlight-code {
          border-radius: 8px;
        }
        
        .swagger-ui .highlight-code pre {
          border-radius: 8px;
        }
        
        .swagger-ui .markdown p,
        .swagger-ui .markdown code {
          color: hsl(var(--muted-foreground));
        }
        
        .swagger-ui .filter-container {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
        }
        
        .swagger-ui .filter-container input {
          border-radius: 6px;
          border-color: hsl(var(--border));
          padding: 8px 12px;
        }
        
        /* Dark mode adjustments */
        .dark .swagger-ui {
          filter: invert(0.88) hue-rotate(180deg);
        }
        
        .dark .swagger-ui .highlight-code,
        .dark .swagger-ui .highlight-code pre,
        .dark .swagger-ui .microlight {
          filter: invert(1) hue-rotate(180deg);
        }
      `}</style>
    </div>
  );
};

export default ApiDocs;
