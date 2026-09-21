// ------------------------------------------------------------
//  Maakt van een foto in een artikel een nette figuur:
//   - de beschrijving tussen [ ] wordt een klein bijschrift onder de foto
//     (laat je die leeg, dan komt er geen bijschrift)
//   - woorden tussen aanhalingstekens achter het pad bepalen de plek en grootte
//     bijv.  ![Bijschrift](/images/foto.jpg "rechts klein")
//   - twee of drie foto's direct onder elkaar (zonder lege regel)
//     komen automatisch naast elkaar te staan
//  Hier hoef je normaal nooit iets te veranderen.
// ------------------------------------------------------------

const KEYWORDS = ['links', 'rechts', 'midden', 'klein', 'breed', 'smal', 'vierkant', 'liggend', 'hoog'];
// Woorden die de vorm van een rij foto's naast elkaar bepalen
const ROW_KEYWORDS = ['liggend', 'vierkant', 'hoog'];

const isWhitespace = (n) => n.type === 'text' && n.value.trim() === '';
const isBreak = (n) => n.type === 'element' && n.tagName === 'br';
const isImg = (n) => n.type === 'element' && n.tagName === 'img';

function makeFigure(img, inRow) {
  const props = img.properties || {};
  const alt = String(props.alt ?? '').trim();
  const words = String(props.title ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const classes = inRow ? ['foto', 'foto--rij-item'] : ['foto'];
  if (!inRow) {
    for (const word of words) {
      if (KEYWORDS.includes(word)) classes.push('foto--' + word);
    }
  }

  const cleanProps = { ...props, loading: 'lazy', decoding: 'async' };
  delete cleanProps.title;

  const children = [{ ...img, properties: cleanProps }];
  if (alt) {
    children.push({
      type: 'element',
      tagName: 'figcaption',
      properties: {},
      children: [{ type: 'text', value: alt }],
    });
  }
  return { type: 'element', tagName: 'figure', properties: { className: classes }, children };
}

function makeRow(imgs) {
  // Een woord achter een van de foto's (bijv. "hoog") bepaalt de vorm van de hele rij
  const words = imgs.flatMap((img) =>
    String((img.properties || {}).title ?? '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean),
  );
  const classes = ['foto-rij'];
  for (const word of words) {
    if (ROW_KEYWORDS.includes(word) && !classes.includes('foto-rij--' + word)) {
      classes.push('foto-rij--' + word);
    }
  }
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: classes, style: '--cols:' + Math.min(imgs.length, 3) },
    children: imgs.map((img) => makeFigure(img, true)),
  };
}

function walk(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === 'element' && child.tagName === 'p') {
      const parts = child.children.filter((c) => !isWhitespace(c) && !isBreak(c));
      if (parts.length > 0 && parts.every(isImg)) {
        return parts.length === 1 ? makeFigure(parts[0], false) : makeRow(parts);
      }
    }
    walk(child);
    return child;
  });
}

export default function rehypeFotos() {
  return (tree) => {
    walk(tree);
  };
}
