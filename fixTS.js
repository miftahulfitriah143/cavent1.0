const fs = require('fs');

// Fix new/page.tsx
let newCode = fs.readFileSync('app/(dashboard)/organizer/events/new/page.tsx', 'utf8');
newCode = newCode.replace('let additionalMediaUrls = [];', 'let additionalMediaUrls: string[] = [];');
newCode = newCode.replace('} catch (error) {', '} catch (error: any) {');
fs.writeFileSync('app/(dashboard)/organizer/events/new/page.tsx', newCode);

// Fix edit/page.tsx
let editCode = fs.readFileSync('app/(dashboard)/organizer/events/[id]/edit/page.tsx', 'utf8');
editCode = editCode.replace('let additionalMediaUrls = [...existingAdditionalMedia];', 'let additionalMediaUrls: string[] = [...existingAdditionalMedia];');
editCode = editCode.replace("const eventRef = doc(db, 'events', params.id as string);", "const eventRef = doc(db, 'events', id);");
editCode = editCode.replace('} catch (error) {', '} catch (error: any) {');
fs.writeFileSync('app/(dashboard)/organizer/events/[id]/edit/page.tsx', editCode);

console.log('Fixed TypeScript errors in both files.');
