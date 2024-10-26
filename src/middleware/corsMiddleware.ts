// middleware/corsMiddleware.ts
import cors from "cors";

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://ecommerce-83yqvi950-andersonguestart098s-projects.vercel.app",
    "https://demo-vendas-6jk1tuu0m-andersonguestart098s-projects.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  credentials: true,
};

export default cors(corsOptions);
