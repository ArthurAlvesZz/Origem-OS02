import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { errorHandler } from './server/middlewares/errorHandler';
import { requireAuth } from './server/middlewares/requireAuth';
import { checkDbConnection } from './server/lib/prisma';

// Auth Routes
import { login, getMe, loginSchema } from './server/modules/auth/auth.controller';
import { validate } from './server/middlewares/validate';

// Product Routes
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, productSchema } from './server/modules/products/products.controller';

// Inventory Routes
import { getMovements, createMovement, getInventorySummary, getLowStock, movementSchema } from './server/modules/inventory/inventory.controller';

// Orders Routes
import { getOrders, getOrderById, createOrder, cancelOrder, createOrderSchema } from './server/modules/orders/orders.controller';
import { getBatches, getBatchById, createBatch, finalizeBatch, cancelBatch, createProductionBatchSchema, finalizeProductionBatchSchema } from './server/modules/production/production.controller';
import { getConsignments, getConsignmentById, createConsignment, settleConsignment, cancelConsignment, createConsignmentSchema, settleConsignmentSchema, getPartners, createPartner, updatePartner, createPartnerSchema } from './server/modules/consignments/consignments.controller';
import { getTransactions, createExpense, markAsPaid, cancelTransaction, getFinancialSummary, getCashFlow, getSimpleDre, expenseSchema } from './server/modules/finance/finance.controller';
import { getSummary, getAlerts, getRecentActivity } from './server/modules/dashboard/dashboard.controller';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer, getCustomerBalance, getCustomerActivity, createCustomerSchema, updateCustomerSchema } from './server/modules/customers/customers.controller';
import { getProfile, updateProfile, getBranches, createBranch, updateBranch, deleteBranch, getBusinessRules, updateBusinessRules, getProductionRules, updateProductionRules, getModuleFlags, updateModuleFlags } from './server/modules/settings/settings.controller';
import { getSalesReports, getFinanceReports, getInventoryReports, generateDocument, getDocuments, voidDocument } from './server/modules/reports/reports.controller';

import { 
  getStorefrontProducts, 
  getStorefrontPlans, 
  createSubscriptionRequest,
  getPlans,
  createPlan,
  updatePlan,
  getRequests,
  updateRequestStatus,
  getSubscriptions,
  updateSubscriptionStatus
} from './server/controllers/storefront';

import { requirePermission } from './server/middlewares/requirePermission';
import { 
  getTeamMembers, 
  getRoles, 
  getPermissionsList, 
  createRole, 
  updateRole, 
  updateTeamMember, 
  suspendTeamMember, 
  reactivateTeamMember, 
  createInvitation, 
  getAuditLogs, 
  getMyPermissions 
} from './server/controllers/team';

import {
  createPaymentIntentPublic,
  webhookHandler,
  getIntents,
  markAsPaidManual,
  cancelIntent,
  getWebhookEvents,
  getProviderConfig,
  updateProviderConfig
} from './server/controllers/payments';

import {
  getPipelines,
  createPipeline,
  getDeals,
  createDeal,
  updateDeal,
  moveDeal,
  getActivities,
  createActivity,
  getTemplates,
  createTemplate,
  getCommunications,
  queueCommunication,
  markCommunicationSimulated
} from './server/controllers/crm';

import {
  getGreenLots, createGreenLot, updateGreenLot,
  getRecipes, createRecipe, updateRecipe,
  getRoastProfiles, createRoastProfile, updateRoastProfile,
  getProductionDemand,
  createBatchFromDemand,
  reserveBatchInputs, startBatch, completeBatch, cancelBatch as advCancelBatch
} from './server/controllers/advancedProduction';

import {
  getReviews, createReview, updateReview, approveReview, rejectReview, getDescriptors, getDefects
} from './server/controllers/quality';

import {
  getB2BCatalog, createB2BCatalogItem, updateB2BCatalogItem
} from './server/controllers/b2bCatalog';

import {
  getPublicTrace, getTraces, getTraceById, createTraceFromQualityInfo, updateTrace, publishTrace, unpublishTrace
} from './server/controllers/traceability';

import {
  getConfig, updateConfig, getCategories, createCategory, updateCategory, deleteCategory,
  getItems, createItem, updateItem, deleteItem, getOrders as getDigitalMenuOrders, updateOrderStatus,
  getPublicMenu, createPublicOrder, getPublicOrder
} from './server/controllers/digitalMenu';

import {
  getConnectUrl, oauthCallback, getStatus as getMpStatus, disconnect as disconnectMp, webhook as mpWebhook
} from './server/controllers/paymentMercadoPago';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/version', (req, res) => res.json({ version: '1.0.0-phase2' }));
  app.get('/api/health', async (req, res) => {
    const isDbConnected = await checkDbConnection();
    res.json({ status: isDbConnected ? 'ok' : 'error', database: isDbConnected });
  });

  app.get('/api/system/status', async (req, res) => {
    const isDbConnected = await checkDbConnection();
    res.json({
      appVersion: '1.0.0-phase2',
      nodeEnv: process.env.NODE_ENV || 'development',
      dbConnected: isDbConnected,
      dataMode: process.env.DATA_MODE || 'api',
      tenantMode: 'multi',
      uptime: process.uptime()
    });
  });

  // DB strict middleware for actual API data routes
  const requireDb = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const isDbConnected = await checkDbConnection();
    if (!isDbConnected) {
      return res.status(503).json({ error: 'Database is not configured or offline. Please use mock mode.' });
    }
    next();
  };

  // Middleware overrides for Async Errors
  const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  app.post('/api/auth/login', requireDb, validate(loginSchema), asyncHandler(login));
  app.get('/api/me', requireDb, requireAuth, asyncHandler(getMe));

  app.get('/api/products', requireDb, requireAuth, asyncHandler(getProducts));
  app.get('/api/products/:id', requireDb, requireAuth, asyncHandler(getProductById));
  app.post('/api/products', requireDb, requireAuth, validate(productSchema), asyncHandler(createProduct));
  app.patch('/api/products/:id', requireDb, requireAuth, validate(productSchema), asyncHandler(updateProduct));
  app.delete('/api/products/:id', requireDb, requireAuth, asyncHandler(deleteProduct));

  // Stub routes for domains
  app.post('/api/auth/refresh', (req, res) => res.json({ token: 'dummy-jwt-token-refresh' }));
  // Inventory Routes
  app.get('/api/inventory/movements', requireDb, requireAuth, asyncHandler(getMovements));
  app.post('/api/inventory/movements', requireDb, requireAuth, validate(movementSchema), asyncHandler(createMovement));
  app.get('/api/inventory/summary', requireDb, requireAuth, asyncHandler(getInventorySummary));
  app.get('/api/inventory/low-stock', requireDb, requireAuth, asyncHandler(getLowStock));

  // Orders Routes
  app.get('/api/orders', requireDb, requireAuth, asyncHandler(getOrders));
  app.post('/api/orders', requireDb, requireAuth, validate(createOrderSchema), asyncHandler(createOrder));
  app.get('/api/orders/:id', requireDb, requireAuth, asyncHandler(getOrderById));
  app.patch('/api/orders/:id/cancel', requireDb, requireAuth, asyncHandler(cancelOrder));

  // Operations/Production Routes
  app.get('/api/production/batches', requireDb, requireAuth, asyncHandler(getBatches));
  app.post('/api/production/batches', requireDb, requireAuth, validate(createProductionBatchSchema), asyncHandler(createBatch));
  app.get('/api/production/batches/:id', requireDb, requireAuth, asyncHandler(getBatchById));
  app.patch('/api/production/batches/:id/complete', requireDb, requireAuth, validate(finalizeProductionBatchSchema), asyncHandler(finalizeBatch));
  app.patch('/api/production/batches/:id/cancel', requireDb, requireAuth, asyncHandler(cancelBatch));

  // Customer Routes
  app.get('/api/customers', requireDb, requireAuth, asyncHandler(getCustomers));
  app.get('/api/customers/:id', requireDb, requireAuth, asyncHandler(getCustomerById));
  app.post('/api/customers', requireDb, requireAuth, validate(createCustomerSchema), asyncHandler(createCustomer));
  app.patch('/api/customers/:id', requireDb, requireAuth, validate(updateCustomerSchema), asyncHandler(updateCustomer));
  app.delete('/api/customers/:id', requireDb, requireAuth, asyncHandler(deleteCustomer));
  app.get('/api/customers/:id/balance', requireDb, requireAuth, asyncHandler(getCustomerBalance));
  app.get('/api/customers/:id/activity', requireDb, requireAuth, asyncHandler(getCustomerActivity));

  // Settings Routes
  app.get('/api/settings/profile', requireDb, requireAuth, asyncHandler(getProfile));
  app.patch('/api/settings/profile', requireDb, requireAuth, asyncHandler(updateProfile));
  
  // Team & Audit Routes
  app.get('/api/me/permissions', requireDb, requireAuth, asyncHandler(getMyPermissions));
  app.get('/api/team/members', requireDb, requireAuth, asyncHandler(getTeamMembers));
  app.patch('/api/team/members/:id', requireDb, requireAuth, requirePermission('team:update'), asyncHandler(updateTeamMember));
  app.patch('/api/team/members/:id/suspend', requireDb, requireAuth, requirePermission('team:suspend'), asyncHandler(suspendTeamMember));
  app.patch('/api/team/members/:id/reactivate', requireDb, requireAuth, requirePermission('team:update'), asyncHandler(reactivateTeamMember));
  
  app.get('/api/team/roles', requireDb, requireAuth, asyncHandler(getRoles));
  app.post('/api/team/roles', requireDb, requireAuth, requirePermission('team:update'), asyncHandler(createRole));
  app.patch('/api/team/roles/:id', requireDb, requireAuth, requirePermission('team:update'), asyncHandler(updateRole));
  // Not exposing delete Role yet to avoid orphaned users, can do soft delete later
  
  app.get('/api/team/permissions', requireDb, requireAuth, asyncHandler(getPermissionsList));
  app.post('/api/team/invitations', requireDb, requireAuth, requirePermission('team:invite'), asyncHandler(createInvitation));
  
  app.get('/api/audit/access-log', requireDb, requireAuth, requirePermission('audit:read'), asyncHandler(getAuditLogs));
  app.get('/api/settings/branches', requireDb, requireAuth, asyncHandler(getBranches));
  app.post('/api/settings/branches', requireDb, requireAuth, asyncHandler(createBranch));
  app.patch('/api/settings/branches/:id', requireDb, requireAuth, asyncHandler(updateBranch));
  app.delete('/api/settings/branches/:id', requireDb, requireAuth, asyncHandler(deleteBranch));
  app.get('/api/settings/business-rules', requireDb, requireAuth, asyncHandler(getBusinessRules));
  app.patch('/api/settings/business-rules', requireDb, requireAuth, asyncHandler(updateBusinessRules));
  app.get('/api/settings/production-rules', requireDb, requireAuth, asyncHandler(getProductionRules));
  app.patch('/api/settings/production-rules', requireDb, requireAuth, asyncHandler(updateProductionRules));
  app.get('/api/settings/modules', requireDb, requireAuth, asyncHandler(getModuleFlags));
  app.patch('/api/settings/modules', requireDb, requireAuth, asyncHandler(updateModuleFlags));

  // Reports & Documents Routes
  app.get('/api/reports/sales', requireDb, requireAuth, asyncHandler(getSalesReports));
  app.get('/api/reports/finance', requireDb, requireAuth, asyncHandler(getFinanceReports));
  app.get('/api/reports/inventory', requireDb, requireAuth, asyncHandler(getInventoryReports));
  app.post('/api/documents/generate', requireDb, requireAuth, asyncHandler(generateDocument));
  app.get('/api/documents', requireDb, requireAuth, asyncHandler(getDocuments));
  app.patch('/api/documents/:id/void', requireDb, requireAuth, asyncHandler(voidDocument));

  // ----------------------------------------------------------------------
  // STOREFRONT & ENQUIRIES - PUBLIC (No Auth)
  // ----------------------------------------------------------------------
  app.get('/api/storefront/products', asyncHandler(getStorefrontProducts));
  app.get('/api/storefront/subscription-plans', asyncHandler(getStorefrontPlans));
  app.post('/api/storefront/subscription-requests', asyncHandler(createSubscriptionRequest));

  // ----------------------------------------------------------------------
  // SUBSCRIPTIONS - ADMIN
  // ----------------------------------------------------------------------
  app.get('/api/subscriptions/plans', requireDb, requireAuth, asyncHandler(getPlans));
  app.post('/api/subscriptions/plans', requireDb, requireAuth, asyncHandler(createPlan));
  app.patch('/api/subscriptions/plans/:id', requireDb, requireAuth, asyncHandler(updatePlan));
  app.get('/api/subscriptions/requests', requireDb, requireAuth, asyncHandler(getRequests));
  app.patch('/api/subscriptions/requests/:id/status', requireDb, requireAuth, asyncHandler(updateRequestStatus));
  app.get('/api/subscriptions', requireDb, requireAuth, asyncHandler(getSubscriptions));
  app.patch('/api/subscriptions/:id/status', requireDb, requireAuth, asyncHandler(updateSubscriptionStatus));

  // ----------------------------------------------------------------------
  // PAYMENTS & WEBHOOKS
  // ----------------------------------------------------------------------
  // Public / Webhooks
  app.post('/api/payments/intents', asyncHandler(createPaymentIntentPublic));
  app.post('/api/payments/webhooks/:provider', asyncHandler(webhookHandler));

  // Admin
  app.get('/api/payments/intents', requireDb, requireAuth, asyncHandler(getIntents));
  app.post('/api/payments/intents/:id/mark-paid-manual', requireDb, requireAuth, asyncHandler(markAsPaidManual));
  app.post('/api/payments/intents/:id/cancel', requireDb, requireAuth, asyncHandler(cancelIntent));
  app.get('/api/payments/webhook-events', requireDb, requireAuth, asyncHandler(getWebhookEvents));
  app.get('/api/payments/provider-config', requireDb, requireAuth, asyncHandler(getProviderConfig));
  app.patch('/api/payments/provider-config', requireDb, requireAuth, asyncHandler(updateProviderConfig));

  // Mercado Pago Admin
  app.get('/api/payments/mercadopago/connect-url', requireDb, requireAuth, asyncHandler(getConnectUrl));
  app.get('/api/payments/mercadopago/callback', requireDb, asyncHandler(oauthCallback));
  app.post('/api/payments/mercadopago/disconnect', requireDb, requireAuth, asyncHandler(disconnectMp));
  app.get('/api/payments/mercadopago/status', requireDb, requireAuth, asyncHandler(getMpStatus));

  // Mercado Pago Webhook 
  app.post('/api/payments/mercadopago/webhook', requireDb, asyncHandler(mpWebhook));

  // ----------------------------------------------------------------------
  // CRM & COMMUNICATIONS
  // ----------------------------------------------------------------------
  app.get('/api/crm/pipelines', requireDb, requireAuth, asyncHandler(getPipelines));
  app.post('/api/crm/pipelines', requireDb, requireAuth, asyncHandler(createPipeline));
  app.get('/api/crm/deals', requireDb, requireAuth, asyncHandler(getDeals));
  app.post('/api/crm/deals', requireDb, requireAuth, asyncHandler(createDeal));
  app.patch('/api/crm/deals/:id', requireDb, requireAuth, asyncHandler(updateDeal));
  app.patch('/api/crm/deals/:id/move', requireDb, requireAuth, asyncHandler(moveDeal));
  app.get('/api/crm/activities', requireDb, requireAuth, asyncHandler(getActivities));
  app.post('/api/crm/activities', requireDb, requireAuth, asyncHandler(createActivity));
  app.get('/api/crm/templates', requireDb, requireAuth, asyncHandler(getTemplates));
  app.post('/api/crm/templates', requireDb, requireAuth, asyncHandler(createTemplate));
  app.get('/api/crm/communications', requireDb, requireAuth, asyncHandler(getCommunications));
  app.post('/api/crm/communications/queue', requireDb, requireAuth, asyncHandler(queueCommunication));
  app.post('/api/crm/communications/:id/simulate', requireDb, requireAuth, asyncHandler(markCommunicationSimulated));
  
  // ----------------------------------------------------------------------
  // ADVANCED PRODUCTION 
  // ----------------------------------------------------------------------
  app.get('/api/production/green-lots', requireDb, requireAuth, asyncHandler(getGreenLots));
  app.post('/api/production/green-lots', requireDb, requireAuth, asyncHandler(createGreenLot));
  app.patch('/api/production/green-lots/:id', requireDb, requireAuth, asyncHandler(updateGreenLot));
  
  app.get('/api/production/recipes', requireDb, requireAuth, asyncHandler(getRecipes));
  app.post('/api/production/recipes', requireDb, requireAuth, asyncHandler(createRecipe));
  app.patch('/api/production/recipes/:id', requireDb, requireAuth, asyncHandler(updateRecipe));
  
  app.get('/api/production/roast-profiles', requireDb, requireAuth, asyncHandler(getRoastProfiles));
  app.post('/api/production/roast-profiles', requireDb, requireAuth, asyncHandler(createRoastProfile));
  app.patch('/api/production/roast-profiles/:id', requireDb, requireAuth, asyncHandler(updateRoastProfile));
  
  app.get('/api/production/demand', requireDb, requireAuth, asyncHandler(getProductionDemand));
  app.post('/api/production/batches/from-demand', requireDb, requireAuth, asyncHandler(createBatchFromDemand));
  app.post('/api/production/batches/:id/reserve', requireDb, requireAuth, asyncHandler(reserveBatchInputs));
  app.post('/api/production/batches/:id/start', requireDb, requireAuth, asyncHandler(startBatch));
  app.post('/api/production/batches/:id/complete', requireDb, requireAuth, asyncHandler(completeBatch));
  app.post('/api/production/batches/:id/cancel', requireDb, requireAuth, asyncHandler(advCancelBatch));
  
  // ----------------------------------------------------------------------
  // QUALITY CONTROL
  // ----------------------------------------------------------------------
  app.get('/api/quality/reviews', requireDb, requireAuth, asyncHandler(getReviews));
  app.post('/api/quality/reviews', requireDb, requireAuth, asyncHandler(createReview));
  app.patch('/api/quality/reviews/:id', requireDb, requireAuth, asyncHandler(updateReview));
  app.post('/api/quality/reviews/:id/approve', requireDb, requireAuth, asyncHandler(approveReview));
  app.post('/api/quality/reviews/:id/reject', requireDb, requireAuth, asyncHandler(rejectReview));
  app.get('/api/quality/descriptors', requireDb, requireAuth, asyncHandler(getDescriptors));
  app.get('/api/quality/defects', requireDb, requireAuth, asyncHandler(getDefects));

  // ----------------------------------------------------------------------
  // DIGITAL MENU - PUBLIC (No Auth)
  // ----------------------------------------------------------------------
  app.get('/api/public/menu/:slug', requireDb, asyncHandler(getPublicMenu));
  app.post('/api/public/menu/:slug/orders', requireDb, asyncHandler(createPublicOrder));
  app.get('/api/public/menu/:slug/orders/:id', requireDb, asyncHandler(getPublicOrder));

  // ----------------------------------------------------------------------
  // PUBLIC TRACEABILITY (No auth needed)
  // ----------------------------------------------------------------------
  app.get('/api/public/trace/:publicCode', requireDb, asyncHandler(getPublicTrace));

  // ----------------------------------------------------------------------
  // TRACEABILITY ADMIN
  // ----------------------------------------------------------------------
  app.get('/api/traceability', requireDb, requireAuth, asyncHandler(getTraces));
  app.get('/api/traceability/:id', requireDb, requireAuth, asyncHandler(getTraceById));
  app.post('/api/traceability/from-quality/:qualityReviewId', requireDb, requireAuth, asyncHandler(createTraceFromQualityInfo));
  app.patch('/api/traceability/:id', requireDb, requireAuth, asyncHandler(updateTrace));
  app.post('/api/traceability/:id/publish', requireDb, requireAuth, asyncHandler(publishTrace));
  app.post('/api/traceability/:id/unpublish', requireDb, requireAuth, asyncHandler(unpublishTrace));

  // ----------------------------------------------------------------------
  // B2B CATALOG
  // ----------------------------------------------------------------------
  app.get('/api/b2b/catalog', requireDb, requireAuth, asyncHandler(getB2BCatalog));
  app.post('/api/b2b/catalog/items', requireDb, requireAuth, asyncHandler(createB2BCatalogItem));
  app.patch('/api/b2b/catalog/items/:id', requireDb, requireAuth, asyncHandler(updateB2BCatalogItem));

  // ----------------------------------------------------------------------
  // DIGITAL MENU (Admin)
  // ----------------------------------------------------------------------
  app.get('/api/digital-menu/config', requireDb, requireAuth, asyncHandler(getConfig));
  app.patch('/api/digital-menu/config', requireDb, requireAuth, asyncHandler(updateConfig));
  app.get('/api/digital-menu/categories', requireDb, requireAuth, asyncHandler(getCategories));
  app.post('/api/digital-menu/categories', requireDb, requireAuth, asyncHandler(createCategory));
  app.patch('/api/digital-menu/categories/:id', requireDb, requireAuth, asyncHandler(updateCategory));
  app.delete('/api/digital-menu/categories/:id', requireDb, requireAuth, asyncHandler(deleteCategory));
  app.get('/api/digital-menu/items', requireDb, requireAuth, asyncHandler(getItems));
  app.post('/api/digital-menu/items', requireDb, requireAuth, asyncHandler(createItem));
  app.patch('/api/digital-menu/items/:id', requireDb, requireAuth, asyncHandler(updateItem));
  app.delete('/api/digital-menu/items/:id', requireDb, requireAuth, asyncHandler(deleteItem));
  app.get('/api/digital-menu/orders', requireDb, requireAuth, asyncHandler(getDigitalMenuOrders));
  app.patch('/api/digital-menu/orders/:id/status', requireDb, requireAuth, asyncHandler(updateOrderStatus));

  // Consignments Routes
  app.get('/api/partners', requireDb, requireAuth, asyncHandler(getPartners));
  app.post('/api/partners', requireDb, requireAuth, validate(createPartnerSchema), asyncHandler(createPartner));
  app.patch('/api/partners/:id', requireDb, requireAuth, asyncHandler(updatePartner));
  
  app.get('/api/consignments', requireDb, requireAuth, asyncHandler(getConsignments));
  app.get('/api/consignments/:id', requireDb, requireAuth, asyncHandler(getConsignmentById));
  app.post('/api/consignments', requireDb, requireAuth, validate(createConsignmentSchema), asyncHandler(createConsignment));
  app.patch('/api/consignments/:id/settle', requireDb, requireAuth, validate(settleConsignmentSchema), asyncHandler(settleConsignment));
  app.patch('/api/consignments/:id/cancel', requireDb, requireAuth, asyncHandler(cancelConsignment));

  // Finance Routes
  app.get('/api/finance/transactions', requireDb, requireAuth, asyncHandler(getTransactions));
  app.post('/api/finance/expenses', requireDb, requireAuth, validate(expenseSchema), asyncHandler(createExpense));
  app.patch('/api/finance/transactions/:id/pay', requireDb, requireAuth, asyncHandler(markAsPaid));
  app.patch('/api/finance/transactions/:id/cancel', requireDb, requireAuth, asyncHandler(cancelTransaction));
  app.get('/api/finance/summary', requireDb, requireAuth, asyncHandler(getFinancialSummary));
  app.get('/api/finance/cashflow', requireDb, requireAuth, asyncHandler(getCashFlow));
  app.get('/api/finance/dre', requireDb, requireAuth, asyncHandler(getSimpleDre));

  // Dashboard Routes
  app.get('/api/dashboard/summary', requireDb, requireAuth, asyncHandler(getSummary));
  app.get('/api/dashboard/alerts', requireDb, requireAuth, asyncHandler(getAlerts));
  app.get('/api/dashboard/recent-activity', requireDb, requireAuth, asyncHandler(getRecentActivity));

  // Catch-all for undefined /api routes should return JSON, not Vite fallback
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
