import { formatIDR } from './currency';

type ExtractedTransaction = Record<string, any>;

const valueOrDash = (value: any) => {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
};

const moneyLine = (label: string, value: any) => {
  const amount = Number(value || 0);
  return amount > 0 ? `${label}: ${formatIDR(amount)}` : null;
};

export function getPaymentMethodFromExtracted(data: ExtractedTransaction = {}) {
  return (
    data.payment_method ||
    data.paymentMethod ||
    data.payment ||
    data.metode_pembayaran ||
    data.source ||
    'E-Wallet'
  );
}

export function buildTransactionDetailNotes(data: ExtractedTransaction = {}, source = 'AI Vision') {
  const lines: string[] = [];

  lines.push(`Sumber: ${source}`);
  if (data.platform || data.marketplace) lines.push(`Platform: ${data.platform || data.marketplace}`);
  if (data.merchant || data.store || data.seller) lines.push(`Toko/Merchant: ${data.merchant || data.store || data.seller}`);
  if (data.order_number || data.orderId || data.invoice_number) {
    lines.push(`Nomor Pesanan: ${data.order_number || data.orderId || data.invoice_number}`);
  }
  if (data.date) lines.push(`Tanggal Dokumen: ${data.date}`);

  const paymentMethod = getPaymentMethodFromExtracted(data);
  if (paymentMethod) lines.push(`Metode Bayar: ${paymentMethod}`);

  [
    moneyLine('Subtotal Produk', data.subtotal),
    moneyLine('Diskon/Voucher', data.discount),
    moneyLine('Ongkir', data.shipping),
    moneyLine('Biaya Layanan/Admin', data.tax_or_fee || data.fee || data.service_fee),
    moneyLine('Total Akhir', data.amount),
  ].forEach((line) => {
    if (line) lines.push(line);
  });

  if (Array.isArray(data.items) && data.items.length > 0) {
    lines.push('Daftar Belanja:');
    data.items.forEach((item: any, index: number) => {
      if (typeof item === 'object') {
        const qty = item.qty || item.quantity || 1;
        const price = Number(item.price || item.unit_price || 0);
        const total = Number(item.total || item.subtotal || item.price || 0);
        const priceText = price > 0 ? ` @${formatIDR(price)}` : '';
        const totalText = total > 0 ? ` = ${formatIDR(total)}` : '';
        lines.push(`${index + 1}. ${valueOrDash(item.name)} (${qty}x${priceText})${totalText}`);
      } else {
        lines.push(`${index + 1}. ${String(item)}`);
      }
    });
  }

  if (data.notes || data.copilot_note) {
    lines.push(`Catatan AI: ${data.notes || data.copilot_note}`);
  }

  return lines.filter(Boolean).join('\n');
}
