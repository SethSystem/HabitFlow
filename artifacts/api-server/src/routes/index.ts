import { Router, type IRouter } from "express";
import healthRouter from "./health";
import habitsRouter from "./habits";

const router: IRouter = Router();

router.use(healthRouter);
router.use(habitsRouter);

export default router;
