import app from '../apps/backend/src/app.js';
import { errorHandler } from '../apps/backend/src/middleware/errorHandler.js';

app.use(errorHandler);

export default app;
