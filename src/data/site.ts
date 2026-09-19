// ============================================================
//  ALLE VASTE TEKSTEN VAN DE SITE STAAN HIER
//  Wil je een zin op de homepage of in de footer aanpassen?
//  Verander de tekst tussen de aanhalingstekens en sla op.
// ============================================================

export const site = {
  name: 'One Way Reizen',
  tagline: 'Een reisblog zonder retourticket',
  description:
    'Solo op pad langs 65+ landen, van drukke steden tot plekken waar bijna niemand komt. Praktische gidsen, eerlijke verhalen, geen poeha.',

  // Foto bovenaan de homepage en op pagina's zonder eigen foto
  heroImage: '/images/hero.jpg',

  home: {
    title: 'Een klein beetje van heel veel plekken',
    text: 'Solo op pad langs 65+ landen, van drukke steden tot plekken waar bijna niemand komt. Praktische gidsen, eerlijke verhalen, geen poeha.',
    regionsTitle: 'Ontdek per regio',
    latestTitle: 'Nieuwste verhalen',
    themesTitle: 'Zoek je avontuur',
  },

  // Cijfers in de donkere strook op de homepage (haal weg wat je niet wilt tonen)
  stats: [
    { value: '65+', label: 'landen bezocht' },
    { value: '3', label: 'jaar onderweg' },
  ],

  about: {
    title: 'Over mij',
    image: '/images/over-mij.jpg',
    paragraphs: [
      'Al drie jaar onderweg, zonder vaste route en met een camera in de aanslag. Ik schrijf over de plekken waar ik kom, groot of klein, bekend of onbekend, met tips die je echt kunt gebruiken.',
    ],
  },

  footer: {
    text: 'Een reisblog zonder retourticket.',
  },
};
