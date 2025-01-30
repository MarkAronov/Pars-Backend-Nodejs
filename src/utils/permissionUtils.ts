import { Post, type PostType } from "src/api/post/post.model";
import { Thread, type ThreadType } from "src/api/thread/thread.model";
import { Topic, type TopicType } from "src/api/topic/topic.model";
import { User, type UserType } from "src/api/user/user.model";
import type { Request } from "src/commom/generalTypes";
import { ErrorAO } from "./generalUtils";

const validateUser = async (req: Request) => {
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
};

const validatePost = async (req: Request) => {
	const post = await Post.findById(req.params.id).catch(() => {
		throw new ErrorAO({ MAIN: ["Malformed post query"] }, "DatabaseError", 500);
	});
	return post;
};

const validateThread = async (req: Request) => {
	const thread = await Thread.findById(req.params.id)
		.populate("posts")
		.catch(() => {
			throw new ErrorAO(
				{ MAIN: ["Malformed thread query"] },
				"DatabaseError",
				500,
			);
		});
	return thread;
};

const validateTopic = async (req: Request) => {
	const topic = await Topic.findOne({ name: req.params.name }).catch(() => {
		throw new ErrorAO(
			{ MAIN: ["Malformed topic query"] },
			"DatabaseError",
			500,
		);
	});
	return topic;
};

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
			(user._id !== currentUser._id || currentUser.role !== "admin") &&
			reqMethod !== "GET" &&
			reqMethod !== "DELETE"
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
			(post.user._id !== currentUser._id || currentUser.role === "user") &&
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
			(thread.originalPoster !== currentUser._id ||
				currentUser.role === "user") &&
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
	const currentUser = req.user;
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
		if (currentUser && currentUser.role !== "admin" && reqMethod !== "GET") {
			throw new ErrorAO(
				{
					MAIN: ["You are not allowed to change/delete this topic"],
				},
				"AuthorizationError",
				403,
			);
		}
	}
};

export const validateAndCheckPermissions = {
	user: async (req: Request) => {
		const user = await validateUser(req);
		if (user) {
			checkUserPermissions(req, user);
		}
		return user;
	},
	post: async (req: Request) => {
		const post = await validatePost(req);
		if (post) {
			checkPostPermissions(req, post);
		}
		return post;
	},
	thread: async (req: Request) => {
		const thread = await validateThread(req);
		if (thread) {
			checkThreadPermissions(req, thread);
		}
		return thread;
	},
	topic: async (req: Request) => {
		const topic = await validateTopic(req);
		if (topic) {
			checkTopicPermissions(req, topic);
		}
		return topic;
	},
};
