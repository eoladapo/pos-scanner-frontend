import { useEffect, useRef, useState } from 'react';

function POSScanner() {
  const videoRef = useRef(null);
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);

  useEffect(() => {
    async function initScanner() {
      if (!('BarcodeDetector' in window)) {
        alert('BarcodeDetector API not supported in this browser.');
        return;
      }

      const detector = new BarcodeDetector({ formats: ['ean_13', 'code_128', 'qr_code'] });

      // ✅ Prefer rear camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      async function detect() {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code !== barcode) {
              setBarcode(code);

              // fetch product
              const res = await fetch(`https://pos-scanner-backend-8u8n.vercel.app/api/products/${code}`);
              if (res.ok) {
                const data = await res.json();
                setProduct(data);
              } else {
                setProduct({ error: 'Product not found' });
              }
            }
          }
        } catch (err) {
          console.error('Barcode detection failed:', err);
        }
        requestAnimationFrame(detect);
      }

      detect();
    }

    initScanner();
  }, [barcode]);

  return (
    <div className="flex flex-col items-center p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">POS Barcode Scanner</h2>

      {/* Camera preview */}
      <div className="w-full aspect-video max-w-md bg-white rounded-xl overflow-hidden shadow-md">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      </div>

      {/* Scanned Barcode */}
      <input
        type="text"
        value={barcode}
        readOnly
        placeholder="Scanned barcode"
        className="mt-3 w-full border p-3 rounded-lg text-lg text-center shadow-sm"
      />

      {/* Product Info */}
      {product && (
        <div className="mt-4 w-full p-4 border rounded-xl bg-gray-100 shadow">
          {product.error ? (
            <p className="text-red-500 text-center">{product.error}</p>
          ) : (
            <>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-700">Price: ${product.price}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default POSScanner;
