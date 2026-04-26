/**
 * Generate Invoice PDF (HTML-based)
 * 
 * GET /generate-invoice-pdf?id=xxx → Returns a beautiful bilingual HTML invoice
 * The user can then print/save as PDF from the browser
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { auth: { autoRefreshToken: false, persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Get invoice ID
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get('id');
    if (!invoiceId) {
      return new Response('Missing invoice ID', { status: 400, headers: corsHeaders });
    }

    // Fetch invoice with package info
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: invoice, error: invError } = await serviceClient
      .from('invoices')
      .select(`*, packages (id, name, description, price_sar, price_usd)`)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (invError || !invoice) {
      return new Response('Invoice not found', { status: 404, headers: corsHeaders });
    }

    // Fetch user profile
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch site settings for company info
    const { data: seoSettings } = await serviceClient
      .from('seo_settings')
      .select('organization_name, organization_logo_url')
      .limit(1)
      .maybeSingle();

    // Build invoice HTML
    const html = buildInvoiceHTML(invoice, profile, seoSettings);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Invoice PDF] Error:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});

function getLocalizedText(obj: any, lang = 'ar'): string {
  if (!obj) return '';
  if (typeof obj === 'string') {
    try {
      const parsed = JSON.parse(obj);
      return parsed[lang] || parsed['en'] || parsed['ar'] || obj;
    } catch { return obj; }
  }
  if (typeof obj === 'object') return obj[lang] || obj['en'] || obj['ar'] || '';
  return String(obj || '');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDateAr(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getStatusBadge(status: string): { labelAr: string; labelEn: string; color: string } {
  switch (status) {
    case 'paid': return { labelAr: 'مدفوعة', labelEn: 'Paid', color: '#16a34a' };
    case 'pending': return { labelAr: 'قيد الانتظار', labelEn: 'Pending', color: '#d97706' };
    case 'cancelled': return { labelAr: 'ملغية', labelEn: 'Cancelled', color: '#dc2626' };
    case 'refunded': return { labelAr: 'مستردة', labelEn: 'Refunded', color: '#7c3aed' };
    default: return { labelAr: status || '-', labelEn: status || '-', color: '#6b7280' };
  }
}

function getPaymentGatewayLabel(gateway: string | null): { ar: string; en: string } {
  switch (gateway) {
    case 'paypal': return { ar: 'باي بال', en: 'PayPal' };
    case 'stripe': return { ar: 'سترايب', en: 'Stripe' };
    default: return { ar: gateway || '-', en: gateway || '-' };
  }
}

function buildInvoiceHTML(invoice: any, profile: any, seoSettings: any): string {
  const packageNameAr = getLocalizedText(invoice.packages?.name, 'ar');
  const packageNameEn = getLocalizedText(invoice.packages?.name, 'en');
  const orgNameAr = getLocalizedText(seoSettings?.organization_name, 'ar') || 'شجرتي';
  const orgNameEn = getLocalizedText(seoSettings?.organization_name, 'en') || 'Shjrti';
  const logoUrl = seoSettings?.organization_logo_url || '';
  const status = getStatusBadge(invoice.payment_status || invoice.status);
  const gateway = getPaymentGatewayLabel(invoice.payment_gateway);
  const customerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '-';
  const currencyAr = invoice.currency === 'SAR' ? 'ريال سعودي' : (invoice.currency === 'USD' ? 'دولار أمريكي' : invoice.currency);
  const currencyEn = invoice.currency || 'SAR';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number || invoice.id} | فاتورة</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Cairo', 'Inter', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 24px;
    }
    
    .invoice-container {
      background: white;
      max-width: 800px;
      width: 100%;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    
    /* Header */
    .invoice-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d9488 100%);
      color: white;
      padding: 40px 48px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .brand-section h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    
    .brand-section .brand-en {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      opacity: 0.7;
      font-weight: 500;
    }
    
    .invoice-title-section {
      text-align: left;
      direction: ltr;
    }
    
    .invoice-title-section h2 {
      font-family: 'Inter', sans-serif;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      opacity: 0.95;
    }
    
    .invoice-title-section .invoice-title-ar {
      font-family: 'Cairo', sans-serif;
      font-size: 16px;
      opacity: 0.6;
      margin-top: 2px;
    }
    
    /* Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 700;
      color: white;
      margin-top: 12px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
    }
    
    /* Body */
    .invoice-body {
      padding: 40px 48px;
    }
    
    /* Meta Row */
    .meta-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 36px;
    }
    
    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
    }
    
    .meta-card-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
    }
    
    .meta-card-title .en {
      font-family: 'Inter', sans-serif;
      direction: ltr;
    }
    
    .field-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .field-row:last-child { border-bottom: none; }
    
    .field-label {
      font-size: 13px;
      color: #64748b;
    }
    
    .field-label .en {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: #94a3b8;
      display: block;
      direction: ltr;
      text-align: right;
    }
    
    .field-value {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      text-align: left;
      direction: ltr;
    }
    
    /* Items Table */
    .items-section {
      margin-bottom: 36px;
    }
    
    .items-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
    }
    
    .items-title .en {
      font-family: 'Inter', sans-serif;
      direction: ltr;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .items-table thead th {
      background: #f1f5f9;
      padding: 14px 20px;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-align: right;
    }
    
    .items-table thead th .en {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      display: block;
      color: #94a3b8;
      font-weight: 500;
    }
    
    .items-table thead th:last-child {
      text-align: left;
    }
    
    .items-table tbody td {
      padding: 16px 20px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .items-table tbody td:last-child {
      text-align: left;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      direction: ltr;
    }
    
    .package-name-cell .ar { font-weight: 600; }
    .package-name-cell .en {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #94a3b8;
      display: block;
    }
    
    /* Total Section */
    .total-section {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 36px;
    }
    
    .total-card {
      background: linear-gradient(135deg, #0f172a, #1e3a5f);
      color: white;
      border-radius: 12px;
      padding: 24px 36px;
      min-width: 280px;
    }
    
    .total-label {
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
    }
    
    .total-label .en {
      font-family: 'Inter', sans-serif;
    }
    
    .total-amount {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      direction: ltr;
      text-align: left;
    }
    
    .total-currency {
      font-size: 14px;
      opacity: 0.6;
      margin-top: 4px;
      display: flex;
      justify-content: space-between;
    }
    
    .total-currency .en {
      font-family: 'Inter', sans-serif;
    }
    
    /* Footer */
    .invoice-footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .footer-note {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .footer-note .en {
      font-family: 'Inter', sans-serif;
      display: block;
    }
    
    .print-btn {
      background: #0f172a;
      color: white;
      border: none;
      padding: 10px 28px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Cairo', sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .print-btn:hover { background: #1e293b; }
    
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; border-radius: 0; max-width: 100%; }
      .print-btn { display: none !important; }
      .invoice-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .total-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .status-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="brand-section">
        <h1>${orgNameAr}</h1>
        <div class="brand-en">${orgNameEn}</div>
      </div>
      <div class="invoice-title-section">
        <h2>INVOICE</h2>
        <div class="invoice-title-ar">فاتورة</div>
        <div class="status-badge" style="background: ${status.color}">
          <span class="status-dot"></span>
          ${status.labelAr} / ${status.labelEn}
        </div>
      </div>
    </div>
    
    <!-- Body -->
    <div class="invoice-body">
      <!-- Meta Cards -->
      <div class="meta-row">
        <!-- Invoice Details -->
        <div class="meta-card">
          <div class="meta-card-title">
            <span>تفاصيل الفاتورة</span>
            <span class="en">Invoice Details</span>
          </div>
          <div class="field-row">
            <div class="field-label">
              رقم الفاتورة
              <span class="en">Invoice Number</span>
            </div>
            <div class="field-value">${invoice.invoice_number || '-'}</div>
          </div>
          <div class="field-row">
            <div class="field-label">
              تاريخ الإصدار
              <span class="en">Issue Date</span>
            </div>
            <div class="field-value">${formatDate(invoice.created_at)}</div>
          </div>
          ${invoice.due_date ? `
          <div class="field-row">
            <div class="field-label">
              تاريخ الاستحقاق
              <span class="en">Due Date</span>
            </div>
            <div class="field-value">${formatDate(invoice.due_date)}</div>
          </div>` : ''}
          <div class="field-row">
            <div class="field-label">
              طريقة الدفع
              <span class="en">Payment Method</span>
            </div>
            <div class="field-value">${gateway.en}</div>
          </div>
        </div>
        
        <!-- Customer Details -->
        <div class="meta-card">
          <div class="meta-card-title">
            <span>بيانات العميل</span>
            <span class="en">Customer Details</span>
          </div>
          <div class="field-row">
            <div class="field-label">
              الاسم
              <span class="en">Name</span>
            </div>
            <div class="field-value" style="direction: rtl; text-align: right;">${customerName}</div>
          </div>
          <div class="field-row">
            <div class="field-label">
              البريد الإلكتروني
              <span class="en">Email</span>
            </div>
            <div class="field-value">${profile?.email || '-'}</div>
          </div>
          ${profile?.phone ? `
          <div class="field-row">
            <div class="field-label">
              الهاتف
              <span class="en">Phone</span>
            </div>
            <div class="field-value">${profile.phone}</div>
          </div>` : ''}
        </div>
      </div>
      
      <!-- Items -->
      <div class="items-section">
        <div class="items-title">
          <span>تفاصيل الاشتراك</span>
          <span class="en">Subscription Details</span>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>
                الوصف
                <span class="en">Description</span>
              </th>
              <th>
                الكمية
                <span class="en">Qty</span>
              </th>
              <th style="text-align: left;">
                المبلغ
                <span class="en">Amount</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="package-name-cell">
                <span class="ar">${packageNameAr || '-'}</span>
                <span class="en">${packageNameEn || '-'}</span>
              </td>
              <td>1</td>
              <td>${Number(invoice.amount).toFixed(2)} ${currencyEn}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Total -->
      <div class="total-section">
        <div class="total-card">
          <div class="total-label">
            <span>الإجمالي</span>
            <span class="en">Total</span>
          </div>
          <div class="total-amount">${Number(invoice.amount).toFixed(2)} ${currencyEn}</div>
          <div class="total-currency">
            <span>${currencyAr}</span>
            <span class="en">${currencyEn}</span>
          </div>
        </div>
      </div>

      ${invoice.paypal_order_id ? `
      <div style="margin-bottom: 24px;">
        <div class="meta-card">
          <div class="meta-card-title">
            <span>مرجع الدفع</span>
            <span class="en">Payment Reference</span>
          </div>
          ${invoice.paypal_order_id ? `
          <div class="field-row">
            <div class="field-label">
              معرف PayPal
              <span class="en">PayPal Order ID</span>
            </div>
            <div class="field-value" style="font-size: 12px;">${invoice.paypal_order_id}</div>
          </div>` : ''}
          ${invoice.paypal_capture_id ? `
          <div class="field-row">
            <div class="field-label">
              معرف التسجيل
              <span class="en">Capture ID</span>
            </div>
            <div class="field-value" style="font-size: 12px;">${invoice.paypal_capture_id}</div>
          </div>` : ''}
          ${invoice.stripe_payment_intent_id ? `
          <div class="field-row">
            <div class="field-label">
              معرف Stripe
              <span class="en">Stripe Payment Intent</span>
            </div>
            <div class="field-value" style="font-size: 12px;">${invoice.stripe_payment_intent_id}</div>
          </div>` : ''}
        </div>
      </div>` : ''}
    </div>
    
    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-note">
        شكراً لاستخدامك ${orgNameAr}
        <span class="en">Thank you for using ${orgNameEn}</span>
      </div>
      <button class="print-btn" onclick="window.print()">
        🖨️ طباعة / حفظ PDF
      </button>
    </div>
  </div>
</body>
</html>`;
}
