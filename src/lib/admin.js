// Sirf is email wala user admin panel dekh sakta hai.
// Dhyan rakho: asli suraksha firestore.rules se aati hai, wahan bhi yahi email likhi hai.
// Email badalni ho to dono jagah badlo.
export const ADMIN_EMAIL = "amrjeetgaming2@gmail.com";

export function isAdmin(user) {
  return !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;
}
