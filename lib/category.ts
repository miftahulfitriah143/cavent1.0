export const getCategoryBadgeClass = (category: string) => {
  if (!category) return "text-primary bg-primary/5 border-primary/10";
  const norm = category.toLowerCase();
  if (norm.includes("seminar")) return "text-teal-600 bg-teal-50 border-teal-100";
  if (norm.includes("workshop")) return "text-rose-600 bg-rose-50 border-rose-100";
  if (norm.includes("kompetisi") || norm.includes("competition")) return "text-amber-600 bg-amber-50 border-amber-100";
  if (norm.includes("webinar")) return "text-blue-600 bg-blue-50 border-blue-100";
  if (norm.includes("diskusi")) return "text-violet-600 bg-violet-50 border-violet-100";

  const colors = [
    "text-blue-600 bg-blue-50 border-blue-100",
    "text-emerald-600 bg-emerald-50 border-emerald-100",
    "text-pink-600 bg-pink-50 border-pink-100",
    "text-orange-600 bg-orange-50 border-orange-100",
    "text-indigo-600 bg-indigo-50 border-indigo-100",
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
