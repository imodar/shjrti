/**
 * Singleton holding the active public-share context for the current page.
 * Set by CustomDomainRedirect / StitchPublicTree on mount. Read by image
 * resolution hooks so they can request signed URLs via the
 * `get-shared-image` edge function instead of failing on private buckets.
 */
export type PublicShareContext = {
  familyId?: string;
  shareToken?: string;
  customDomain?: string;
  password?: string;
};

let current: PublicShareContext | null = null;

export const setPublicShareContext = (ctx: PublicShareContext | null) => {
  current = ctx;
};

export const getPublicShareContext = (): PublicShareContext | null => current;

export const hasPublicShareContext = (): boolean =>
  !!(current && (current.shareToken || current.customDomain));