import type { Response } from "express";
import type { Request } from "../types";
import { wrap } from "../utils";

export const createTopic = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(req.body);
});
export const getTopic = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(req.body);
});
export const getTopics = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(req.body);
});
export const deleteTopic = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(req.body);
});
