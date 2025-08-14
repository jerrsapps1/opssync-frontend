/**
 * Field-friendly email templates with a simple color legend.
 * Status terms: On time (green), Due soon (yellow), Late (red)
 */

export function emailLegend() {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:12px 0 4px">
      <tr>
        <td style="font:14px/20px system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#111;">
          <strong>Legend:</strong>
          <span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;">On time</span>
          <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:#fef9c3;color:#92400e;border:1px solid #fde68a;">Due soon</span>
          <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:#fecaca;color:#7f1d1d;border:1px solid #fca5a5;">Late</span>
        </td>
      </tr>
    </table>
  `;
}

export function wrapEmail(bodyHtml: string, title = "Update") {
  return `
  <div style="max-width:640px;margin:0 auto;padding:16px 12px;font:14px/20px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;background:#fff">
    <h2 style="margin:0 0 8px;font:600 18px/24px system-ui,-apple-system,Segoe UI,Roboto,sans-serif">${title}</h2>
    ${emailLegend()}
    ${bodyHtml}
    <p style="margin-top:16px;color:#6b7280;font-size:12px">You are receiving this because notifications are enabled for your organization. Update preferences in Organization Settings.</p>
  </div>`;
}

export function statusPill(status: "On time" | "Due soon" | "Late") {
  const styles = {
    "On time": "background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;",
    "Due soon": "background:#fef9c3;color:#92400e;border:1px solid #fde68a;",
    "Late": "background:#fecaca;color:#7f1d1d;border:1px solid #fca5a5;",
  } as const;
  return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;${styles[status]}">${status}</span>`;
}
