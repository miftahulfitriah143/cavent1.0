const fs = require('fs');
const path = require('path');

const files = [
  "app/(auth)/login/page.tsx",
  "components/layout/Sidebar.tsx",
  "components/layout/UserNav.tsx",
  "components/layout/PublicNavbar.tsx",
  "components/layout/Navbar.tsx",
  "app/page.tsx",
  "app/tentang/page.tsx",
  "app/events/[id]/page.tsx",
  "app/organizers/[id]/page.tsx",
  "app/(dashboard)/organizer/events/page.tsx",
  "app/(dashboard)/organizer/attendees/page.tsx",
  "app/(dashboard)/admin/users/page.tsx",
  "app/(dashboard)/audiens/page.tsx",
  "app/(dashboard)/audiens/my-events/page.tsx",
  "app/(dashboard)/audiens/my-events/[id]/page.tsx",
  "app/(dashboard)/audiens/ratings/page.tsx"
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let data = fs.readFileSync(filePath, 'utf8');
    // Replace lower case
    data = data.replace(/mahasiswa/g, 'audiens');
    // Replace Capitalized
    data = data.replace(/Mahasiswa/g, 'Audiens');
    // Replace all caps if any (unlikely, but just in case)
    data = data.replace(/MAHASISWA/g, 'AUDIENS');
    
    fs.writeFileSync(filePath, data);
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}
