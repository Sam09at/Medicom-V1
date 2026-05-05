import type { PageSection } from '../../types';
import { createSection } from './sectionConfig';

// ─── Template definition ──────────────────────────────────────────────────────

export interface WebsiteTemplate {
  id: string;
  name: string;
  specialty: string;
  category: TemplateCategory;
  description: string;
  accentColor: string;
  thumbnailColor: string; // gradient CSS string for visual thumbnail
  sections: PageSection[];
}

export type TemplateCategory = 'dentaire' | 'médecine' | 'pédiatrie' | 'spécialiste' | 'chirurgie';

// ─── Helper ───────────────────────────────────────────────────────────────────

function make(type: Parameters<typeof createSection>[0], content: Record<string, unknown>): PageSection {
  const s = createSection(type);
  s.content = content;
  return s;
}

// ─── Template: Dentiste Moderne ───────────────────────────────────────────────

const DENTISTE_MODERNE: WebsiteTemplate = {
  id: 'dentiste-moderne',
  name: 'Dentiste Moderne',
  specialty: 'Cabinet dentaire',
  category: 'dentaire',
  description: 'Site professionnel pour cabinet dentaire — focus sur les soins et la confiance.',
  accentColor: '#136cfb',
  thumbnailColor: 'linear-gradient(135deg, #136cfb 0%, #4f8dff 100%)',
  sections: [
    make('hero', {
      headline: 'Cabinet Dentaire Excellence',
      subheadline: 'Des soins dentaires de qualité pour toute votre famille, dans un environnement moderne et bienveillant.',
      ctaText: 'Prendre rendez-vous',
      backgroundImage: '',
      overlayOpacity: 50,
    }),
    make('about', {
      heading: 'Un cabinet à votre service depuis 2010',
      body: 'Notre équipe de chirurgiens-dentistes qualifiés vous accueille dans un cabinet de pointe. Nous mettons un point d\'honneur à vous offrir des soins personnalisés, dans le respect et la confidentialité.',
      imageUrl: '',
      imagePosition: 'right',
    }),
    make('services', {
      heading: 'Nos Prestations',
      items: [
        { id: 's1', icon: '🦷', title: 'Détartrage & Prévention', description: 'Nettoyage professionnel et conseils d\'hygiène bucco-dentaire.' },
        { id: 's2', icon: '✨', title: 'Blanchiment dentaire', description: 'Retrouvez un sourire éclatant avec nos techniques de blanchiment.' },
        { id: 's3', icon: '🔬', title: 'Orthodontie', description: 'Aligners invisibles et appareils discrets pour adultes et enfants.' },
        { id: 's4', icon: '🦴', title: 'Implants dentaires', description: 'Reconstruction complète avec des implants de dernière génération.' },
        { id: 's5', icon: '🩺', title: 'Chirurgie buccale', description: 'Extractions, greffes et interventions sous anesthésie locale.' },
        { id: 's6', icon: '👶', title: 'Pédodontie', description: 'Soins adaptés et doux pour les enfants dès le premier âge.' },
      ],
    }),
    make('doctors', {
      heading: 'Notre Équipe',
      items: [
        { id: 'd1', name: 'Dr. Amine Benali', title: 'Chirurgien-dentiste, Implantologiste', photoUrl: '', bio: 'Spécialiste en prothèse et implantologie avec 15 ans d\'expérience.' },
        { id: 'd2', name: 'Dr. Fatima Radi', title: 'Orthodontiste', photoUrl: '', bio: 'Experte en orthodontie invisible et aligners pour adolescents et adultes.' },
      ],
    }),
    make('testimonials', {
      heading: 'L\'avis de nos patients',
      items: [
        { id: 't1', author: 'Nadia K.', role: 'Patiente depuis 5 ans', text: 'Cabinet excellent, staff chaleureux. Mon enfant n\'a plus peur du dentiste !', rating: 5 },
        { id: 't2', author: 'Hassan M.', role: 'Traitement implants', text: 'Résultat parfait pour mes implants. Service impeccable du début à la fin.', rating: 5 },
        { id: 't3', author: 'Lara B.', role: 'Aligners invisibles', text: 'Mon sourire a totalement changé en 8 mois. Je recommande vivement !', rating: 5 },
      ],
    }),
    make('booking', {
      heading: 'Prenez rendez-vous',
      body: 'Notre secrétariat est disponible du lundi au samedi de 9h à 18h. Réservez votre consultation en ligne ou par téléphone.',
      buttonText: 'Appeler maintenant',
      phone: '',
    }),
    make('hours', {
      heading: 'Nos Horaires',
      schedule: [
        { id: 'lun', day: 'Lundi', hours: '09:00 – 18:00', closed: false },
        { id: 'mar', day: 'Mardi', hours: '09:00 – 18:00', closed: false },
        { id: 'mer', day: 'Mercredi', hours: '09:00 – 18:00', closed: false },
        { id: 'jeu', day: 'Jeudi', hours: '09:00 – 18:00', closed: false },
        { id: 'ven', day: 'Vendredi', hours: '09:00 – 17:00', closed: false },
        { id: 'sam', day: 'Samedi', hours: '09:00 – 13:00', closed: false },
        { id: 'dim', day: 'Dimanche', hours: '', closed: true },
      ],
    }),
    make('contact', {
      heading: 'Nous trouver',
      phone: '',
      email: '',
      address: '',
      googleMapsUrl: '',
    }),
    make('faq', {
      heading: 'Questions fréquentes',
      items: [
        { id: 'f1', question: 'Acceptez-vous les nouvelles mutuelles ?', answer: 'Oui, nous travaillons avec la plupart des organismes de complémentaire santé au Maroc.' },
        { id: 'f2', question: 'Sous combien de temps puis-je obtenir un RDV ?', answer: 'En général sous 48h pour les consultations standard, le jour même pour les urgences.' },
        { id: 'f3', question: 'Proposez-vous des facilités de paiement ?', answer: 'Oui, nous proposons des paiements échelonnés pour les traitements importants (orthodontie, implants).' },
      ],
    }),
  ],
};

// ─── Template: Médecin Généraliste ────────────────────────────────────────────

const MEDECIN_GENERALISTE: WebsiteTemplate = {
  id: 'medecin-generaliste',
  name: 'Médecin Généraliste',
  specialty: 'Médecine générale',
  category: 'médecine',
  description: 'Template propre et professionnel pour médecin généraliste.',
  accentColor: '#16a34a',
  thumbnailColor: 'linear-gradient(135deg, #16a34a 0%, #34d399 100%)',
  sections: [
    make('hero', {
      headline: 'Cabinet de Médecine Générale',
      subheadline: 'Votre santé, notre priorité. Consultations sur rendez-vous et urgences du lundi au samedi.',
      ctaText: 'Prendre rendez-vous',
      backgroundImage: '',
      overlayOpacity: 50,
    }),
    make('about', {
      heading: 'Votre médecin de confiance',
      body: 'Médecin généraliste diplômé de la Faculté de Médecine de Casablanca, j\'assure un suivi médical complet pour toute la famille. De la prévention au traitement, je vous accompagne avec écoute et professionnalisme.',
      imageUrl: '',
      imagePosition: 'left',
    }),
    make('services', {
      heading: 'Consultations & Services',
      items: [
        { id: 's1', icon: '🩺', title: 'Consultation générale', description: 'Diagnostics, prescriptions et suivi de santé global.' },
        { id: 's2', icon: '💉', title: 'Vaccinations', description: 'Calendrier vaccinal adultes et enfants, voyages.' },
        { id: 's3', icon: '📋', title: 'Bilans de santé', description: 'Examens préventifs annuels complets.' },
        { id: 's4', icon: '🫀', title: 'Maladies chroniques', description: 'Suivi diabète, HTA, cholestérol et thyroïde.' },
        { id: 's5', icon: '🧠', title: 'Certificats médicaux', description: 'Aptitude sport, travail, scolaire et autres.' },
        { id: 's6', icon: '🚑', title: 'Urgences & petite chirurgie', description: 'Soins de plaies, sutures et urgences légères.' },
      ],
    }),
    make('booking', {
      heading: 'Prendre rendez-vous',
      body: 'Disponible du lundi au samedi. Consultations en ligne disponibles pour les suivis.',
      buttonText: 'Appeler le cabinet',
      phone: '',
    }),
    make('testimonials', {
      heading: 'Témoignages patients',
      items: [
        { id: 't1', author: 'Ahmed S.', role: 'Patient depuis 8 ans', text: 'Médecin très attentif, prend le temps d\'écouter et d\'expliquer. Je recommande.', rating: 5 },
        { id: 't2', author: 'Meryem O.', role: 'Famille suivie', text: 'Toute ma famille est suivie ici. Docteur disponible même en urgence.', rating: 5 },
      ],
    }),
    make('hours', {
      heading: 'Horaires de consultation',
      schedule: [
        { id: 'lun', day: 'Lundi', hours: '08:00 – 12:00 / 15:00 – 18:00', closed: false },
        { id: 'mar', day: 'Mardi', hours: '08:00 – 12:00 / 15:00 – 18:00', closed: false },
        { id: 'mer', day: 'Mercredi', hours: '08:00 – 12:00', closed: false },
        { id: 'jeu', day: 'Jeudi', hours: '08:00 – 12:00 / 15:00 – 18:00', closed: false },
        { id: 'ven', day: 'Vendredi', hours: '08:00 – 12:00 / 15:00 – 17:00', closed: false },
        { id: 'sam', day: 'Samedi', hours: '09:00 – 12:00', closed: false },
        { id: 'dim', day: 'Dimanche', hours: '', closed: true },
      ],
    }),
    make('contact', {
      heading: 'Coordonnées',
      phone: '',
      email: '',
      address: '',
      googleMapsUrl: '',
    }),
    make('faq', {
      heading: 'Questions fréquentes',
      items: [
        { id: 'f1', question: 'Puis-je consulter sans rendez-vous ?', answer: 'Oui, des créneaux sont réservés aux urgences chaque matin. Appelez avant de vous déplacer.' },
        { id: 'f2', question: 'Faites-vous des consultations à domicile ?', answer: 'Dans certains cas (personnes âgées, mobilité réduite), oui sur demande.' },
        { id: 'f3', question: 'Quelle est la durée d\'une consultation ?', answer: 'Entre 15 et 30 minutes selon le type de consultation.' },
      ],
    }),
  ],
};

// ─── Template: Pédiatrie Familiale ────────────────────────────────────────────

const PEDIATRIE_FAMILIALE: WebsiteTemplate = {
  id: 'pediatrie-familiale',
  name: 'Pédiatrie Familiale',
  specialty: 'Pédiatrie',
  category: 'pédiatrie',
  description: 'Site chaleureux et rassurant pour cabinet de pédiatrie.',
  accentColor: '#f59e0b',
  thumbnailColor: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  sections: [
    make('hero', {
      headline: 'Cabinet de Pédiatrie',
      subheadline: 'Des soins bienveillants pour vos enfants, de la naissance à l\'adolescence. Un cabinet où les enfants se sentent bien.',
      ctaText: 'Prendre rendez-vous',
      backgroundImage: '',
      overlayOpacity: 40,
    }),
    make('about', {
      heading: 'Un environnement conçu pour les enfants',
      body: 'Notre cabinet pédiatrique offre un espace aménagé et adapté à chaque âge. Notre pédiatre accompagne votre enfant avec douceur et expertise, du nouveau-né à l\'adolescent.',
      imageUrl: '',
      imagePosition: 'right',
    }),
    make('services', {
      heading: 'Nos Consultations',
      items: [
        { id: 's1', icon: '👶', title: 'Suivi du nourrisson', description: 'Consultations régulières de la naissance à 2 ans.' },
        { id: 's2', icon: '💉', title: 'Vaccinations', description: 'Calendrier vaccinal complet selon les recommandations nationales.' },
        { id: 's3', icon: '🌡️', title: 'Urgences pédiatriques', description: 'Fièvre, infections, troubles digestifs — prise en charge rapide.' },
        { id: 's4', icon: '📈', title: 'Courbes de croissance', description: 'Suivi du développement staturo-pondéral et psychomoteur.' },
        { id: 's5', icon: '🧠', title: 'Développement de l\'enfant', description: 'Bilan neurologique, troubles du langage et comportement.' },
        { id: 's6', icon: '🏫', title: 'Certificats scolaires', description: 'Aptitude sport, colonie de vacances, certificats de scolarité.' },
      ],
    }),
    make('doctors', {
      heading: 'Votre Pédiatre',
      items: [
        { id: 'd1', name: 'Dr. Sanaa Kettani', title: 'Pédiatre – Néonatologue', photoUrl: '', bio: 'Spécialisée en pédiatrie générale et développement de l\'enfant. Ancienne chef de clinique CHU de Rabat.' },
      ],
    }),
    make('booking', {
      heading: 'Prendre rendez-vous',
      body: 'Consultation sur rendez-vous uniquement. Des créneaux d\'urgence sont disponibles chaque matin sur appel.',
      buttonText: 'Appeler le cabinet',
      phone: '',
    }),
    make('testimonials', {
      heading: 'Ce que disent les parents',
      items: [
        { id: 't1', author: 'Samira A.', role: 'Maman de 2 enfants', text: 'Docteure extraordinaire, très patiente avec mes deux garçons. Ils n\'ont plus peur de la consultation !', rating: 5 },
        { id: 't2', author: 'Youssef T.', role: 'Papa de triplés', text: 'Suivi irréprochable depuis la naissance. Toujours disponible et rassurante.', rating: 5 },
      ],
    }),
    make('hours', {
      heading: 'Horaires',
      schedule: [
        { id: 'lun', day: 'Lundi', hours: '09:00 – 12:00 / 14:00 – 17:00', closed: false },
        { id: 'mar', day: 'Mardi', hours: '09:00 – 12:00 / 14:00 – 17:00', closed: false },
        { id: 'mer', day: 'Mercredi', hours: '09:00 – 12:00', closed: false },
        { id: 'jeu', day: 'Jeudi', hours: '09:00 – 12:00 / 14:00 – 17:00', closed: false },
        { id: 'ven', day: 'Vendredi', hours: '09:00 – 12:00 / 14:00 – 16:00', closed: false },
        { id: 'sam', day: 'Samedi', hours: '09:00 – 12:00', closed: false },
        { id: 'dim', day: 'Dimanche', hours: '', closed: true },
      ],
    }),
    make('contact', {
      heading: 'Nous trouver',
      phone: '',
      email: '',
      address: '',
      googleMapsUrl: '',
    }),
    make('faq', {
      heading: 'Questions des parents',
      items: [
        { id: 'f1', question: 'À quel âge commence le suivi pédiatrique ?', answer: 'Dès la naissance — nous recommandons une première visite dans les 8 jours suivant le retour de la maternité.' },
        { id: 'f2', question: 'Mon enfant a de la fièvre, que faire ?', answer: 'En cas de fièvre > 39°C ou chez un nourrisson < 3 mois, appelez immédiatement. Des créneaux d\'urgence sont réservés.' },
        { id: 'f3', question: 'Faites-vous des visites à domicile ?', answer: 'Non, mais nous pouvons faire des téléconsultations de suivi pour les parents éloignés.' },
      ],
    }),
  ],
};

// ─── Template: Gynécologie & Maternité ────────────────────────────────────────

const GYNECOLOGIE_MATERNITE: WebsiteTemplate = {
  id: 'gynecologie-maternite',
  name: 'Gynécologie & Maternité',
  specialty: 'Gynécologie-Obstétrique',
  category: 'spécialiste',
  description: 'Élégant et rassurant pour cabinet de gynécologie et suivi de grossesse.',
  accentColor: '#db2777',
  thumbnailColor: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
  sections: [
    make('hero', {
      headline: 'Gynécologie & Maternité',
      subheadline: 'Accompagnement expert et bienveillant à chaque étape de votre vie féminine — consultations, grossesse, accouchement et suivi post-natal.',
      ctaText: 'Prendre rendez-vous',
      backgroundImage: '',
      overlayOpacity: 50,
    }),
    make('about', {
      heading: 'Un cabinet pensé pour vous',
      body: 'Notre cabinet de gynécologie-obstétrique offre un espace de confiance où chaque patiente est accueillie avec respect et bienveillance. Suivi gynécologique régulier, grossesse à risque ou IVG — nous sommes à vos côtés.',
      imageUrl: '',
      imagePosition: 'right',
    }),
    make('services', {
      heading: 'Nos Consultations',
      items: [
        { id: 's1', icon: '🌸', title: 'Gynécologie générale', description: 'Frottis, dépistage, contraception, ménopause.' },
        { id: 's2', icon: '🤰', title: 'Suivi de grossesse', description: 'Consultations prénatales, échographies et préparation à l\'accouchement.' },
        { id: 's3', icon: '🔬', title: 'Échographies', description: 'Datation, morphologique, et doppler obstétrical.' },
        { id: 's4', icon: '💊', title: 'Contraception', description: 'Conseil et pose de DIU, implants, pilule et autres méthodes.' },
        { id: 's5', icon: '🧬', title: 'Fertilité & PMA', description: 'Bilan hormonal, stimulation ovulatoire et accompagnement PMA.' },
        { id: 's6', icon: '🌺', title: 'Post-natal', description: 'Suivi post-accouchement, allaitement et rééducation périnéale.' },
      ],
    }),
    make('doctors', {
      heading: 'Votre spécialiste',
      items: [
        { id: 'd1', name: 'Dr. Nadia El Amrani', title: 'Gynécologue-Obstétricienne', photoUrl: '', bio: 'Spécialiste en obstétrique et gynécologie médicale. 12 ans d\'expérience, ancienne chef de clinique.' },
      ],
    }),
    make('booking', {
      heading: 'Prendre rendez-vous',
      body: 'Consultations sur rendez-vous. Urgences gynécologiques accueillies en priorité.',
      buttonText: 'Réserver',
      phone: '',
    }),
    make('testimonials', {
      heading: 'Témoignages',
      items: [
        { id: 't1', author: 'Imane R.', role: 'Grossesse suivie en 2024', text: 'Docteure exceptionnelle. J\'ai vécu ma grossesse sereinement grâce à son accompagnement.', rating: 5 },
        { id: 't2', author: 'Houda M.', role: 'Patiente depuis 3 ans', text: 'Cabinet discret, propre et professionnel. Docteure à l\'écoute et très compétente.', rating: 5 },
      ],
    }),
    make('faq', {
      heading: 'Questions fréquentes',
      items: [
        { id: 'f1', question: 'À quelle fréquence consulter un gynécologue ?', answer: 'Une consultation annuelle est recommandée pour le suivi gynécologique standard, plus souvent pendant la grossesse.' },
        { id: 'f2', question: 'Proposez-vous des consultations de fertilité ?', answer: 'Oui, nous réalisons un bilan complet du couple et orientons vers la PMA si nécessaire.' },
        { id: 'f3', question: 'Les échographies sont-elles faites au cabinet ?', answer: 'Oui, nous disposons d\'un échographe de dernière génération pour les échographies obstétricales et gynécologiques.' },
      ],
    }),
    make('hours', {
      heading: 'Horaires',
      schedule: [
        { id: 'lun', day: 'Lundi', hours: '09:00 – 17:00', closed: false },
        { id: 'mar', day: 'Mardi', hours: '09:00 – 17:00', closed: false },
        { id: 'mer', day: 'Mercredi', hours: '09:00 – 13:00', closed: false },
        { id: 'jeu', day: 'Jeudi', hours: '09:00 – 17:00', closed: false },
        { id: 'ven', day: 'Vendredi', hours: '09:00 – 16:00', closed: false },
        { id: 'sam', day: 'Samedi', hours: '09:00 – 12:00', closed: false },
        { id: 'dim', day: 'Dimanche', hours: '', closed: true },
      ],
    }),
    make('contact', {
      heading: 'Nous trouver',
      phone: '',
      email: '',
      address: '',
      googleMapsUrl: '',
    }),
  ],
};

// ─── Template: Cabinet Ophtalmologie ─────────────────────────────────────────

const OPHTALMOLOGIE: WebsiteTemplate = {
  id: 'ophtalmologie',
  name: 'Ophtalmologie',
  specialty: 'Ophtalmologie',
  category: 'spécialiste',
  description: 'Moderne et technique pour cabinet d\'ophtalmologie.',
  accentColor: '#0891b2',
  thumbnailColor: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
  sections: [
    make('hero', {
      headline: 'Cabinet d\'Ophtalmologie',
      subheadline: 'Votre vue mérite le meilleur. Consultations, bilan visuel, traitement laser et chirurgie réfractive.',
      ctaText: 'Prendre rendez-vous',
      backgroundImage: '',
      overlayOpacity: 55,
    }),
    make('about', {
      heading: 'Des équipements de pointe au service de votre vision',
      body: 'Notre cabinet est équipé des dernières technologies ophtalmologiques pour des diagnostics précis et des traitements efficaces. Nous prenons en charge toute la pathologie oculaire, de l\'enfant à la personne âgée.',
      imageUrl: '',
      imagePosition: 'left',
    }),
    make('services', {
      heading: 'Nos Spécialités',
      items: [
        { id: 's1', icon: '👁️', title: 'Bilan visuel complet', description: 'Examen de la réfraction, fond d\'œil et mesures de la tension.' },
        { id: 's2', icon: '🔭', title: 'Chirurgie réfractive', description: 'Laser LASIK et LASEK pour corriger myopie, astigmatisme et hypermétropie.' },
        { id: 's3', icon: '🩺', title: 'Glaucome', description: 'Dépistage, traitement médical et chirurgical du glaucome.' },
        { id: 's4', icon: '🧑‍🦳', title: 'Cataracte', description: 'Chirurgie de la cataracte par phacoémulsification avec implants premium.' },
        { id: 's5', icon: '🌐', title: 'Rétine', description: 'Examen et traitement des pathologies rétiniennes (DMLA, décollement).' },
        { id: 's6', icon: '👓', title: 'Orthoptie pédiatrique', description: 'Traitement du strabisme et de l\'amblyopie chez l\'enfant.' },
      ],
    }),
    make('doctors', {
      heading: 'Notre équipe médicale',
      items: [
        { id: 'd1', name: 'Dr. Khalid Moussaoui', title: 'Ophtalmologiste – Chirurgien réfractif', photoUrl: '', bio: 'Spécialiste en chirurgie réfractive laser et implants phakiques. 400+ interventions par an.' },
        { id: 'd2', name: 'Dr. Sara Benkirane', title: 'Ophtalmologiste – Rétinologue', photoUrl: '', bio: 'Expert en pathologies rétiniennes et injection intravitréenne anti-VEGF.' },
      ],
    }),
    make('booking', {
      heading: 'Consultations sur rendez-vous',
      body: 'Pour un bilan visuel complet ou une consultation chirurgicale, prenez rendez-vous ci-dessous.',
      buttonText: 'Appeler le cabinet',
      phone: '',
    }),
    make('faq', {
      heading: 'Questions fréquentes',
      items: [
        { id: 'f1', question: 'À partir de quel âge opérer la myopie ?', answer: 'La chirurgie réfractive est possible à partir de 18 ans, lorsque la myopie est stable depuis 2 ans.' },
        { id: 'f2', question: 'Combien de temps dure la chirurgie de la cataracte ?', answer: 'L\'intervention dure environ 20 minutes par œil, sous anesthésie locale. Ambulatoire.' },
        { id: 'f3', question: 'Mon enfant louche, quand consulter ?', answer: 'Dès les premiers signes de strabisme, même chez le nourrisson. Un traitement précoce est essentiel.' },
      ],
    }),
    make('hours', {
      heading: 'Horaires',
      schedule: [
        { id: 'lun', day: 'Lundi', hours: '08:30 – 12:30 / 14:30 – 18:00', closed: false },
        { id: 'mar', day: 'Mardi', hours: '08:30 – 12:30 / 14:30 – 18:00', closed: false },
        { id: 'mer', day: 'Mercredi', hours: '08:30 – 12:30', closed: false },
        { id: 'jeu', day: 'Jeudi', hours: '08:30 – 12:30 / 14:30 – 18:00', closed: false },
        { id: 'ven', day: 'Vendredi', hours: '08:30 – 12:30 / 14:30 – 17:00', closed: false },
        { id: 'sam', day: 'Samedi', hours: '09:00 – 12:00', closed: false },
        { id: 'dim', day: 'Dimanche', hours: '', closed: true },
      ],
    }),
    make('contact', {
      heading: 'Nous contacter',
      phone: '',
      email: '',
      address: '',
      googleMapsUrl: '',
    }),
  ],
};

// ─── Template: Clinique Premium ───────────────────────────────────────────────

const CLINIQUE_PREMIUM: WebsiteTemplate = {
  id: 'clinique-premium',
  name: 'Clinique Premium',
  specialty: 'Clinique multi-spécialités',
  category: 'chirurgie',
  description: 'Template haut de gamme pour clinique privée ou centre médical multi-spécialités.',
  accentColor: '#7c3aed',
  thumbnailColor: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  sections: [
    make('hero', {
      headline: 'Clinique Médicale Excellence',
      subheadline: 'Un centre médical de référence réunissant spécialistes et équipements de pointe pour des soins d\'exception.',
      ctaText: 'Prendre rendez-vous',
      backgroundImage: '',
      overlayOpacity: 60,
    }),
    make('about', {
      heading: 'L\'excellence médicale à votre service',
      body: 'Notre clinique réunit plus de 15 spécialistes dans un cadre moderne et confortable. Plateau technique complet, bloc opératoire, imagerie médicale et laboratoire — tout sous un même toit pour votre prise en charge globale.',
      imageUrl: '',
      imagePosition: 'right',
    }),
    make('services', {
      heading: 'Nos Spécialités',
      items: [
        { id: 's1', icon: '🫀', title: 'Cardiologie', description: 'ECG, holter, échographie cardiaque et consultation spécialisée.' },
        { id: 's2', icon: '🦴', title: 'Orthopédie', description: 'Traumatologie, chirurgie osseuse et prothèses articulaires.' },
        { id: 's3', icon: '🧠', title: 'Neurologie', description: 'EEG, consultation neurologique et suivi des troubles neurologiques.' },
        { id: 's4', icon: '🔬', title: 'Oncologie', description: 'Consultation et accompagnement des patients atteints de cancer.' },
        { id: 's5', icon: '🏥', title: 'Chirurgie générale', description: 'Interventions ambulatoires et hospitalières avec bloc opératoire moderne.' },
        { id: 's6', icon: '🩻', title: 'Imagerie médicale', description: 'Radio, échographie, scanner et IRM sur place.' },
      ],
    }),
    make('doctors', {
      heading: 'Notre équipe de spécialistes',
      items: [
        { id: 'd1', name: 'Pr. Mohamed El Fassi', title: 'Directeur médical – Chirurgien', photoUrl: '', bio: 'Professeur agrégé de chirurgie viscérale, ancien chef de département CHU Rabat.' },
        { id: 'd2', name: 'Dr. Leila Chafik', title: 'Cardiologue Interventionnelle', photoUrl: '', bio: 'Spécialisée en cardiologie interventionnelle et insuffisance cardiaque.' },
        { id: 'd3', name: 'Dr. Omar Tazi', title: 'Orthopédiste – Chirurgie du genou', photoUrl: '', bio: 'Expert en chirurgie arthroscopique et prothèses de hanche et genou.' },
      ],
    }),
    make('testimonials', {
      heading: 'Ils nous font confiance',
      items: [
        { id: 't1', author: 'Rachid A.', role: 'Opéré du genou', text: 'Prise en charge irréprochable du bilan au post-opératoire. Personnel aux petits soins.', rating: 5 },
        { id: 't2', author: 'Fatima Z.', role: 'Suivi cardiologique', text: 'Clinique moderne, attente courte, spécialiste disponible. Bien mieux qu\'un CHU.', rating: 5 },
        { id: 't3', author: 'Hassan B.', role: 'Chirurgie programmée', text: 'Tout s\'est passé parfaitement. Chambre confortable et suivi post-op excellent.', rating: 5 },
      ],
    }),
    make('booking', {
      heading: 'Prendre rendez-vous',
      body: 'Consultations avec nos spécialistes sur rendez-vous. Urgences acceptées 24h/24.',
      buttonText: 'Contacter la clinique',
      phone: '',
    }),
    make('faq', {
      heading: 'Informations pratiques',
      items: [
        { id: 'f1', question: 'La clinique dispose-t-elle d\'un hébergement ?', answer: 'Oui, nous avons 30 chambres individuelles confortables pour les hospitalisations programmées.' },
        { id: 'f2', question: 'Acceptez-vous les mutuelles marocaines ?', answer: 'Nous travaillons avec les principales CNOPS, CNSS, AMO et mutuelles privées.' },
        { id: 'f3', question: 'Y a-t-il un service d\'urgences ?', answer: 'Oui, notre service d\'urgences est ouvert 24h/24, 7j/7.' },
      ],
    }),
    make('hours', {
      heading: 'Ouverture',
      schedule: [
        { id: 'lun', day: 'Lundi', hours: '07:00 – 22:00', closed: false },
        { id: 'mar', day: 'Mardi', hours: '07:00 – 22:00', closed: false },
        { id: 'mer', day: 'Mercredi', hours: '07:00 – 22:00', closed: false },
        { id: 'jeu', day: 'Jeudi', hours: '07:00 – 22:00', closed: false },
        { id: 'ven', day: 'Vendredi', hours: '07:00 – 22:00', closed: false },
        { id: 'sam', day: 'Samedi', hours: '08:00 – 20:00', closed: false },
        { id: 'dim', day: 'Dimanche', hours: '09:00 – 18:00 (urgences 24h/24)', closed: false },
      ],
    }),
    make('contact', {
      heading: 'Nous contacter',
      phone: '',
      email: '',
      address: '',
      googleMapsUrl: '',
    }),
  ],
};

// ─── Template: Cardiologie ────────────────────────────────────────────────────

const CARDIOLOGIE: WebsiteTemplate = {
  id: 'cardiologie',
  name: 'Cardiologie',
  specialty: 'Cardiologie',
  category: 'spécialiste',
  description: 'Cabinet cardio moderne — confiance, précision, équipements de pointe.',
  accentColor: '#dc2626',
  thumbnailColor: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
  sections: [
    make('hero', {
      headline: 'Cabinet de Cardiologie',
      subheadline: 'Votre santé cardiaque entre les mains d\'experts. Consultations, bilan complet, holter ECG et échocardiographie.',
      ctaText: 'Prendre rendez-vous',
      backgroundImage: '',
      overlayOpacity: 55,
    }),
    make('about', {
      heading: 'Des soins cardiaques d\'excellence à Casablanca',
      body: 'Notre cabinet de cardiologie assure le dépistage, le diagnostic et le traitement de toutes les pathologies cardiovasculaires. Équipé d\'un échocardiographe de dernière génération et d\'un système Holter numérique, nous offrons un bilan cardiaque complet en une seule visite.',
      imageUrl: '',
      imagePosition: 'right',
    }),
    make('services', {
      heading: 'Nos Consultations & Examens',
      items: [
        { id: 's1', icon: '🫀', title: 'Consultation cardiologique', description: 'Bilan clinique complet, auscultation et évaluation du risque cardiovasculaire.' },
        { id: 's2', icon: '📊', title: 'Électrocardiogramme (ECG)', description: 'Enregistrement de l\'activité électrique du cœur au repos.' },
        { id: 's3', icon: '🔊', title: 'Échocardiographie', description: 'Échographie cardiaque Doppler couleur pour visualiser le cœur en temps réel.' },
        { id: 's4', icon: '⏱️', title: 'Holter ECG 24h', description: 'Enregistrement continu sur 24 à 72h pour détecter arythmies et troubles du rythme.' },
        { id: 's5', icon: '🏃', title: 'Épreuve d\'effort', description: 'Test à l\'effort sous surveillance médicale pour évaluer le cœur à l\'exercice.' },
        { id: 's6', icon: '💊', title: 'Maladies cardiovasculaires', description: 'Suivi HTA, insuffisance cardiaque, fibrillation auriculaire, post-infarctus.' },
      ],
    }),
    make('doctors', {
      heading: 'Votre cardiologue',
      items: [
        { id: 'd1', name: 'Dr. Karim Berrada', title: 'Cardiologue — Cardiologue interventionnel', photoUrl: '', bio: 'Diplômé de la Faculté de Médecine de Casablanca. Spécialisé en échocardiographie et insuffisance cardiaque. Ancien interne des Hôpitaux de Paris.' },
        { id: 'd2', name: 'Dr. Nour El Houda Saidi', title: 'Cardiologue — Rythmologue', photoUrl: '', bio: 'Experte en troubles du rythme cardiaque et pose de stimulateurs cardiaques.' },
      ],
    }),
    make('booking_widget', {
      heading: 'Prendre rendez-vous en ligne',
      body: 'Consultations sur rendez-vous du lundi au vendredi. Urgences cardiologiques accueillies en priorité.',
    }),
    make('testimonials', {
      heading: 'Témoignages',
      items: [
        { id: 't1', author: 'Ali B.', role: 'Suivi post-infarctus', text: 'Docteur très compétent et rassurant. Bilan complet réalisé en une seule visite, résultats expliqués clairement.', rating: 5 },
        { id: 't2', author: 'Nadia C.', role: 'Bilan cardiaque annuel', text: 'Cabinet moderne, pas d\'attente. L\'holter et l\'écho ont été réalisés le même jour.', rating: 5 },
        { id: 't3', author: 'Omar M.', role: 'HTA chronique', text: 'Suivi rigoureux depuis 3 ans. Mon HTA est maintenant bien contrôlée.', rating: 5 },
      ],
    }),
    make('faq', {
      heading: 'Questions fréquentes',
      items: [
        { id: 'f1', question: 'À partir de quel âge consulter un cardiologue ?', answer: 'À partir de 40 ans pour un bilan préventif, ou plus tôt en cas de douleurs thoraciques, essoufflement, palpitations ou antécédents familiaux.' },
        { id: 'f2', question: 'Comment se préparer à l\'épreuve d\'effort ?', answer: 'Éviter de manger dans les 2h avant, porter des vêtements confortables. Apporter la liste de vos médicaments.' },
        { id: 'f3', question: 'Le cabinet accepte-t-il les urgences ?', answer: 'Oui, des créneaux d\'urgence sont réservés chaque matin. En cas de douleur thoracique aiguë, appelez le 15 (SAMU).' },
      ],
    }),
    make('hours', {
      heading: 'Horaires',
      schedule: [
        { id: 'lun', day: 'Lundi', hours: '08:30 – 13:00 / 15:00 – 18:00', closed: false },
        { id: 'mar', day: 'Mardi', hours: '08:30 – 13:00 / 15:00 – 18:00', closed: false },
        { id: 'mer', day: 'Mercredi', hours: '08:30 – 13:00', closed: false },
        { id: 'jeu', day: 'Jeudi', hours: '08:30 – 13:00 / 15:00 – 18:00', closed: false },
        { id: 'ven', day: 'Vendredi', hours: '08:30 – 13:00 / 15:00 – 17:30', closed: false },
        { id: 'sam', day: 'Samedi', hours: '09:00 – 12:30', closed: false },
        { id: 'dim', day: 'Dimanche', hours: '', closed: true },
      ],
    }),
    make('contact', {
      heading: 'Nous trouver',
      phone: '',
      email: '',
      address: '',
      googleMapsUrl: '',
    }),
  ],
};

// ─── Template: Dermatologie ───────────────────────────────────────────────────

const DERMATOLOGIE: WebsiteTemplate = {
  id: 'dermatologie',
  name: 'Dermatologie',
  specialty: 'Dermatologie & Esthétique',
  category: 'spécialiste',
  description: 'Moderne et élégant pour cabinet de dermatologie médicale et esthétique.',
  accentColor: '#ea580c',
  thumbnailColor: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
  sections: [
    make('hero', {
      headline: 'Cabinet de Dermatologie',
      subheadline: 'Soins dermatologiques médicaux et esthétiques — acné, psoriasis, dépigmentation et rajeunissement cutané à Rabat.',
      ctaText: 'Prendre rendez-vous',
      backgroundImage: '',
      overlayOpacity: 50,
    }),
    make('about', {
      heading: 'Votre peau mérite les meilleurs soins',
      body: 'Cabinet de dermatologie-vénérologie spécialisé dans les pathologies cutanées et les traitements esthétiques non-invasifs. Nous combinons expertise médicale et technologies laser de pointe pour des résultats durables et naturels.',
      imageUrl: '',
      imagePosition: 'left',
    }),
    make('services', {
      heading: 'Nos Spécialités',
      items: [
        { id: 's1', icon: '🔬', title: 'Dermatologie médicale', description: 'Acné, eczéma, psoriasis, dermatite atopique, rosacée.' },
        { id: 's2', icon: '🌞', title: 'Dermatologie oncologique', description: 'Dépistage mélanome, naevi atypiques et suivi post-chirurgical.' },
        { id: 's3', icon: '✨', title: 'Laser & peeling', description: 'Traitement des taches, cicatrices d\'acné et renouvellement cutané.' },
        { id: 's4', icon: '💉', title: 'Injections esthétiques', description: 'Botox, acide hyaluronique, comblement des rides et sillons.' },
        { id: 's5', icon: '💫', title: 'Dépigmentation', description: 'Traitement des hyperpigmentations, mélasma et taches de grossesse.' },
        { id: 's6', icon: '🧴', title: 'Alopécie & cheveux', description: 'PRP capillaire, traitement chute de cheveux hommes et femmes.' },
      ],
    }),
    make('doctors', {
      heading: 'Votre dermatologue',
      items: [
        { id: 'd1', name: 'Dr. Salma Tahiri', title: 'Dermatologue-Vénérologue', photoUrl: '', bio: 'Spécialisée en dermatologie médicale et esthétique. Formée en laser cutané à Paris. 10 ans d\'expérience.' },
      ],
    }),
    make('services', {
      heading: 'Nos Technologies',
      items: [
        { id: 'tech1', icon: '🔦', title: 'Laser Nd:YAG', description: 'Traitement des taches vasculaires, lentigos et épilation laser.' },
        { id: 'tech2', icon: '💡', title: 'LED Photothérapie', description: 'Anti-inflammatoire, anti-acné et stimulation du collagène.' },
        { id: 'tech3', icon: '🧬', title: 'Dermato-pathologie', description: 'Analyse histologique in-house pour les lésions suspectes.' },
      ],
    }),
    make('booking_widget', {
      heading: 'Réservez votre consultation',
      body: 'Première consultation dermatologique ou bilan esthétique — choisissez votre créneau en ligne.',
    }),
    make('testimonials', {
      heading: 'Avis patients',
      items: [
        { id: 't1', author: 'Sara K.', role: 'Traitement acné', text: 'Résultat spectaculaire en 3 mois. Ma peau n\'a jamais été aussi nette. Docteure à l\'écoute et patiente.', rating: 5 },
        { id: 't2', author: 'Meryem L.', role: 'Traitement mélasma', text: 'Mes taches de grossesse ont disparu à 80% en 4 séances de laser. Je recommande vivement.', rating: 5 },
        { id: 't3', author: 'Younes A.', role: 'Injection hyaluronique', text: 'Résultat très naturel et professionnel. Cabinet propre et équipe bienveillante.', rating: 5 },
      ],
    }),
    make('faq', {
      heading: 'Questions fréquentes',
      items: [
        { id: 'f1', question: 'Les injections de botox sont-elles douloureuses ?', answer: 'Non, nous utilisons des aiguilles très fines et une crème anesthésiante. La séance dure 15 à 20 minutes.' },
        { id: 'f2', question: 'Combien de séances de laser faut-il ?', answer: 'En général 3 à 6 séances espacées de 4 semaines selon le type de lésion et le phototype.' },
        { id: 'f3', question: 'Prenez-vous en charge les pathologies chroniques ?', answer: 'Oui, nous assurons le suivi long terme du psoriasis, eczéma, rosacée et dermatoses chroniques.' },
      ],
    }),
    make('hours', {
      heading: 'Horaires',
      schedule: [
        { id: 'lun', day: 'Lundi', hours: '09:00 – 13:00 / 15:00 – 18:30', closed: false },
        { id: 'mar', day: 'Mardi', hours: '09:00 – 13:00 / 15:00 – 18:30', closed: false },
        { id: 'mer', day: 'Mercredi', hours: '09:00 – 13:00', closed: false },
        { id: 'jeu', day: 'Jeudi', hours: '09:00 – 13:00 / 15:00 – 18:30', closed: false },
        { id: 'ven', day: 'Vendredi', hours: '09:00 – 13:00 / 15:00 – 17:00', closed: false },
        { id: 'sam', day: 'Samedi', hours: '09:30 – 13:00', closed: false },
        { id: 'dim', day: 'Dimanche', hours: '', closed: true },
      ],
    }),
    make('contact', {
      heading: 'Nous contacter',
      phone: '',
      email: '',
      address: '',
      googleMapsUrl: '',
    }),
  ],
};

// ─── Template: Chirurgie Orthopédique ─────────────────────────────────────────

const ORTHOPEDIQUE: WebsiteTemplate = {
  id: 'chirurgie-orthopedique',
  name: 'Chirurgie Orthopédique',
  specialty: 'Orthopédie & Traumatologie',
  category: 'chirurgie',
  description: 'Professionnel et technique pour chirurgien orthopédiste ou traumatologue.',
  accentColor: '#0f766e',
  thumbnailColor: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
  sections: [
    make('hero', {
      headline: 'Chirurgie Orthopédique & Traumatologie',
      subheadline: 'Expertise chirurgicale en pathologies osseuses, articulaires et ligamentaires. Consultation, bilan et prise en charge chirurgicale à Marrakech.',
      ctaText: 'Prendre rendez-vous',
      backgroundImage: '',
      overlayOpacity: 55,
    }),
    make('about', {
      heading: 'Une expertise chirurgicale de référence',
      body: 'Notre service d\'orthopédie-traumatologie prend en charge l\'ensemble des pathologies de l\'appareil locomoteur — des fractures aux prothèses totales de hanche et genou. Chirurgie ambulatoire, arthroscopie et prothèses de dernière génération.',
      imageUrl: '',
      imagePosition: 'right',
    }),
    make('services', {
      heading: 'Nos Spécialités Chirurgicales',
      items: [
        { id: 's1', icon: '🦴', title: 'Prothèses articulaires', description: 'Prothèse totale de hanche (PTH) et prothèse totale de genou (PTG) de dernière génération.' },
        { id: 's2', icon: '🔭', title: 'Chirurgie arthroscopique', description: 'Ménisques, ligament croisé antérieur (LCA), coiffe des rotateurs.' },
        { id: 's3', icon: '🚑', title: 'Traumatologie', description: 'Fractures, luxations et urgences orthopédiques.' },
        { id: 's4', icon: '🦶', title: 'Chirurgie du pied', description: 'Hallux valgus, orteils en griffe, pied plat et chirurgie du tendon d\'Achille.' },
        { id: 's5', icon: '🧠', title: 'Rachis & colonne', description: 'Hernie discale, sténose canalaire et discopathies dégénératives.' },
        { id: 's6', icon: '👶', title: 'Orthopédie pédiatrique', description: 'Scoliose, dysplasie de hanche et pathologies ostéo-articulaires de l\'enfant.' },
      ],
    }),
    make('doctors', {
      heading: 'Votre chirurgien',
      items: [
        { id: 'd1', name: 'Pr. Youssef El Mansouri', title: 'Chirurgien Orthopédiste — Traumatologue', photoUrl: '', bio: 'Professeur agrégé, spécialiste en chirurgie prothétique et arthroscopique. Plus de 2000 interventions. Ancien chef de service CHU Mohammed VI.' },
        { id: 'd2', name: 'Dr. Zineb Lahlou', title: 'Orthopédiste pédiatrique', photoUrl: '', bio: 'Experte en orthopédie de l\'enfant et de l\'adolescent. Formée à l\'Hôpital Necker Paris.' },
      ],
    }),
    make('booking_widget', {
      heading: 'Prendre rendez-vous',
      body: 'Consultations sur rendez-vous. Chirurgie programmée et urgences traumatologiques acceptées.',
    }),
    make('testimonials', {
      heading: 'Retours d\'expérience',
      items: [
        { id: 't1', author: 'Driss M.', role: 'Prothèse de genou', text: 'Opération parfaite, reprise de marche en 48h. Équipe très professionnelle, je marche sans douleur depuis 1 an.', rating: 5 },
        { id: 't2', author: 'Khadija B.', role: 'Chirurgie LCA', text: 'Retour au sport en 6 mois comme promis. Le Pr. El Mansouri est exceptionnel.', rating: 5 },
        { id: 't3', author: 'Hassan A.', role: 'Prothèse de hanche', text: 'À 68 ans, je marche à nouveau sans douleur. Chirurgie rapide et suivi post-op impeccable.', rating: 5 },
      ],
    }),
    make('faq', {
      heading: 'Questions fréquentes',
      items: [
        { id: 'f1', question: 'Combien de temps dure une intervention de prothèse de genou ?', answer: 'Environ 1h30 à 2h sous anesthésie rachidienne. L\'hospitalisation est de 3 à 5 jours. La rééducation commence dès le lendemain.' },
        { id: 'f2', question: 'La chirurgie arthroscopique laisse-t-elle des cicatrices ?', answer: 'Non, elle utilise de petites incisions de 5mm, avec une récupération rapide et une cicatrice quasi invisible.' },
        { id: 'f3', question: 'Acceptez-vous les mutuelles AMO et CNOPS ?', answer: 'Oui, nous travaillons avec la majorité des organismes de protection sociale au Maroc (AMO, CNOPS, CNSS, mutuelles privées).' },
      ],
    }),
    make('hours', {
      heading: 'Consultations',
      schedule: [
        { id: 'lun', day: 'Lundi', hours: '09:00 – 13:00 / 15:00 – 17:00', closed: false },
        { id: 'mar', day: 'Mardi', hours: '09:00 – 13:00', closed: false },
        { id: 'mer', day: 'Mercredi', hours: '09:00 – 13:00 / 15:00 – 17:00', closed: false },
        { id: 'jeu', day: 'Jeudi', hours: '09:00 – 13:00', closed: false },
        { id: 'ven', day: 'Vendredi', hours: '09:00 – 12:00', closed: false },
        { id: 'sam', day: 'Samedi', hours: '09:00 – 12:00 (urgences)', closed: false },
        { id: 'dim', day: 'Dimanche', hours: '', closed: true },
      ],
    }),
    make('contact', {
      heading: 'Nous trouver',
      phone: '',
      email: '',
      address: '',
      googleMapsUrl: '',
    }),
  ],
};

// ─── All templates ─────────────────────────────────────────────────────────────

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  DENTISTE_MODERNE,
  MEDECIN_GENERALISTE,
  PEDIATRIE_FAMILIALE,
  GYNECOLOGIE_MATERNITE,
  OPHTALMOLOGIE,
  CLINIQUE_PREMIUM,
  CARDIOLOGIE,
  DERMATOLOGIE,
  ORTHOPEDIQUE,
];

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'dentaire', label: 'Dentaire' },
  { id: 'médecine', label: 'Médecine' },
  { id: 'pédiatrie', label: 'Pédiatrie' },
  { id: 'spécialiste', label: 'Spécialistes' },
  { id: 'chirurgie', label: 'Chirurgie' },
];
