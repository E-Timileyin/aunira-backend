import type { Request, Response } from "express";
import { ApiError } from "@/helpers";
import { CartService } from "./cart.service";

export class CartController {
	static instance: CartController;

	private service: CartService;

	static getInstance(): CartController {
		if (!this.instance) {
			this.instance = new CartController();
		}
		return this.instance;
	}

	/** @private - use CartController.getInstance() */
	private constructor() {
		this.service = CartService.getInstance();
	}

	getCart = async (req: Request, res: Response) => {
		try {
			const cart = await this.service.getCart(req.user!.id);
			res.json({ status: "success", data: { cart } });
		} catch (error) {
			res.status(500).json({
				status: "error",
				message: "Failed to fetch cart",
				code: "CART_FETCH_ERROR",
			});
		}
	};

	addToCart = async (req: Request, res: Response) => {
		try {
			const cart = await this.service.addToCart(req.user!.id, req.body.productId, req.body.quantity);
			res.json({ status: "success", data: { cart }, message: "Item added to cart" });
		} catch (error) {
			if (error instanceof ApiError) {
				return res.status(error.statusCode).json({
					status: "error",
					message: error.message,
					code: error.code,
				});
			}
			res.status(500).json({
				status: "error",
				message: "Failed to add item to cart",
				code: "CART_ADD_ERROR",
			});
		}
	};

	removeFromCart = async (req: Request, res: Response) => {
		try {
			const cart = await this.service.removeFromCart(req.user!.id, req.body.productId);
			res.json({ status: "success", data: { cart }, message: "Item removed from cart" });
		} catch (error) {
			if (error instanceof ApiError) {
				return res.status(error.statusCode).json({
					status: "error",
					message: error.message,
					code: error.code,
				});
			}
			res.status(500).json({
				status: "error",
				message: "Failed to remove item from cart",
				code: "CART_REMOVE_ERROR",
			});
		}
	};
}