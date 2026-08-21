import app from "../src/index";

export default async function handler(req: Request) {
  return await app.handle(req);
}
