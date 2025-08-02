import QRCode from 'qrcode';

export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const parseQRCode = (qrText: string): { type: string; tagNumber: string; id: string } | null => {
  const match = qrText.match(/^GOAT_(.+)_(.+)$/);
  if (match) {
    return {
      type: 'GOAT',
      tagNumber: match[1],
      id: match[2]
    };
  }
  return null;
};