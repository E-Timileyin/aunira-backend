import type { Request, Response } from "express";
import { logger } from "@/utils";
import { ProductService } from "./product.service";

const SERVER_ERROR = { status: "error", message: "Internal server error", code: "SERVER_ERROR" };

const toInt = (value: unknown, fallback: number) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export class ProductController {
	static instance: ProductController;

	private service: ProductService;

	static getInstance(): ProductController {
		if (!this.instance) {
			this.instance = new ProductController();
		}
		return this.instance;
	}

	/** @private - use ProductController.getInstance() */
	private constructor() {
		this.service = ProductService.getInstance();
	}

	getAll = async (req: Request, res: Response) => {
		try {
			const products = await this.service.getAll({
				page: toInt(req.query.page, 1),
				limit: toInt(req.query.limit, 10),
				category: typeof req.query.category === "string" ? req.query.category : undefined,
				search: typeof req.query.search === "string" ? req.query.search : undefined,
			});
			res.json(products);
		} catch (error) {
			logger.error(`Error fetching products: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(SERVER_ERROR);
		}
	};

	create = async (req: Request, res: Response) => {
		try {
			const product = await this.service.create(req.body);
			res.json(product);
		} catch (error) {
			logger.error(`Error creating product: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(SERVER_ERROR);
		}
	};

	getById = async (req: Request<{ id: string }>, res: Response) => {
		try {
			const product = await this.service.getById(req.params.id);
			res.json(product);
		} catch (error) {
			logger.error(`Error fetching product: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(SERVER_ERROR);
		}
	};

	update = async (req: Request<{ id: string }>, res: Response) => {
		try {
			const product = await this.service.update(req.params.id, req.body);
			res.json(product);
		} catch (error) {
			logger.error(`Error updating product: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(SERVER_ERROR);
		}
	};

	delete = async (req: Request<{ id: string }>, res: Response) => {
		try {
			const product = await this.service.delete(req.params.id);
			res.json(product);
		} catch (error) {
			logger.error(`Error deleting product: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(SERVER_ERROR);
		}
	};
}