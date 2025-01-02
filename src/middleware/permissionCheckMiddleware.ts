import { Post, Thread, Topic, User } from "@/models";
import type {
	PostType,
	Request,
	ThreadType,
	TopicType,
	UserType,
} from "@/types";
import { ErrorAO, wrap } from "@/utils";
import type mongoose from "mongoose";

const validateUser = wrap(async (req: Request) => {
	const user = await User.findOne({ username: req.params.username }).catch(
		() => {
			throw new ErrorAO(
				{ MAIN: ["Malformed user query"] },
				"DatabaseError",
				500,
			);
		},
	);
	return user;
});

const validatePost = wrap(async (req: Request) => {
	const post = await Post.findById(req.params.id).catch(() => {
		throw new ErrorAO({ MAIN: ["Malformed post query"] }, "DatabaseError", 500);
	});
	return post;
});

const validateThread = wrap(async (req: Request) => {
	const thread = await Thread.findById(req.params.id).catch(() => {
		throw new ErrorAO(
			{ MAIN: ["Malformed thread query"] },
			"DatabaseError",
			500,
		);
	});
	return thread;
});

const validateTopic = wrap(async (req: Request) => {
	const topic = await Topic.findOne({ name: req.params.name }).catch(() => {
		throw new ErrorAO(
			{ MAIN: ["Malformed topic query"] },
			"DatabaseError",
			500,
		);
	});
	return topic;
});

const checkUserPermissions = (req: Request, user: UserType) => {
	const currentUser = req.user;
	const reqMethod = req.method;
	if (req.params.username) {
		if (!user) {
			throw new ErrorAO(
				{
					MAIN: [`There's no user with the username: ${req.params.username}`],
				},
				"ParameterError",
				404,
			);
		}
		if (
			currentUser &&
			!(user._id as mongoose.Types.ObjectId).equals(
				currentUser._id as mongoose.Types.ObjectId,
			) &&
			reqMethod !== "GET"
		) {
			throw new ErrorAO(
				{
					MAIN: ["You are not allowed to change/delete this user"],
				},
				"AuthorizationError",
				403,
			);
		}
	}
};

const checkPostPermissions = (req: Request, post: PostType) => {
	const currentUser = req.user;
	const reqMethod = req.method;
	if (req.params.id) {
		if (!post) {
			throw new ErrorAO(
				{
					MAIN: [`No post by that ID: ${req.params.id}`],
				},
				"ParameterError",
				404,
			);
		}
		if (
			currentUser &&
			!(post.user._id as mongoose.Types.ObjectId).equals(
				currentUser._id as mongoose.Types.ObjectId,
			) &&
			reqMethod !== "GET"
		) {
			throw new ErrorAO(
				{
					MAIN: ["You are not allowed to change/delete this post"],
				},
				"AuthorizationError",
				403,
			);
		}
	}
};

const checkThreadPermissions = (req: Request, thread: ThreadType) => {
	const currentUser = req.user;
	const reqMethod = req.method;
	if (req.params.id) {
		if (!thread) {
			throw new ErrorAO(
				{
					MAIN: [`No thread by that ID: ${req.params.id}`],
				},
				"ParameterError",
				404,
			);
		}
		if (
			currentUser &&
			!(thread.posts[0].user._id as mongoose.Types.ObjectId).equals(
				currentUser._id as mongoose.Types.ObjectId,
			) &&
			reqMethod !== "GET"
		) {
			throw new ErrorAO(
				{
					MAIN: ["You are not allowed to change/delete this thread"],
				},
				"AuthorizationError",
				403,
			);
		}
	}
};

const checkTopicPermissions = (req: Request, topic: TopicType) => {
	const reqMethod = req.method;
	if (req.params.name) {
		if (!topic) {
			throw new ErrorAO(
				{
					MAIN: [`No topic by that name: ${req.params.name}`],
				},
				"ParameterError",
				404,
			);
		}
		// if (reqMethod !== "GET") {
		// 	throw new ErrorAO(
		// 		{
		// 			MAIN: ["You are not allowed to change/delete this topic"],
		// 		},
		// 		"AuthorizationError",
		// 		403,
		// 	);
		// }
	}
};

export const validateAndCheckPermissions = {
	user: async (req: Request) => {
		const user = await validateUser(req);
		checkUserPermissions(req, user);
		return user;
	},
	post: async (req: Request) => {
		const post = await validatePost(req);
		checkPostPermissions(req, post);
		return post;
	},
	thread: async (req: Request) => {
		const thread = await validateThread(req);
		checkThreadPermissions(req, thread);
		return thread;
	},
	topic: async (req: Request) => {
		const topic = await validateTopic(req);
		checkTopicPermissions(req, topic);
		return topic;
	},
};
