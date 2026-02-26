import { API } from 'types/api.js';

export const gone: API = async (_, res) => {
  await res.code(410).send();
};
