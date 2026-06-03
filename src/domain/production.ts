import { productionBatches, products } from '../data/mocks';
import { ProductionBatch, ProductionInput, ProductionExtraCost, ProductionStatus } from './types';
import { createStockEntry, createStockExit } from './inventory';

export function calculateYield(initialWeight: number, finalWeight: number) {
  if (initialWeight <= 0) return { yieldPercent: 0, lossPercent: 0 };
  const yieldPercent = (finalWeight / initialWeight) * 100;
  const lossPercent = 100 - yieldPercent;
  return { yieldPercent, lossPercent };
}

export function calculateProductionCosts(
  inputs: ProductionInput[],
  extraCosts: ProductionExtraCost[],
  hours: number,
  laborCostPerHour: number,
  finalQty: number
) {
  const totalInputCost = inputs.reduce((acc, i) => acc + (i.qty * i.unitCost), 0);
  const totalExtraCost = extraCosts.reduce((acc, c) => acc + c.amount, 0);
  const totalLaborCost = hours * laborCostPerHour;
  const totalCost = totalInputCost + totalExtraCost + totalLaborCost;
  const unitCost = finalQty > 0 ? totalCost / finalQty : 0;
  
  return { totalInputCost, totalExtraCost, totalLaborCost, totalCost, unitCost };
}

export function validateProductionInputs(inputs: { productId: string; qty: number }[]) {
  const warnings: string[] = [];
  for (const input of inputs) {
    const product = products.find(p => p.id === input.productId);
    if (!product) continue;
    if (product.stock < input.qty) {
      warnings.push(`Insumo ${product.name} insuficiente no estoque (Disponível: ${product.stock}).`);
    }
  }
  return warnings;
}

export function createProductionBatch(data: {
  finalProductId: string;
  finalProductName: string;
  initialWeight: number;
  finalWeight: number;
  finalQty: number;
  inputs: ProductionInput[];
  extraCosts: ProductionExtraCost[];
  hours: number;
  laborCostPerHour: number;
  responsible: string;
  notes: string;
  status: ProductionStatus;
}) {
  const { yieldPercent, lossPercent } = calculateYield(data.initialWeight, data.finalWeight);
  const costs = calculateProductionCosts(data.inputs, data.extraCosts, data.hours, data.laborCostPerHour, data.finalQty);

  const newBatch: ProductionBatch = {
    id: `PRD-${Date.now().toString().slice(-4)}`,
    code: `TR-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString(),
    ...data,
    yieldPercent,
    lossPercent,
    ...costs
  };

  productionBatches.unshift(newBatch);

  if (data.status === 'Concluído') {
    applyProductionStockMovements(newBatch);
  }

  return newBatch;
}

export function finalizeProductionBatch(batchId: string, finalData: {
  finalWeight: number;
  finalQty: number;
  extraCosts: ProductionExtraCost[];
  hours: number;
  notes: string;
}) {
  const batch = productionBatches.find(b => b.id === batchId);
  if (!batch) throw new Error('Lote não encontrado.');
  if (batch.status === 'Concluído') throw new Error('Lote já está concluído.');

  batch.finalWeight = finalData.finalWeight;
  batch.finalQty = finalData.finalQty;
  batch.extraCosts = finalData.extraCosts;
  batch.hours = finalData.hours;
  batch.notes = finalData.notes;
  
  const { yieldPercent, lossPercent } = calculateYield(batch.initialWeight, batch.finalWeight);
  batch.yieldPercent = yieldPercent;
  batch.lossPercent = lossPercent;

  const costs = calculateProductionCosts(batch.inputs, batch.extraCosts, batch.hours, batch.laborCostPerHour, batch.finalQty);
  Object.assign(batch, costs);
  
  batch.status = 'Concluído';

  applyProductionStockMovements(batch);

  return batch;
}

function applyProductionStockMovements(batch: ProductionBatch) {
  // Deduct inputs
  for (const input of batch.inputs) {
    createStockExit(input.productId, input.name, input.qty, `Insumo Lote ${batch.code}`);
  }
  // Add product
  if (batch.finalQty > 0) {
    createStockEntry(batch.finalProductId, batch.finalProductName, batch.finalQty, `Produção Lote ${batch.code}`);
  }
}
