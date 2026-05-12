import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    buyingPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    lowStockAlert: { type: Number, default: 5, min: 0 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    category: { type: String, enum: ["men", "women", "kids"], required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imagePath: { type: String, default: "" },
    images: {
      type: [
        {
          url: { type: String, default: "" },
          path: { type: String, default: "" },
          name: { type: String, default: "" }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text", category: "text" });

export default mongoose.model("Product", productSchema);
