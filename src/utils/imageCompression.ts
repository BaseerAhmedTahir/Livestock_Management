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

        // Balanced size: not too small, not too large
        const maxWidth = 800;
        const maxHeight = 800;

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

        let quality = 0.7; // Start with high-ish quality
        const maxFileSize = 250 * 1024; // 250 KB target size (tunable)

        const attemptCompression = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed.'));
                return;
              }

              // Keep trying until we hit file size or quality floor
              if (blob.size > maxFileSize && quality > 0.4) {
                quality -= 0.05;
                attemptCompression();
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
