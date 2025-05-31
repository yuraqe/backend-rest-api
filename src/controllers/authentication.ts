import express from 'express';
import { createUser, getUserByEmail } from '../db/users';
import { authentication, random } from '../helpers';

export const login = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.sendStatus(400);
      return;
    }

    const user = await getUserByEmail(email).select('+authentication.salt +authentication.password');

    if (!user) {
      res.sendStatus(400);
      return;
    }

    const expectedHash = authentication(user.authentication.salt, password);

    if (user.authentication.password !== expectedHash) {
      res.sendStatus(403);
      return;
    }

    const salt = random();
    user.authentication.sessionToken = authentication(salt, user._id.toString());
    await user.save();

    res.cookie('YURA-AUTh', user.authentication.sessionToken, {
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    const userJson = user.toObject();
    delete userJson.authentication.password;
    delete userJson.authentication.salt;

    res.status(200).json(userJson);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
};

export const register = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      res.sendStatus(400);
      return;
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.sendStatus(400);
      return;
    }

    const salt = random();
    const user = await createUser({
      email,
      username,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
};
