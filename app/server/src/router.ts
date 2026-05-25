import { Router } from 'express';

// Import Modular Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import driversRoutes from './routes/drivers.routes.js';
import procurementRoutes from './routes/procurement.routes.js';
import materialsRoutes from './routes/materials.routes.js';
import customersRoutes from './routes/customers.routes.js';
import financeRoutes from './routes/finance.routes.js';
import adminRoutes from './routes/admin.routes.js';

const router = Router();

// Mount all modular routes to the root router
// Since each modular route defines its exact path (e.g. '/orders'),
// mounting at '/' ensures backward compatibility.
router.use('/', authRoutes);
router.use('/', usersRoutes);
router.use('/', ordersRoutes);
router.use('/', inventoryRoutes);
router.use('/', shippingRoutes);
router.use('/', driversRoutes);
router.use('/', procurementRoutes);
router.use('/', materialsRoutes);
router.use('/', customersRoutes);
router.use('/', financeRoutes);
router.use('/', adminRoutes);

export default router;