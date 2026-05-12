import { 
  Plus, 
  Calendar, 
  Users, 
  CheckCircle, 
  Star,
  ArrowUpRight
} from "lucide-react";

export default function OrganizerDashboard() {
  return (
    <div className="py-2 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">Dashboard Penyelenggara</h1>
          <p className="text-sm text-neutral mt-1">Ringkasan Aktivitas dan acara Anda</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0e517a] transition-colors shadow-sm">
          <Plus className="h-4 w-4" />
          Buat Acara Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-4xl font-bold text-dark tracking-tight">3</h3>
            <div className="p-2 bg-teal-50 rounded-lg text-secondary">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Total Acara</p>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-auto">
            <ArrowUpRight className="h-3 w-3" />
            <span>1 bulan ini</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-4xl font-bold text-dark tracking-tight">160</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Total Pendaftar</p>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-auto">
            <ArrowUpRight className="h-3 w-3" />
            <span>12% dari sebelumnya</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-4xl font-bold text-dark tracking-tight">89%</h3>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Tingkat Kehadiran</p>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-auto">
            <ArrowUpRight className="h-3 w-3" />
            <span>4% dari rata-rata</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-4xl font-bold text-dark tracking-tight">4.7</h3>
            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-500">
              <Star className="h-5 w-5 fill-yellow-500" />
            </div>
          </div>
          <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Rating rata-rata</p>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-auto">
            <ArrowUpRight className="h-3 w-3" />
            <span>Sangat baik</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-dark">Daftar Acara Saya (Terbaru)</h2>
          <button className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#0e517a] transition-colors shadow-sm">
            Tambah
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-neutral text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-100">Nama Acara</th>
                <th className="px-6 py-4 border-b border-gray-100">Tanggal</th>
                <th className="px-6 py-4 border-b border-gray-100">Status</th>
                <th className="px-6 py-4 border-b border-gray-100">Pendaftar</th>
                <th className="px-6 py-4 border-b border-gray-100">Kapasitas</th>
                <th className="px-6 py-4 border-b border-gray-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {/* Row 1 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-dark text-sm">Seminar Nasional Teknologi 2026</div>
                  <div className="text-xs text-neutral mt-0.5">Aula Firmanzah Lt.8</div>
                </td>
                <td className="px-6 py-4 text-dark font-medium">25 Mei 2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-100">
                    Terbuka
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-dark">180</td>
                <td className="px-6 py-4 font-bold text-dark">300</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="px-4 py-1.5 border border-gray-200 rounded-md text-xs font-bold text-primary hover:border-primary hover:bg-primary-50 transition-colors">
                      Edit
                    </button>
                    <button className="px-4 py-1.5 bg-primary text-white rounded-md text-xs font-bold shadow-sm hover:bg-[#0e517a] transition-colors">
                      Check-in
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-dark text-sm">Workshop UI/UX Design Thinking</div>
                  <div className="text-xs text-neutral mt-0.5">Lab Komputer</div>
                </td>
                <td className="px-6 py-4 text-dark font-medium">25 Mei 2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-100">
                    Terbuka
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-dark">50</td>
                <td className="px-6 py-4 font-bold text-dark">300</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="px-4 py-1.5 border border-gray-200 rounded-md text-xs font-bold text-primary hover:border-primary hover:bg-primary-50 transition-colors">
                      Edit
                    </button>
                    <button className="px-4 py-1.5 bg-primary text-white rounded-md text-xs font-bold shadow-sm hover:bg-[#0e517a] transition-colors">
                      Check-in
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-dark text-sm">IT Fest 2026</div>
                  <div className="text-xs text-neutral mt-0.5">Aula Firmanzah Lt.8</div>
                </td>
                <td className="px-6 py-4 text-dark font-medium">25 Okt 2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                    Aktif
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-dark">0</td>
                <td className="px-6 py-4 font-bold text-dark">300</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="px-4 py-1.5 border border-gray-200 rounded-md text-xs font-bold text-primary hover:border-primary hover:bg-primary-50 transition-colors">
                      Edit
                    </button>
                    <button className="px-4 py-1.5 bg-primary text-white rounded-md text-xs font-bold shadow-sm hover:bg-[#0e517a] transition-colors">
                      Check-in
                    </button>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
