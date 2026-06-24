const fs = require('fs');

let code = fs.readFileSync('app/(dashboard)/organizer/events/[id]/attendance/page.tsx', 'utf8');

// Add X to lucide-react import
code = code.replace('AlertCircle', 'AlertCircle,\n  X');

// Add isFullScreenQR state
code = code.replace('const [isRefreshing, setIsRefreshing] = useState(false);', 'const [isRefreshing, setIsRefreshing] = useState(false);\n  const [isFullScreenQR, setIsFullScreenQR] = useState(false);');

// Add fullscreenchange effect
const fullscreenEffect = `
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreenQR(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
`;

code = code.replace('// Dynamic QR Code Generator', fullscreenEffect + '\n  // Dynamic QR Code Generator');

// Add Fullscreen QR UI
const fullscreenUI = `
      {isFullScreenQR && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <button 
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              }
              setIsFullScreenQR(false);
            }} 
            className="absolute top-8 right-8 p-4 bg-gray-50 hover:bg-gray-100 rounded-full text-dark transition-all"
          >
            <X className="h-6 w-6" />
          </button>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-dark text-center mb-8 tracking-tight max-w-4xl">{event?.title}</h1>
          <h2 className="text-2xl lg:text-3xl font-bold text-neutral mb-12">QR Code Absensi</h2>
          
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-primary/5 border border-gray-100 w-full max-w-[400px] lg:max-w-[500px] aspect-square flex items-center justify-center mb-12">
             {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <div className="animate-pulse bg-gray-200 w-full h-full rounded-2xl"></div>
              )}
          </div>
          
          <p className="text-lg lg:text-xl font-medium text-neutral text-center bg-gray-50 px-8 py-4 rounded-full border border-gray-200 flex items-center gap-3">
             <RefreshCw className="h-5 w-5 animate-spin text-primary" />
             Kode QR akan diperbarui setiap 30 detik
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
`;

code = code.replace('<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">', fullscreenUI);

// Update Maximize button behavior
const maximizeButton = `onClick={() => {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                  elem.requestFullscreen();
                }
              }}`;
const newMaximizeButton = `onClick={() => {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                  elem.requestFullscreen();
                }
                setIsFullScreenQR(true);
              }}`;

code = code.replace(maximizeButton, newMaximizeButton);

fs.writeFileSync('app/(dashboard)/organizer/events/[id]/attendance/page.tsx', code);
console.log('Successfully updated fullscreen logic in attendance page.');
