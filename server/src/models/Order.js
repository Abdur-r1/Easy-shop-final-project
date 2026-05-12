import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    buyingPrice: { type: Number, default: 0 },
    qty: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, default: "" }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: "" },
      address: { type: String, required: true }
    },
    customerMessage: { type: String, default: "" },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    totalCost: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["COD", "ONLINE_DEMO"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "cod", "failed"], default: "pending" },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
