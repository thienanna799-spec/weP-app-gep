export const printBatchQRs = (rolls: any[], productName?: string, specification?: string, batchId?: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để in tem.');
    return;
  }

  const displayBatchId = batchId ? batchId.slice(-6).toUpperCase() : '';

  printWindow.document.write(`<!DOCTYPE html><html><head><title>In QR - ${productName} ${displayBatchId ? `- Lô ${displayBatchId}` : ''}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; background: #fff; }
      @page { size: auto; margin: 0mm; }
      
      .page-break {
        page-break-after: always;
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 5mm;
      }
      
      .label-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        text-align: center;
      }

      .product-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .specification { font-size: 10px; margin-bottom: 4px; }
      
      .qr-svg { max-width: 80%; max-height: 60vh; width: auto; height: auto; }
      .qr-code-text { font-size: 16px; font-weight: bold; margin-top: 4px; letter-spacing: 1px; }
      .batch-info { font-size: 10px; margin-top: 2px; color: #333; }
      
      @media print {
        body { width: 100%; }
      }
    </style>
  </head><body>`);

  rolls.forEach((roll) => {
    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(roll.qrCode);
    
    printWindow.document.write(`
      <div class="page-break">
        <div class="label-container">
          <div class="product-name">${productName || 'Sản phẩm'}</div>
          ${specification ? `<div class="specification">${specification}</div>` : ''}
          
          <img src="${qrUrl}" class="qr-svg" />
          
          <div class="qr-code-text">${roll.qrCode}</div>
          <div class="batch-info">${roll.code || ''} ${displayBatchId ? `| Lô: ${displayBatchId}` : ''}</div>
        </div>
      </div>
    `);
  });

  printWindow.document.write('</body></html>');
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 1000);
};
