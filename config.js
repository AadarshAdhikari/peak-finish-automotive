// Safe to publish: Supabase publishable keys are designed for browser use.
// Row-level security in supabase/schema.sql protects private booking data.
window.PEAK_FINISH_CONFIG = {
  supabaseUrl: '',
  supabasePublishableKey: '',
  adminRedirectUrl: `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}admin.html`,
  reviewUrl: 'https://maps.app.goo.gl/haWqCKfQQN6azjuAA?g_st=ic'
};
