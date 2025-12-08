import { MikroORM, RequestContext } from '@mikro-orm/core';
import config from '../mikro-orm.config';

let orm: MikroORM | undefined;

export async function initORM() {
  if (orm) {
    return orm;
  }

  orm = await MikroORM.init(config);
  return orm;
}

export async function getORM() {
  if (!orm) {
    orm = await initORM();
  }
  return orm;
}

export async function closeORM() {
  if (orm) {
    await orm.close();
    orm = undefined;
  }
}

export async function getEM() {
  const orm = await getORM();
  return orm.em.fork();
}

export { RequestContext };
