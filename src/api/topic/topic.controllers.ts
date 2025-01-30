import type { Response } from "express";
import type { Request } from "src/commom/generalTypes";
import { ErrorAO, wrap } from "src/utils/generalUtils";
import { Topic } from "./topic.model";
import type { TopicMediaTypeKey } from "./topic.model";

export const createTopic = wrap(async (req: Request, res: Response) => {
	const createdTopic = new Topic(req.body);

	// Handle file uploads
	if (req.files) {
		const files = req.files as { [fieldname: string]: Express.Multer.File[] };

		for (const [mediaType, fileArray] of Object.entries(files)) {
			if (fileArray.length > 0) {
				createdTopic[mediaType as TopicMediaTypeKey] = fileArray[0].filename;
			}
		}
	}

	await createdTopic.save();
	return res.status(201).send(createdTopic);
});

export const getTopics = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(await Topic.find({}));
});

export const getTopic = wrap(async (req: Request, res: Response) => {
	const topic = await Topic.findOne({ name: req.params.name });
	if (!topic) {
		throw new ErrorAO(
			{
				ERROR: [`No topic with that name: ${req.params.name}`],
			},
			"SearchError",
		);
	}

	return res.status(200).send(topic);
});

export const deleteTopic = wrap(async (req: Request, res: Response) => {
	const topic = await Topic.findOne({ name: req.params.name });
	if (!topic) {
		throw new ErrorAO(
			{
				ERROR: [`No topic with that name: ${req.params.name}`],
			},
			"SearchError",
		);
	}
	await topic.deleteOne();
	return res.status(200).send();
});
