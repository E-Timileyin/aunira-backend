import { ProductRepository } from "./product.repository";

export class ProductService {
	static instance: ProductService;

	private repository: ProductRepository;

	static getInstance(): ProductService {
		if (!this.instance) {
			this.instance = new ProductService();
		}
		return this.instance;
	}

	/** @private - use ProductService.getInstance() */
	private constructor() {
		this.repository = new ProductRepository();
	}

	create(data: Parameters<ProductRepository["create"]>[0]) {
		return this.repository.create(data);
	}

	getAll(options: { page?: number; limit?: number; category?: string; search?: string }) {
		return this.repository.findAll(options);
	}

	getById(id: string) {
		return this.repository.findById(id);
	}

	update(id: string, data: Parameters<ProductRepository["update"]>[1]) {
		return this.repository.update(id, data);
	}

	delete(id: string) {
		return this.repository.deleteById(id);
	}
}