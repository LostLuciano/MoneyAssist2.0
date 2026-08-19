export interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
}

/**
 * Intelligent Heuristic Transaction Parser (Ultra-Fast Instant Fallback & Augmentation)
 * Accurately parses Indonesian financial phrases like:
 * "beli bensin 50000", "kopi 25rb", "makan siang 35.000", "gaji freelance 1.5jt", "bayar wifi 350k"
 */
export function extractTransactionHeuristic(input: string): ParsedTransaction | null {
  if (!input || typeof input !== 'string') return null;
  const text = input.trim();

  // 1. Amount Extraction Regex
  // Matches: 1.5jt, 1,5jt, 500rb, 25k, 50.000, 50000, Rp 50.000, rp50k, etc.
  let amount = 0;
  let matchedAmountStr = '';

  // Match "1.5jt" or "2jt" or "500k" or "25rb"
  const multiplierRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(jt|juta|k|rb|ribu)\b/i;
  const multMatch = text.match(multiplierRegex);

  if (multMatch) {
    matchedAmountStr = multMatch[0];
    const num = parseFloat(multMatch[1].replace(',', '.'));
    const unit = multMatch[2].toLowerCase();

    if (unit === 'jt' || unit === 'juta') {
      amount = Math.round(num * 1000000);
    } else if (unit === 'k' || unit === 'rb' || unit === 'ribu') {
      amount = Math.round(num * 1000);
    }
  } else {
    // Match standard numbers: 50.000, 50000, Rp 25.000
    const plainNumRegex = /(?:rp\.?\s*)?(\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b|\b\d{4,9}\b)/i;
    const plainMatch = text.match(plainNumRegex);

    if (plainMatch) {
      matchedAmountStr = plainMatch[0];
      const cleanNum = plainMatch[1].replace(/\./g, '').replace(',', '.');
      amount = parseFloat(cleanNum);
    }
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return null;
  }

  // 2. Type Detection
  const lower = text.toLowerCase();
  const isIncome =
    lower.includes('gaji') ||
    lower.includes('pemasukan') ||
    lower.includes('transfer masuk') ||
    lower.includes('terima') ||
    lower.includes('dapat uang') ||
    lower.includes('income') ||
    lower.includes('cair') ||
    lower.includes('bonus') ||
    lower.includes('dividen');

  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

  // 3. Category Detection
  let category = type === 'income' ? 'Pemasukan Lainnya' : 'Lain-lain';

  if (type === 'income') {
    if (lower.includes('gaji')) category = 'Gaji Utama';
    else if (lower.includes('freelance') || lower.includes('proyek') || lower.includes('side job')) category = 'Freelance & Side Job';
    else if (lower.includes('bisnis') || lower.includes('omset') || lower.includes('jualan')) category = 'Hasil Usaha/Bisnis';
    else if (lower.includes('bonus') || lower.includes('thr')) category = 'Bonus & Tunjangan';
    else if (lower.includes('dividen') || lower.includes('invest')) category = 'Investasi / Dividen';
  } else {
    if (
      lower.includes('makan') ||
      lower.includes('kopi') ||
      lower.includes('nasi') ||
      lower.includes('ayam') ||
      lower.includes('resto') ||
      lower.includes('cafe') ||
      lower.includes('minum') ||
      lower.includes('sarapan') ||
      lower.includes('dinner') ||
      lower.includes('lunch')
    ) {
      category = 'Makanan & Minuman';
    } else if (
      lower.includes('bensin') ||
      lower.includes('pertalite') ||
      lower.includes('pertamax') ||
      lower.includes('solar') ||
      lower.includes('gojek') ||
      lower.includes('grab') ||
      lower.includes('ojol') ||
      lower.includes('maxim') ||
      lower.includes('parkir') ||
      lower.includes('tol') ||
      lower.includes('angkot') ||
      lower.includes('kereta') ||
      lower.includes('mrt')
    ) {
      category = 'Transportasi';
    } else if (
      lower.includes('belanja') ||
      lower.includes('supermarket') ||
      lower.includes('indomaret') ||
      lower.includes('alfamart') ||
      lower.includes('shopee') ||
      lower.includes('tokopedia') ||
      lower.includes('baju') ||
      lower.includes('celana') ||
      lower.includes('sepatu')
    ) {
      category = 'Belanja & Kebutuhan';
    } else if (
      lower.includes('listrik') ||
      lower.includes('pln') ||
      lower.includes('wifi') ||
      lower.includes('indihome') ||
      lower.includes('pulsa') ||
      lower.includes('kuota') ||
      lower.includes('pdam') ||
      lower.includes('air') ||
      lower.includes('iuran')
    ) {
      category = 'Tagihan & Utilitas';
    } else if (
      lower.includes('nonton') ||
      lower.includes('bioskop') ||
      lower.includes('xxi') ||
      lower.includes('game') ||
      lower.includes('steam') ||
      lower.includes('netflix') ||
      lower.includes('spotify') ||
      lower.includes('karaoke')
    ) {
      category = 'Hiburan & Rekreasi';
    } else if (
      lower.includes('obat') ||
      lower.includes('dokter') ||
      lower.includes('apotek') ||
      lower.includes('klinik') ||
      lower.includes('rumah sakit') ||
      lower.includes('vitamin')
    ) {
      category = 'Kesehatan & Medis';
    } else if (
      lower.includes('kursus') ||
      lower.includes('buku') ||
      lower.includes('spp') ||
      lower.includes('kuliah') ||
      lower.includes('sekolah')
    ) {
      category = 'Pendidikan';
    }
  }

  // 4. Clean Description (Strip amount, prefixes like "catat", "tadi", "kemarin", "beli", etc.)
  let desc = text.replace(matchedAmountStr, '').trim();
  desc = desc.replace(/^(catat|tolong catat|tadi|kemarin|hari ini|pengeluaran|pemasukan|beli|bayar)\s+/i, '').trim();
  desc = desc.replace(/^(buat|untuk|ke)\s+/i, '').trim();

  // Capitalize first letter of description
  if (!desc || desc.length <= 1) {
    desc = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
  } else {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return {
    amount,
    type,
    category,
    description: desc,
  };
}
