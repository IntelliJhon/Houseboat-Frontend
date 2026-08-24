export interface PricingPolicySettings {
  commissionPercent: number;
  gstPercent: number;
  bookingFee: number;
  cancellationPolicy: string;
}

export const PRICING_POLICY_STORAGE_KEY = 'b4boat_pricing_policy_config';

export const DEFAULT_PRICING_POLICY: PricingPolicySettings = {
  commissionPercent: 5.0,
  gstPercent: 18.0,
  bookingFee: 250,
  cancellationPolicy: 'Moderate (100% refund up to 7 days before check-in)'
};

// Retrieve current live pricing policy settings
export const getPricingPolicy = (): PricingPolicySettings => {
  try {
    const saved = localStorage.getItem(PRICING_POLICY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        commissionPercent: Number(parsed.commissionPercent) ?? DEFAULT_PRICING_POLICY.commissionPercent,
        gstPercent: Number(parsed.gstPercent) ?? DEFAULT_PRICING_POLICY.gstPercent,
        bookingFee: Number(parsed.bookingFee) ?? DEFAULT_PRICING_POLICY.bookingFee,
        cancellationPolicy: parsed.cancellationPolicy || DEFAULT_PRICING_POLICY.cancellationPolicy,
      };
    }
  } catch (e) {
    console.error('Error loading pricing policy:', e);
  }
  return DEFAULT_PRICING_POLICY;
};

// Save updated pricing policy settings & dispatch event for reactive UI updates across all components
export const savePricingPolicy = (policy: Partial<PricingPolicySettings>): PricingPolicySettings => {
  const current = getPricingPolicy();
  const updated: PricingPolicySettings = {
    commissionPercent: policy.commissionPercent !== undefined ? Number(policy.commissionPercent) : current.commissionPercent,
    gstPercent: policy.gstPercent !== undefined ? Number(policy.gstPercent) : current.gstPercent,
    bookingFee: policy.bookingFee !== undefined ? Number(policy.bookingFee) : current.bookingFee,
    cancellationPolicy: policy.cancellationPolicy !== undefined ? String(policy.cancellationPolicy) : current.cancellationPolicy,
  };
  
  localStorage.setItem(PRICING_POLICY_STORAGE_KEY, JSON.stringify(updated));
  
  // Dispatch custom browser event for instant live reactivity across components
  window.dispatchEvent(new CustomEvent('b4boat_pricing_policy_changed', { detail: updated }));
  return updated;
};

// Compute dynamic pricing breakdown for any base vessel price
export const calculateDynamicBookingPrice = (basePricePerNight: number, nights: number = 1) => {
  const policy = getPricingPolicy();
  const baseTotal = basePricePerNight * nights;
  const bookingFee = policy.bookingFee;
  const subtotal = baseTotal + bookingFee;
  const gstAmount = Math.round(subtotal * (policy.gstPercent / 100));
  const totalAmount = subtotal + gstAmount;
  const platformCommission = Math.round(baseTotal * (policy.commissionPercent / 100));
  const hostNetEarnings = totalAmount - platformCommission - gstAmount;

  return {
    baseTotal,
    bookingFee,
    subtotal,
    gstPercent: policy.gstPercent,
    gstAmount,
    totalAmount,
    commissionPercent: policy.commissionPercent,
    platformCommission,
    hostNetEarnings,
    cancellationPolicy: policy.cancellationPolicy,
  };
};
