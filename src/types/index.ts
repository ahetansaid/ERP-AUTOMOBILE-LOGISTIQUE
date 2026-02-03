export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export interface Vehicle {
  id: string;
  vin: string;
  chassisNumber?: string;
  brand: string;
  model: string;
  year: number;
  vehicleType?: string;
  status: string;
  clientId?: string;
  clientName?: string;
  purchasePrice?: number;
  salePrice?: number;
  currency?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface TransitStep {
  id: string;
  vehicleId: string;
  step: string;
  date?: string;
  status: string;
  details?: string;
}
