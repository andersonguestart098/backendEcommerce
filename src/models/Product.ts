import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    price: number;
    description: string;
    discount?: number;
    paymentOptions: string[];
}

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    discount: { type: Number, default: 0 },
    paymentOptions: { type: [String], required: true },
}, {
    timestamps: true
});

const Product = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
