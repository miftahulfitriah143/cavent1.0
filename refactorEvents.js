const fs = require('fs');

let code = fs.readFileSync('app/(dashboard)/organizer/events/page.tsx', 'utf8');

// Remove showQRModal state
code = code.replace(/const \[showQRModal, setShowQRModal\] = useState[^;]+;/g, '');
code = code.replace(/const \[qrDataUrl, setQrDataUrl\] = useState[^;]+;/g, '');
code = code.replace(/const \[isFullScreenQR, setIsFullScreenQR\] = useState[^;]+;/g, '');

// Remove the QR generation useEffect and fullscreen effects
const startEffectIndex = code.indexOf('// Generate QR dynamically every 15s');
const endEffectIndex = code.indexOf('const handleDelete = async (eventId: string, title: string) => {');
if (startEffectIndex !== -1 && endEffectIndex !== -1) {
  code = code.substring(0, startEffectIndex) + code.substring(endEffectIndex);
}

// In handleStartEvent, remove handleShowQR(eventId, title);
code = code.replace('handleShowQR(eventId, title);', '');

// Change the QrCode button to Link
const searchButton = `<button 
                         onClick={() => handleShowQR(event.id, event.title)}
                         className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"
                         title="Lihat QR Absensi"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>`;
const linkButton = `<Link 
                         href={\`/organizer/events/\${event.id}/attendance\`}
                         className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"
                         title="Manajemen Absensi"
                        >
                          <QrCode className="h-4 w-4" />
                        </Link>`;
code = code.replace(searchButton, linkButton);

// Remove the QR Modal JSX
const modalStart = code.indexOf('{/* QR Code Modal for Attendance */}');
if (modalStart !== -1) {
  code = code.substring(0, modalStart) + '    </div>\n  );\n}\n';
}

fs.writeFileSync('app/(dashboard)/organizer/events/page.tsx', code);
console.log('Modified events/page.tsx successfully.');
