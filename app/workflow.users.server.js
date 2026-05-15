import prisma from "./db.server";

// Reads allowed workflow users from the database.
export async function getWorkflowUsers() {
  try {
    let users = await prisma.workflowUser.findMany();
    
    // Seed default user if table is empty
    if (users.length === 0) {
      await prisma.workflowUser.create({
        data: {
          email: "skpjony@gmail.com",
          name: "Super Admin",
          access: JSON.stringify(["admin", "inventory", "production", "dispatch"]),
        },
      });
      users = await prisma.workflowUser.findMany();
    }
    
    return users.map(u => ({
      ...u,
      access: JSON.parse(u.access || "[]"),
    }));
  } catch (err) {
    console.error("[users] Failed to fetch users from DB:", err.message);
    return [];
  }
}

export async function findWorkflowUser(email) {
  if (!email) return null;
  try {
    let user = await prisma.workflowUser.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    // Seed default user if table is empty
    if (!user) {
      const count = await prisma.workflowUser.count();
      if (count === 0) {
        await prisma.workflowUser.create({
          data: {
            email: "skpjony@gmail.com",
            name: "Super Admin",
            access: JSON.stringify(["admin", "inventory", "production", "dispatch"]),
          },
        });
        
        if (email.toLowerCase() === "skpjony@gmail.com") {
          user = await prisma.workflowUser.findUnique({
            where: { email: email.toLowerCase() },
          });
        }
      }
    }
    
    if (!user) return null;
    return {
      ...user,
      access: JSON.parse(user.access || "[]"),
    };
  } catch (err) {
    console.error("[users] Failed to find user in DB:", err.message);
    return null;
  }
}
