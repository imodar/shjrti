
## نظرة عامة
دمج Stripe (BYOK) في نظام الفواتير الحالي بجانب PayPal، مع تحكم كامل من الادمن، وإضافة صفحات إدارة الفواتير وطلبات المتجر.

## 1. إعداد Stripe (BYOK)
- إضافة secret: `STRIPE_SECRET_KEY` (سري) + `STRIPE_PUBLISHABLE_KEY` (عام للواجهة)
- إضافة `STRIPE_WEBHOOK_SECRET` للتحقق من webhooks
- تسجيل `stripe` في جدول `payment_gateway_settings` (موجود أصلاً) — `is_active` يتحكم بظهوره

## 2. Edge Functions جديدة
- `create-stripe-payment` — ينشئ Checkout Session مرتبطة بـ `invoice_id`
- `verify-stripe-payment` — يتحقق من الدفع ويحدّث الفاتورة عبر `complete_payment_and_upgrade`
- `stripe-webhook` — يستقبل أحداث Stripe (`checkout.session.completed`, `charge.refunded`, إلخ) بدون JWT
- `admin-stripe-refund` — استرجاع المبلغ عبر Stripe API + تحديث الفاتورة
- `get-stripe-publishable-key` — يرجع المفتاح العام (مشابه لـ `get-paypal-client-id`)

## 3. تعديلات الواجهة (الدفع)
- إضافة `StripeButton.tsx` بجانب `PayPalButton.tsx`
- تحديث صفحة `Payment.tsx`: عرض كلا الزرين بناءً على `is_active` في `payment_gateway_settings`
- منطق اختيار البوابة (Tabs أو Radio) في صفحة الدفع
- تحديث `usePaymentTracking` ليدعم `payment_gateway: 'stripe'`

## 4. لوحة تحكم الادمن — تعديلات
### أ. إعدادات بوابات الدفع (موجودة):
- توسعة `PaymentGatewaySettings.tsx` لإضافة قسم Stripe (تفعيل/تعطيل، بيئة sandbox/live)

### ب. صفحات جديدة:
- **`AdminInvoices.tsx`** — قائمة كل الفواتير (PayPal + Stripe) مع:
  - فلترة (الحالة، البوابة، التاريخ، المستخدم)
  - تفاصيل كل فاتورة (modal): معلومات المستخدم، الباقة، المبلغ، payment IDs
  - زر استرجاع مباشر (يستدعي PayPal أو Stripe refund حسب البوابة)
  - تنزيل PDF
  
- **`AdminStoreOrders.tsx`** — قائمة `store_orders`:
  - فلترة بالحالة
  - تفاصيل الطلب، المنتج، المشتري
  - تحديث حالة الطلب

### ج. تعديل `AdminRefunds.tsx`:
- دعم استرجاع Stripe عبر `admin-stripe-refund`
- شارة توضح بوابة الفاتورة

### د. تعديل `AdminPaymentAnalytics.tsx`:
- تقسيم الإيرادات حسب البوابة (PayPal vs Stripe)
- معدلات النجاح/الفشل لكل بوابة

## 5. تعديلات قاعدة البيانات
```sql
-- إضافة سطر Stripe في payment_gateway_settings (insert tool)
-- (لا تغيير في schema — invoices.stripe_payment_intent_id موجود أصلاً)
```

إضافة index للأداء على `invoices(payment_status, created_at)` و`invoices(payment_gateway)`.

## 6. التوجيه والقوائم
- إضافة `/admin/invoices` و `/admin/store-orders` في `src/routes.tsx`
- إضافة الروابط في قائمة الادمن (`EnhancedAdminPanel.tsx`)
- ترجمات جديدة في جدول `translations`

## التفاصيل التقنية
- استخدام `@stripe/stripe-js` للواجهة (مفتاح publishable فقط)
- استخدام `npm:stripe@14` في الـ edge functions
- webhook URL: `https://xzakoccnfswabrdwvukp.supabase.co/functions/v1/stripe-webhook` (المستخدم يسجّله في Stripe Dashboard)
- جميع الـ admin endpoints تتحقق من `is_admin(auth.uid())`
- استرجاعات Stripe عبر `stripe.refunds.create({ payment_intent })`

## الخطوات بالترتيب
1. طلب الـ secrets من المستخدم (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET)
2. تسجيل Stripe في `payment_gateway_settings`
3. إنشاء edge functions
4. بناء `StripeButton` ودمجه في `Payment.tsx`
5. توسعة `PaymentGatewaySettings`
6. بناء `AdminInvoices` و `AdminStoreOrders`
7. تحديث `AdminRefunds` و `AdminPaymentAnalytics`
8. إضافة الروابط والترجمات

## ملاحظة مهمة
بعد تطبيق الخطة، تحتاج تزويدنا بـ 3 مفاتيح من Stripe Dashboard:
- `STRIPE_SECRET_KEY` (Developers → API keys → Secret key)
- `STRIPE_PUBLISHABLE_KEY` (نفس الصفحة)
- `STRIPE_WEBHOOK_SECRET` (Developers → Webhooks → بعد إنشاء endpoint للـ URL أعلاه)
