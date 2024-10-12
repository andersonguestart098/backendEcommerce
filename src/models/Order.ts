import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
    productIds: string[];
    totalAmount: number;
    userId: string;
}

const OrderSchema: Schema = new Schema({
    productIds: { type: [String], required: true },
    totalAmount: { type: Number, required: true },
    userId: { type: String, required: true }
}, {
    timestamps: true
});

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
