export interface GreenCoffeeLotRecord {
  id: string;
  name: string;
  origin?: string;
  variety?: string;
  processing?: string;
  harvest?: string;
  supplier?: string;
  sensoryNotes?: string;
  costPerKg: number;
  stockKg: number;
  status: string;
  createdAt: string;
}

export interface ProductionRecipeRecord {
  id: string;
  productId: string;
  name: string;
  targetYield: number;
  defaultPackagingId?: string;
  defaultCostPerHour: number;
  observations?: string;
  inputs: Array<{ id: string; greenLotId: string; percent: number; estimatedWaste: number }>;
  extras: Array<{ id: string; itemName: string; cost: number }>;
}

export interface RoastProfileRecord {
  id: string;
  recipeId: string;
  name: string;
  totalTime: number;
  roastLevel: string;
  notes?: string;
  curveJson?: string;
  active: boolean;
}

export interface IAdvancedProductionRepository {
  getGreenLots(): Promise<GreenCoffeeLotRecord[]>;
  createGreenLot(data: Partial<GreenCoffeeLotRecord>): Promise<GreenCoffeeLotRecord>;
  updateGreenLot(id: string, data: Partial<GreenCoffeeLotRecord>): Promise<GreenCoffeeLotRecord>;

  getRecipes(): Promise<ProductionRecipeRecord[]>;
  createRecipe(data: Partial<ProductionRecipeRecord>): Promise<ProductionRecipeRecord>;
  updateRecipe(id: string, data: Partial<ProductionRecipeRecord>): Promise<ProductionRecipeRecord>;

  getRoastProfiles(): Promise<RoastProfileRecord[]>;
  createRoastProfile(data: Partial<RoastProfileRecord>): Promise<RoastProfileRecord>;
  updateRoastProfile(id: string, data: Partial<RoastProfileRecord>): Promise<RoastProfileRecord>;

  getProductionDemand(): Promise<any[]>;
  createBatchFromDemand(data: any): Promise<any>;
  reserveBatchInputs(id: string, data: { greenLotId: string; reservedKg: number }): Promise<any>;
  startBatch(id: string): Promise<any>;
  completeBatch(id: string, data: { finalWeight: number; packagedQty: number; costPerUnit: number }): Promise<any>;
  cancelBatch(id: string): Promise<any>;
}
