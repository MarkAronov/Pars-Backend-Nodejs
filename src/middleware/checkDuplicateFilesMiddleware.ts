import type { Request } from "@/types";
import { wrap } from "@/utils";
import bcrypt from "bcryptjs";
import type { NextFunction } from "express";

export const checkDuplicateFiles = () =>
	wrap(async (req: Request, res: Response, next: NextFunction) => {
		if (
			req.files !== undefined &&
			req.path.includes("/post") &&
			Object.keys(req.files).length > 1
		) {
			req.errorList = req.errorList || {};
			req.errorList.media = [
				"Either upload a set of images, a set of files or a single video",
			];
		}
		next();
	});
