import { Router } from 'express';
import { getAllUsers, getUserById, createUser } from '../controllers/userController';

const router = Router();

router.get('/', getAllUsers); // Rota para listar todos os usuários
router.get('/:id', getUserById); // Rota para obter um usuário por ID
router.post('/', createUser); // Rota para criar um novo usuário

export default router;
