export const getCategoryBadgeClass = (category: string) => {
  if (!category) return "text-primary bg-primary/5 border-primary/10";
  const norm = category.toLowerCase();
  if (norm.includes("seminar")) return "text-teal-600 bg-teal-50 border-teal-100";
  if (norm.includes("workshop")) return "text-rose-600 bg-rose-50 border-rose-100";
  if (norm.includes("kompetisi") || norm.includes("competition")) return "text-amber-600 bg-amber-50 border-amber-100";
  if (norm.includes("webinar")) return "text-blue-600 bg-blue-50 border-blue-100";
  if (norm.includes("diskusi")) return "text-violet-600 bg-violet-50 border-violet-100";

  const colors = [
    "text-emerald-600 bg-emerald-50 border-emerald-100",
    "text-pink-600 bg-pink-50 border-pink-100",
    "text-orange-600 bg-orange-50 border-orange-100",
    "text-indigo-600 bg-indigo-50 border-indigo-100",
    "text-cyan-600 bg-cyan-50 border-cyan-100",
    "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100",
    "text-lime-600 bg-lime-50 border-lime-100",
    "text-purple-600 bg-purple-50 border-purple-100",
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getCategoryPillColors = (name: string): { active: string; inactive: string } => {
  const norm = name.toLowerCase();
  if (norm.includes("seminar")) return { active: "bg-teal-500 text-white", inactive: "bg-white border border-teal-200 text-teal-700 hover:bg-teal-50" };
  if (norm.includes("workshop")) return { active: "bg-rose-500 text-white", inactive: "bg-white border border-rose-200 text-rose-700 hover:bg-rose-50" };
  if (norm.includes("kompetisi") || norm.includes("competition")) return { active: "bg-amber-500 text-white", inactive: "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50" };
  if (norm.includes("webinar")) return { active: "bg-blue-500 text-white", inactive: "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50" };
  if (norm.includes("diskusi")) return { active: "bg-violet-500 text-white", inactive: "bg-white border border-violet-200 text-violet-700 hover:bg-violet-50" };

  const colors = [
    { active: "bg-emerald-500 text-white", inactive: "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50" },
    { active: "bg-pink-500 text-white", inactive: "bg-white border border-pink-200 text-pink-700 hover:bg-pink-50" },
    { active: "bg-orange-500 text-white", inactive: "bg-white border border-orange-200 text-orange-700 hover:bg-orange-50" },
    { active: "bg-indigo-500 text-white", inactive: "bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50" },
    { active: "bg-cyan-500 text-white", inactive: "bg-white border border-cyan-200 text-cyan-700 hover:bg-cyan-50" },
    { active: "bg-fuchsia-500 text-white", inactive: "bg-white border border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50" },
    { active: "bg-lime-500 text-white", inactive: "bg-white border border-lime-200 text-lime-700 hover:bg-lime-50" },
    { active: "bg-purple-500 text-white", inactive: "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

