// src/typings/mercadopago.d.ts
declare module "mercadopago" {
  export interface CreatePaymentPayload {
    transaction_amount: number;
    token: string;
    description: string;
    installments: number;
    payment_method_id: string;
    payer: {
      email: string;
      first_name: string;
      last_name: string;
      identification: {
        type: string;
        number: string;
      };
    };
    statement_descriptor: string;
    notification_url: string;
    additional_info: {
      items: Array<{
        id: string;
        title: string;
        description: string;
        category_id: string;
        quantity: number;
        unit_price: number;
      }>;
      payer: {
        first_name: string;
        last_name: string;
        address: {
          zip_code: string;
          street_name: string;
          street_number: number;
        };
      };
      shipments: {
        receiver_address: string;
      };
    };
  }
}
