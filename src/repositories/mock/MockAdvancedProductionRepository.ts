import { IAdvancedProductionRepository, GreenCoffeeLotRecord, ProductionRecipeRecord, RoastProfileRecord } from '../interfaces/IAdvancedProductionRepository';

export class MockAdvancedProductionRepository implements IAdvancedProductionRepository {
  private lots: GreenCoffeeLotRecord[] = [];
  private recipes: ProductionRecipeRecord[] = [];
  private profiles: RoastProfileRecord[] = [];
  private demand: any[] = [{ id: '1', product: 'Café Especial 250g', pendingOrders: 12, pendingSubscriptions: 3, currentStock: 5, suggestedProduction: 10 }];

  constructor() {
    this.lots.push({ id: '1', name: 'Mundo Novo Safra 25', origin: 'Fazenda Sertão', variety: 'Mundo Novo', processing: 'Natural', harvest: '2025', costPerKg: 35.5, stockKg: 600, status: 'available', createdAt: new Date().toISOString() });
    
    this.recipes.push({
       id: 'rec-1', productId: 'prod-1', name: 'Torra Padrão B2C', targetYield: 0.85, defaultCostPerHour: 50,
       inputs: [{ id: 'in-1', greenLotId: '1', percent: 1, estimatedWaste: 0.15 }],
       extras: [{ id: 'ext-1', itemName: 'Saco Valvulado 250g', cost: 2.5 }]
    });
    
    this.profiles.push({
       id: 'prof-1', recipeId: 'rec-1', name: 'Omni Roast', totalTime: 720, roastLevel: 'medium', active: true
    });
  }

  async getGreenLots(): Promise<GreenCoffeeLotRecord[]> { return this.lots; }
  async createGreenLot(data: Partial<GreenCoffeeLotRecord>): Promise<GreenCoffeeLotRecord> {
    const l = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() } as GreenCoffeeLotRecord;
    this.lots.push(l); return l;
  }
  async updateGreenLot(id: string, data: Partial<GreenCoffeeLotRecord>): Promise<GreenCoffeeLotRecord> {
    const i = this.lots.findIndex(x => x.id === id); if(i===-1) throw new Error('Not found');
    this.lots[i] = { ...this.lots[i], ...data }; return this.lots[i];
  }

  async getRecipes(): Promise<ProductionRecipeRecord[]> { return this.recipes; }
  async createRecipe(data: Partial<ProductionRecipeRecord>): Promise<ProductionRecipeRecord> {
    const r = { ...data, id: Date.now().toString() } as ProductionRecipeRecord;
    this.recipes.push(r); return r;
  }
  async updateRecipe(id: string, data: Partial<ProductionRecipeRecord>): Promise<ProductionRecipeRecord> {
    const i = this.recipes.findIndex(x => x.id === id); if(i===-1) throw new Error('Not found');
    this.recipes[i] = { ...this.recipes[i], ...data }; return this.recipes[i];
  }

  async getRoastProfiles(): Promise<RoastProfileRecord[]> { return this.profiles; }
  async createRoastProfile(data: Partial<RoastProfileRecord>): Promise<RoastProfileRecord> {
    const p = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() } as RoastProfileRecord;
    this.profiles.push(p); return p;
  }
  async updateRoastProfile(id: string, data: Partial<RoastProfileRecord>): Promise<RoastProfileRecord> {
    const i = this.profiles.findIndex(x => x.id === id); if(i===-1) throw new Error('Not found');
    this.profiles[i] = { ...this.profiles[i], ...data }; return this.profiles[i];
  }

  async getProductionDemand(): Promise<any[]> { return this.demand; }
  async createBatchFromDemand(data: any): Promise<any> { return { status: 'ok', id: '123' }; }

  async reserveBatchInputs(id: string, data: { greenLotId: string; reservedKg: number }): Promise<any> { return { status: 'ok' }; }
  async startBatch(id: string): Promise<any> { return { status: 'ok' }; }
  async completeBatch(id: string, data: { finalWeight: number; packagedQty: number; costPerUnit: number }): Promise<any> { return { status: 'ok' }; }
  async cancelBatch(id: string): Promise<any> { return { status: 'ok' }; }
}
