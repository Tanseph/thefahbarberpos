/**
 * Updates the browser tab's favicon dynamically to the store's uploaded logo
 */
export function updateFavicon(logoUrl?: string | null) {
  if (typeof document === 'undefined') return;

  const existingIcons = document.querySelectorAll<HTMLLinkElement>(
    "link[rel*='icon'], link[rel='apple-touch-icon']"
  );

  if (logoUrl && logoUrl.trim() !== '') {
    // Remove existing favicon links to trigger browser refresh
    existingIcons.forEach((el) => el.remove());

    const link = document.createElement('link');
    link.id = 'app-dynamic-favicon';
    link.rel = 'icon';
    link.href = logoUrl;

    if (logoUrl.startsWith('data:image/svg+xml')) {
      link.type = 'image/svg+xml';
    } else if (logoUrl.startsWith('data:image/png')) {
      link.type = 'image/png';
    } else if (logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg')) {
      link.type = 'image/jpeg';
    } else if (logoUrl.startsWith('data:image/webp')) {
      link.type = 'image/webp';
    }

    document.head.appendChild(link);

    // Also support Apple touch icon
    const appleTouch = document.createElement('link');
    appleTouch.rel = 'apple-touch-icon';
    appleTouch.href = logoUrl;
    document.head.appendChild(appleTouch);
  } else {
    // If logo removed or empty, clean up dynamic favicon
    existingIcons.forEach((el) => el.remove());
  }
}
