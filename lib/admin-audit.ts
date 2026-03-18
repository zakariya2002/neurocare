import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuditLogEntry {
  adminUserId: string;
  adminEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: entry.adminUserId,
      admin_email: entry.adminEmail || null,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      details: entry.details || {},
      ip_address: entry.ipAddress || null,
    });
  } catch (error) {
    // Ne jamais bloquer l'action admin si le log échoue
    console.error('Audit log failed:', error);
  }
}
