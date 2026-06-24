const fs = require('fs');

function addSaveDraftNew() {
  let code = fs.readFileSync('app/(dashboard)/organizer/events/new/page.tsx', 'utf8');

  const saveDraftCode = `  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('Judul acara minimal harus diisi untuk menyimpan draft.');
      return;
    }

    if (!auth.currentUser) {
      toast.error('Sesi telah berakhir, silakan login kembali.');
      return;
    }

    setIsLoading(true);
    console.log('Saving draft...');

    try {
      let bannerUrl = '';
      let additionalMediaUrls = [];

      if (formData.bannerPoster) {
        bannerUrl = await uploadImage(formData.bannerPoster);
      }

      if (formData.additionalMedia.length > 0) {
        const uploadPromises = formData.additionalMedia.map(file => uploadImage(file));
        additionalMediaUrls = await Promise.all(uploadPromises);
      }

      await addDoc(collection(db, 'events'), {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        category: formData.category,
        feeType: formData.feeType,
        campusLocation: formData.campusLocation,
        venue: formData.venue,
        maxCapacity: parseInt(formData.maxCapacity) || 0,
        description: formData.description,
        benefits: formData.benefits,
        targetAudience: formData.targetAudience,
        whatYouWillGet: formData.whatYouWillGet.filter(item => item.trim() !== ''),
        termsAndConditions: formData.termsAndConditions.filter(item => item.trim() !== ''),
        registrationStatus: formData.registrationStatus,
        isProdiOnly: formData.isProdiOnly,
        organizerProdi: formData.organizerProdi,
        regOpenDate: formData.regOpenDate,
        regCloseDate: formData.regCloseDate,
        bannerUrl: bannerUrl,
        additionalMedia: additionalMediaUrls,
        status: 'draft',
        organizerId: auth.currentUser.uid,
        organizerName: auth.currentUser.displayName || 'Unknown Organizer',
        createdAt: serverTimestamp(),
      });

      toast.success('Draft berhasil disimpan!');
      router.push('/organizer/events');
    } catch (error) {
      console.error('Draft Save Error:', error);
      toast.error(\`Terjadi kesalahan: \${error.message}\`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {`;

  if (!code.includes('const handleSaveDraft')) {
    code = code.replace('  const handleSubmit = async () => {', saveDraftCode);
    code = code.replace(
      '<button className="hidden md:block text-sm font-bold text-neutral hover:text-dark px-6 py-3.5 rounded-2xl transition-all">',
      '<button type="button" onClick={handleSaveDraft} disabled={isLoading} className="hidden md:block text-sm font-bold text-neutral hover:text-dark px-6 py-3.5 rounded-2xl transition-all disabled:opacity-50">'
    );
    fs.writeFileSync('app/(dashboard)/organizer/events/new/page.tsx', code);
    console.log('Added handleSaveDraft to new/page.tsx');
  } else {
    console.log('handleSaveDraft already exists in new/page.tsx');
  }
}

addSaveDraftNew();
