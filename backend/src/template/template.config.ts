// ─────────────────────────────────────────────────────────────────────────────
// template.config.ts
// Capa de configuración del template Locotoons.
// Para derivar un nuevo rubro: solo modificar este archivo.
// No contiene lógica de aplicación — solo datos de negocio y constantes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Swagger ───────────────────────────────────────────────────────────────────

export const TEMPLATE_SWAGGER = {
  title: 'Locotoons API',
  description: 'API ecommerce para coleccionables retro/anime',
  version: '0.1.0',
} as const;

// ── Auth ──────────────────────────────────────────────────────────────────────

export const TEMPLATE_JWT_SECRET_FALLBACK = 'locotoons-secret';

// ── Base de datos ─────────────────────────────────────────────────────────────

export const TEMPLATE_DB = {
  defaultName: 'locotoons_dev',
} as const;

// ── Categorías oficiales ──────────────────────────────────────────────────────

export const TEMPLATE_OFFICIAL_CATEGORIES = [
  {
    name: 'Pokémon',
    slug: 'pokemon',
    description: 'Figuras, cartas, peluches y coleccionables del universo Pokemon.',
  },
  {
    name: 'Digimon',
    slug: 'digimon',
    description: 'Productos, figuras y articulos para fans de Digimon.',
  },
  {
    name: 'Maquetas',
    slug: 'maquetas',
    description: 'Kits, modelos armables y piezas para coleccionistas y hobbistas.',
  },
  {
    name: 'Dragon Ball',
    slug: 'dragon-ball',
    description: 'Figuras, accesorios y coleccionables inspirados en Dragon Ball.',
  },
  {
    name: 'Star Wars',
    slug: 'star-wars',
    description: 'Coleccionables, figuras y articulos clasicos de Star Wars.',
  },
  {
    name: 'Anime',
    slug: 'anime',
    description: 'Merchandising, figuras y accesorios de tus series favoritas.',
  },
  {
    name: 'Ropa',
    slug: 'ropa',
    description: 'Poleras, chaquetas y prendas con estilo geek y otaku.',
  },
] as const;

export type OfficialCategory = (typeof TEMPLATE_OFFICIAL_CATEGORIES)[number];

// ── Seed products ─────────────────────────────────────────────────────────────

export type SeedProductReview = {
  authorName: string;
  rating: number;
  comment: string;
};

export type SeedProductSpecification = {
  label: string;
  value: string;
};

export type SeedProduct = {
  title: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categorySlug: string;
  specifications: SeedProductSpecification[];
  reviews: SeedProductReview[];
};

function buildReviews(productName: string): SeedProductReview[] {
  return [
    {
      authorName: 'Camila',
      rating: 5,
      comment: `${productName} llego en buen estado y se ve muy bien en vitrina.`,
    },
    {
      authorName: 'Matias',
      rating: 4,
      comment: `Buen producto para demo de tienda, con detalles visuales atractivos en ${productName}.`,
    },
  ];
}

export const TEMPLATE_SEED_PRODUCTS: SeedProduct[] = [
  {
    title: 'Figura Pikachu Classic Pose',
    slug: 'figura-pikachu-classic-pose',
    description: 'Figura coleccionable de Pikachu con acabado brillante, ideal para vitrina y regalo.',
    price: 24900,
    stock: 12,
    imageUrl: 'https://placehold.co/600x600/png?text=Pikachu+Classic+Pose',
    categorySlug: 'pokemon',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '14 cm' },
      { label: 'Linea', value: 'Pokemon Display' },
    ],
    reviews: buildReviews('Figura Pikachu Classic Pose'),
  },
  {
    title: 'Figura Charizard Battle Version',
    slug: 'figura-charizard-battle-version',
    description: 'Figura de Charizard en pose de batalla con base de exhibicion y terminaciones premium.',
    price: 36500,
    stock: 9,
    imageUrl: 'https://placehold.co/600x600/png?text=Charizard+Battle+Version',
    categorySlug: 'pokemon',
    specifications: [
      { label: 'Material', value: 'PVC reforzado' },
      { label: 'Altura', value: '21 cm' },
      { label: 'Incluye', value: 'Base de exhibicion' },
    ],
    reviews: buildReviews('Figura Charizard Battle Version'),
  },
  {
    title: 'Peluche Eevee Soft Collection',
    slug: 'peluche-eevee-soft-collection',
    description: 'Peluche suave de Eevee pensado para fans de Pokemon que buscan regalo o decoracion.',
    price: 21900,
    stock: 14,
    imageUrl: 'https://placehold.co/600x600/png?text=Eevee+Soft+Collection',
    categorySlug: 'pokemon',
    specifications: [
      { label: 'Material', value: 'Felpa suave' },
      { label: 'Tamaño', value: '26 cm' },
      { label: 'Uso', value: 'Coleccion y regalo' },
    ],
    reviews: buildReviews('Peluche Eevee Soft Collection'),
  },
  {
    title: 'Figura Mewtwo Collector Edition',
    slug: 'figura-mewtwo-collector-edition',
    description: 'Edicion de Mewtwo para coleccionistas, con diseño limpio y presencia destacada.',
    price: 39500,
    stock: 6,
    imageUrl: 'https://placehold.co/600x600/png?text=Mewtwo+Collector+Edition',
    categorySlug: 'pokemon',
    specifications: [
      { label: 'Material', value: 'PVC premium' },
      { label: 'Altura', value: '20 cm' },
      { label: 'Edicion', value: 'Collector Edition' },
    ],
    reviews: buildReviews('Figura Mewtwo Collector Edition'),
  },
  {
    title: 'Peluche Agumon Tamaño Mediano',
    slug: 'peluche-agumon-mediano',
    description: 'Peluche suave de Agumon para fans de Digimon, perfecto para coleccion o regalo.',
    price: 19900,
    stock: 8,
    imageUrl: 'https://placehold.co/600x600/png?text=Agumon+Peluche',
    categorySlug: 'digimon',
    specifications: [
      { label: 'Material', value: 'Felpa suave' },
      { label: 'Tamaño', value: '24 cm' },
      { label: 'Linea', value: 'Digimon Plush' },
    ],
    reviews: buildReviews('Peluche Agumon Tamaño Mediano'),
  },
  {
    title: 'Figura WarGreymon Battle Mode',
    slug: 'figura-wargreymon-battle-mode',
    description: 'Figura articulada de WarGreymon con detalles metalicos y presencia ideal para vitrina.',
    price: 38900,
    stock: 7,
    imageUrl: 'https://placehold.co/600x600/png?text=WarGreymon+Battle+Mode',
    categorySlug: 'digimon',
    specifications: [
      { label: 'Material', value: 'PVC y ABS' },
      { label: 'Altura', value: '19 cm' },
      { label: 'Acabado', value: 'Metalico' },
    ],
    reviews: buildReviews('Figura WarGreymon Battle Mode'),
  },
  {
    title: 'Figura Gabumon Classic Edition',
    slug: 'figura-gabumon-classic-edition',
    description: 'Figura compacta de Gabumon con acabado clasico para coleccionistas de Digimon.',
    price: 23500,
    stock: 11,
    imageUrl: 'https://placehold.co/600x600/png?text=Gabumon+Classic+Edition',
    categorySlug: 'digimon',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '12 cm' },
      { label: 'Edicion', value: 'Classic Edition' },
    ],
    reviews: buildReviews('Figura Gabumon Classic Edition'),
  },
  {
    title: 'Figura MetalGarurumon Display',
    slug: 'figura-metalgarurumon-display',
    description: 'Figura de MetalGarurumon orientada a exhibicion, con base y diseño de alto impacto.',
    price: 42000,
    stock: 5,
    imageUrl: 'https://placehold.co/600x600/png?text=MetalGarurumon+Display',
    categorySlug: 'digimon',
    specifications: [
      { label: 'Material', value: 'PVC premium' },
      { label: 'Altura', value: '22 cm' },
      { label: 'Incluye', value: 'Base de exhibicion' },
    ],
    reviews: buildReviews('Figura MetalGarurumon Display'),
  },
  {
    title: 'Maqueta Gundam Entry Grade',
    slug: 'maqueta-gundam-entry-grade',
    description: 'Kit armable ideal para comenzar en el mundo de las maquetas con excelente nivel de detalle.',
    price: 29900,
    stock: 6,
    imageUrl: 'https://placehold.co/600x600/png?text=Gundam+Entry+Grade',
    categorySlug: 'maquetas',
    specifications: [
      { label: 'Escala', value: '1/144' },
      { label: 'Dificultad', value: 'Inicial' },
      { label: 'Incluye', value: 'Manual y stickers' },
    ],
    reviews: buildReviews('Maqueta Gundam Entry Grade'),
  },
  {
    title: 'Maqueta Evangelion Unit-01 Model Kit',
    slug: 'maqueta-evangelion-unit-01-model-kit',
    description: 'Modelo armable de Evangelion Unit-01 con piezas de buen acabado para exhibicion.',
    price: 41000,
    stock: 5,
    imageUrl: 'https://placehold.co/600x600/png?text=Evangelion+Unit-01+Model+Kit',
    categorySlug: 'maquetas',
    specifications: [
      { label: 'Escala', value: '1/400' },
      { label: 'Dificultad', value: 'Intermedia' },
      { label: 'Serie', value: 'Neon Genesis Evangelion' },
    ],
    reviews: buildReviews('Maqueta Evangelion Unit-01 Model Kit'),
  },
  {
    title: 'Maqueta Mazinger Z Collector Build',
    slug: 'maqueta-mazinger-z-collector-build',
    description: 'Maqueta de Mazinger Z orientada a coleccionistas que buscan una pieza clasica de impacto.',
    price: 44500,
    stock: 4,
    imageUrl: 'https://placehold.co/600x600/png?text=Mazinger+Z+Collector+Build',
    categorySlug: 'maquetas',
    specifications: [
      { label: 'Escala', value: '1/100' },
      { label: 'Dificultad', value: 'Intermedia' },
      { label: 'Acabado', value: 'Collector Build' },
    ],
    reviews: buildReviews('Maqueta Mazinger Z Collector Build'),
  },
  {
    title: 'Maqueta Saint Seiya Armor Kit',
    slug: 'maqueta-saint-seiya-armor-kit',
    description: 'Kit armable inspirado en Saint Seiya con piezas para vitrina y montaje detallado.',
    price: 46900,
    stock: 4,
    imageUrl: 'https://placehold.co/600x600/png?text=Saint+Seiya+Armor+Kit',
    categorySlug: 'maquetas',
    specifications: [
      { label: 'Escala', value: '1/144' },
      { label: 'Dificultad', value: 'Intermedia' },
      { label: 'Tema', value: 'Saint Seiya' },
    ],
    reviews: buildReviews('Maqueta Saint Seiya Armor Kit'),
  },
  {
    title: 'Figura Goku Super Saiyajin',
    slug: 'figura-goku-super-saiyajin',
    description: 'Figura de Goku en pose de combate con base incluida para coleccionistas de Dragon Ball.',
    price: 34900,
    stock: 10,
    imageUrl: 'https://placehold.co/600x600/png?text=Goku+Super+Saiyajin',
    categorySlug: 'dragon-ball',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '18 cm' },
      { label: 'Saga', value: 'Dragon Ball Z' },
    ],
    reviews: buildReviews('Figura Goku Super Saiyajin'),
  },
  {
    title: 'Figura Vegeta Saiyan Armor',
    slug: 'figura-vegeta-saiyan-armor',
    description: 'Figura de Vegeta con armadura saiyajin y presencia ideal para vitrina tematica.',
    price: 33900,
    stock: 9,
    imageUrl: 'https://placehold.co/600x600/png?text=Vegeta+Saiyan+Armor',
    categorySlug: 'dragon-ball',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '17 cm' },
      { label: 'Version', value: 'Saiyan Armor' },
    ],
    reviews: buildReviews('Figura Vegeta Saiyan Armor'),
  },
  {
    title: 'Figura Gohan Ultimate Version',
    slug: 'figura-gohan-ultimate-version',
    description: 'Figura de Gohan version definitiva con base de apoyo y detalles inspirados en la saga.',
    price: 31500,
    stock: 8,
    imageUrl: 'https://placehold.co/600x600/png?text=Gohan+Ultimate+Version',
    categorySlug: 'dragon-ball',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '16 cm' },
      { label: 'Version', value: 'Ultimate' },
    ],
    reviews: buildReviews('Figura Gohan Ultimate Version'),
  },
  {
    title: 'Figura Trunks Future Edition',
    slug: 'figura-trunks-future-edition',
    description: 'Figura de Trunks del futuro con espada, pensada para coleccionistas de Dragon Ball.',
    price: 35900,
    stock: 7,
    imageUrl: 'https://placehold.co/600x600/png?text=Trunks+Future+Edition',
    categorySlug: 'dragon-ball',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '18 cm' },
      { label: 'Incluye', value: 'Espada y base' },
    ],
    reviews: buildReviews('Figura Trunks Future Edition'),
  },
  {
    title: 'Casco Coleccionable Darth Vader Mini',
    slug: 'casco-darth-vader-mini',
    description: 'Replica decorativa compacta inspirada en Darth Vader, ideal para escritorio o repisa.',
    price: 27500,
    stock: 5,
    imageUrl: 'https://placehold.co/600x600/png?text=Darth+Vader+Mini+Helmet',
    categorySlug: 'star-wars',
    specifications: [
      { label: 'Material', value: 'Resina decorativa' },
      { label: 'Altura', value: '13 cm' },
      { label: 'Uso', value: 'Display' },
    ],
    reviews: buildReviews('Casco Coleccionable Darth Vader Mini'),
  },
  {
    title: 'Figura Stormtrooper Retro Edition',
    slug: 'figura-stormtrooper-retro-edition',
    description: 'Stormtrooper de estilo retro con acabado clasico para fans de Star Wars.',
    price: 28900,
    stock: 10,
    imageUrl: 'https://placehold.co/600x600/png?text=Stormtrooper+Retro+Edition',
    categorySlug: 'star-wars',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '16 cm' },
      { label: 'Edicion', value: 'Retro Edition' },
    ],
    reviews: buildReviews('Figura Stormtrooper Retro Edition'),
  },
  {
    title: 'Figura Mandalorian Display Version',
    slug: 'figura-mandalorian-display-version',
    description: 'Figura del Mandalorian con postura de exhibicion y presencia fuerte para coleccion.',
    price: 39900,
    stock: 6,
    imageUrl: 'https://placehold.co/600x600/png?text=Mandalorian+Display+Version',
    categorySlug: 'star-wars',
    specifications: [
      { label: 'Material', value: 'PVC premium' },
      { label: 'Altura', value: '19 cm' },
      { label: 'Incluye', value: 'Base de exhibicion' },
    ],
    reviews: buildReviews('Figura Mandalorian Display Version'),
  },
  {
    title: 'Figura Grogu Collection Mini',
    slug: 'figura-grogu-collection-mini',
    description: 'Figura mini de Grogu para escritorio o coleccion, ideal como regalo para fans de Star Wars.',
    price: 22900,
    stock: 12,
    imageUrl: 'https://placehold.co/600x600/png?text=Grogu+Collection+Mini',
    categorySlug: 'star-wars',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '10 cm' },
      { label: 'Linea', value: 'Collection Mini' },
    ],
    reviews: buildReviews('Figura Grogu Collection Mini'),
  },
  {
    title: 'Figura Satoru Gojo Display',
    slug: 'figura-satoru-gojo-display',
    description: 'Figura decorativa con base de exhibicion pensada para fans de anime contemporaneo.',
    price: 32000,
    stock: 7,
    imageUrl: 'https://placehold.co/600x600/png?text=Satoru+Gojo+Display',
    categorySlug: 'anime',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '18 cm' },
      { label: 'Serie', value: 'Jujutsu Kaisen' },
    ],
    reviews: buildReviews('Figura Satoru Gojo Display'),
  },
  {
    title: 'Figura Naruto Sage Mode',
    slug: 'figura-naruto-sage-mode',
    description: 'Figura de Naruto en modo sabio con detalles dinamicos y base para vitrina.',
    price: 30900,
    stock: 9,
    imageUrl: 'https://placehold.co/600x600/png?text=Naruto+Sage+Mode',
    categorySlug: 'anime',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '17 cm' },
      { label: 'Serie', value: 'Naruto Shippuden' },
    ],
    reviews: buildReviews('Figura Naruto Sage Mode'),
  },
  {
    title: 'Figura Luffy Gear Collection',
    slug: 'figura-luffy-gear-collection',
    description: 'Figura de Luffy para coleccion, inspirada en sus transformaciones mas icónicas.',
    price: 33500,
    stock: 8,
    imageUrl: 'https://placehold.co/600x600/png?text=Luffy+Gear+Collection',
    categorySlug: 'anime',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '18 cm' },
      { label: 'Serie', value: 'One Piece' },
    ],
    reviews: buildReviews('Figura Luffy Gear Collection'),
  },
  {
    title: 'Figura Tanjiro Kamado Action Pose',
    slug: 'figura-tanjiro-kamado-action-pose',
    description: 'Figura de Tanjiro en pose de accion con base y detalles inspirados en Demon Slayer.',
    price: 34200,
    stock: 7,
    imageUrl: 'https://placehold.co/600x600/png?text=Tanjiro+Kamado+Action+Pose',
    categorySlug: 'anime',
    specifications: [
      { label: 'Material', value: 'PVC' },
      { label: 'Altura', value: '18 cm' },
      { label: 'Serie', value: 'Demon Slayer' },
    ],
    reviews: buildReviews('Figura Tanjiro Kamado Action Pose'),
  },
  {
    title: 'Polera Anime Negra Estampado Frontal',
    slug: 'polera-anime-negra-estampado-frontal',
    description: 'Polera comoda de corte unisex con estampado frontal inspirada en cultura anime y geek.',
    price: 18500,
    stock: 15,
    imageUrl: 'https://placehold.co/600x600/png?text=Polera+Anime+Negra',
    categorySlug: 'ropa',
    specifications: [
      { label: 'Material', value: 'Algodon peinado' },
      { label: 'Tallas', value: 'S a XL' },
      { label: 'Color', value: 'Negro' },
    ],
    reviews: buildReviews('Polera Anime Negra Estampado Frontal'),
  },
  {
    title: 'Polera Dragon Ball Logo Edition',
    slug: 'polera-dragon-ball-logo-edition',
    description: 'Polera de uso diario con logo de Dragon Ball y estilo pensado para fans del anime.',
    price: 19900,
    stock: 12,
    imageUrl: 'https://placehold.co/600x600/png?text=Dragon+Ball+Logo+Edition',
    categorySlug: 'ropa',
    specifications: [
      { label: 'Material', value: 'Algodon' },
      { label: 'Tallas', value: 'S a XXL' },
      { label: 'Estilo', value: 'Logo Edition' },
    ],
    reviews: buildReviews('Polera Dragon Ball Logo Edition'),
  },
  {
    title: 'Hoodie Pokémon Trainer Green',
    slug: 'hoodie-pokemon-trainer-green',
    description: 'Hoodie comodo con grafica inspirada en entrenadores Pokemon, ideal para temporada fria.',
    price: 34500,
    stock: 7,
    imageUrl: 'https://placehold.co/600x600/png?text=Pokemon+Trainer+Green+Hoodie',
    categorySlug: 'ropa',
    specifications: [
      { label: 'Material', value: 'Algodon y poliester' },
      { label: 'Tallas', value: 'M a XXL' },
      { label: 'Color', value: 'Verde' },
    ],
    reviews: buildReviews('Hoodie Pokémon Trainer Green'),
  },
  {
    title: 'Polera Star Wars Dark Side',
    slug: 'polera-star-wars-dark-side',
    description: 'Polera tematica de Star Wars con diseño Dark Side para uso diario y fans de la saga.',
    price: 21500,
    stock: 10,
    imageUrl: 'https://placehold.co/600x600/png?text=Star+Wars+Dark+Side+Tee',
    categorySlug: 'ropa',
    specifications: [
      { label: 'Material', value: 'Algodon' },
      { label: 'Tallas', value: 'S a XL' },
      { label: 'Tema', value: 'Dark Side' },
    ],
    reviews: buildReviews('Polera Star Wars Dark Side'),
  },
];

// ── Patrones para detectar productos de prueba ────────────────────────────────

export const TEMPLATE_TEST_PRODUCT_PATTERNS = {
  imageUrlIncludes: ['example.com'],
  exactDescriptions: [
    'figura de colección retro inspirada en anime clásico.',
    'figura de coleccion retro inspirada en anime clasico.',
  ],
  exactSlugs: ['slug-feo', 'figura-retro-anime'],
  slugContains: [' '],
  exactTitles: ['iron man', 'figura retro pikachu'],
} as const;
