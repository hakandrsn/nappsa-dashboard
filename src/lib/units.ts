// Yaygın ölçü birimleri
export const MEASUREMENT_UNITS = [
  // Ağırlık birimleri
  { value: 'g', label: 'Gram (g)', category: 'weight' },
  { value: 'kg', label: 'Kilogram (kg)', category: 'weight' },
  { value: 'oz', label: 'Ons (oz)', category: 'weight' },
  { value: 'lb', label: 'Pound (lb)', category: 'weight' },
  
  // Hacim birimleri
  { value: 'ml', label: 'Mililitre (ml)', category: 'volume' },
  { value: 'l', label: 'Litre (l)', category: 'volume' },
  { value: 'cup', label: 'Fincan (cup)', category: 'volume' },
  { value: 'tbsp', label: 'Yemek kaşığı (tbsp)', category: 'volume' },
  { value: 'tsp', label: 'Çay kaşığı (tsp)', category: 'volume' },
  { value: 'fl_oz', label: 'Sıvı ons (fl oz)', category: 'volume' },
  
  // Adet birimleri
  { value: 'piece', label: 'Adet (piece)', category: 'count' },
  { value: 'slice', label: 'Dilim (slice)', category: 'count' },
  { value: 'clove', label: 'Diş (clove)', category: 'count' },
  { value: 'bunch', label: 'Demet (bunch)', category: 'count' },
  { value: 'head', label: 'Baş (head)', category: 'count' },
  
  // Uzunluk birimleri
  { value: 'cm', label: 'Santimetre (cm)', category: 'length' },
  { value: 'inch', label: 'İnç (inch)', category: 'length' },
  
  // Özel birimler
  { value: 'pinch', label: 'Tutam (pinch)', category: 'special' },
  { value: 'dash', label: 'Damla (dash)', category: 'special' },
  { value: 'to_taste', label: 'Damak zevkine göre', category: 'special' },
  { value: 'as_needed', label: 'Gerektiği kadar', category: 'special' }
]

// Kategoriye göre birimleri grupla
export const UNITS_BY_CATEGORY = {
  weight: MEASUREMENT_UNITS.filter(unit => unit.category === 'weight'),
  volume: MEASUREMENT_UNITS.filter(unit => unit.category === 'volume'),
  count: MEASUREMENT_UNITS.filter(unit => unit.category === 'count'),
  length: MEASUREMENT_UNITS.filter(unit => unit.category === 'length'),
  special: MEASUREMENT_UNITS.filter(unit => unit.category === 'special')
}

// Birim değerini label'a çevir
export function getUnitLabel(value: string): string {
  const unit = MEASUREMENT_UNITS.find(u => u.value === value)
  return unit ? unit.label : value
}

// Birim kategorisini getir
export function getUnitCategory(value: string): string {
  const unit = MEASUREMENT_UNITS.find(u => u.value === value)
  return unit ? unit.category : 'unknown'
}
