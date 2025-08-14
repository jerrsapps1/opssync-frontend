import { sendEmail, sendSMS } from "./notifications";
import { computeStatus } from "../utils/timeliness";
import { storage } from "../storage";
import { db } from "../db";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Role-aware escalation ladders by project type
const ESCALATION_LADDERS = {
  'construction': {
    defaultHours: 4,
    escalationLevels: [
      { role: 'supervisor', hours: 2 },
      { role: 'project_manager', hours: 4 },
      { role: 'site_manager', hours: 8 },
      { role: 'project_owner', hours: 24 }
    ]
  },
  'demolition': {
    defaultHours: 2, // More urgent for safety-critical work
    escalationLevels: [
      { role: 'safety_supervisor', hours: 1 },
      { role: 'demolition_manager', hours: 2 },
      { role: 'site_manager', hours: 4 },
      { role: 'project_owner', hours: 12 }
    ]
  },
  'infrastructure': {
    defaultHours: 6,
    escalationLevels: [
      { role: 'supervisor', hours: 3 },
      { role: 'project_manager', hours: 6 },
      { role: 'engineering_manager', hours: 12 },
      { role: 'project_owner', hours: 48 }
    ]
  },
  'default': {
    defaultHours: 4,
    escalationLevels: [
      { role: 'supervisor', hours: 2 },
      { role: 'project_manager', hours: 4 },
      { role: 'project_owner', hours: 12 }
    ]
  }
};

/**
 * Get escalation ladder for project type
 */
function getEscalationLadder(projectType?: string) {
  const type = projectType?.toLowerCase() || 'default';
  return ESCALATION_LADDERS[type] || ESCALATION_LADDERS.default;
}

/**
 * Auto-escalate items that are overdue for more than X hours using role-aware logic.
 * Different project types have different escalation ladders and timing.
 */
export async function runEscalations() {
  const client = await pool.connect();
  let escalated = 0;
  let scanned = 0;

  try {
    console.log("⚡ Running escalation check...");
    
    // Get all overdue items with project details
    const { rows } = await client.query(`
      SELECT 
        i.id, i.type, i.title, i.due_at, i.escalated_at, i.project_id,
        p.name as project_name, p.type as project_type,
        p.manager_email, p.owner_email, p.contacts
      FROM timeliness_items i
      JOIN projects p ON p.id = i.project_id
      WHERE i.deleted_at IS NULL 
        AND i.submitted_at IS NULL
        AND i.due_at < NOW()
      ORDER BY i.due_at ASC
    `);

    scanned = rows.length;

    for (const item of rows) {
      const ladder = getEscalationLadder(item.project_type);
      const overdueDuration = Date.now() - new Date(item.due_at).getTime();
      const overdueHours = overdueDuration / (1000 * 60 * 60);
      
      // Check if this item should be escalated based on project type ladder
      const shouldEscalate = overdueHours >= ladder.defaultHours;
      const lastEscalated = item.escalated_at ? new Date(item.escalated_at) : null;
      const hoursSinceLastEscalation = lastEscalated ? 
        (Date.now() - lastEscalated.getTime()) / (1000 * 60 * 60) : Infinity;

      // Only escalate if we haven't escalated recently (prevent spam)
      if (shouldEscalate && hoursSinceLastEscalation >= ladder.defaultHours) {
        // Determine escalation level based on how long overdue
        let escalationLevel = ladder.escalationLevels[0];
        for (const level of ladder.escalationLevels) {
          if (overdueHours >= level.hours) {
            escalationLevel = level;
          }
        }

        // Send escalation notification
        const recipients = [];
        if (item.manager_email) recipients.push(item.manager_email);
        if (item.owner_email) recipients.push(item.owner_email);
        
        // Parse contacts for additional escalation recipients
        try {
          const contacts = JSON.parse(item.contacts || '[]');
          contacts.forEach((contact: any) => {
            if (contact.email && contact.role?.toLowerCase().includes(escalationLevel.role)) {
              recipients.push(contact.email);
            }
          });
        } catch (e) {
          // Ignore contact parsing errors
        }

        if (recipients.length > 0) {
          const subject = `ESCALATION: ${item.title} - Overdue ${Math.round(overdueHours)}h`;
          const message = `Project: ${item.project_name}\nItem: ${item.title}\nDue: ${item.due_at}\nOverdue: ${Math.round(overdueHours)} hours\nEscalation Level: ${escalationLevel.role.replace('_', ' ').toUpperCase()}`;
          
          // Send notification (placeholder - would integrate with real email service)
          console.log(`📧 Escalating to ${escalationLevel.role}: ${recipients.join(', ')}`);
          console.log(`   Subject: ${subject}`);
          
          // Update escalation timestamp
          await client.query(
            'UPDATE timeliness_items SET escalated_at = NOW() WHERE id = $1',
            [item.id]
          );
          
          escalated++;
        }
      }
    }

    console.log(`✅ Escalation complete: ${escalated} escalated, ${scanned} scanned`);
    return { escalated, scanned, hours: ESCALATION_LADDERS.default.defaultHours };
    
  } catch (error) {
    console.error("Error running escalations:", error);
    throw error;
  } finally {
    client.release();
  }
}