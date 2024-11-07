import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar usuários" });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { address: true }, // Inclui o endereço ao buscar o usuário
    });
    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado" });
    } else {
      res.json(user);
    }
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar usuário" });
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, email, password, tipoUsuario, cpf, phone, address } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        tipoUsuario,
        cpf,
        phone,
        address: {
          create: address, // Cria o endereço associado ao usuário
        },
      },
    });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
};

// Função de registro de usuário com bcrypt e novos campos
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, email, password, tipoUsuario, cpf, phone, address } = req.body;

  try {
    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      res.status(400).json({ message: "Usuário já existe" });
      return;
    }

    // Gera o hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cria um novo usuário com a senha hash e novos campos
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tipoUsuario,
        cpf,
        phone,
        address: {
          create: address, // Cria o endereço associado ao usuário
        },
      },
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    res.status(500).json({ message: "Erro no servidor ao registrar usuário" });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params; // ID do usuário a ser atualizado
  const { name, cpf, phone, address } = req.body; // Campos editáveis

  try {
    // Busca o usuário para verificar sua existência
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      res.status(404).json({ message: "Usuário não encontrado" });
      return;
    }

    // Atualiza os dados do usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        cpf,
        phone,
        address: {
          update: address, // Atualiza o endereço associado ao usuário
        },
      },
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ message: "Erro ao atualizar usuário" });
  }
};
