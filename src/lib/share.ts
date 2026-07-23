// Share-page init — draws the focus chord for the one pre-selected metro.
// The readout/rest/income are already server-rendered (no client fetch, per §8.2);
// this only adds the hero, and makes its partner nodes navigate to their pages.

import { VIEW_BY_SLUG, MAX_NET } from './data';
import { renderFocus } from './viz';

const heroSvg = document.querySelector('#hero') as SVGSVGElement | null;
if (heroSvg) {
  const slug = heroSvg.dataset.slug || '';
  const m = VIEW_BY_SLUG.get(slug) || null;
  renderFocus(heroSvg, m, MAX_NET, (p) => {
    location.href = `/metro/${p.slug}`;
  });
}
