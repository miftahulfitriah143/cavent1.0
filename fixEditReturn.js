const fs = require('fs');

let code = fs.readFileSync('app/(dashboard)/organizer/events/[id]/edit/page.tsx', 'utf8');

const searchStr1 = `  if (isLoading) {
    return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">`;

const searchStr2 = `  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">`;

const searchStr3 = `  if (isLoading) {
    return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">`;

const replaceStr = `  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="h-14 w-14 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
        <p className="text-neutral text-sm font-bold tracking-wide uppercase">Memuat Data Acara...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">`;

let replaced = false;
if (code.includes(searchStr1)) {
  code = code.replace(searchStr1, replaceStr);
  replaced = true;
} else if (code.includes(searchStr2)) {
  code = code.replace(searchStr2, replaceStr);
  replaced = true;
} else {
  // Let's try regex just in case
  code = code.replace(/if\s*\(isLoading\)\s*\{\s*return\s*\(\s*<div\s*className="max-w-5xl\s*mx-auto\s*space-y-6\s*pb-20">/, replaceStr);
  replaced = true;
}

if (code.endsWith('}\r\n}\r\n')) {
  code = code.substring(0, code.lastIndexOf('}'));
} else if (code.endsWith('}\n}\n')) {
  code = code.substring(0, code.lastIndexOf('}'));
} else if (code.endsWith('}\n}')) {
  code = code.substring(0, code.lastIndexOf('}'));
}

fs.writeFileSync('app/(dashboard)/organizer/events/[id]/edit/page.tsx', code);
console.log('Fixed loading state and return in edit/page.tsx. Replaced:', replaced);
