import { describe, expect, it } from "vitest";
import { ApiError } from "@/helpers";
import { OrderService } from "@/modules/order/order.service";

const orderService = OrderService.getInstance();

describe("OrderService.updateOrderStatus — status validation", () => {
	it("rejects an unknown status before touching the repository", async () => {
		try {
			await orderService.updateOrderStatus("order-1", "SOME_STATUS");
			throw new Error("expected an ApiError");
		} catch (error) {
			expect(error).toBeInstanceOf(ApiError);
			expect((error as ApiError).statusCode).toBe(400);
			expect((error as ApiError).message).toBe("Invalid order status");
			expect((error as ApiError).code).toBe("ORDER_STATUS_UPDATE_ERROR");
		}
	});
});