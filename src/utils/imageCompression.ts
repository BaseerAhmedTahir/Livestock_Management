export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set max dimensions - much smaller for faster uploads (80-90% reduction)
        const maxWidth = 400;
        const maxHeight = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.4; // Initial quality (40%) - very aggressive compression for 80-90% reduction
        const maxFileSize = 100 * 1024; // 100 KB - much smaller target size

        const attemptCompression = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed.'));
                return;
              }

              if (blob.size > maxFileSize && quality > 0.1) {
                quality -= 0.02; // Reduce quality by 2% for finer control
                attemptCompression(); // Re-attempt with lower quality
              } else {
                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
              }
            },
            'image/jpeg',
            quality
          );
        };

        attemptCompression();
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};