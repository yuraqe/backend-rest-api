import express from 'express';
import { login, register } from '../controllers/authentication';  


export const authentication = (router: express.Router) => {
  router.post('/auth/register', register);
  router.post('/auth/login', login);
};

