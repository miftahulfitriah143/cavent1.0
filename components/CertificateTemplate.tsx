"use client";

import React, { forwardRef } from "react";
import { Sparkles } from "lucide-react";

interface CertificateProps {
  userName: string;
  eventName: string;
  eventDate: string;
  certificateId: string;
}

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateProps>(
  ({ userName, eventName, eventDate, certificateId }, ref) => {
    return (
      <div 
        style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} 
        aria-hidden="true"
      >
        <div
          ref={ref}
          style={{
            width: '1122px', // A4 Landscape roughly
            height: '793px',
            backgroundColor: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '"Inter", sans-serif',
            color: '#1e293b'
          }}
        >
          {/* Background Decorations */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '16px', backgroundColor: '#3b82f6' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '16px', backgroundColor: '#eab308' }} />
          <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', borderRadius: '50%', border: '40px solid #f8fafc', opacity: 0.8 }} />
          <div style={{ position: 'absolute', bottom: '-150px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', border: '60px solid #f0f9ff', opacity: 0.8 }} />

          {/* Content Wrapper */}
          <div style={{ position: 'relative', zIndex: 10, padding: '80px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
              <div style={{ color: '#3b82f6' }}>
                 <Sparkles size={40} />
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '8px', color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
                CAVENT
              </h1>
            </div>

            <p style={{ fontSize: '24px', letterSpacing: '4px', color: '#64748b', textTransform: 'uppercase', marginBottom: '30px' }}>
              Certificate of Attendance
            </p>

            <p style={{ fontSize: '18px', color: '#475569', marginBottom: '20px' }}>Diberikan Kepada:</p>

            <h2 style={{ fontSize: '56px', fontWeight: 800, color: '#1e3a8a', margin: '0 0 40px 0', fontFamily: '"Lora", serif', fontStyle: 'italic', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', display: 'inline-block', minWidth: '600px' }}>
              {userName}
            </h2>

            <p style={{ fontSize: '18px', color: '#475569', marginBottom: '10px' }}>Atas partisipasinya sebagai Peserta dalam acara:</p>
            
            <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 30px 0' }}>
              {eventName}
            </h3>

            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '60px' }}>
              Diselenggarakan pada tanggal <strong>{eventDate}</strong>
            </p>

            {/* Signature Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 'auto', padding: '0 40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '40px' }}>ID: {certificateId}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '200px', borderBottom: '1px solid #cbd5e1', marginBottom: '10px' }}></div>
                <p style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#334155' }}>Penyelenggara Acara</p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Cavent University System</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = "CertificateTemplate";
