declare module "mercadopago" {
    interface PreferenceItem {
        title: string;
        quantity: number;
        currency_id: string;
        unit_price: number;
    }

    interface PaymentMethods {
        excluded_payment_types?: { id: string }[];
        installments?: number;
    }

    interface BackUrls {
        success: string;
        failure: string;
        pending: string;
    }

    interface CreatePreferencePayload {
        items: PreferenceItem[];
        payment_methods?: PaymentMethods;
        back_urls?: BackUrls;
        auto_return?: "approved" | "all";
        external_reference?: string;
    }

    interface Preferences {
        create: (payload: CreatePreferencePayload) => Promise<{ body: { init_point: string } }>;
    }

    const mercadopago: {
        configure: (options: { access_token: string }) => void;
        preferences: Preferences;
    };

    export default mercadopago;
}
