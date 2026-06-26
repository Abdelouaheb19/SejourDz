export interface Package {
  id: string;
  title: string;
  description: string;
  destination: string;
  durationDays: number;
  price: number;
  promoPrice?: number; // Optional promotion price
  image: string;
  spotsAvailable: number;
  spotsMax: number;
  startDate: string;
  endDate: string;
  inclusions: string[];
  exclusions: string[];
  schedule: { day: number; title: string; desc: string }[];
  status: 'active' | 'inactive';
  rating: number;
  category: 'Plage' | 'Culture' | 'Aventure' | 'Luxe' | 'Famille';
}

export interface Booking {
  id: string;
  packageId: string;
  packageTitle: string;
  packageImage: string;
  packagePrice: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  passengers: string[]; // name of each traveler
  totalAmount: number;
  status: 'En attente' | 'Confirmé' | 'Annulé';
  paymentStatus: 'Non payé' | 'Acompte payé' | 'Payé';
  paymentMethod?: 'Carte bancaire' | 'Virement' | 'Agence';
  paymentAmount: number;
  dateBooked: string;
  specialRequests?: string;
  aiCustomization?: string; // Stored custom markdown suggestion from Gemini
}

export interface SystemStats {
  totalBookings: number;
  totalRevenue: number;
  activePackages: number;
  pendingValidation: number;
}
