// Reads allowed workflow users from WORKFLOW_USERS env var (JSON array).
// Format: [{"email":"x@y.com","name":"Name","access":["admin","inventory","production","dispatch"]}]
export function getWorkflowUsers() {
  try {
    const raw = process.env.WORKFLOW_USERS;
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function findWorkflowUser(email) {
  if (!email) return null;
  const users = getWorkflowUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}
