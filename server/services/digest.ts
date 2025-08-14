import { sendEmail } from "./notifications";
import { storage } from "../storage";

/**
 * Weekly digest: Sends a Monday 09:00 email summary to supervisors/managers
 */
export async function runWeeklyDigest() {
  try {
    console.log("Running weekly digest...");
    
    // Get all projects with supervisor emails
    const projects = await storage.getProjects();
    const projectsWithSupervisors = projects.filter(p => p.supervisorEmail);
    
    let sent = 0;
    for (const project of projectsWithSupervisors) {
      const subject = `Weekly Project Digest - ${project.name}`;
      const html = `
        <h2>Weekly Project Summary: ${project.name}</h2>
        <p><strong>Status:</strong> ${project.status}</p>
        <p><strong>Location:</strong> ${project.location || 'N/A'}</p>
        <p><strong>Progress:</strong> ${project.progress || 0}%</p>
        <hr>
        <p>This is your weekly project digest. Check the Supervisor Portal for detailed updates.</p>
      `;
      
      if (project.supervisorEmail) {
        await sendEmail({
          to: project.supervisorEmail,
          subject,
          html,
        });
        sent++;
      }
    }
    
    return { sent, projects: projectsWithSupervisors.length };
  } catch (error) {
    console.error("Error running weekly digest:", error);
    throw error;
  }
}