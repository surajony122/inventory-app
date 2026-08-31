import { json } from "@react-router/node";
import prisma from "../db.server";
import nodemailer from "nodemailer";

export async function loader({ request }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  
  if (token !== "unniyarcha-daily-secret") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalActive = await prisma.orderCache.count({
      where: {
        status: {
          notIn: ["Dispatched", "Cancelled"]
        }
      }
    });

    const readyForDispatch = await prisma.orderCache.count({
      where: { status: "Ready for Dispatch" }
    });

    const awaitingInventory = await prisma.orderCache.count({
      where: { status: "Awaiting Inventory Check" }
    });

    const inProduction = await prisma.orderCache.count({
      where: { status: "In Production" }
    });

    const delayed = await prisma.orderCache.count({
      where: {
        status: { notIn: ["Dispatched", "Cancelled"] },
        createdAt: { lt: new Date(Date.now() - 7 * 86400000) } 
      }
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Unniyarcha Daily Workflow Report</h2>
        <p style="color: #34495e;">Here is your automated daily summary of the inventory and production workflow.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background: #f4f4f4;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; color: #2c3e50;">Metric</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd; color: #2c3e50;">Count</th>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; color: #34495e;">Total Active Orders in Workflow</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #34495e;">${totalActive}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; color: #34495e;">Awaiting Inventory Check</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #34495e;">${awaitingInventory}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; color: #34495e;">In Production</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #34495e;">${inProduction}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; color: #27ae60;">Ready for Dispatch</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #27ae60;">${readyForDispatch}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; color: #e74c3c;">Delayed Orders (7+ Days Old)</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #e74c3c;">${delayed}</td>
          </tr>
        </table>
        <p style="margin-top: 30px; font-size: 12px; color: #95a5a6; border-top: 1px solid #eee; padding-top: 15px;">
          This is an automated email from the Unniyarcha Workflow App.
        </p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true", 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    if(!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP credentials missing. Email not sent.");
      return json({ success: false, error: "SMTP credentials missing from environment (SMTP_USER, SMTP_PASS)" }, { status: 500 });
    }

    await transporter.sendMail({
      from: \`"Unniyarcha Workflow" <\${process.env.SMTP_USER}>\`,
      to: "pulkit@unniyarcha.com",
      subject: \`Daily Workflow Report - \${new Date().toLocaleDateString()}\`,
      html: html
    });

    return json({ success: true, message: "Report sent successfully." });

  } catch (error) {
    console.error("Failed to send daily report", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
